import { Link } from 'react-router-dom';
import type { Collection } from '../api';
import styles from '../styles/components/CollectionCard.module.css';

interface CollectionCardProps {
  collection: Collection;
}

const CollectionCard = ({ collection }: CollectionCardProps) => {
  return (
    <Link to={`/collections/${collection.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageGrid}>
          {collection.items.slice(0, 4).map((item) => {
            const firstImageUrl = item.images && item.images.length > 0 ? item.images[0].image_url : null;
            return (
              <div key={item.id} className={styles.gridImageWrapper}>
                {firstImageUrl ? (
                  <img
                    src={firstImageUrl}
                    alt={`Preview of ${item.name}`}
                    className={styles.gridImage}
                  />
                ) : (
                  <div className={styles.noImage}>No image</div>
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