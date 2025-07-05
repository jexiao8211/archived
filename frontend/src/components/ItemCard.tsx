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

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (images.length > 0) {
      const img = new window.Image();
      img.src = images[0].image_url;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [images]);

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
          {images.length > 0 ? (
            <ImageCarousel 
              images={images} 
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