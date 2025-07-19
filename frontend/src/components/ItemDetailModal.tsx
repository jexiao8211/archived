import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItem } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarousel from './ImageCarousel';
import styles from '../styles/components/ItemDetailModal.module.css';

interface ItemDetailModalProps {
  onClose: () => void;
  itemId: string;
}

const ItemDetailModal = ({ onClose, itemId }: ItemDetailModalProps) => {
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [itemImages, setItemImages] = useState<ItemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItem = useCallback(async () => {
    if (!itemId) {
      console.log('loadItem: No itemId provided');
      return;
    }
    
    try {
      console.log('loadItem: Starting to fetch item', { itemId });
      setLoading(true);
      const itemData = await fetchItem(Number(itemId));
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
  }, [itemId]);

  useEffect(() => {
    console.log('ItemDetailModal useEffect: itemId changed', { itemId });
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
              images={itemImages} 
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal; 