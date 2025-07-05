import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchCollection, fetchCollectionItems } from '../api';
import type { Collection, Item } from '../api';
import ItemCard from '../components/ItemCard';
import CreateItemForm from '../components/CreateItemForm';
import styles from '../styles/pages/CollectionDetailPage.module.css';

// TODO: add the option to have masonry grid fitting or square 
// TODO: fix the issue with the masonry grid. items dont seem to be added in a top to bottom and left to right manner
// TODO: add a sort function
// TODO: add an edit function which sets the page into "edit mode". Here you can edit the item itself, or delete them
// TODO: add a date field for items and collections (dateCreated, dateUpdated)

const CollectionDetailPage = () => {
  const { token } = useContext(AuthContext);
  const { collectionId } = useParams<{ collectionId: string }>();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const loadCollectionAndItems = async () => {
    console.log('loadCollectionAndItems called with:', { token: !!token, collectionId });
    if (!token || !collectionId) {
      console.log('Missing token or collectionId, returning early');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching collection with ID:', collectionId);
      const collectionData = await fetchCollection(token, Number(collectionId));
      console.log('Collection data received:', collectionData);
      setCollection(collectionData);

      console.log('Fetching items for collection:', collectionId);
      const itemsData = await fetchCollectionItems(token, Number(collectionId));
      console.log('Items data received:', itemsData);
      setItems(itemsData);

      setError('');
    } catch (err) {
      console.error('Error in loadCollectionAndItems:', err);
      setError('Failed to load collection or items');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with:', { token: !!token, collectionId });
    loadCollectionAndItems();
  }, [token, collectionId]);

  const handleItemsCreated = () => {
    loadCollectionAndItems(); // Refresh the items list
  };

  if (!token) {
    return <div>Please log in to view this collection.</div>;
  }

  if (loading) {
    return <div>Loading items...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>{collection ? collection.name : 'Collection'}</h1> 
      
      <div className={styles.controlsRow}>
        <CreateItemForm onItemCreated={handleItemsCreated} />
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className={styles.button}
        >
          {isEditMode ? 'exit edit mode' : 'edit collection'}
        </button>
      </div>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>this collection doesn't have any items yet</p>
          <p>click "create item" above to get started</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} isEditMode={isEditMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage; 