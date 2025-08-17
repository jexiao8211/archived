import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import page components
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import HomePage from './pages/HomePage';
import LoggedOutPage from './pages/LoggedOutPage';
import ContactPage from './pages/ContactPage';
import SharedCollectionPage from './pages/SharedCollectionPage';

const AppContent = () => {
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
                <Route path="/collections/:collectionId" element={<CollectionDetailPage />} />
                <Route path="/collections/:collectionId/edit" element={<CollectionDetailPage />} />
                <Route path="/collections/:collectionId/items/:itemId" element={<CollectionDetailPage />} />
                <Route path="/collections/:collectionId/items/:itemId/edit" element={<CollectionDetailPage />} />
                <Route path="/share/:token" element={<SharedCollectionPage />} />
                <Route path="/share/:token/items/:itemId" element={<SharedCollectionPage />} />
                <Route path="/logged-out" element={<LoggedOutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

const queryClient = new QueryClient();

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    <AppContent />
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;