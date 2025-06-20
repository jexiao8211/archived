import { Link } from "react-router-dom";

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">ARCHIVED</Link>
            </div>
            <div className="navbar-links">
                <Link to="/collections" className="nav-link">archives</Link>
                <Link to="/register" className="nav-link">register</Link>
                <Link to="/login" className="nav-link">login</Link>
                <Link to="/profile" className="nav-link">profile</Link>
            </div>
        </nav>
    );
};


export default NavBar