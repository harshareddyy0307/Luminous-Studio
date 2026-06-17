import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiImage, FiGrid, FiCalendar, FiLogOut, FiCamera, FiMenu, FiX, FiTrendingUp, FiSettings, FiBarChart2, FiSliders, FiCpu } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './AdminDashboard.css';

const navItems = [
  { to: '/admin', icon: <FiTrendingUp />, label: 'Overview', exact: true },
  { to: '/admin/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  { to: '/admin/operations', icon: <FiSliders />, label: 'Operations & Logs' },
  { to: '/admin/business', icon: <FiCpu />, label: 'Business & AI' },
  { to: '/admin/portfolio', icon: <FiImage />, label: 'Portfolio' },
  { to: '/admin/services', icon: <FiGrid />, label: 'Services' },
  { to: '/admin/bookings', icon: <FiCalendar />, label: 'Bookings' },
  { to: '/admin/settings', icon: <FiSettings />, label: 'Account Settings' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/bookings/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const isActive = (item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== '/admin';

  return (
    <div className="admin">
      {/* Sidebar */}
      <aside className={`admin__sidebar ${sidebarOpen ? 'admin__sidebar--open' : ''}`}>
        <div className="admin__sidebar-top">
          <Link to="/" className="admin__logo">
            <FiCamera className="text-gold" />
            <span className="font-heading"><span className="text-gold">Luminos</span></span>
          </Link>
          <button className="admin__sidebar-close" onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>

        <div className="admin__user">
          <div className="admin__user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="admin__user-name">{user?.username}</div>
            <div className="admin__user-role">Administrator</div>
          </div>
        </div>

        <nav className="admin__nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin__nav-item ${isActive(item) ? 'admin__nav-item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="admin__logout" onClick={handleLogout}>
          <FiLogOut /> Sign Out
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="admin__overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin__main">
        {/* Top bar */}
        <header className="admin__topbar">
          <button className="admin__menu-btn" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
          <div className="admin__topbar-title">
            {navItems.find(n => isActive(n))?.label || 'Dashboard'}
          </div>
          <div className="admin__topbar-right">
            <Link to="/" className="btn btn-secondary btn-sm" target="_blank">View Site</Link>
          </div>
        </header>

        {/* Page content */}
        <main className="admin__content">
          {location.pathname === '/admin' && stats && (
            <div className="admin__overview">
              <h2 className="admin__page-title">Dashboard Overview</h2>
              <div className="admin__stats-grid animate-stagger">
                {[
                  { label: 'Total Bookings', value: stats.total, color: 'var(--gold)' },
                  { label: 'Pending', value: stats.pending, color: 'var(--gold)' },
                  { label: 'Confirmed', value: stats.confirmed, color: 'var(--success)' },
                  { label: 'Revenue (Confirmed)', value: `₹${(stats.revenue || 0).toLocaleString('en-IN')}`, color: 'var(--success)' },
                ].map((s) => (
                  <div key={s.label} className="admin__stat-card card">
                    <div className="admin__stat-label">{s.label}</div>
                    <div className="admin__stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="admin__quick-links">
                <h3>Quick Actions</h3>
                <div className="flex gap-md flex-wrap">
                  <Link to="/admin/portfolio" className="btn btn-outline-gold"><FiImage /> Manage Portfolio</Link>
                  <Link to="/admin/services" className="btn btn-outline-gold"><FiGrid /> Manage Services</Link>
                  <Link to="/admin/bookings" className="btn btn-outline-gold"><FiCalendar /> View Bookings</Link>
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
