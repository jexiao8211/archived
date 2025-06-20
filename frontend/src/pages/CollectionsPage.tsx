import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { fetchCollections } from '../api';
import type { Collection } from '../api';
import CollectionCard from '../components/CollectionCard';
import CreateCollectionForm from '../components/CreateCollectionForm';
import styles from '../styles/pages/CollectionsPage.module.css';

const CollectionsPage = () => {
  const { token } = useContext(AuthContext);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCollections = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await fetchCollections(token);
      setCollections(data);
      setError('');
    } catch (err) {
      setError('Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [token]);

  const handleCollectionCreated = () => {
    loadCollections(); // Refresh the collections list
  };

  if (!token) {
    return <div>Please log in to view your collections.</div>;
  }

  if (loading) {
    return <div>Loading collections...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>My Collections</h1>
      
      <CreateCollectionForm onCollectionCreated={handleCollectionCreated} />
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {collections.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You don't have any collections yet.</p>
          <p>Click "Create Collection" above to get started!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage; 