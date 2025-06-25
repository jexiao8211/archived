import { useState, useEffect, useContext, useRef } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'A-Z' | 'Custom' | 'Last Saved To'>('A-Z');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCollectionCreated = () => {
    loadCollections(); // Refresh the collections list
  };

  const getSortedCollections = () => {
    let filtered = collections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortOption === 'A-Z') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    // TODO: implement "Custom" and "Last Saved To" sorting options
    return filtered;
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
      
      <div className={styles.controlsRow}>
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Search collections by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className={styles.sortDropdownWrapper} ref={dropdownRef}>
          <button
            className={styles.sortButton}
            onClick={() => setDropdownOpen((open) => !open)}
            type="button"
          >
            Sort: {sortOption} ▼
          </button>
          {dropdownOpen && (
            <div className={styles.sortDropdown}>
              <div
                className={styles.sortOption}
                onClick={() => { setSortOption('A-Z'); setDropdownOpen(false); }}
              >A-Z</div>
              <div
                className={styles.sortOption}
                onClick={() => { setSortOption('Custom'); setDropdownOpen(false); }}
              >Custom</div>
              <div
                className={styles.sortOption}
                onClick={() => { setSortOption('Last Saved To'); setDropdownOpen(false); }}
              >Last Saved to</div>
            </div>
          )}
        </div>
      </div>
      
      <CreateCollectionForm onCollectionCreated={handleCollectionCreated} />
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {collections.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You don't have any collections yet.</p>
          <p>Click "Create Collection" above to get started!</p>
        </div>
      ) : getSortedCollections().length === 0 ? (
        <div className={styles.emptyState}>
          <p>No collections match your search.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {getSortedCollections().map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage; 