import { useState, useEffect } from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import ServiceCard from '../components/ServiceCard';
import api from '../api';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './Services.css';

const categories = ['all', 'wedding', 'birthday', 'corporate', 'portrait'];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCompare, setShowCompare] = useState(false);
  const { items } = useCart();

  useEffect(() => {
    api.get('/services')
      .then(({ data }) => setServices(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="services page-top">
      {/* Header */}
      <div className="services__header">
        <div className="services__header-bg" />
        <div className="container">
          <div className="section-label">Our Packages</div>
          <h1 className="display-md">Photography <span className="text-gold">Services</span></h1>
          <p className="services__sub">Carefully crafted packages for every occasion. Add services to your cart and book in one seamless step.</p>
        </div>
      </div>

      {/* Cart floating hint */}
      {items.length > 0 && (
        <div className="services__cart-hint">
          <div className="container">
            <div className="services__cart-bar">
              <div className="flex gap-sm" style={{alignItems:'center'}}>
                <FiShoppingBag className="text-gold" />
                <span>{items.length} service{items.length > 1 ? 's' : ''} in cart · ₹{items.reduce((s, i) => s + i.price, 0).toLocaleString('en-IN')}</span>
              </div>
              <Link to="/cart" className="btn btn-primary btn-sm">View Cart & Book</Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="services__filters">
        <div className="container">
          <div className="portfolio__filter-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`portfolio__filter-btn ${activeCategory === cat ? 'portfolio__filter-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  id={`services-filter-${cat}`}
                >
                  {cat === 'all' ? 'All Services' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn btn-outline-gold btn-sm" onClick={() => setShowCompare(true)}>
              Compare Packages
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container section">
        {loading ? (
          <div className="grid-3">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{height:'420px', borderRadius:'12px'}} />)}
          </div>
        ) : (
          <div className="grid-3 animate-stagger">
            {filtered.map(service => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {showCompare && (
        <div className="compare-modal-overlay" onClick={() => setShowCompare(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-modal__header">
              <h3 className="compare-modal__title">Package Comparison Matrix</h3>
              <button className="compare-modal__close" onClick={() => setShowCompare(false)}>✕</button>
            </div>
            <div className="compare-modal__body">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Wedding Photo</th>
                    <th>Wedding Video</th>
                    <th>Pre-Wedding</th>
                    <th>Portrait Session</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="compare-table__feature">Price</td>
                    <td className="compare-table__highlight">₹45,000</td>
                    <td className="compare-table__highlight">₹35,000</td>
                    <td>₹20,000</td>
                    <td>₹8,000</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Duration</td>
                    <td>Full Day (10 Hours)</td>
                    <td>Full Day (10 Hours)</td>
                    <td>6 Hours</td>
                    <td>2 Hours</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Team Size</td>
                    <td>2 Photographers</td>
                    <td>2 Videographers</td>
                    <td>1 Photographer</td>
                    <td>1 Photographer</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Deliverables</td>
                    <td>500+ Edited Photos</td>
                    <td>10-15min Film + Reels</td>
                    <td>150+ Edited Photos</td>
                    <td>50+ Edited Photos</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Printed Album</td>
                    <td>Yes (50 Pages)</td>
                    <td>No</td>
                    <td>Optional Add-on</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Drone Aerials</td>
                    <td>Yes (Included)</td>
                    <td>Yes (Included)</td>
                    <td>No</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td className="compare-table__feature">Outfit Changes</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                    <td>Up to 3</td>
                    <td>2 Changes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
