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
      setError('Failed to create collection.');
      console.error(err);
    }
  };

  return (
    <>
      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdownMenu}>
            <h3 className={styles.title}>new collection</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  name
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
                  description
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
                  create
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      <button
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
        className={styles.fabButton}
        aria-label="Create Collection"
        disabled={isOpen}
      >
        +
      </button>
    </>
  );
};

export default CreateCollectionForm; 