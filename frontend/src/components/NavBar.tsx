import { Link } from "react-router-dom";
import styles from "../styles/components/NavBar.module.css";

const NavBar = () => {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarBrand}>
                <Link to="/" className={styles.navbarBrand}>ARCHIVED</Link>
            </div>
            <div className={styles.navbarLinks}>
                <Link to="/collections" className={styles.navLink}>archives</Link>
                <Link to="/register" className={styles.navLink}>register</Link>
                <Link to="/login" className={styles.navLink}>login</Link>
                <Link to="/profile" className={styles.navLink}>profile</Link>
            </div>
        </nav>
    );
};

export default NavBar