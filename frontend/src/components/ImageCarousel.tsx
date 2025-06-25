import { useState } from 'react';
import styles from '../styles/components/ImageCarousel.module.css';

interface ImageCarouselProps {
  images: string[];
  onRemoveImage?: (index: number) => void;
}

const ImageCarousel = ({ images, onRemoveImage }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  console.log(images)
  if (images.length === 0) {
    return (
      <div className={styles.carouselContainer}>
        <div className={styles.noImages}>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselWrapper}>
        {/* Main Image Display */}
        <div className={styles.mainImageContainer}>
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className={styles.mainImage}
          />
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={goToNext}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Remove Button */} 
          {onRemoveImage && (
            <button
              className={styles.removeButton}
              onClick={() => onRemoveImage(currentIndex)}
              aria-label="Remove image"
            >
              ×
            </button>
          )}

          {/* Image Counter */}
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className={styles.thumbnailContainer}>
            {images.map((image, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${
                  index === currentIndex ? styles.activeThumbnail : ''
                }`}
                onClick={() => goToImage(index)}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={styles.thumbnailImage}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel; 