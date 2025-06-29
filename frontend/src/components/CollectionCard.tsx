import { Link } from 'react-router-dom';
import type { Collection } from '../api';
import styles from '../styles/components/CollectionCard.module.css';

interface CollectionCardProps {
  collection: Collection;
}

const CollectionCard = ({ collection }: CollectionCardProps) => {
  const itemsToShow = Array(4)
  .fill(null)
  .map((_, i) => collection.items[i] || null);

  // TODO: add item count
return (
  <Link to={`/collections/${collection.id}`} className={styles.cardLink}>
    <div className={styles.card}>

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
  </Link>
);
};

export default CollectionCard; 