import { Link, useLocation } from "react-router-dom";
import styles from "../styles/components/NavBar.module.css";

const NavBar = () => {
    const location = useLocation();
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarBrand}>
                <Link to="/" className={styles.navbarBrand}>ARCHIVED</Link>
            </div>
            <div className={styles.navbarLinks}>
                <Link to="/collections" className={`${styles.navLink} ${location.pathname.startsWith('/collections') ? styles.activeNavLink : ''}`}>archives</Link>
                <Link to="/register" className={`${styles.navLink} ${location.pathname === '/register' ? styles.activeNavLink : ''}`}>register</Link>
                <Link to="/login" className={`${styles.navLink} ${location.pathname === '/login' ? styles.activeNavLink : ''}`}>login</Link>
                <Link to="/profile" className={`${styles.navLink} ${location.pathname === '/profile' ? styles.activeNavLink : ''}`}>profile</Link>
            </div>
        </nav>
    );
};

export default NavBar