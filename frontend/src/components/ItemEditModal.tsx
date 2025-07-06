import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";
import { fetchItem, uploadItemImages, deleteItemImage, updateItem, addItemTags, deleteItemTags, updateItemImages } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarouselEdit from './ImageCarouselEdit';
import styles from '../styles/components/ItemDetailModal.module.css';

/**
 * ItemEditModal - Modal for editing item details including images, tags, and metadata
 * 
 * Image Management Strategy:
 * 1. Track original images in itemImages (from database)
 * 2. Track current display order in itemImagesOrder (including temp uploads)
 * 3. Track deletions in itemImagesDelete (real images only)
 * 4. Track additions in itemImagesAdd (File objects)
 * 5. On save: delete → upload → reorder → refresh
 */


interface ItemDetailModalProps {
  onClose: () => void;
  itemId: string;
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

const ItemDetailModal = ({ onClose, itemId }: ItemDetailModalProps) => {
  const { token } = useContext(AuthContext);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  

  /**
   * Handle form submission - shows confirmation modal
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !itemId) {
      console.log('handleSubmit: Missing token or itemId', { token: !!token, itemId });
      return;
    }
    
    setShowConfirmModal(true);
  };

  /**
   * Execute the actual save operation after confirmation
   * Performs: name/desc update → tag update → image operations → refresh
   */
  const confirmSubmit = async() => {
    if (!token) return; // Redundant - just so we dont see errors from typescript
    
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try{
      const itemImagesOrderIds = itemImagesOrder.map(img => img.id);
      console.log('itemId:', itemId);
      console.log('itemImagesDelete', itemImagesDelete);
      console.log('itemImagesAdd', itemImagesAdd);
      console.log('itemImagesOrderIds', itemImagesOrderIds);
      await updateItemImages(token, Number(itemId), itemImagesDelete, itemImagesAdd, itemImagesOrderIds)
    } catch (err) {
      setError('Failed to edit item.');
      console.error('confirmSubmit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }
  // const confirmSubmit = async () => {
  //   if (!token || !itemId) return;
    
  //   setIsSubmitting(true);
  //   setShowConfirmModal(false);

  //   try {
  //     // Step 1: Update basic item information
  //     await updateItem(token, Number(itemId), {name: name || '', description: description || ''});

  //     // Step 2: Update tags (delete all, then add current)
  //     await deleteItemTags(token, Number(itemId));
  //     await addItemTags(token, Number(itemId), tags);

  //     // Step 3: Handle image operations in sequence
  //     await processImageChanges();

  //     // Step 4: Cleanup and refresh
  //     resetImageStates();
  //     await loadItem();
  //     handleClose();

  //   } catch (err) {
  //     setError('Failed to edit item.');
  //     console.error('confirmSubmit error:', err);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };


  // /**
  //  * Process all image changes: delete → upload → replace temp images → reorder
  //  */
  // const processImageChanges = async () => {
  //   // Step 3a: Delete staged images (real images only)
  //   await Promise.all(itemImagesDelete.map((img: ItemImage) => deleteItemImage(token!, img.id)));

  //   console.log('Uploading new images...')
  //   // Step 3b: Upload new images and capture results
  //   let uploadedImages: ItemImage[] = [];
  //   if (itemImagesAdd.length > 0) {
  //     uploadedImages = await uploadItemImages(token!, Number(itemId), itemImagesAdd);
  //   }
  //   console.log('Replacing temp images with new uploads...')

  //   // Step 3c: Replace temporary images with real uploaded images
  //   if (uploadedImages.length > 0) {
  //     replaceTempImagesWithUploaded(uploadedImages);
  //   }

  //   // Step 3d: Reorder all images based on current display order
  //   await reorderImages();
  // };

  // /**
  //  * Replace temporary images with real uploaded images
  //  * Maps temp images to uploaded images using the temp-{index} pattern
  //  */
  // const replaceTempImagesWithUploaded = (uploadedImages: ItemImage[]) => {
  //   console.log('Replacing temp images. Current order:', itemImagesOrder);
  //   console.log('Uploaded images:', uploadedImages);
    
  //   const updatedOrder = itemImagesOrder.map((img: ExtendedItemImage) => {
  //     if (typeof img.id === 'string' && img.id.startsWith('temp-')) {
  //       // This is a temp image - extract the index and map to uploaded image
  //       const tempIndex = parseInt(img.id.replace('temp-', ''));
        
  //       if (tempIndex >= 0 && tempIndex < uploadedImages.length) {
  //         const uploadedImage = uploadedImages[tempIndex];
  //         console.log(`Replacing temp-${tempIndex} with uploaded image ID ${uploadedImage.id}`);
  //         // Replace temp image with real uploaded image, keeping the same order
  //         return {
  //           ...uploadedImage,
  //           image_order: img.image_order
  //         };
  //       } else {
  //         console.log(`No uploaded image found for temp-${tempIndex}`);
  //       }
  //     }
  //     // Return existing image unchanged
  //     return img;
  //   });
    
  //   console.log('Updated order after replacement:', updatedOrder);
  //   setItemImagesOrder(updatedOrder);
  // };

  // /**
  //  * Reorder images by mapping current display order to database IDs
  //  * Now all images should have real IDs after temp replacement
  //  */
  // const reorderImages = async () => {
  //   console.log('Starting reorder. Current itemImagesOrder:', itemImagesOrder);
    
  //   const finalOrder: { id: number; image_order: number }[] = [];
    
  //   // Process each image in current display order
  //   itemImagesOrder.forEach((img: ExtendedItemImage, index: number) => {
  //     console.log(`Processing image at index ${index}:`, img);
  //     if (typeof img.id === 'number') {
  //       // All images should now have real IDs after temp replacement
  //       console.log(`Adding real image ID ${img.id} to final order`);
  //       finalOrder.push({
  //         id: img.id,
  //         image_order: index
  //       });
  //     } else {
  //       console.log(`Skipping temp image with ID: ${img.id}`);
  //     }
  //   });
    
  //   console.log('Final order to send to backend:', finalOrder);
    
  //   // Apply the new order if we have images to reorder
  //   if (finalOrder.length > 0) {
  //     await updateItemImageOrder(token!, Number(itemId), {
  //       image_orders: finalOrder
  //     });
  //   }
  // };

  /**
   * Reset all image-related state after successful save
   */
  const resetImageStates = () => {
    setItemImagesAdd([]);
    setItemImagesDelete([]);
  };

  /**
   * Load item data from the server and initialize all state
   */
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
  }, [token, itemId]);

  // Load item data when component mounts or dependencies change
  useEffect(() => {
    console.log('ItemDetailModal useEffect: token and itemId changed', { token: !!token, itemId });
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