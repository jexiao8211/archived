import { useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { Item } from '../api';
import styles from '../styles/components/ItemCard.module.css';
import ImageCarousel from './ImageCarousel';

interface ItemCardProps {
  item: Item;
  isEditMode?: boolean;
}

const ItemCard = ({ item, isEditMode = false }: ItemCardProps) => {
  const navigate = useNavigate();
  const { collectionId } = useParams<{ collectionId: string }>();
  
  // Prepare image URLs for the carousel
  const images = item.images;

  // Sort images by image_order to get the first image properly
  const sortedImages = [...images].sort((a, b) => {
    if (a.image_order !== undefined && b.image_order !== undefined) {
      return a.image_order - b.image_order;
    }
    return 0;
  });

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (sortedImages.length > 0) {
      const img = new window.Image();
      img.src = sortedImages[0].image_url;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [sortedImages]);

  // Style for dynamic aspect ratio
  const aspectStyle = aspectRatio
    ? { aspectRatio: `${aspectRatio}` }
    : {};

  const handleClick = () => {
    if (isEditMode) {
      // In edit mode, navigate to edit route
      if (collectionId) {
        navigate(`/collections/${collectionId}/items/${item.id}/edit`);
      } else {
        navigate(`/items/${item.id}/edit`);
      }
    } else {
      // Normal mode, navigate to detail view
      if (collectionId) {
        navigate(`/collections/${collectionId}/items/${item.id}`);
      } else {
        navigate(`/items/${item.id}`);
      }
    }
  };

  return (
    <div onClick={handleClick} className={styles.cardLink}>
      <div className={`${styles.card} ${isEditMode ? styles.editMode : ''}`} style={aspectStyle}>
        <div className={`${styles.imagePlaceholder} ${isEditMode ? styles.editMode : ''}`} style={aspectStyle}>
          {sortedImages.length > 0 ? (
            <ImageCarousel 
              images={sortedImages} 
              fitParent={true}
            />
          ) : (
            'No images'
          )}
        </div>
      </div>
      <div className={`${styles.itemName} ${isEditMode ? styles.editMode : ''}`}>{item.name}</div>
    </div>
  );
};

export default ItemCard; 