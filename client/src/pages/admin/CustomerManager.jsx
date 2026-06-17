import { useState, useEffect } from 'react';
import { FiUsers, FiMessageSquare, FiMail, FiShield, FiDownload, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../../api';
import './CustomerManager.css';

const CustomerManager = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'leads' | 'news' | 'login' | 'backup'
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/bookings'),
      api.get('/admin/leads'),
      api.get('/admin/subscribers'),
      api.get('/admin/login-history')
    ])
    .then(([bookingsRes, leadsRes, subsRes, loginRes]) => {
      // 1. Process bookings into unique customer profiles
      const bookings = bookingsRes.data;
      const custMap = {};
      
      bookings.forEach(b => {
        const emailKey = (b.email || 'unknown').toLowerCase().trim();
        if (!custMap[emailKey]) {
          custMap[emailKey] = {
            name: b.customerName,
            email: b.email,
            phone: b.phone,
            bookingsCount: 0,
            totalSpent: 0,
            bookingsList: []
          };
        }
        custMap[emailKey].bookingsCount += 1;
        if (b.status === 'confirmed') {
          custMap[emailKey].totalSpent += (b.totalAmount || 0);
        }
        custMap[emailKey].bookingsList.push(b);
      });
      
      setCustomers(Object.values(custMap).sort((a, b) => b.totalSpent - a.totalSpent));
      setLeads(leadsRes.data);
      setSubscribers(subsRes.data);
      setLoginHistory(loginRes.data);
    })
    .catch(err => console.error('Error loading logs:', err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const downloadBackup = async () => {
    try {
      const response = await api.get('/admin/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `luminosbook_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Could not download backup.');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="customer-manager">
      <div className="admin__page-header">
        <div>
          <h2 className="admin__page-title">Operations & Log Manager</h2>
          <p className="text-silver">Manage customers, chatbot leads, subscribers, and security logs</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="customer-manager__tabs">
        <button className={`customer-manager__tab ${activeTab === 'customers' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('customers')}>
          <FiUsers /> Customers ({customers.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'leads' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('leads')}>
          <FiMessageSquare /> AI Chatbot Leads ({leads.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'news' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('news')}>
          <FiMail /> Subscribers ({subscribers.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'login' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('login')}>
          <FiShield /> Login Audit ({loginHistory.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'backup' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('backup')}>
          <FiDownload /> Data Backup
        </button>
      </div>

      <div className="card customer-manager__panel animate-fade-in" key={activeTab}>
        {/* 1. CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'center' }}>Total Bookings</th>
                  <th style={{ textAlign: 'right' }}>Total Paid</th>
                  <th>Customer Class</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-silver" style={{ padding: '24px' }}>No customer profiles found.</td>
                  </tr>
                ) : (
                  customers.map((c, i) => (
                    <tr key={i}>
                      <td className="admin-table__service-name">{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td style={{ textAlign: 'center' }}>{c.bookingsCount}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="text-gold">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                      <td>
                        {c.bookingsCount > 1 ? (
                          <span className="status-badge status-confirmed">Repeat Client</span>
                        ) : (
                          <span className="status-badge status-pending">New Client</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. CHATBOT LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Contact Info</th>
                  <th>Inquiry Detail</th>
                  <th>Captured Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-silver" style={{ padding: '24px' }}>No chatbot leads recorded.</td>
                  </tr>
                ) : (
                  leads.map((l, i) => (
                    <tr key={i}>
                      <td className="admin-table__service-name">{l.name}</td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>✉ {l.email || '—'}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>📞 {l.phone || '—'}</div>
                      </td>
                      <td className="text-silver" style={{ fontStyle: 'italic' }}>
                        Interested in: {l.packageInquiry || 'General Consultation'}
                      </td>
                      <td>{new Date(l.timestamp).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. NEWSLETTER TAB */}
        {activeTab === 'news' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subscriber Email</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="text-center text-silver" style={{ padding: '24px' }}>No newsletter subscribers yet.</td>
                  </tr>
                ) : (
                  subscribers.map((s, i) => (
                    <tr key={i}>
                      <td className="admin-table__service-name">{s.email}</td>
                      <td>{new Date(s.timestamp).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. LOGIN AUDIT TAB */}
        {activeTab === 'login' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Attempt Time</th>
                  <th>User Entered</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>User Agent / Browser</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-silver" style={{ padding: '24px' }}>No login records found.</td>
                  </tr>
                ) : (
                  loginHistory.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.timestamp).toLocaleString('en-IN')}</td>
                      <td className="admin-table__service-name">{h.username}</td>
                      <td>
                        {h.status === 'success' ? (
                          <span className="status-badge status-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiCheckCircle /> Success</span>
                        ) : (
                          <span className="status-badge status-cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiAlertCircle /> Failed</span>
                        )}
                      </td>
                      <td>{h.ip}</td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.userAgent}>
                        {h.userAgent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. BACKUP TAB */}
        {activeTab === 'backup' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <FiDownload size={48} className="text-gold" style={{ marginBottom: '16px' }} />
            <h3 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '8px' }}>Export Studio Databases</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              Download a complete JSON file containing bookings, portfolio images, services catalog, newsletter lists, chatbot leads, and security login logs for storage and backup safety.
            </p>
            <button className="btn btn-primary" onClick={downloadBackup}>
              <FiDownload /> Download Backup JSON File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;