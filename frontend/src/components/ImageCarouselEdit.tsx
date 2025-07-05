import { useState, useRef } from 'react';
import styles from '../styles/components/ImageCarouselEdit.module.css';

interface ExtendedItemImage {
  id: number | string;
  image_url: string;
  file?: File;
}

interface ImageCarouselEditProps {
  images: ExtendedItemImage[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDelete: (imageId: number | string) => void;
  onAdd: (files: File[]) => void;
  fitParent?: boolean;
  modalContext?: boolean;
}

const ImageCarouselEdit = ({ 
  images, 
  onReorder, 
  onDelete, 
  onAdd, 
  fitParent = false, 
  modalContext = false 
}: ImageCarouselEditProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onAdd(files);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  if (images.length === 0) {
    return (
      <div className={`${styles.carouselContainer} ${fitParent ? styles.fitParent : ''} ${modalContext ? styles.modalContext : ''}`}>
        <div className={styles.emptyState}>
          <p>No images</p>
          <button 
            type="button"
            onClick={handleAddClick}
            className={styles.addButton}
          >
            Add Images
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className={styles.hiddenInput}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.carouselContainer} ${fitParent ? styles.fitParent : ''} ${modalContext ? styles.modalContext : ''}`}>
      <div className={styles.editHeader}>
        <h3>Edit Images</h3>
        <button 
          type="button"
          onClick={handleAddClick}
          className={styles.addButton}
        >
          Add Images
        </button>
      </div>

      <div className={styles.imageGrid}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`${styles.imageItem} ${
              draggedIndex === index ? styles.dragging : ''
            } ${
              dragOverIndex === index ? styles.dragOver : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className={styles.imageWrapper}>
              <img
                src={image.image_url}
                alt={`Image ${index + 1}`}
                className={styles.image}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.dragHandle}>
                  ⋮⋮
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(image.id)}
                  className={styles.deleteButton}
                  aria-label="Delete image"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.imageIndex}>
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default ImageCarouselEdit; 