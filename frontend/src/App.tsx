import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import UserProfilePage from './components/UserProfile';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <div style={{"padding": "20px"}}>
                    <nav>
                        <ul>
                            <li><Link to="/register">Register</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                        </ul>
                    </nav>
                    <Routes>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/profile" element={<UserProfilePage/>}/>
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;