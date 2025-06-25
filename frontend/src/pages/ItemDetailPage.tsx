import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";
import { fetchItem , uploadItemImages } from '../api';
import type { Item, ItemImage } from '../api';
import ImageCarousel from '../components/ImageCarousel';
import styles from '../styles/pages/ItemDetailPage.module.css';

// TODO: add ability to change the cover photo for the item


const ItemDetailPage = () => {
  const { token } = useContext(AuthContext);
  const { itemId } = useParams<{ itemId: string }>();

  const [item, setItem] = useState<Item | null>(null);
  const [itemImages, setItemImages] = useState<ItemImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadItem = async () => {
    if (!token || !itemId) return;
    
    try {
      setLoading(true);
      const itemData = await fetchItem(token, Number(itemId));
      setItem(itemData);
      setItemImages(itemData.images || []);
      setError('');
    } catch (err) {
      setError('Failed to load item');
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [token, itemId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // TODO: add previews to uploaded images
  const handleUploadImages = async () => {
    if (!token || !itemId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const imageData = await uploadItemImages(token, Number(itemId), selectedFiles);
      console.log('Uploading images:', selectedFiles);
      
      setSelectedFiles([]);
      // Reload item to get updated images
      await loadItem();
    } catch (err) {
      setError('Failed to upload images');
      console.error('Error uploading images:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageIndex: number) => {
    if (!token || !itemId) return;

    try {
      // TODO: Implement image removal API call
      console.log('Removing image at index:', imageIndex);
      
      // For now, just remove from local state
      setItemImages(prev => prev.filter((_, i) => i !== imageIndex));
    } catch (err) {
      setError('Failed to remove image');
      console.error('Error removing image:', err);
    }
  };

  if (!token) {
    return <div>Please log in to view this item.</div>;
  }

  if (loading) {
    return <div>Loading item...</div>;
  }

  if (!item) {
    return <div>Item not found.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{item.name}</h1>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Image Carousel Section */}
      <div className={styles.imageSection}>
        <h2>Images</h2>
        <ImageCarousel 
          images={itemImages.map(img => img.image_url)} 
          onRemoveImage={removeImage}
        />
      </div>

      {/* Image Upload Section */}
      <div className={styles.uploadSection}>
        <h3>Add Images</h3>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        {selectedFiles.length > 0 && (
          <div className={styles.selectedFiles}>
            <h4>Selected Files ({selectedFiles.length})</h4>
            <div className={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span>{file.name}</span>
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleUploadImages}
              disabled={uploading}
              className={styles.uploadButton}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage; 