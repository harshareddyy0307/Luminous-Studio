import { useState, useEffect, useRef } from 'react';
import { FiLock, FiEye, FiEyeOff, FiSave, FiSettings, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './AccountSettings.css';

const defaultSettings = {
  logoUrl: '',
  studioName: 'By Jonathan Studio',
  bookingTheme: 'Luxury Gold & Black',
  contactEmail: 'neelasaipranav5@gmail.com',
  contactPhone: '+91 9618401231',
  whatsappNumber: '+91 9618401231',
  notificationEmail: 'neelasaipranav5@gmail.com',
  studioAddress: '123 Luxury Lane, Hyderabad, India 500081',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  twitterUrl: 'https://twitter.com'
};

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  
  // States
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileInputRef = useRef(null);

  // Load configuration on mount
  useEffect(() => {
    setLoading(true);
    api.get('/admin/settings')
      .then(({ data }) => {
        if (data) {
          // Merge defaults in case fields are missing
          setSettings({ ...defaultSettings, ...data });
        }
      })
      .catch((err) => {
        console.error('Failed to load settings from server:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle Input Changes
  const handleInputChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  // Handle logo file upload (Convert to base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Logo image size must be less than 2MB.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleInputChange('logoUrl', event.target.result);
        toast.info('Logo image loaded. Click "Save Settings" below to persist changes.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Studio Configuration Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { data } = await api.put('/admin/settings', settings);
      toast.success(data.message || 'Studio configuration saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save studio configuration.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Submit Password Change Security Credentials
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      return toast.error('Please enter your current password to change it.');
    }
    if (!newPassword.trim()) {
      return toast.error('Please enter your new password.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }

    setSavingPassword(true);
    try {
      const payload = {
        currentPassword,
        newPassword
      };
      // Note: We use the existing credentials endpoint which updates the password
      const { data } = await api.put('/admin/update-credentials', payload);
      
      // Update session token in AuthContext
      updateUser(data.username, data.token);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Admin password updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update credentials.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-settings-container">
      {/* Header */}
      <div>
        <h2 className="admin__page-title">Admin Portal Settings</h2>
      </div>

      <div className="settings-layout">
        {/* ── Left: Studio Configuration ── */}
        <form onSubmit={handleSaveSettings} className="settings-card">
          <div className="settings-card__header">
            <FiSettings className="header-icon" /> Studio Configuration
          </div>

          {/* Logo preview upload block */}
          <div className="logo-upload-section">
            <div className="logo-preview-box">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Studio Logo Preview" />
              ) : (
                'No Logo'
              )}
            </div>
            <div className="logo-actions-box">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <button 
                type="button" 
                className="logo-upload-btn-label" 
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload /> Upload Logo
              </button>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                  placeholder="Or enter logo URL" 
                  value={settings.logoUrl} 
                  onChange={e => handleInputChange('logoUrl', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-group">
              <label className="form-label">Studio / Website Name</label>
              <input 
                className="form-input" 
                value={settings.studioName} 
                onChange={e => handleInputChange('studioName', e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Booking Accents Theme</label>
              <select 
                className="form-input" 
                value={settings.bookingTheme} 
                onChange={e => handleInputChange('bookingTheme', e.target.value)}
              >
                <option value="Luxury Gold & Black">Luxury Gold & Black</option>
                <option value="Royal Rose & Charcoal">Royal Rose & Charcoal</option>
                <option value="Ocean Blue & Platinum">Ocean Blue & Platinum</option>
                <option value="Classic Monochrome">Classic Monochrome</option>
              </select>
            </div>
          </div>

          <div className="settings-grid-3">
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input 
                type="email"
                className="form-input" 
                value={settings.contactEmail} 
                onChange={e => handleInputChange('contactEmail', e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input 
                className="form-input" 
                value={settings.contactPhone} 
                onChange={e => handleInputChange('contactPhone', e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input 
                className="form-input" 
                value={settings.whatsappNumber} 
                onChange={e => handleInputChange('whatsappNumber', e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-group">
              <label className="form-label">Booking Notification Email</label>
              <input 
                type="email"
                className="form-input" 
                value={settings.notificationEmail} 
                onChange={e => handleInputChange('notificationEmail', e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Physical Studio Address</label>
              <input 
                className="form-input" 
                value={settings.studioAddress} 
                onChange={e => handleInputChange('studioAddress', e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="section-subtitle">Social Media Integration</div>

          <div className="settings-grid-3">
            <div className="form-group">
              <label className="form-label">Instagram URL</label>
              <input 
                className="form-input" 
                value={settings.instagramUrl} 
                onChange={e => handleInputChange('instagramUrl', e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook URL</label>
              <input 
                className="form-input" 
                value={settings.facebookUrl} 
                onChange={e => handleInputChange('facebookUrl', e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Twitter/X URL</label>
              <input 
                className="form-input" 
                value={settings.twitterUrl} 
                onChange={e => handleInputChange('twitterUrl', e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-gold-action" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={savingSettings}
          >
            <FiSave /> {savingSettings ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </form>

        {/* ── Right: Security Portal ── */}
        <form onSubmit={handleChangePassword} className="settings-card">
          <div className="settings-card__header">
            <FiLock className="header-icon" /> Security Portal
          </div>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="account-settings__pw-wrap">
              <input 
                type={showCurrent ? 'text' : 'password'}
                className="form-input" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                required
              />
              <button 
                type="button" 
                className="account-settings__eye" 
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="account-settings__pw-wrap">
              <input 
                type={showNew ? 'text' : 'password'}
                className="form-input" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
              />
              <button 
                type="button" 
                className="account-settings__eye" 
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="account-settings__pw-wrap">
              <input 
                type={showConfirm ? 'text' : 'password'}
                className="form-input" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
              />
              <button 
                type="button" 
                className="account-settings__eye" 
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-gold-action" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={savingPassword}
          >
            {savingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
