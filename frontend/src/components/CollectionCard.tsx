import { useNavigate } from 'react-router-dom';
import type { Collection } from '../api';
import styles from '../styles/components/CollectionCard.module.css';

interface CollectionCardProps {
  collection: Collection;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, itemId: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, itemId: number) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, itemId: number) => void;
  onDragEnd?: () => void;
  isDragged?: boolean;
  isDragOver?: boolean;
}

const CollectionCard = ({
  collection,
  onDragStart, 
  onDragOver, 
  onDrop,
  onDragEnd,
  isDragged = false,
  isDragOver = false
}: CollectionCardProps) => {
  const itemsToShow = Array(4)
  .fill(null)
  .map((_, i) => collection.items[i] || null);

  const navigate = useNavigate();

  const handleClick = () => {
      navigate(`/collections/${collection.id}`);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) {
      onDragStart(e, collection.id);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragOver) {
      onDragOver(e, collection.id);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDrop) {
      onDrop(e, collection.id);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Apply visual styles based on drag state
  const getCardClassName = () => {
    let className = styles.card;
    if (isDragged) className += ` ${styles.dragged}`;
    if (isDragOver) className += ` ${styles.dragOver}`;
    return className;
  };

  // TODO: add item count ?
  return (
    <div 
      onClick={handleClick} 
      className={styles.cardLink}
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div className={getCardClassName()}>

        <div className={styles.imageGrid}>
          {itemsToShow.map((item, idx) => {
            if (!item) {
              return (
                <div key={`empty-${idx}`} className={styles.gridImageWrapper}>
                  <div className={styles.noImage} />
                </div>
              );
            }
            const firstImageUrl =
              item.images && item.images.length > 0 ? item.images[0].image_url : null;
            return (
              <div key={`item-${item.id}`} className={styles.gridImageWrapper}>
                {firstImageUrl ? (
                  <img
                    src={firstImageUrl}
                    alt={`Preview of ${item.name}`}
                    className={styles.gridImage}
                    draggable={false}
                  />
                ) : (
                  <div className={styles.noImage} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.collectionName}>{collection.name}</div>
    </div>
  );
};

export default CollectionCard; 