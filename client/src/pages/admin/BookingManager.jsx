import { useState, useEffect } from 'react';
import { FiTrash2, FiFilter } from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-toastify';

const statuses = ['all', 'pending', 'confirmed', 'cancelled'];

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');

  const load = (status) => {
    setLoading(true);
    const params = status && status !== 'all' ? `?status=${status}` : '';
    api.get(`/bookings${params}`).then(({ data }) => setBookings(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (s) => { setActiveStatus(s); load(s); };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b._id === id ? data : b));
      toast.success(`Booking ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      setBookings(prev => prev.filter(b => b._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-manager">
      <div className="admin-manager__header">
        <div>
          <h2 className="admin__page-title">Booking Manager</h2>
          <p className="text-silver">{bookings.length} bookings found</p>
        </div>
        <div className="portfolio__filter-tabs">
          {statuses.map(s => (
            <button key={s} className={`portfolio__filter-btn ${activeStatus===s?'portfolio__filter-btn--active':''}`} onClick={() => handleFilter(s)} id={`filter-booking-${s}`}>
              <FiFilter size={12} /> {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="spinner" /> : bookings.length === 0 ? (
        <div className="page-loading text-center"><p className="text-silver">No bookings found.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Event Date</th>
                <th>Services</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td><span className="text-gold" style={{fontFamily:'var(--font-heading)',fontSize:'0.95rem'}}>{b.bookingReference}</span></td>
                  <td>
                    <div className="admin-table__service-name">{b.customerName}</div>
                    <div className="admin-table__service-desc">{b.email} · {b.phone}</div>
                  </td>
                  <td>{b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td>
                    {b.services.map(s => (
                      <div key={s.serviceId || s.name} className="admin-table__service-desc">{s.name}</div>
                    ))}
                  </td>
                  <td className="text-gold font-heading">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-badge status-${b.status}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-sm flex-wrap">
                      {b.status !== 'confirmed' && (
                        <button className="btn btn-sm" style={{background:'rgba(82,192,122,0.15)',color:'var(--success)',border:'1px solid var(--success)'}} onClick={() => updateStatus(b._id, 'confirmed')} id={`confirm-${b._id}`}>Confirm</button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button className="btn btn-sm" style={{background:'rgba(224,82,82,0.1)',color:'var(--danger)',border:'1px solid var(--danger)'}} onClick={() => updateStatus(b._id, 'cancelled')} id={`cancel-${b._id}`}>Cancel</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)} id={`delete-booking-${b._id}`}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
