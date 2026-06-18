import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCamera, FiShoppingCart, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { items } = useCart();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem('luminosTheme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('luminosTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/services', label: 'Services' },
    { to: '/tools', label: 'Interactive Tools' },
    { to: '/portal', label: 'Client Portal' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <FiCamera className="navbar__logo-icon" />
          <span>
            <span className="navbar__logo-luminos">Luminos</span>
            <span className="navbar__logo-studio"> Studio</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="navbar__actions">
          <button onClick={toggleTheme} className="navbar__theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <FiSun size={19} /> : <FiMoon size={19} />}
          </button>
          
          <Link to="/cart" className="navbar__cart" aria-label="Cart">
            <FiShoppingCart size={20} />
            {items.length > 0 && <span className="badge">{items.length}</span>}
          </Link>
          <Link to="/booking" className="btn btn-primary btn-sm navbar__cta">Book Now</Link>
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar__mobile-link ${location.pathname === link.to ? 'navbar__mobile-link--active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link to="/cart" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
          Cart {items.length > 0 && <span className="badge">{items.length}</span>}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
