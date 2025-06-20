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
        <div>
          <h3 className={styles.title}>{collection.name}</h3>
          {collection.description && (
            <p className={styles.description}>{collection.description}</p>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <div className={styles.itemCount}>
            {collection.items.length} item{collection.items.length !== 1 ? 's' : ''}
          </div>
          
          <div className={styles.imagePlaceholder}>
            Image previews coming soon
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard; 