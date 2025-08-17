import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchItem, fetchSharedItem } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarousel from './ImageCarousel';
import styles from '../styles/components/ItemDetailModal.module.css';

interface ItemDetailModalProps {
  onClose: () => void;
  itemId: string;
  token?: string; // if provided, fetch read-only shared item
}

const ItemDetailModal = ({ onClose, itemId, token }: ItemDetailModalProps) => {
  const navigate = useNavigate();

  const { data: itemData, isLoading, error } = useQuery<Item, Error>({
    queryKey: token ? ['sharedItem', token, itemId] : ['item', itemId],
    queryFn: () => token ? fetchSharedItem(token as string, Number(itemId)) : fetchItem(Number(itemId)),
    enabled: !!itemId,
  });
  const item = itemData ?? null;
  const itemImages = item?.images ?? [];

  const handleClose = () => {
    onClose();
    if (token) {
      // In shared mode, parent controls navigation back to /share/:token
      return;
    }
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



  if (isLoading) {
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
              <div className={styles.error}>{error.message || 'Failed to load item'}</div>
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