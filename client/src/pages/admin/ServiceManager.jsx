import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-toastify';
import './ServiceManager.css';

const defaultImages = {
  wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
  birthday: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800',
  corporate: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800',
  portrait: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800',
  other: 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=800'
};

const emptyForm = { name: '', description: '', price: '', category: 'wedding', features: '', popular: false, imageUrl: '', active: true };

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/services').then(({ data }) => setServices(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s._id);
    setForm({ ...s, features: s.features.join('\n'), price: s.price.toString(), imageUrl: s.imageUrl || '', active: s.active !== false });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        price: Number(form.price), 
        features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
        active: form.active !== false
      };
      if (editing) {
        const { data } = await api.put(`/services/${editing}`, payload);
        setServices(prev => prev.map(s => s._id === editing ? data : s));
        toast.success('Service updated');
      } else {
        const { data } = await api.post('/services', payload);
        setServices(prev => [...prev, data]);
        toast.success('Service created');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleActive = async (s) => {
    const nextActive = s.active === false ? true : false;
    // Optimistic UI update
    setServices(prev => prev.map(item => item._id === s._id ? { ...item, active: nextActive } : item));
    try {
      await api.put(`/services/${s._id}`, { ...s, active: nextActive });
      toast.success(`Service status set to ${nextActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      // Rollback on error
      setServices(prev => prev.map(item => item._id === s._id ? { ...item, active: !nextActive } : item));
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-manager">
      <div className="admin-manager__header">
        <div>
          <h2 className="admin__page-title">Service Packages Editor</h2>
          <p className="text-silver">{services.length} services configured</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-service-btn">
          <FiPlus /> Add Package
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="services-editor-grid">
          {services.map(s => {
            const cardImg = s.imageUrl || defaultImages[s.category] || defaultImages.other;
            return (
              <div key={s._id} className="service-editor-card animate-fade-in">
                <div className="service-editor-card__image">
                  <img src={cardImg} alt={s.name} />
                  {s.popular && <div className="service-editor-card__badge">Popular</div>}
                </div>
                <div className="service-editor-card__content">
                  <div className="service-editor-card__header">
                    <h3 className="service-editor-card__title" title={s.name}>{s.name}</h3>
                    <span className="service-editor-card__price">₹{s.price.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="service-editor-card__description">{s.description}</p>
                  
                  <div className="service-editor-card__deliverables-section">
                    <span className="service-editor-card__deliverables-label">Deliverables:</span>
                    <ul className="service-editor-card__deliverables-list">
                      {(s.features || []).slice(0, 4).map((f, idx) => (
                        <li key={idx} className="service-editor-card__deliverable">{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="service-editor-card__footer">
                  <label className="switch-container">
                    <span className="switch">
                      <input 
                        type="checkbox" 
                        checked={s.active !== false} 
                        onChange={() => handleToggleActive(s)}
                      />
                      <span className="slider"></span>
                    </span>
                    <span className="switch-label" style={{ color: s.active !== false ? 'var(--gold)' : 'var(--silver)', cursor: 'pointer' }}>
                      {s.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                  
                  <div className="service-editor-card__actions">
                    <button className="service-editor-card__btn" onClick={() => openEdit(s)} title="Edit Package">
                      <FiEdit2 size={14} />
                    </button>
                    <button className="service-editor-card__btn service-editor-card__btn--danger" onClick={() => handleDelete(s._id)} title="Delete Package">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal admin-modal--lg glass-card animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="font-heading">{editing ? 'Edit Package' : 'New Package'}</h3>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSave} className="admin-modal__form">
              <div className="admin-modal__grid">
                <div className="form-group">
                  <label className="form-label">Package Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['wedding','birthday','corporate','portrait','other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://unsplash.com/..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} required />
              </div>
              <div className="form-group">
                <label className="form-label">Features / Deliverables (one per line)</label>
                <textarea className="form-input" value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={4} placeholder="Full day coverage&#10;2 photographers&#10;500+ edited photos" />
              </div>
              
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', paddingTop: '8px' }}>
                <div className="flex gap-sm" style={{alignItems:'center'}}>
                  <input type="checkbox" id="popular-check" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} />
                  <label htmlFor="popular-check" className="form-label" style={{marginBottom:0}}>Mark as Popular</label>
                </div>
                <div className="flex gap-sm" style={{alignItems:'center'}}>
                  <input type="checkbox" id="active-check" checked={form.active !== false} onChange={e => setForm({...form, active: e.target.checked})} />
                  <label htmlFor="active-check" className="form-label" style={{marginBottom:0}}>Active</label>
                </div>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Package' : 'Create Package'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;
