import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { createCollection } from '../api';
import type { CollectionCreate } from '../api';
import styles from '../styles/components/CreateCollectionForm.module.css';

interface CreateCollectionFormProps {
  onCollectionCreated: () => void;
}

const CreateCollectionForm = ({ onCollectionCreated }: CreateCollectionFormProps) => {
  const { token } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('You must be logged in to create a collection');
      return;
    }

    try {
      const collectionData: CollectionCreate = {
        name: name.trim(),
        description: description.trim() || undefined
      };
      
      await createCollection(token, collectionData);
      setName('');
      setDescription('');
      setIsOpen(false);
      onCollectionCreated();
    } catch (err) {
      setError('Failed to create collection. Please try again.');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.createButton}
      >
        Create Collection
      </button>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h3>Create New Collection</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Name: *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Description:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
          />
        </div>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        <div className={styles.buttonGroup}>
          <button 
            type="submit"
            className={styles.submitButton}
          >
            Create
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsOpen(false);
              setName('');
              setDescription('');
              setError('');
            }}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCollectionForm; 