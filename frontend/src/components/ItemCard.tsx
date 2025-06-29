import { useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { Item } from '../api';
import styles from '../styles/components/ItemCard.module.css';
import ImageCarousel from './ImageCarousel';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const navigate = useNavigate();
  const { collectionId } = useParams<{ collectionId: string }>();
  
  // Prepare image URLs for the carousel
  const imageUrls = item.images && item.images.length > 0 ? item.images.map(img => img.image_url) : [];

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageUrls.length > 0) {
      const img = new window.Image();
      img.src = imageUrls[0];
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [imageUrls]);

  // Style for dynamic aspect ratio
  const aspectStyle = aspectRatio
    ? { aspectRatio: `${aspectRatio}` }
    : {};

  const handleClick = () => {
    // Navigate to item with collection context if available
    if (collectionId) {
      navigate(`/collections/${collectionId}/items/${item.id}`);
    } else {
      navigate(`/items/${item.id}`);
    }
  };

  return (
    <div onClick={handleClick} className={styles.cardLink}>
      <div className={styles.card} style={aspectStyle}>
        <div className={styles.imagePlaceholder} style={aspectStyle}>
          {imageUrls.length > 0 ? (
            <ImageCarousel 
              images={imageUrls} 
              fitParent={true}
            />
          ) : (
            'No images'
          )}
        </div>
      </div>
      <div className={styles.itemName}>{item.name}</div>
    </div>
  );
};

export default ItemCard; 