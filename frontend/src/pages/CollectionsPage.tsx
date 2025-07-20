import { useState, useEffect } from 'react';
import { fetchCollections, reorderCollections } from '../api';
import type { Collection } from '../api';
import CollectionCard from '../components/CollectionCard';
import CreateCollectionForm from '../components/CreateCollectionForm';
import styles from '../styles/pages/CollectionsPage.module.css';

import SearchBar from '../components/SearchBar';
import SortDropdown from '../components/SortDropdown';
import type { SortState } from '../components/SortDropdown';


const CollectionsPage = () => {

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Collection order state
  const [colOrder, setColOrder] = useState<number[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedColId, setDraggedColId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<number | null>(null);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ option: 'Custom', ascending: true });

  const loadCollections = async () => {
    try {
      setLoading(true);
              const data = await fetchCollections();
      setCollections(data);
      
      // Initialize collection order from fetched data
      const initialOrder = data.map(collection => collection.id);
      setColOrder(initialOrder);
      
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
  }, []);

  const handleCollectionCreated = () => {
    loadCollections(); // Refresh the collections list
  };

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    e.dataTransfer.setData('text/plain', itemId.toString());
    setDraggedColId(itemId);
    setDragOverColId(null); // Clear drop indicator
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    setDragOverColId(targetItemId);
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
    setDragOverColId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    const draggedItemId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedItemId === targetItemId) return;

    const newOrder = [...colOrder];
    const draggedIndex = newOrder.indexOf(draggedItemId);
    const targetIndex = newOrder.indexOf(targetItemId);
    
    // Remove dragged item from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert dragged item at target position
    newOrder.splice(targetIndex, 0, draggedItemId);
    
    setColOrder(newOrder);
    setDraggedColId(null);
    setDragOverColId(null);

    // Immediately call API to save the new order
    try {
      setIsReordering(true);
      await reorderCollections(newOrder);
    } catch (error) {
      console.error('Failed to reorder collections:', error);
      setError('Failed to save collection order');
      // Revert the order on error
      setColOrder(collections.map(collection => collection.id));
    } finally {
      setIsReordering(false);
    }
  };

  // Get collections in the current order
  const orderedCollections = colOrder.map(id => collections.find(collection => collection.id === id)).filter(Boolean) as Collection[];

  // Filter and sort items
  const filteredAndSortedCollections = orderedCollections
    .filter(collection => 
      searchTerm === '' || 
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortState.option) {
        case 'Alphabetical':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'Custom':
          // Keep the current order (already ordered by colOrder)
          return 0;
        case 'Last Updated':
          // Sort by updated_date if available, otherwise by created_date
          const aDate = a.updated_date || a.created_date || new Date(0);
          const bDate = b.updated_date || b.created_date || new Date(0);
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
          break;
        default:
          return 0;
      }
      
      // Apply ascending/descending
      return sortState.ascending ? comparison : -comparison;
    });

  if (loading) {
    return <div>Loading collections...</div>;
  }

  return (
    <div className={styles.pageContainer}>      
      <div className={styles.controlsRow}>
        <div className={styles.leftControls}>

        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="search items in this collection"
          className={styles.collectionSearchBar}
        />
        <SortDropdown 
          value={sortState}
          onChange={setSortState}
        />
        </div>

        <CreateCollectionForm onCollectionCreated={handleCollectionCreated} />
      </div>
      
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {collections.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You don't have any collections yet.</p>
          <p>Click "Create Collection" above to get started!</p>
        </div>
      ) : filteredAndSortedCollections.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No collections match your search.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAndSortedCollections.map((collection) => (
            <CollectionCard 
              key={collection.id} 
              collection={collection}
              onDragStart={(e) => handleDragStart(e, collection.id)}
              onDragOver={(e) => handleDragOver(e, collection.id)}
              onDrop={(e) => handleDrop(e, collection.id)}
              onDragEnd={handleDragEnd}
              isDragged={draggedColId === collection.id}
              isDragOver={dragOverColId === collection.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage; 