import { useState, useRef, useEffect } from 'react';
import styles from '../styles/components/ImageCarousel.module.css';

interface ImageCarouselProps {
  images: string[];
  onRemoveImage?: (index: number) => void;
  fitParent?: boolean;
  modalContext?: boolean;
}

const ImageCarousel = ({ images, onRemoveImage, fitParent = false, modalContext = false }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll thumbnail to current image
  useEffect(() => {
    if (thumbnailContainerRef.current && thumbnailRefs.current[currentIndex]) {
      const container = thumbnailContainerRef.current;
      const thumbnail = thumbnailRefs.current[currentIndex];
      
      if (thumbnail) {
        const containerRect = container.getBoundingClientRect();
        const thumbnailRect = thumbnail.getBoundingClientRect();
        
        // Check if thumbnail is outside the visible area
        if (thumbnailRect.left < containerRect.left) {
          // Scroll to show thumbnail on the left
          container.scrollTo({
            left: container.scrollLeft + (thumbnailRect.left - containerRect.left) - 10,
            behavior: 'smooth'
          });
        } else if (thumbnailRect.right > containerRect.right) {
          // Scroll to show thumbnail on the right
          container.scrollTo({
            left: container.scrollLeft + (thumbnailRect.right - containerRect.right) + 10,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentIndex]);

  if (images.length === 0) {
    return (
      <div className={`${styles.carouselContainer} ${fitParent ? styles.fitParent : ''} ${modalContext ? styles.modalContext : ''}`}>
        <div className={styles.noImages}>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`${styles.carouselContainer} ${fitParent ? styles.fitParent : ''} ${modalContext ? styles.modalContext : ''}`}>
      <div className={styles.carouselWrapper}>
        {/* Main Image Display */}
        <div className={`${styles.mainImageContainer} ${fitParent ? styles.fitParent : ''}`}>
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className={
              currentIndex === 0
                ? `${styles.mainImage} ${styles.firstImage}`
                : styles.mainImage
            }
          />
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={goToPrevious}
                aria-label="Previous image"
                tabIndex={0}
                type="button"
              >
                &#x2039;
              </button>
              <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={goToNext}
                aria-label="Next image"
                tabIndex={0}
                type="button"
              >
                &#x203A;
              </button>
            </>
          )}

          {/* Remove Button */}
          {onRemoveImage && (
            <button
              className={styles.removeButton}
              onClick={() => onRemoveImage(currentIndex)}
              aria-label="Remove image"
              type="button"
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
          <div className={styles.thumbnailContainer} ref={thumbnailContainerRef}>
            {images.map((image, index) => (
              <div
                key={index}
                ref={(el) => {
                  thumbnailRefs.current[index] = el;
                }}
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