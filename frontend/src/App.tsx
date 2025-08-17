import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useState, useEffect } from 'react';

// Import page components
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import AddItemPage from './pages/AddItemPage';
import ItemDetailModal from './components/ItemDetailModal';
import ItemEditModal from './components/ItemEditModal';
import HomePage from './pages/HomePage';
import LoggedOutPage from './pages/LoggedOutPage';
import ContactPage from './pages/ContactPage';
import SharedCollectionPage from './pages/SharedCollectionPage';

const AppContent = () => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [collectionContext, setCollectionContext] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to refresh collection data
    const location = useLocation();
    const navigate = useNavigate();

    // Extract itemId from URL if present
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        // Skip global item modal handling on shared routes
        if (pathParts.includes('share')) {
            setSelectedItemId(null);
            setCollectionContext(null);
            setIsEditMode(false);
            return;
        }
        const itemIndex = pathParts.indexOf('items');
        
        console.log('App useEffect: Checking URL for itemId', { pathParts, itemIndex, pathname: location.pathname });
        
        if (itemIndex !== -1 && pathParts[itemIndex + 1]) {
            const itemId = pathParts[itemIndex + 1];
            console.log('App useEffect: Setting selectedItemId', itemId);
            setSelectedItemId(itemId);
            
            // Check if we're in edit mode
            const isEdit = pathParts.includes('edit');
            setIsEditMode(isEdit);
            
            // Check if we're in a collection context
            const collectionIndex = pathParts.indexOf('collections');
            if (collectionIndex !== -1 && pathParts[collectionIndex + 1]) {
                const collectionId = pathParts[collectionIndex + 1];
                setCollectionContext(collectionId);
            } else {
                setCollectionContext(null);
            }
        } else {
            console.log('App useEffect: Clearing selectedItemId');
            setSelectedItemId(null);
            setCollectionContext(null);
            setIsEditMode(false);
        }
    }, [location.pathname]);

    const handleCloseItemModal = () => {
        setSelectedItemId(null);
        setIsEditMode(false);
        // Navigate back to the appropriate context
        if (collectionContext) {
            navigate(`/collections/${collectionContext}`);
        } else {
            navigate('/collections');
        }
    };

    const handleItemUpdated = () => {
        // Trigger a refresh of the collection data
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div style={{ paddingTop: "80px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px" }}>
            <NavBar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/collections/:collectionId" element={<CollectionDetailPage refreshTrigger={refreshTrigger} />} />
                <Route path="/collections/:collectionId/add-item" element={<AddItemPage />} />
                <Route path="/collections/:collectionId/items/:itemId" element={<CollectionDetailPage refreshTrigger={refreshTrigger} />} />
                <Route path="/collections/:collectionId/items/:itemId/edit" element={<CollectionDetailPage refreshTrigger={refreshTrigger} />} />
                <Route path="/share/:token" element={<SharedCollectionPage />} />
                <Route path="/share/:token/items/:itemId" element={<SharedCollectionPage />} />

                <Route path="/logged-out" element={<LoggedOutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Item Detail Modal */}
            {selectedItemId && !isEditMode && !location.pathname.startsWith('/share/') && (
                <ItemDetailModal onClose={handleCloseItemModal} itemId={selectedItemId} />
            )}

            {/* Item Edit Modal */}
            {selectedItemId && isEditMode && !location.pathname.startsWith('/share/') && (
                <ItemEditModal onClose={handleCloseItemModal} itemId={selectedItemId} onItemUpdated={handleItemUpdated} />
            )}
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;