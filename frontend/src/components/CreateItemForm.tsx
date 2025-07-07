import { useState, useContext, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createItem, uploadItemImages, addItemTags } from '../api';
import styles from '../styles/components/CreateItemForm.module.css';

interface CreateItemFormProps {
  onItemCreated: () => void;
}

interface ImagePreview {
  id: string;
  file: File;
  url: string;
}

const CreateItemForm = ({ onItemCreated }: CreateItemFormProps) => {
  const { token } = useContext(AuthContext);
  const { collectionId } = useParams<{ collectionId: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('You must be logged in to create an item.');
      return;
    }
    if (!collectionId) {
      setError('Could not determine the collection.');
      return;
    }

    setIsLoading(true);

    try {
      // Create the item first
      const newItem = await createItem(token, Number(collectionId), { name, description });
      
      // Upload images if any
      if (images.length > 0) {
        const imageFiles = images.map(img => img.file);
        await uploadItemImages(token, newItem.id, imageFiles);
      }

      // Add tags if any
      if (tags.length > 0) {
        await addItemTags(token, newItem.id, tags);
      }

      // Reset form
      setName('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setImages([]);
      setIsOpen(false);
      onItemCreated();
    } catch (err) {
      setError('Failed to create item.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ImagePreview[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    // Clean up image URLs
    images.forEach(img => URL.revokeObjectURL(img.url));
    
    // Reset form
    setName('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setImages([]);
    setError('');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.button}
      >
        +
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={handleClose}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>new item</h2>
              <button 
                onClick={handleClose}
                className={styles.closeButton}
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  images
                </label>
                <div
                  className={`${styles.imageUploadSection} ${isDragOver ? styles.dragover : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className={styles.imageUploadInput}
                    disabled={isLoading}
                  />
                  <div className={styles.imageUploadText}>
                    drag and drop images here or click to browse
                  </div>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={isLoading}
                  >
                    choose files
                  </button>
                </div>
                
                {images.length > 0 && (
                  <div className={styles.imagePreviewContainer}>
                    {images.map((image) => (
                      <div key={image.id} className={styles.imagePreview}>
                        <img src={image.url} alt="Preview" />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className={styles.removeImageButton}
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  tags
                </label>
                <div className={styles.tagInputContainer}>
                  {tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className={styles.removeTagButton}
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Type a tag and press Enter..."
                    className={styles.tagInput}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {error && (
                <div className={styles.error}>{error}</div>
              )}
              
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateItemForm;