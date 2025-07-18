import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchCollection, fetchCollectionItems, reorderItems, updateCollection, deleteCollection } from '../api';
import type { Collection, Item, CollectionCreate } from '../api';
import ItemCard from '../components/ItemCard';
import CreateItemForm from '../components/CreateItemForm';
import ConfirmModal from '../components/ConfirmModal';
import SearchBar from '../components/SearchBar';
import SortDropdown from '../components/SortDropdown';
import type { SortState } from '../components/SortDropdown';
import styles from '../styles/pages/CollectionDetailPage.module.css';

// TODO: add the option to have masonry grid fitting or square 
// TODO: fix the issue with the masonry grid. items dont seem to be added in a top to bottom and left to right manner
// TODO: add a sort function
// TODO: add an edit function which sets the page into "edit mode". Here you can edit the item itself, or delete them
// TODO: add a date field for items and collections (dateCreated, dateUpdated)

interface CollectionDetailPageProps {
  refreshTrigger?: number;
}

const CollectionDetailPage = ({ refreshTrigger = 0 }: CollectionDetailPageProps) => {
  const navigate = useNavigate();

  const { token } = useContext(AuthContext);
  const { collectionId } = useParams<{ collectionId: string }>();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  // Image order state
  const [itemOrder, setItemOrder] = useState<number[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ option: 'Custom', ascending: true });

  // UI State
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadCollectionAndItems = async () => {
    console.log('loadCollectionAndItems called with:', { token: !!token, collectionId });
    if (!token || !collectionId) {
      console.log('Missing token or collectionId, returning early');
      return;
    }
    
    try {
      setLoading(true);
      const collectionData = await fetchCollection(token, Number(collectionId));
      setCollection(collectionData);

      const itemsData = await fetchCollectionItems(token, Number(collectionId));
      setItems(itemsData);

      setCollectionName(collectionData.name);
      setCollectionDescription(collectionData.description || '');
      
      // Initialize item order with current item IDs (sorted by item_order from server)
      const newItemOrder = itemsData.map(item => item.id);
      setItemOrder(newItemOrder);

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
    loadCollectionAndItems();
  }, [token, collectionId]);

  // Refresh data when refreshTrigger changes (when an item is updated)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadCollectionAndItems();
    }
  }, [refreshTrigger]);

  const handleItemsCreated = async () => {
    // If we're in edit mode, we need to be careful about preserving the current order
    if (isEditMode) {
      // Get the current items to see what's new
      const currentItemsData = await fetchCollectionItems(token!, Number(collectionId));
      const currentItemIds = new Set(itemOrder);
      const newItemIds = currentItemsData.map(item => item.id);
      
      // Find new items that weren't in our current order
      const addedItems = newItemIds.filter(id => !currentItemIds.has(id));
      
      if (addedItems.length > 0) {
        // Add new items to the end of the current order
        const updatedOrder = [...itemOrder, ...addedItems];
        setItemOrder(updatedOrder);
        setItems(currentItemsData);
      }
    } else {
      // Not in edit mode, just refresh normally
      loadCollectionAndItems();
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    e.dataTransfer.setData('text/plain', itemId.toString());
    setDraggedItemId(itemId);
    setDragOverItemId(null); // Clear drop indicator
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    setDragOverItemId(targetItemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    const draggedItemId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedItemId === targetItemId) return;

    const newOrder = [...itemOrder];
    const draggedIndex = newOrder.indexOf(draggedItemId);
    const targetIndex = newOrder.indexOf(targetItemId);
    
    // Remove dragged item from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert dragged item at target position
    newOrder.splice(targetIndex, 0, draggedItemId);
    
    setItemOrder(newOrder);
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleEditModeToggle = async () => {
    if (isEditMode && itemOrder.length > 0) {
      // Exiting edit mode - commit the new order
      try {
        setIsReordering(true);
        console.log('itemOrder:', itemOrder)
        await reorderItems(token!, Number(collectionId), itemOrder);

        const collectionUpdate: CollectionCreate = {
          name: collectionName,
          description: collectionDescription
        }
        await updateCollection(token!, Number(collectionId), collectionUpdate);

        // Refresh the items to get the updated order from the server
        await loadCollectionAndItems();
      } catch (error) {
        console.error('Failed to reorder items:', error);
        setError('Failed to save item order');
      } finally {
        setIsReordering(false);
      }
    }
    setIsEditMode(!isEditMode);
  };

  // Get items in the current order
  const orderedItems = itemOrder.map(id => items.find(item => item.id === id)).filter(Boolean) as Item[];

  // Filter and sort items
  const filteredAndSortedItems = orderedItems
    .filter(item => 
      searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortState.option) {
        case 'Alphabetical':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'Custom':
          // Keep the current order (already ordered by itemOrder)
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

  const confirmDeleteCollection = async () => {
    try {
      setIsDeleting(true);
      await deleteCollection(token!, Number(collectionId));
      setIsDeleting(false);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to delete collection:', error);
      setError('Failed to delete collection');
      setIsDeleting(false);
    }
  };

  if (!token) {
    return <div>Please log in to view this collection.</div>;
  }

  if (loading) {
    return <div>Loading items...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {isEditMode ? (
        <div className={styles.editFields}>
          <input
            className={styles.title}
            type="text"
            value={collectionName}
            onChange={e => setCollectionName(e.target.value)}
          />
          <textarea
            className={styles.desc}
            value={collectionDescription}
            onChange={e => setCollectionDescription(e.target.value)}
            rows={2}
          />
        </div>
      ) : (
        <>
          <h1 className={styles.title}>{collection ? collection.name : 'Collection'}</h1>
          <p className={styles.desc}>{collection?.description}</p>
        </>
      )}
      
      <div className={styles.searchAndSortRow}>
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

      <div className={styles.controlsRow}>
        <button 
          onClick={handleEditModeToggle}
          className={styles.button}
          disabled={isReordering}
        >
          {isReordering ? 'Saving...' : isEditMode ? 'exit edit mode' : 'edit collection'}
        </button>
        {isEditMode && (
          <CreateItemForm onItemCreated={handleItemsCreated} />
        )}
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
          {filteredAndSortedItems.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              isEditMode={isEditMode}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              isDragged={draggedItemId === item.id}
              isDragOver={dragOverItemId === item.id}
            />
          ))}
        </div>
      )}        
      {isEditMode && (
        <div className={styles.deleteSection}>
          <button
            type="button"
            className={styles.submitButton}
            disabled={isDeleting}
            onClick={() => setShowConfirmModal(true)}
          >
            {isDeleting ? 'deleting...' : 'delete collection'}
          </button>
        </div>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDeleteCollection}
        title="Confirm Edit"
        message="Are you sure you want to delete this item?"
        confirmText="Save Changes"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CollectionDetailPage; 