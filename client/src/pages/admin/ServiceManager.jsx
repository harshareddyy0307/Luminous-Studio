import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', description: '', price: '', category: 'wedding', features: '', popular: false, imageUrl: '' };

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
    setForm({ ...s, features: s.features.join('\n'), price: s.price.toString() });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), features: form.features.split('\n').map(f => f.trim()).filter(Boolean) };
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

  return (
    <div className="admin-manager">
      <div className="admin-manager__header">
        <div>
          <h2 className="admin__page-title">Service Manager</h2>
          <p className="text-silver">{services.length} services available</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-service-btn">
          <FiPlus /> Add Service
        </button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Popular</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="admin-table__service-name">{s.name}</div>
                    <div className="admin-table__service-desc">{s.description.slice(0, 70)}...</div>
                  </td>
                  <td><span className="status-badge status-pending">{s.category}</span></td>
                  <td className="text-gold font-heading">₹{s.price.toLocaleString('en-IN')}</td>
                  <td>{s.popular ? <FiCheck className="text-gold" /> : '—'}</td>
                  <td>
                    <div className="flex gap-sm">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} id={`edit-service-${s._id}`}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)} id={`delete-service-${s._id}`}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal admin-modal--lg glass-card animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="font-heading">{editing ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSave} className="admin-modal__form">
              <div className="admin-modal__grid">
                <div className="form-group">
                  <label className="form-label">Service Name</label>
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
                <div className="flex gap-sm" style={{alignItems:'center', paddingTop:'24px'}}>
                  <input type="checkbox" id="popular-check" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} />
                  <label htmlFor="popular-check" className="form-label" style={{marginBottom:0}}>Mark as Popular</label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} required />
              </div>
              <div className="form-group">
                <label className="form-label">Features (one per line)</label>
                <textarea className="form-input" value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={5} placeholder="Full day coverage&#10;2 photographers&#10;500+ edited photos" />
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;
