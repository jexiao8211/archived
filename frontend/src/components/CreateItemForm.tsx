import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createItem } from '../api';
import styles from '../styles/components/CreateItemForm.module.css';

interface CreateItemFormProps {
  onItemCreated: () => void;
}

const CreateItemForm = ({ onItemCreated }: CreateItemFormProps) => {
  const { token } = useContext(AuthContext);
  const { collectionId } = useParams<{ collectionId: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('');

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

    try {
      await createItem(token, Number(collectionId), { name, description });
      setName('');
      setDescription('');
      setIsOpen(false);
      onItemCreated();
    } catch (err) {
      setError('Failed to create item.');
      console.error(err);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.createButton}
      >
        Create Item
      </button>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h3>Create New Item</h3>
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

export default CreateItemForm;