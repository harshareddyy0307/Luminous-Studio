import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCamera, FiInstagram, FiFacebook, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setSettings(data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/subscribers', { email });
      toast.success('Thank you for subscribing!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    }
  };

  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.studioName} style={{ height: '36px', objectFit: 'contain' }} />
              ) : (
                <>
                  <FiCamera className="footer__logo-icon" />
                  <span>
                    <span className="text-gold">{settings?.studioName ? settings.studioName.split(' ')[0] : 'Luminos'}</span>
                    {settings?.studioName ? ' ' + settings.studioName.split(' ').slice(1).join(' ') : ' Studio'}
                  </span>
                </>
              )}
            </Link>
            <p className="footer__tagline">
              Crafting timeless memories through the art of light and lens. Every frame tells a story worth preserving forever.
            </p>
            <div className="footer__socials">
              <a href={settings?.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social"><FiInstagram /></a>
              <a href={settings?.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer__social"><FiFacebook /></a>
              <a href={settings?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" className="footer__social"><FiYoutube /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__col-title">Quick Links</h4>
            <ul className="footer__links">
              <li><Link to="/" className="footer__link">Home</Link></li>
              <li><Link to="/portfolio" className="footer__link">Portfolio</Link></li>
              <li><Link to="/services" className="footer__link">Services</Link></li>
              <li><Link to="/booking" className="footer__link">Book Now</Link></li>
              <li><Link to="/cart" className="footer__link">My Cart</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer__col">
            <h4 className="footer__col-title">Services</h4>
            <ul className="footer__links">
              <li><Link to="/services" className="footer__link">Wedding Photography</Link></li>
              <li><Link to="/services" className="footer__link">Birthday Events</Link></li>
              <li><Link to="/services" className="footer__link">Corporate Events</Link></li>
              <li><Link to="/services" className="footer__link">Portrait Sessions</Link></li>
              <li><Link to="/services" className="footer__link">Pre-Wedding Shoots</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__col-title">Contact</h4>
            <ul className="footer__contact">
              <li>
                <FiMail className="footer__contact-icon" />
                <a href={`mailto:${settings?.contactEmail || "studio@luminosbook.com"}`} className="footer__link">
                  {settings?.contactEmail || "studio@luminosbook.com"}
                </a>
              </li>
              <li>
                <FiPhone className="footer__contact-icon" />
                <a href={`tel:${settings?.contactPhone || "+919876543210"}`} className="footer__link">
                  {settings?.contactPhone || "+91 98765 43210"}
                </a>
              </li>
              <li>
                <FiMapPin className="footer__contact-icon" />
                <span className="footer__link">{settings?.studioAddress || "Hyderabad, Telangana, India"}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer__col">
            <h4 className="footer__col-title">Newsletter</h4>
            <p className="footer__tagline" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
              Subscribe to get updates, special offers, and pricing announcements.
            </p>
            <form onSubmit={handleSubscribe} className="footer__newsletter-form">
              <input
                type="email"
                className="footer__newsletter-input"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm footer__newsletter-btn" style={{ width: '100%', marginTop: '8px' }}>
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} Luminos Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
