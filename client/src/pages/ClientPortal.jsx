import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCalendar, FiClock, FiFileText, FiDownload, FiCheck, FiKey, FiPlus, FiTrash, FiAward } from 'react-icons/fi';
import api from '../api';
import './ClientPortal.css';

const ClientPortal = () => {
  const { user, login, register, logout, isCustomer, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authData, setAuthData] = useState({ username: '', password: '', email: '', phone: '', fullName: '' });
  const [error, setError] = useState('');
  
  // Tab states
  const [portalTab, setPortalTab] = useState('bookings'); // 'bookings' | 'photos' | 'contract' | 'timeline' | 'shots'
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Photo portal passcode
  const [albumCode, setAlbumCode] = useState('');
  const [albumUnlocked, setAlbumUnlocked] = useState(false);
  
  // Timeline states
  const [timeline, setTimeline] = useState([
    { id: 1, time: '09:00 AM', event: 'Bride & Groom Preparation Shots' },
    { id: 2, time: '12:00 PM', event: 'Ceremony / Vows' },
    { id: 3, time: '02:30 PM', event: 'Family Group Portraits' },
    { id: 4, time: '06:00 PM', event: 'Reception & First Dance' }
  ]);
  const [newTime, setNewTime] = useState('');
  const [newEvent, setNewEvent] = useState('');
  
  // Shotlist state
  const [shots, setShots] = useState([
    { id: 1, name: 'Detail shots of Rings, Dress, Shoes', checked: true },
    { id: 2, name: 'First Look portrait of Couple', checked: false },
    { id: 3, name: 'Bridesmaids & Groomsmen groups', checked: false },
    { id: 4, name: 'Emotional parent reactions during vows', checked: true },
    { id: 5, name: 'Wide scenic shots of reception venue', checked: false }
  ]);
  const [newShot, setNewShot] = useState('');

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);

  // Fetch client bookings & contracts
  const loadClientData = () => {
    if (!user || !isCustomer) return;
    // Customer profile loads bookings filter
    api.get('/bookings').then(({ data }) => {
      // Filter bookings matching logged in user's email or username
      const clientBookings = data.filter(b => 
        b.email?.toLowerCase() === user.username.toLowerCase() || 
        b.customerName?.toLowerCase() === user.username.toLowerCase()
      );
      setBookings(clientBookings);
      if (clientBookings.length > 0) {
        setSelectedBooking(clientBookings[0]);
      }
    }).catch(err => console.error(err));

    api.get(`/contracts?email=${user.username}`).then(({ data }) => {
      setContracts(data);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    loadClientData();
  }, [user, isCustomer]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegisterMode) {
      const res = await register(authData.username, authData.password, authData.email, authData.phone, authData.fullName);
      if (res.success) {
        setIsRegisterMode(false);
        alert('Registration successful! Please login.');
      } else {
        setError(res.message);
      }
    } else {
      const res = await login(authData.username, authData.password);
      if (!res.success) {
        setError(res.message);
      } else if (res.role === 'admin') {
        window.location.href = '/admin'; // Redirect admin
      }
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c9a84c';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = async () => {
    if (!selectedBooking) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL(); // base64 image
    try {
      await api.post('/contracts/sign', {
        bookingId: selectedBooking._id,
        customerEmail: selectedBooking.email || user.username,
        signatureData
      });
      alert('Contract e-signed successfully!');
      setContractSigned(true);
      loadClientData();
    } catch {
      alert('Failed to save signature.');
    }
  };

  const handleUnlockAlbum = (e) => {
    e.preventDefault();
    if (albumCode === 'LUMINOS2026' || albumCode === selectedBooking?.bookingReference) {
      setAlbumUnlocked(true);
      setError('');
    } else {
      setError('Invalid passcode. Use your Booking Reference or LUMINOS2026.');
    }
  };

  const handleAddTimeline = (e) => {
    e.preventDefault();
    if (!newTime || !newEvent) return;
    setTimeline(prev => [...prev, { id: Date.now(), time: newTime, event: newEvent }].sort((a,b) => a.time.localeCompare(b.time)));
    setNewTime('');
    setNewEvent('');
  };

  const handleAddShot = (e) => {
    e.preventDefault();
    if (!newShot) return;
    setShots(prev => [...prev, { id: Date.now(), name: newShot, checked: false }]);
    setNewShot('');
  };

  const toggleShot = (id) => {
    setShots(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  // Mock Invoice download with a styled print screen
  const downloadInvoice = () => {
    if (!selectedBooking) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${selectedBooking.bookingReference}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; background: #fff; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; margin-bottom: 20px; }
            .title { color: #C9A84C; font-size: 28px; font-weight: bold; }
            .details { margin-bottom: 30px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
            td { padding: 10px; border: 1px solid #ddd; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #C9A84C; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="title">Luminos Studio</div>
                <div>Premium Photography & Storytelling</div>
              </div>
              <div style="text-align: right;">
                <h3>TAX INVOICE</h3>
                <div>Invoice #: INV-${selectedBooking.bookingReference}</div>
                <div>Date: ${new Date(selectedBooking.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div class="details">
              <strong>Billed To:</strong><br>
              Name: ${selectedBooking.customerName}<br>
              Email: ${selectedBooking.email}<br>
              Phone: ${selectedBooking.phone}<br>
              Shoot Date: ${new Date(selectedBooking.date).toLocaleDateString()}<br>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(selectedBooking.services || []).map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td style="text-align: right;">₹${s.price.toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td>SGST (9%)</td>
                  <td style="text-align: right;">₹${((selectedBooking.totalAmount || 0) * 0.09).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>CGST (9%)</td>
                  <td style="text-align: right;">₹${((selectedBooking.totalAmount || 0) * 0.09).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">Grand Total (Incl. GST): ₹${(selectedBooking.totalAmount * 1.18 || 0).toLocaleString('en-IN')}</div>
            <div class="footer">
              Thank you for choosing Luminos Studio! We capture emotions worth keeping.<br>
              For support, contact studio@luminosbook.com
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  // Render auth forms if not logged in
  if (!user || !isCustomer) {
    return (
      <div className="client-auth container section">
        <div className="card client-auth__card glass-card">
          <h2 className="display-sm text-center font-heading">
            Client <span className="text-gold">Portal</span>
          </h2>
          <p className="text-silver text-center" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
            {isRegisterMode ? 'Create a secure customer portal account' : 'Log in to view photo galleries, signatures, and timelines'}
          </p>

          <form onSubmit={handleAuthSubmit} className="client-auth__form">
            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={authData.fullName}
                    onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={authData.phone}
                    onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Username / Login Email</label>
              <input
                type="text"
                className="form-input"
                value={authData.username}
                onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                placeholder={isRegisterMode ? 'Create unique username' : 'Enter email or username'}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                value={authData.password}
                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                required
              />
            </div>

            {error && <div className="client-auth__error">{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              {isRegisterMode ? 'Register Account' : 'Access Portal'}
            </button>
          </form>

          <div className="text-center" style={{ marginTop: '20px' }}>
            <button className="client-auth__toggle" onClick={() => setIsRegisterMode(!isRegisterMode)}>
              {isRegisterMode ? 'Already registered? Log In' : 'Create an Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate mock loyalty points: ₹100 spent = 1 point
  const totalSpentVal = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const loyaltyPoints = Math.floor(totalSpentVal / 100);

  return (
    <div className="client-portal container section animate-fade-in">
      {/* Header Profile Dashboard */}
      <div className="client-portal__profile card glass-card">
        <div className="client-portal__profile-inner">
          <div className="client-portal__avatar"><FiUser size={24} /></div>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.6rem', color: 'var(--cream)' }}>
              Welcome back, {user.username}!
            </h2>
            <p className="text-silver" style={{ fontSize: '0.85rem' }}>
              Access your digital assets, contract documents, event lists, and schedules.
            </p>
          </div>
          <div className="client-portal__loyalty text-center">
            <FiAward size={28} className="text-gold" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--silver)' }}>Loyalty Tier</div>
            <strong className="text-gold" style={{ fontSize: '1.2rem' }}>{loyaltyPoints} Points</strong>
          </div>
        </div>
        <button onClick={logout} className="btn btn-outline-gold btn-sm client-portal__logout">Logout</button>
      </div>

      {/* Tabs */}
      <div className="client-portal__tabs">
        <button className={`client-portal__tab ${portalTab === 'bookings' ? 'active' : ''}`} onClick={() => setPortalTab('bookings')}>
          <FiCalendar /> Booking History ({bookings.length})
        </button>
        <button className={`client-portal__tab ${portalTab === 'photos' ? 'active' : ''}`} onClick={() => setPortalTab('photos')}>
          <FiKey /> Photo Delivery
        </button>
        <button className={`client-portal__tab ${portalTab === 'contract' ? 'active' : ''}`} onClick={() => setPortalTab('contract')}>
          <FiFileText /> Agreement Contract
        </button>
        <button className={`client-portal__tab ${portalTab === 'timeline' ? 'active' : ''}`} onClick={() => setPortalTab('timeline')}>
          <FiClock /> Timeline Planner
        </button>
        <button className={`client-portal__tab ${portalTab === 'shots' ? 'active' : ''}`} onClick={() => setPortalTab('shots')}>
          <FiCheck /> Shot List
        </button>
      </div>

      <div className="client-portal__content card animate-fade-in" key={portalTab}>
        {/* 1. BOOKINGS HISTORY */}
        {portalTab === 'bookings' && (
          <div className="admin-table-wrap">
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '16px' }}>My Photo Sessions</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Shoot Date</th>
                  <th>Packages</th>
                  <th>Gross total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-silver" style={{ padding: '24px' }}>No bookings recorded under this account email.</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} onClick={() => setSelectedBooking(b)} style={{ cursor: 'pointer', background: selectedBooking?._id === b._id ? 'rgba(201,168,76,0.06)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }} className="text-gold">{b.bookingReference}</td>
                      <td>{new Date(b.date).toLocaleDateString()}</td>
                      <td>{(b.services || []).map(s => s.name).join(', ')}</td>
                      <td>₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-badge status-${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-outline-gold btn-sm" onClick={downloadInvoice}>
                          <FiDownload /> Tax Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. PHOTO PORTAL */}
        {portalTab === 'photos' && (
          <div className="photo-portal">
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>Secure Gallery Delivery</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Access password-protected client albums. Enter your passcode to unlock.
            </p>

            {!albumUnlocked ? (
              <form onSubmit={handleUnlockAlbum} className="photo-portal__unlock glass-card" style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
                <FiKey size={36} className="text-gold" style={{ marginBottom: '12px' }} />
                <div className="form-group">
                  <label>Album Passcode</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter Reference (e.g. LB-...) or LUMINOS2026"
                    value={albumCode}
                    onChange={(e) => setAlbumCode(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="client-auth__error" style={{ marginBottom: '12px' }}>{error}</div>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Unlock Album</button>
              </form>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="status-badge status-confirmed">Album Decrypted Successfully</span>
                  <span className="text-silver" style={{ fontSize: '0.78rem' }}>⚠️ Gallery download expires in 30 days</span>
                </div>
                
                <div className="grid-3">
                  {[
                    { id: 1, title: 'Engagement Portrait', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600' },
                    { id: 2, title: 'Bridal Preparation', url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600' },
                    { id: 3, title: 'Ceremony Vows', url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600' }
                  ].map(photo => (
                    <div key={photo.id} className="photo-portal__card card">
                      <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--cream)' }}>{photo.title}</span>
                        <a href={photo.url} download className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          <FiDownload /> HD
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CONTRACT SIGNING */}
        {portalTab === 'contract' && (
          <div className="contract-portal">
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '16px' }}>Digital Contract E-Signing</h3>
            {!selectedBooking ? (
              <p className="text-silver">Please select a booking from the Booking History tab first to generate contract agreements.</p>
            ) : (
              <div className="grid-2 gap-lg">
                <div className="contract-portal__text card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', maxHeight: '300px', overflowY: 'auto', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--cream-dim)' }}>
                  <h4 style={{ color: 'var(--gold)', marginBottom: '8px' }}>PHOTOGRAPHY SERVICE AGREEMENT</h4>
                  <p><strong>Parties:</strong> Luminos Studio (Photographer) and {selectedBooking.customerName} (Client)</p>
                  <p><strong>Services:</strong> The Photographer agrees to perform photoshoot coverage on <strong>{new Date(selectedBooking.date).toLocaleDateString()}</strong>.</p>
                  <p><strong>Payment Terms:</strong> Total package value is ₹{selectedBooking.totalAmount?.toLocaleString('en-IN')}. Client agrees to pay the remaining balance before final deliverables release.</p>
                  <p><strong>Copyright & Usage:</strong> Photographer retains copyright of all images. Client is granted print and personal sharing rights. Commercial usage requires written approval.</p>
                </div>

                <div className="contract-portal__sign text-center">
                  <h4 style={{ color: 'var(--cream)', marginBottom: '8px', fontSize: '0.9rem' }}>E-Signature Block</h4>
                  {contracts.find(c => c.bookingId === selectedBooking._id) || contractSigned ? (
                    <div style={{ padding: '36px', border: '1px dashed var(--gold)', borderRadius: '8px', background: 'rgba(201,168,76,0.04)' }}>
                      <FiCheck size={36} className="text-gold" style={{ marginBottom: '8px' }} />
                      <p className="text-gold" style={{ fontWeight: 600 }}>Agreement Legally Signed</p>
                      <span className="text-silver" style={{ fontSize: '0.75rem' }}>E-Signature verified on blockchain timestamp</span>
                    </div>
                  ) : (
                    <div>
                      <canvas
                        ref={canvasRef}
                        width="300"
                        height="130"
                        style={{ background: '#fff', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.3)', cursor: 'crosshair' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={clearSignature}>Clear</button>
                        <button className="btn btn-primary btn-sm" onClick={submitSignature}>Sign & Submit</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TIMELINE PLANNER */}
        {portalTab === 'timeline' && (
          <div className="timeline-portal">
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>Event Timeline Planner</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Build and coordinate timing milestones to keep photographers aligned with your schedule.
            </p>

            <div className="grid-2 gap-lg">
              <div className="timeline-portal__list">
                {timeline.map((item) => (
                  <div key={item.id} className="timeline-portal__item flex justify-between align-center card" style={{ padding: '12px', marginBottom: '8px', borderLeft: '3px solid var(--gold)' }}>
                    <div>
                      <strong className="text-gold" style={{ fontSize: '0.85rem' }}>{item.time}</strong>
                      <div style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{item.event}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px', minWidth: 'auto' }} onClick={() => setTimeline(prev => prev.filter(t => t.id !== item.id))}>
                      <FiTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTimeline} className="timeline-portal__form card" style={{ padding: '16px' }}>
                <h4 style={{ color: 'var(--cream)', marginBottom: '12px', fontSize: '0.95rem' }}>Add Milestone</h4>
                <div className="form-group">
                  <label>Milestone Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 11:30 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Event Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Wedding Cake Cutting"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  <FiPlus /> Add to Schedule
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5. SHOT LIST CHECKLIST */}
        {portalTab === 'shots' && (
          <div className="shots-portal">
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>Shot List Checklist</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Check required photos so our photography crew knows exactly what poses and group photos to cover.
            </p>

            <div className="grid-2 gap-lg">
              <div className="shots-portal__list card" style={{ padding: '16px' }}>
                {shots.map((item) => (
                  <div key={item.id} className="shots-portal__item flex align-center gap-md" style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => toggleShot(item.id)}>
                    <div className={`checkbox-box ${item.checked ? 'checked' : ''}`} style={{ width: '18px', height: '18px', border: '1px solid var(--gold)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.checked && <FiCheck size={12} className="text-gold" />}
                    </div>
                    <span style={{ fontSize: '0.88rem', textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--silver)' : 'var(--cream)' }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddShot} className="shots-portal__form card" style={{ padding: '16px' }}>
                <h4 style={{ color: 'var(--cream)', marginBottom: '12px', fontSize: '0.95rem' }}>Add Custom Pose / Shot Request</h4>
                <div className="form-group">
                  <label>Shot Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Groom laughing with his grandfather"
                    value={newShot}
                    onChange={(e) => setNewShot(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  <FiPlus /> Add Shot Expectation
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
