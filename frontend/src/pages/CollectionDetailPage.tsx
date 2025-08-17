import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCollection, fetchCollectionItems, reorderItems, updateCollection, deleteCollection, createOrEnableShare, disableShare } from '../api';
import type { Collection, Item, CollectionCreate } from '../api';
import ItemCard from '../components/ItemCard';
import CreateItemForm from '../components/CreateItemForm';
import ConfirmModal from '../components/ConfirmModal';
import SearchBar from '../components/SearchBar';
import SortDropdown from '../components/SortDropdown';
import type { SortState } from '../components/SortDropdown';
import styles from '../styles/pages/CollectionDetailPage.module.css';
import ItemDetailModal from '../components/ItemDetailModal';
import ItemEditModal from '../components/ItemEditModal';

// TODO: add the option to have masonry grid fitting or square 
// TODO: fix the issue with the masonry grid. items dont seem to be added in a top to bottom and left to right manner
// TODO: add a sort function
// TODO: add an edit function which sets the page into "edit mode". Here you can edit the item itself, or delete them
// TODO: add a date field for items and collections (dateCreated, dateUpdated)

const CollectionDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { collectionId, itemId } = useParams<{ collectionId: string; itemId?: string }>();
  const queryClient = useQueryClient();
  const navState = location.state as { collection?: Collection } | null;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');

  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  // Image order state
  const [itemOrder, setItemOrder] = useState<number[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
  const [collectionEdited, setCollectionEdited] = useState(false)

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ option: 'Custom', ascending: true });

  // UI State
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditMode = location.pathname.endsWith('/edit');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Data fetching with React Query (v5: no onSuccess/onError in options)
  const { data: collectionData, isLoading: isCollectionLoading, error: collectionError } = useQuery<Collection, Error>({
    queryKey: ['collection', collectionId],
    queryFn: () => fetchCollection(Number(collectionId)),
    enabled: !!collectionId,
  });

  const { data: itemsData, isLoading: isItemsLoading, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['collectionItems', collectionId],
    queryFn: () => fetchCollectionItems(Number(collectionId)),
    enabled: !!collectionId,
  });

  // Derive local state from query data
  useEffect(() => {
    if (collectionData) {
      const preferred = navState?.collection && navState.collection.id === Number(collectionId)
        ? navState.collection
        : collectionData;
      setCollection(preferred);
      setCollectionName(preferred.name);
      setCollectionDescription(preferred.description || '');
    }
  }, [collectionData, navState, collectionId]);

  useEffect(() => {
    if (itemsData) {
      const sorted = [...itemsData].sort((a, b) => a.item_order - b.item_order);
      setItems(sorted);
      setItemOrder(sorted.map(i => i.id));
      setCollectionEdited(false);
    }
  }, [itemsData]);

  useEffect(() => {
    if (collectionError) setError('Failed to load collection');
    if (itemsError) setError('Failed to load items');
  }, [collectionError, itemsError]);

  const handleItemsCreated = async () => {
    // If we're in edit mode, we need to be careful about preserving the current order
    if (isEditMode) {
      // Get the current items to see what's new
      const currentItemsData = await fetchCollectionItems(Number(collectionId));
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
      // Not in edit mode, just refresh normally via invalidation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collectionItems', collectionId] }),
        queryClient.invalidateQueries({ queryKey: ['collection', collectionId] }),
      ]);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    if (sortState.option !== 'Custom') {
      e.preventDefault();
      alert('To edit custom order, change sort to "Custom"');
      return;
    }
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
    setCollectionEdited(true);
  };

  const handleEditModeToggle = async () => {
    // Close any share UI when toggling modes
    setShowShareMenu(false);
    if (isEditMode && (itemOrder.length > 0 || collectionEdited)) {
      // Exiting edit mode - commit the new order and/or collection changes
      try {
        setIsReordering(true);
        
        // Only reorder items if there are items and the order has changed
        if (itemOrder.length > 0) {
          console.log('itemOrder:', itemOrder)
          await reorderItems(Number(collectionId), itemOrder);
          await queryClient.invalidateQueries({ queryKey: ['collectionItems', collectionId] });
        }

        // Only update collection if it has been edited
        if (collectionEdited) {
          const collectionUpdate: CollectionCreate = {
            name: collectionName,
            description: collectionDescription
          }
          await updateCollection(Number(collectionId), collectionUpdate);
          await queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
        }

        // Data will be refreshed by invalidation
      } catch (error) {
        console.error('Failed to save changes:', error);
        setError('Failed to save changes');
      } finally {
        setIsReordering(false);
      }
    }
    else { // Switch to edit mode 
      // set sort to custom
      // set search terms to none
      setSearchTerm('')
      setSortState({ option: 'Custom', ascending: true })
    }
    // Ensure fresh data when leaving edit mode regardless of local changes
    if (isEditMode) {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['collectionItems', collectionId] }),
        queryClient.refetchQueries({ queryKey: ['collection', collectionId] }),
      ]);
      navigate(`/collections/${collectionId}`);
    } else {
      navigate(`/collections/${collectionId}/edit`);
    }
  };

  // Choose items from query: prefer dedicated items query; fallback to collection.items
  const baseItems = (items && items.length > 0)
    ? items
    : (collection?.items ?? []);
  const sortedBaseItems = [...baseItems].sort((a, b) => a.item_order - b.item_order);
  const effectiveOrder = itemOrder.length > 0 ? itemOrder : sortedBaseItems.map(i => i.id);
  const orderedItems = effectiveOrder
    .map(id => sortedBaseItems.find(item => item.id === id))
    .filter(Boolean) as Item[];

  // Filter and sort items
  const filteredAndSortedItems = orderedItems
    .filter(item => 
      searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
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
      await deleteCollection(Number(collectionId));
      setIsDeleting(false);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to delete collection:', error);
      setError('Failed to delete collection');
      setIsDeleting(false);
    }
  };

  const handleCreateShare = async (rotate: boolean = false) => {
    if (!collectionId) return;
    try {
      setIsSharing(true);
      const shareInfo = await createOrEnableShare(Number(collectionId), rotate);
      setShareUrl(shareInfo.url);
    } catch (error) {
      setError('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDisableShare = async () => {
    if (!collectionId) return;
    try {
      setIsSharing(true);
      await disableShare(Number(collectionId));
      setShareUrl(null);
      setShowShareMenu(false);
    } catch (error) {
      setError('Failed to disable share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Keep menu open; optionally give feedback later
    } catch (e) {
      console.error('Failed to copy');
    }
  };



  if (isCollectionLoading || isItemsLoading) {
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
            onChange={e => {
              setCollectionName(e.target.value);
              setCollectionEdited(true);
            }}
          />
          <textarea
            className={styles.desc}
            value={collectionDescription}
            onChange={e => {
              setCollectionDescription(e.target.value);
              setCollectionEdited(true);
            }}
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
        {!isEditMode && (
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowShareMenu(prev => !prev)}
              className={styles.button}
              disabled={isSharing}
            >
              {isSharing ? 'processing...' : 'share'}
            </button>
            {showShareMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: 'white', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 8, zIndex: 1000, minWidth: 260 }}>
                {shareUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>share link</div>
                    <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{shareUrl}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={styles.button} onClick={handleCopyShareLink} disabled={!shareUrl}>copy link</button>
                      <button className={styles.button} onClick={() => handleCreateShare(true)} disabled={isSharing}>rotate</button>
                      <button className={styles.button} onClick={handleDisableShare} disabled={isSharing}>disable</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>no active link</div>
                    <button className={styles.button} onClick={() => handleCreateShare(false)} disabled={isSharing}>create link</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {sortedBaseItems.length === 0 ? (
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
              isNavigable={true}
              isDraggable={sortState.option === 'Custom'}
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
      {/* Modals handled via route */}
      {itemId && !isEditMode && (
        <ItemDetailModal onClose={() => navigate(`/collections/${collectionId}`)} itemId={itemId} />
      )}
      {itemId && isEditMode && (
        <ItemEditModal 
          onClose={() => navigate(`/collections/${collectionId}/edit`)} 
          itemId={itemId} 
          onItemUpdated={async (info) => {
            // Optimistically update local state if an item was deleted to avoid stale ghost entries
            if (info?.deletedItemId) {
              setItems(prev => prev.filter(i => i.id !== info.deletedItemId));
              setItemOrder(prev => prev.filter(id => id !== info.deletedItemId));
            }
            await Promise.all([
              queryClient.refetchQueries({ queryKey: ['collectionItems', collectionId] }),
              queryClient.refetchQueries({ queryKey: ['collection', collectionId] }),
            ]);
          }} 
        />
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
        message="Are you sure you want to delete this collection?"
        confirmText="Save Changes"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CollectionDetailPage; 