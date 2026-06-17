import { useState, useEffect } from 'react';
import {
  FiUser, FiLock, FiEye, FiEyeOff, FiSave,
  FiShield, FiCheckCircle, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './AccountSettings.css';

// ─── Password strength scorer ──────────────────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  const checks = {
    length:    pw.length >= 8,
    upper:     /[A-Z]/.test(pw),
    lower:     /[a-z]/.test(pw),
    number:    /\d/.test(pw),
    special:   /[@$!%*?&#^()_+]/.test(pw),
    longEnough: pw.length >= 12,
  };
  score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) return { score, label: 'Weak',   color: '#E05252', pct: 20,  checks };
  if (score <= 3) return { score, label: 'Fair',   color: '#E0A052', pct: 45,  checks };
  if (score <= 4) return { score, label: 'Good',   color: '#C9A84C', pct: 70,  checks };
  if (score <= 5) return { score, label: 'Strong', color: '#52C07A', pct: 90,  checks };
  return             { score, label: 'Excellent', color: '#52C07A', pct: 100, checks };
};

const strengthChecks = [
  { key: 'length',    label: 'At least 8 characters' },
  { key: 'upper',     label: 'One uppercase letter (A–Z)' },
  { key: 'lower',     label: 'One lowercase letter (a–z)' },
  { key: 'number',    label: 'One number (0–9)' },
  { key: 'special',   label: 'One special character (@$!%*?&#…)' },
];

// ─── Component ─────────────────────────────────────────────────────────────────
const AccountSettings = () => {
  const { user, updateUser } = useAuth();

  // Profile data from server
  const [profile, setProfile]   = useState({ username: '', createdAt: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername,     setNewUsername]      = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');

  // UI state
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew,     setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [saving,      setSaving]        = useState(false);
  const [activeTab,   setActiveTab]     = useState('username'); // 'username' | 'password'

  const strength = getStrength(newPassword);

  // ─── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/admin/profile')
      .then(({ data }) => {
        setProfile(data);
        setNewUsername(data.username);
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoadingProfile(false));
  }, []);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!currentPassword.trim())
      return toast.error('Please enter your current password to save changes.');

    if (activeTab === 'password') {
      if (!newPassword)
        return toast.error('Please enter a new password.');
      if (newPassword !== confirmPassword)
        return toast.error('New passwords do not match.');
      const { checks } = getStrength(newPassword);
      const required = ['length', 'upper', 'lower', 'number', 'special'];
      if (!required.every(k => checks[k]))
        return toast.error('Password does not meet the strength requirements.');
    }

    if (activeTab === 'username' && !newUsername.trim())
      return toast.error('Username cannot be empty.');

    setSaving(true);
    try {
      const payload = { currentPassword };
      if (activeTab === 'username') payload.newUsername = newUsername.trim();
      if (activeTab === 'password') payload.newPassword = newPassword;

      const { data } = await api.put('/admin/update-credentials', payload);

      // Update stored token + user in AuthContext
      updateUser(data.username, data.token);

      setProfile(prev => ({ ...prev, username: data.username }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update credentials.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  const currentDisplayUsername = profile.username || user?.username || 'admin';

  return (
    <div className="account-settings">
      {/* Header */}
      <div className="account-settings__header">
        <div>
          <h2 className="admin__page-title">Account Settings</h2>
          <p className="text-silver">Manage your admin credentials securely</p>
        </div>
      </div>

      <div className="account-settings__layout">
        {/* ── Left: Profile card ── */}
        <div className="account-settings__profile card">
          <div className="account-settings__avatar">
            {currentDisplayUsername[0]?.toUpperCase()}
          </div>
          <div className="account-settings__profile-info">
            <div className="account-settings__profile-name">{currentDisplayUsername}</div>
            <div className="account-settings__profile-role">
              <FiShield size={12} /> Administrator
            </div>
          </div>
          {profile.createdAt && (
            <div className="account-settings__profile-meta text-silver">
              Account created {new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}

          <hr className="divider" style={{ margin: '16px 0' }} />

          {/* Security notice */}
          <div className="account-settings__notice">
            <FiAlertCircle className="text-gold" />
            <p>Always use a strong, unique password. After changing credentials, you'll stay logged in with a fresh session token.</p>
          </div>


        </div>

        {/* ── Right: Edit form ── */}
        <div className="account-settings__form-area">
          {/* Tabs */}
          <div className="account-settings__tabs">
            <button
              className={`account-settings__tab ${activeTab === 'username' ? 'account-settings__tab--active' : ''}`}
              onClick={() => setActiveTab('username')}
              id="tab-username"
            >
              <FiUser /> Change Username
            </button>
            <button
              className={`account-settings__tab ${activeTab === 'password' ? 'account-settings__tab--active' : ''}`}
              onClick={() => setActiveTab('password')}
              id="tab-password"
            >
              <FiLock /> Change Password
            </button>
          </div>

          <form onSubmit={handleSubmit} className="card account-settings__form">

            {/* ── Username Tab ── */}
            {activeTab === 'username' && (
              <div className="account-settings__fields animate-fade-in">
                <div className="account-settings__field-heading">
                  <FiUser className="text-gold" /> Update Username
                </div>
                <p className="text-silver" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  Current username: <strong className="text-cream">{currentDisplayUsername}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-username">New Username</label>
                  <input
                    id="new-username"
                    className="form-input"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                  />
                  <span className="account-settings__hint">3–32 characters</span>
                </div>
              </div>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
              <div className="account-settings__fields animate-fade-in">
                <div className="account-settings__field-heading">
                  <FiLock className="text-gold" /> Update Password
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <div className="account-settings__pw-wrap">
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    <button type="button" className="account-settings__eye" onClick={() => setShowNew(v => !v)}>
                      {showNew ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div className="account-settings__strength">
                      <div className="account-settings__strength-bar">
                        <div
                          className="account-settings__strength-fill"
                          style={{ width: `${strength.pct}%`, background: strength.color }}
                        />
                      </div>
                      <span className="account-settings__strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}

                  {/* Checklist */}
                  {newPassword && (
                    <ul className="account-settings__checklist">
                      {strengthChecks.map(c => (
                        <li key={c.key} className={`account-settings__check-item ${strength.checks?.[c.key] ? 'account-settings__check-item--pass' : ''}`}>
                          {strength.checks?.[c.key] ? <FiCheckCircle /> : <FiAlertCircle />}
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <div className="account-settings__pw-wrap">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      className={`form-input ${confirmPassword && confirmPassword !== newPassword ? 'form-input--error' : ''}`}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    <button type="button" className="account-settings__eye" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span className="form-error">Passwords do not match</span>
                  )}
                  {confirmPassword && confirmPassword === newPassword && newPassword && (
                    <span className="account-settings__match"><FiCheckCircle /> Passwords match</span>
                  )}
                </div>
              </div>
            )}

            {/* ── Current password (always required) ── */}
            <div className="account-settings__current-pw">
              <div className="account-settings__current-pw-label">
                <FiShield className="text-gold" />
                Confirm Your Current Password to Save Changes
              </div>
              <div className="account-settings__pw-wrap">
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                <button type="button" className="account-settings__eye" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={saving}
              id="save-credentials-btn"
              style={{ marginTop: '8px' }}
            >
              {saving ? 'Saving...' : <><FiSave /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
