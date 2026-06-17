import { useState, useEffect } from 'react';
import { FiFilter, FiHeart, FiSearch } from 'react-icons/fi';
import Lightbox from '../components/Lightbox';
import api from '../api';
import './Portfolio.css';

const categories = [
  { key: 'all', label: 'All Work' },
  { key: 'wedding', label: 'Wedding' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'favorites', label: '❤ Wishlist' },
];

const Portfolio = () => {
  const [images, setImages] = useState([]);
  const [active, setActive] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('luminosFavorites') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get('/portfolio')
      .then(({ data }) => { setImages(data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (e, imgId) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(imgId) ? prev.filter((id) => id !== imgId) : [...prev, imgId];
      localStorage.setItem('luminosFavorites', JSON.stringify(updated));
      return updated;
    });
  };

  const handleFilter = (cat) => {
    setActive(cat);
  };

  const filtered = images.filter(img => {
    const matchesCat = active === 'all' 
      ? true 
      : active === 'favorites'
        ? favorites.includes(img._id)
        : img.category === active;
        
    const matchesSearch = search.trim() === ''
      ? true
      : img.title.toLowerCase().includes(search.toLowerCase()) || 
        img.category.toLowerCase().includes(search.toLowerCase());
        
    return matchesCat && matchesSearch;
  });

  return (
    <div className="portfolio page-top">
      {/* Header */}
      <div className="portfolio__header">
        <div className="portfolio__header-bg" />
        <div className="container">
          <div className="section-label"><FiFilter /> Gallery</div>
          <h1 className="display-md">Our <span className="text-gold">Portfolio</span></h1>
          <p className="portfolio__sub">Explore our collection of stunning photography across all categories</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="portfolio__filters">
        <div className="container portfolio__filters-inner">
          <div className="portfolio__filter-tabs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`portfolio__filter-btn ${active === cat.key ? 'portfolio__filter-btn--active' : ''}`}
                onClick={() => handleFilter(cat.key)}
                id={`filter-${cat.key}`}
              >
                {cat.label}
                <span className="portfolio__filter-count">
                  {cat.key === 'all' 
                    ? images.length 
                    : cat.key === 'favorites'
                      ? favorites.length
                      : images.filter(i => i.category === cat.key).length}
                </span>
              </button>
            ))}
          </div>

          <div className="portfolio__search-wrap">
            <input
              type="text"
              className="portfolio__search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search portfolio..."
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container section-sm">
        {loading ? (
          <div className="portfolio__grid">
            {Array(9).fill(0).map((_, i) => <div key={i} className="skeleton portfolio__skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="page-loading text-center">
            <p className="text-silver">No images found matching your criteria.</p>
          </div>
        ) : (
          <div className="portfolio__grid animate-stagger">
            {filtered.map((img, i) => (
              <div
                key={img._id}
                className="portfolio__item"
                onClick={() => setLightboxIdx(i)}
              >
                <img src={img.cloudinaryUrl} alt={img.title} loading="lazy" />
                <div className="portfolio__item-overlay">
                  <button 
                    className={`portfolio__fav-btn ${favorites.includes(img._id) ? 'portfolio__fav-btn--active' : ''}`}
                    onClick={(e) => toggleFavorite(e, img._id)}
                    aria-label="Add to favorites"
                  >
                    <FiHeart size={16} />
                  </button>
                  <span className="portfolio__item-title">{img.title}</span>
                  <span className="portfolio__item-cat">{img.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={filtered}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => (i - 1 + filtered.length) % filtered.length)}
          onNext={() => setLightboxIdx(i => (i + 1) % filtered.length)}
        />
      )}
    </div>
  );
};

export default Portfolio;
