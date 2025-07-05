import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";
import { fetchItem, uploadItemImages, deleteItemImage, updateItem, addItemTags, deleteItemTags } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarouselEdit from './ImageCarouselEdit';
import styles from '../styles/components/ItemDetailModal.module.css';

/* TODO: Many bugs to fix
what works:
- name, desc, and tags updated fine

what does not work:
- I have to refresh the collections page in order to see changed reflected
- image manipulation does not apply after saving changes (any of it)
- it stays in edit mode after I save changes. Should go back to view mode
- need to add a delete item button
- make the UI nicer

still need to test:
- removing tags
- remove name entirely
- remove desc entirely

TODO: read through the ImageCarouselEdit code
TODO: iplement frontend unit tests? (client side API requests in particular)
*/

interface ItemDetailModalProps {
  onClose: () => void;
  itemId: string;
}

// Extended type for images that can include temporary uploads
interface ExtendedItemImage extends Omit<ItemImage, 'id'> {
  id: number | string;
  file?: File;
}

const ItemDetailModal = ({ onClose, itemId }: ItemDetailModalProps) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [tags, setTags] = useState<string[]>([]); 
  const [tagInput, setTagInput] = useState('');  

  const [itemImages, setItemImages] = useState<ItemImage[]>([]);
  const [itemImagesDelete, setItemImagesDelete] = useState<ItemImage[]>([]);
  const [itemImagesOrder, setItemImagesOrder] = useState<ExtendedItemImage[]>([]); // Current order for display
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !itemId) {
      console.log('loadItem: Missing token or itemId', { token: !!token, itemId });
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!token || !itemId) return;
    
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Update name and description
      const updatedItem = await updateItem(token, Number(itemId), {name: name || '', description: description || ''})

      // Update tags
      await deleteItemTags(token, Number(itemId));
      await addItemTags(token, Number(itemId), tags);

      // TODO: none of the below stuff takes place. 
      // Either they are not set, or something is wrong with the way its called
      // Handle image changes
      // Delete staged images
      await Promise.all(itemImagesDelete.map(img => deleteItemImage(token, img.id)));

      // Upload new images
      const newImageFiles = selectedFiles.filter(file => 
        !itemImagesOrder.some(img => img.file === file)
      );
      if (newImageFiles.length > 0) {
        await uploadItemImages(token, Number(itemId), newImageFiles);
      }

      // Reset image states
      setSelectedFiles([]);
      setItemImagesDelete([]);
      
      await loadItem();
      
      // Close modal after successful submission
      handleClose();

    } catch (err) {
      setError('Failed to edit item.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const loadItem = useCallback(async () => {
    if (!token || !itemId) {
      console.log('loadItem: Missing token or itemId', { token: !!token, itemId });
      return;
    }
    
    try {
      console.log('loadItem: Starting to fetch item', { itemId });
      setLoading(true);
      const itemData = await fetchItem(token, Number(itemId));
      console.log('loadItem: Item data received', itemData);
      setItem(itemData);
      setName(itemData.name || '');
      setDescription(itemData.description || '');
      setTags(itemData.tags?.map(tag => tag.name) || []);
      setItemImages(itemData.images || []);
      setItemImagesOrder(itemData.images?.map(img => ({ ...img, id: img.id.toString() })) || []); // Initialize order
      setItemImagesDelete([]); // Reset deletions
      setError('');
    } catch (err) {
      console.error('loadItem: Error loading item', err);
      setError('Failed to load item');
    } finally {
      console.log('loadItem: Setting loading to false');
      setLoading(false);
    }
  }, [token, itemId]);

  useEffect(() => {
    console.log('ItemDetailModal useEffect: token and itemId changed', { token: !!token, itemId });
    loadItem();
  }, [loadItem]);

  const handleClose = () => {
    onClose();
    // Navigate back to the collection page if we have the item data
    if (item && item.collection_id) {
      navigate(`/collections/${item.collection_id}`);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Tag handling
  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newOrder = [...itemImagesOrder];
    const [movedImage] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedImage);
    setItemImagesOrder(newOrder);
  };

  const stageImageDelete = (imageId: number | string) => {
    const imageToDelete = itemImagesOrder.find(img => img.id === imageId);
    if (imageToDelete && typeof imageToDelete.id === 'number') {
      // Only add to delete list if it's a real image (not a temp one)
      const realImage = itemImages.find(img => img.id === imageToDelete.id);
      if (realImage) {
        setItemImagesDelete(prev => [...prev, realImage]);
      }
    }
    setItemImagesOrder(prev => prev.filter(img => img.id !== imageId));
  };

  const stageImageAdd = (files: File[]) => {
    // Create temporary image objects for preview
    const newImages = files.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`, // Temporary ID
      item_id: Number(itemId),
      image_url: URL.createObjectURL(file),
      file: file // Store the actual file
    }));
    setItemImagesOrder(prev => [...prev, ...newImages]);
    setSelectedFiles(prev => [...prev, ...files]);
  };


  if (!token) {
    return (
      <div className={styles.modalOverlay} onClick={handleBackdropClick}>
        <div className={styles.modalContent}>
          <div className={styles.error}>Please log in to view this item.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={handleBackdropClick}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Loading item...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.modalOverlay} onClick={handleBackdropClick}>
        <div className={styles.modalContent}>
          <div className={styles.error}>Item not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            {/* TODO: Change the styles for this so it still looks like a title*/}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              disabled={isSubmitting}
            />
            <button 
              type="button"
              onClick={handleClose}
              className={styles.closeButton}
              aria-label="Close"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Left Side - Image Carousel */}
            <div className={styles.imageSection}>
              <ImageCarouselEdit 
                images={itemImagesOrder} 
                onReorder={moveImage}
                onDelete={stageImageDelete}
                onAdd={stageImageAdd}
                fitParent={true}
                modalContext={true}
              />
            </div>

            {/* Right Side - Description and Tags */}
            <div className={styles.detailsSection}>
              {error && (
                <div className={styles.error}>{error}</div>
              )}

              {item.description && (
                <div className={styles.descriptionSection}>
                  <h3>edit description</h3>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <h3>tags</h3>
                  <div className={styles.tagInputContainer}>
                    {tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className={styles.removeTagButton}
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder="Type a tag and press Enter..."
                      className={styles.tagInput}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className={styles.submitSection}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className={styles.confirmOverlay} onClick={() => setShowConfirmModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Changes</h3>
              <p>Are you sure you want to save these changes?</p>
              <div className={styles.confirmButtons}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSubmit}
                  className={styles.confirmButton}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailModal; 