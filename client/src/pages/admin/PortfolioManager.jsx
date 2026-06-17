import { useState, useEffect } from 'react';
import { FiTrash2, FiStar, FiUpload, FiX } from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-toastify';
import './AdminManager.css';

const PortfolioManager = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'wedding', featured: false });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const load = () => {
    setLoading(true);
    api.get('/portfolio').then(({ data }) => setImages(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = activeFilter === 'all' ? images : images.filter(i => i.category === activeFilter);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an image');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('featured', form.featured);
      await api.post('/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Image uploaded!');
      setShowModal(false);
      setFile(null); setPreview(null);
      setForm({ title: '', category: 'wedding', featured: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      setImages(prev => prev.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const toggleFeatured = async (id) => {
    try {
      const { data } = await api.patch(`/portfolio/${id}/featured`);
      setImages(prev => prev.map(i => i._id === id ? data : i));
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-manager">
      <div className="admin-manager__header">
        <div>
          <h2 className="admin__page-title">Portfolio Manager</h2>
          <p className="text-silver">{images.length} images in gallery</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="upload-image-btn">
          <FiUpload /> Upload Image
        </button>
      </div>

      {/* Filters */}
      <div className="portfolio__filter-tabs" style={{ marginBottom: '24px' }}>
        {['all','wedding','birthday','corporate','other'].map(cat => (
          <button key={cat} className={`portfolio__filter-btn ${activeFilter===cat?'portfolio__filter-btn--active':''}`} onClick={() => setActiveFilter(cat)}>
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase()+cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-manager__grid">
          {Array(8).fill(0).map((_,i) => <div key={i} className="skeleton" style={{height:'200px',borderRadius:'8px'}} />)}
        </div>
      ) : (
        <div className="admin-manager__grid">
          {filtered.map(img => (
            <div key={img._id} className="admin-manager__img-card">
              <img src={img.cloudinaryUrl} alt={img.title} />
              <div className="admin-manager__img-overlay">
                <span className="admin-manager__img-title">{img.title}</span>
                <span className="admin-manager__img-cat">{img.category}</span>
              </div>
              <div className="admin-manager__img-actions">
                <button className={`admin-manager__action-btn ${img.featured ? 'admin-manager__action-btn--gold' : ''}`} onClick={() => toggleFeatured(img._id)} title="Toggle featured">
                  <FiStar />
                </button>
                <button className="admin-manager__action-btn admin-manager__action-btn--danger" onClick={() => handleDelete(img._id)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
              {img.featured && <div className="admin-manager__featured-badge">Featured</div>}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal glass-card animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="font-heading">Upload New Image</h3>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleUpload} className="admin-modal__form">
              <div className="form-group">
                <label className="form-label">Select Image</label>
                <div className="admin-manager__dropzone" onClick={() => document.getElementById('img-file-input').click()}>
                  {preview ? <img src={preview} alt="preview" style={{maxHeight:'180px',objectFit:'contain',borderRadius:'6px'}} /> : (
                    <div className="admin-manager__dropzone-hint">
                      <FiUpload size={24} className="text-gold" />
                      <span>Click to choose image</span>
                    </div>
                  )}
                </div>
                <input id="img-file-input" type="file" accept="image/*" hidden onChange={handleFile} />
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Image title" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {['wedding','birthday','corporate','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-sm" style={{alignItems:'center'}}>
                <input type="checkbox" id="featured-check" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} />
                <label htmlFor="featured-check" className="form-label" style={{marginBottom:0}}>Mark as featured</label>
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;
