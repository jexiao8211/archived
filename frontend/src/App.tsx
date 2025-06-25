import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import page components
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import AddItemPage from './pages/AddItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import HomePage from './pages/HomePage';
import LoggedOutPage from './pages/LoggedOutPage';

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div style={{ paddingTop: "80px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px" }}>
                    <NavBar />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                        <Route path="/collections" element={<CollectionsPage />} />
                        <Route path="/collections/:collectionId" element={<CollectionDetailPage />} />
                        <Route path="/collections/:collectionId/add-item" element={<AddItemPage />} />
                        <Route path="/items/:itemId" element={<ItemDetailPage />} />
                        <Route path="/logged-out" element={<LoggedOutPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;