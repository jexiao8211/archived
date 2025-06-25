import { Link } from 'react-router-dom';
import type { Item } from '../api';
import styles from '../styles/components/CollectionCard.module.css';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  // Get the first image URL if available
  const firstImageUrl = item.images && item.images.length > 0 ? item.images[0].image_url : null;

  return (
    <Link to={`/items/${item.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div>
          <h3 className={styles.title}>{item.name}</h3>
          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <div className={styles.imagesCount}>
            {item.images.length} image{item.images.length !== 1 ? 's' : ''}
          </div>
          
          <div className={styles.imagePlaceholder}>
            {firstImageUrl ? (
              <img 
                src={firstImageUrl} 
                alt={`Preview of ${item.name}`}
                className={styles.itemPreviewImage}
              />
            ) : (
              'No images'
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard; 