import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";
import { fetchItem, updateItem, addItemTags, deleteItemTags, updateItemImages, deleteItem } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarouselEdit from './ImageCarouselEdit';
import ConfirmModal from './ConfirmModal';
import styles from '../styles/components/ItemDetailModal.module.css';

/**
 * ItemEditModal - Modal for editing item details including images, tags, and metadata
 */


interface ItemEditModalProps {
  onClose: () => void;
  itemId: string; // Required - component won't render without it
  onItemUpdated?: () => void; // Optional callback when item is successfully updated
}

/**
 * ExtendedItemImage - Extends ItemImage to handle temporary uploads during editing
 * - id can be number (real image) or string (temp image)
 * - file property for new uploads
 */
interface ExtendedItemImage extends Omit<ItemImage, 'id'> {
  id: number | string;
  file?: File;
}

const ItemEditModal = ({ onClose, itemId, onItemUpdated }: ItemEditModalProps) => {

  const navigate = useNavigate();

  // Item data state
  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Tag management state
  const [tags, setTags] = useState<string[]>([]); 
  const [tagInput, setTagInput] = useState('');  

  // Image management state
  const [itemImages, setItemImages] = useState<ItemImage[]>([]); // Original images from database
  const [itemImagesDelete, setItemImagesDelete] = useState<number[]>([]); // Images staged for deletion
  const [itemImagesOrder, setItemImagesOrder] = useState<ExtendedItemImage[]>([]); // Current display order (includes temp images)
  const [itemImagesAdd, setItemImagesAdd] = useState<File[]>([]); // New files to upload

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  


  const confirmDeleteItem = async () => {
    try {
      setIsDeleting(true);
              await deleteItem(Number(itemId));
      setIsDeleting(false);
      
      // Notify parent component that item was deleted
      if (onItemUpdated) {
        onItemUpdated();
      }
      
      // Navigate to the collection page if we have the collection_id
      if (item?.collection_id) {
        navigate(`/collections/${item.collection_id}`);
      } else {
        navigate('/collections');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item');
      setIsDeleting(false);
    }
  }

  /**
   * Handle form submission - shows confirmation modal
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setShowConfirmModal(true);
  };

  /**
   * Execute the actual save operation after confirmation
   * Performs: name/desc update → tag update → image operations → refresh
   */
  const confirmSubmit = async() => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try{
      // 1. Update item name and description
        await updateItem(Number(itemId), {
        name: name,
        description: description
      });

      // 2. Update tags (delete all existing and add new ones)
      await deleteItemTags(Number(itemId));
      if (tags.length > 0) {
      await addItemTags(Number(itemId), tags);
      }

      // 3. Update images
      const itemImagesOrderIds = itemImagesOrder.map(img => img.id);
      console.log('itemId:', itemId);
      console.log('itemImagesDelete', itemImagesDelete);
      console.log('itemImagesAdd', itemImagesAdd);
      console.log('itemImagesOrderIds', itemImagesOrderIds);
      await updateItemImages(Number(itemId), itemImagesDelete, itemImagesAdd, itemImagesOrderIds)
      
      // Notify parent component that item was updated successfully
      if (onItemUpdated) {
        onItemUpdated();
      }
      
      // Close the modal after successful save
      handleClose();
    } catch (err) {
      setError('Failed to edit item.');
      console.error('confirmSubmit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Load item data from the server and initialize all state
   */
  const loadItem = useCallback(async () => {
    try {
      console.log('loadItem: Starting to fetch item', { itemId });
      setLoading(true);
      
      const itemData = await fetchItem(Number(itemId));
      console.log('loadItem: Item data received', itemData);
      
      // Initialize all state with fetched data
      setItem(itemData);
      setName(itemData.name || '');
      setDescription(itemData.description || '');
      setTags(itemData.tags?.map(tag => tag.name) || []);
      setItemImages(itemData.images || []);
      setItemImagesOrder(itemData.images?.map((img: ItemImage) => ({ ...img, id: img.id })) || []);
      setItemImagesDelete([]);
      setError('');
    } catch (err) {
      console.error('loadItem: Error loading item', err);
      setError('Failed to load item');
    } finally {
      console.log('loadItem: Setting loading to false');
      setLoading(false);
    }
  }, [itemId]);

  // Load item data when component mounts or dependencies change
  useEffect(() => {
    console.log('ItemEditModal useEffect: itemId changed', { itemId });
    loadItem();
  }, [loadItem]);

  /**
   * Close modal and navigate back to collection page
   */
  const handleClose = () => {
    onClose();
    if (item && item.collection_id) {
      navigate(`/collections/${item.collection_id}`);
    } else {
      navigate(-1);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Tag management functions
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

  // Image management functions
  /**
   * Handle drag-and-drop reordering of images
   * Updates both array order and image_order values
   */
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newOrder = [...itemImagesOrder];
    const [movedImage] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedImage);
    
    // Update image_order values to reflect the new order (0, 1, 2, etc.)
    const updatedOrder = newOrder.map((img, index) => ({
      ...img,
      image_order: index
    }));
    
    // Update the state with the new order and updated image_order values
    setItemImagesOrder(updatedOrder);
  };

  /**
   * Stage an image for deletion
   * - Adds real images to deletion list
   * - Removes from display order immediately
   */
  const stageImageDelete = (imageId: number | string) => {
    const imageToDelete = itemImagesOrder.find((img: ExtendedItemImage) => img.id === imageId);
    if (imageToDelete && typeof imageToDelete.id === 'number') {
      // Only add real images (not temp ones) to deletion list
      const realImage = itemImages.find((img: ItemImage) => img.id === imageToDelete.id);
      if (realImage) {
        setItemImagesDelete((prev: number[]) => [...prev, realImage.id]);
      }
    }
    // Remove from display order immediately
    setItemImagesOrder((prev: ExtendedItemImage[]) => prev.filter((img: ExtendedItemImage) => img.id !== imageId));
  };

  /**
   * Stage new images for upload
   * - Creates temporary image objects for preview
   * - Adds to display order and file list
   */
  const stageImageAdd = (files: File[]) => {
    // Create temporary image objects for preview
    const newImages = files.map((file, index) => ({
      id: `new-${index}`, // Temporary ID for mapping to uploaded images
      item_id: Number(itemId),
      image_url: URL.createObjectURL(file), // Local preview URL
      image_order: itemImagesOrder.length + index, // Assign order after existing images
      file: file // Store the actual file for upload
    }));
    
    setItemImagesOrder((prev: ExtendedItemImage[]) => [...prev, ...newImages]);
    setItemImagesAdd((prev: File[]) => [...prev, ...files]);
  };

  

  // Render loading and error states

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

  // Main modal content
  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
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
                images={itemImagesOrder.sort((a, b) => (a.image_order || 0) - (b.image_order || 0))} 
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

                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={isDeleting}
                  onClick={() => setShowConfirmDeleteModal(true)}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmSubmit}
          title="Confirm Edit"
          message="Are you sure you want to save these changes to the item?"
          confirmText="Save Changes"
          cancelText="Cancel"
        />

          <ConfirmModal
          isOpen={showConfirmDeleteModal}
          onClose={() => setShowConfirmDeleteModal(false)}
          onConfirm={confirmDeleteItem}
          title="Confirm Delete"
          message="Are you sure you want to delete this item??"
          confirmText="Delete Item"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};

export default ItemEditModal; 