import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";
import { fetchItem, uploadItemImages } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarousel from './ImageCarousel';
import styles from '../styles/components/ItemDetailModal.module.css';

interface ItemDetailModalProps {
  onClose: () => void;
  itemId: string;
}

const ItemDetailModal = ({ onClose, itemId }: ItemDetailModalProps) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [itemImages, setItemImages] = useState<ItemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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
      setItemImages(itemData.images || []);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (!token || !itemId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await uploadItemImages(token, Number(itemId), selectedFiles);
      setSelectedFiles([]);
      await loadItem();
    } catch (err) {
      setError('Failed to upload images');
      console.error('Error uploading images:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageIndex: number) => {
    if (!token || !itemId) return;

    try {
      // TODO: Implement image removal API call
      console.log('Removing image at index:', imageIndex);
      setItemImages(prev => prev.filter((_, i) => i !== imageIndex));
    } catch (err) {
      setError('Failed to remove image');
      console.error('Error removing image:', err);
    }
  };

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
        <div className={styles.modalHeader}>
          <h1 className={styles.title}>{item.name}</h1>
          <button 
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Left Side - Image Carousel */}
          <div className={styles.imageSection}>
            <ImageCarousel 
              images={itemImages.map(img => img.image_url)} 
              onRemoveImage={removeImage}
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
                <h3>description</h3>
                <p>{item.description}</p>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className={styles.tagsSection}>
                <h3>tags</h3>
                <div className={styles.tagsList}>
                  {item.tags.map((tag) => (
                    <span key={tag.id} className={styles.tag}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div className={styles.uploadSection}>
              <h3>add images</h3>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              
              {selectedFiles.length > 0 && (
                <div className={styles.selectedFiles}>
                  <h4>selected files ({selectedFiles.length})</h4>
                  <div className={styles.fileList}>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <span>{file.name}</span>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className={styles.removeButton}
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleUploadImages}
                    disabled={uploading}
                    className={styles.uploadButton}
                  >
                    {uploading ? 'uploading...' : `upload ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal; 