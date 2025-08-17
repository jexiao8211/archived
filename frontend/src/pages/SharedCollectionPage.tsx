import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchSharedCollection, fetchSharedItem } from '../api';
import type { Collection, Item } from '../api';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import SortDropdown from '../components/SortDropdown';
import type { SortState } from '../components/SortDropdown';
import styles from '../styles/pages/CollectionDetailPage.module.css';
import ItemDetailModal from '../components/ItemDetailModal';

const SharedCollectionPage = () => {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ option: 'Custom', ascending: true });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await fetchSharedCollection(token);
        setCollection(data);
        const sortedItems = [...(data.items || [])].sort((a, b) => a.item_order - b.item_order);
        setItems(sortedItems);
        setError('');
      } catch (err) {
        setError('Invalid or expired share link');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    // Deep-link support: /share/:token/items/:itemId
    const parts = location.pathname.split('/');
    const itemsIndex = parts.indexOf('items');
    if (itemsIndex !== -1 && parts[itemsIndex + 1] && token) {
      const id = Number(parts[itemsIndex + 1]);
      if (!Number.isNaN(id)) {
        fetchSharedItem(token, id).then(setSelectedItem).catch(() => setSelectedItem(null));
      }
    } else {
      setSelectedItem(null);
    }
  }, [location.pathname, token]);

  const filteredAndSortedItems = items
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
          return 0;
        case 'Last Updated':
          const aDate = a.updated_date || a.created_date || new Date(0);
          const bDate = b.updated_date || b.created_date || new Date(0);
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
          break;
        default:
          return 0;
      }
      return sortState.ascending ? comparison : -comparison;
    });

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>{collection?.name || 'Collection'}</h1>
      <p className={styles.desc}>{collection?.description}</p>

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

      {error && <div className={styles.error}>{error}</div>}

      {filteredAndSortedItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p>this collection doesn't have any items yet</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAndSortedItems.map((item) => (
            <div key={item.id} onClick={() => navigate(`/share/${token}/items/${item.id}`)}>
              <ItemCard item={item} isEditMode={false} isNavigable={false} />
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <ItemDetailModal 
          onClose={() => navigate(`/share/${token}`)} 
          itemId={String(selectedItem.id)} 
          token={token}
        />
      )}
    </div>
  );
};

export default SharedCollectionPage;


