import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { FiCamera, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login, verify2FA, isAdmin, loading } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [require2FA, setRequire2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [username2FA, setUsername2FA] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (require2FA) {
      const result = await verify2FA(username2FA, otpCode);
      if (!result.success) {
        setError(result.message);
      } else {
        window.location.href = '/admin';
      }
    } else {
      const result = await login(form.username, form.password);
      if (!result.success) {
        setError(result.message);
      } else if (result.require2FA) {
        setRequire2FA(true);
        setUsername2FA(result.username);
      } else {
        window.location.href = '/admin';
      }
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__bg" />
      <div className="admin-login__card glass-card animate-fade-in-scale">
        <div className="admin-login__logo">
          <FiCamera className="text-gold" />
          <span className="font-heading">
            <span className="text-gold">Luminos</span> Studio
          </span>
        </div>
        <div className="admin-login__title">
          <FiLock className="text-gold" />
          <h1>Admin Portal</h1>
        </div>
        <p className="admin-login__sub text-silver">
          {require2FA ? 'Enter verification code' : 'Sign in to manage your studio dashboard'}
        </p>

        {require2FA ? (
          <form onSubmit={submit} className="admin-login__form">
            <div className="form-group animate-fade-in">
              <label className="form-label" htmlFor="admin-otp"><FiLock /> Two-Factor Code</label>
              <input
                id="admin-otp"
                className="form-input"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP code"
                maxLength="6"
                required
              />
              <span className="text-silver" style={{ fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                Check your terminal/console logs for the OTP verification code.
              </span>
            </div>

            {error && <div className="admin-login__error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
            </button>
            
            <button type="button" className="btn btn-secondary btn-full btn-sm" style={{ marginTop: '8px' }} onClick={() => setRequire2FA(false)}>
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="admin-login__form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-username"><FiUser /> Username</label>
              <input
                id="admin-username"
                className="form-input"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password"><FiLock /> Password</label>
              <div className="admin-login__pw-wrap">
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button type="button" className="admin-login__pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <div className="admin-login__error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="admin-login-btn">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="admin-login__hint text-silver">
          Default: <code>admin</code> / <code>Admin@123</code>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
