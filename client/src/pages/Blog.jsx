import { useState, useEffect } from 'react';
import { FiBookOpen, FiShare2, FiAward, FiMail, FiCheck, FiDollarSign } from 'react-icons/fi';
import api from '../api';
import './Blog.css';

const Blog = () => {
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' | 'affiliate' | 'giftcard' | 'vip'
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  
  // Newsletter promo popup state
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [promoEmail, setPromoEmail] = useState('');
  const [promoSubmitted, setPromoSubmitted] = useState(false);



  // Affiliate states
  const [affEmail, setAffEmail] = useState('');
  const [affCode, setAffCode] = useState('');
  const [affRecord, setAffRecord] = useState(null);
  const [affError, setAffError] = useState('');

  // Fetch blogs
  useEffect(() => {
    api.get('/blogs').then(({ data }) => setBlogs(data)).catch(err => console.error(err));
    
    // Trigger lead capture popup after 2 seconds
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('luminosPromoDismissed');
      if (!dismissed) {
        setShowPromoPopup(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribePromo = async (e) => {
    e.preventDefault();
    if (!promoEmail) return;
    try {
      await api.post('/subscribers', { email: promoEmail });
      setPromoSubmitted(true);
      localStorage.setItem('luminosPromoDismissed', 'true');
    } catch {
      alert('Could not subscribe. Please check your email.');
    }
  };



  const handleRegisterAffiliate = async (e) => {
    e.preventDefault();
    setAffError('');
    try {
      const { data } = await api.post('/affiliates/register', {
        email: affEmail,
        code: affCode
      });
      setAffRecord(data);
      alert('Congratulations! You are registered as an affiliate.');
    } catch (err) {
      setAffError(err.response?.data?.message || 'Affiliate registration failed.');
    }
  };

  return (
    <div className="blog-page container section animate-fade-in">
      <div className="admin__page-header text-center">
        <h2 className="display-md font-heading">Timeless Stories & <span className="text-gold">Promotions</span></h2>
        <p className="text-silver">Photography advice, digital vouchers, referral networks, and VIP memberships</p>
      </div>

      {/* Tabs */}
      <div className="blog-page__tabs">
        <button className={`blog-page__tab ${activeTab === 'blogs' ? 'active' : ''}`} onClick={() => { setActiveTab('blogs'); setSelectedBlog(null); }}>
          <FiBookOpen /> Editorial Blog
        </button>
        <button className={`blog-page__tab ${activeTab === 'affiliate' ? 'active' : ''}`} onClick={() => setActiveTab('affiliate')}>
          <FiShare2 /> Affiliate Network
        </button>
        <button className={`blog-page__tab ${activeTab === 'vip' ? 'active' : ''}`} onClick={() => setActiveTab('vip')}>
          <FiAward /> VIP Membership
        </button>
      </div>

      <div className="blog-page__content card animate-fade-in" key={activeTab}>
        {/* 1. EDITORIAL BLOGS */}
        {activeTab === 'blogs' && (
          <div>
            {!selectedBlog ? (
              <div className="grid-2">
                {blogs.map(post => (
                  <div key={post._id} className="blog-page__post-card card flex flex-column justify-between" style={{ padding: '20px' }}>
                    <div>
                      <span className="status-badge status-pending" style={{ marginBottom: '8px' }}>{post.category}</span>
                      <h3 className="font-heading" style={{ fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '8px' }}>{post.title}</h3>
                      <p className="text-silver" style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '16px' }}>
                        {post.content.substring(0, 140)}...
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--silver)' }}>By {post.author}</span>
                      <button className="btn btn-outline-gold btn-sm" onClick={() => setSelectedBlog(post)}>Read More</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="blog-page__detail animate-fade-in">
                <button className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }} onClick={() => setSelectedBlog(null)}>← Back to Blogs</button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="status-badge status-pending">{selectedBlog.category}</span>
                  <span className="text-silver" style={{ fontSize: '0.78rem' }}>Posted by {selectedBlog.author}</span>
                </div>
                <h3 className="font-heading" style={{ fontSize: '1.8rem', color: 'var(--cream)', marginBottom: '16px' }}>{selectedBlog.title}</h3>
                <p className="text-silver" style={{ fontSize: '0.9rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{selectedBlog.content}</p>
              </div>
            )}
          </div>
        )}

        {/* 2. AFFILIATE NETWORK */}
        {activeTab === 'affiliate' && (
          <div className="grid-2 gap-lg">
            <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--gold)', marginBottom: '12px' }}>Affiliate Partner Program</h3>
              <p className="text-silver" style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Join our referral network! Recommend Luminos Studio to friends or couples, track bookings with your promo code, and earn 10% commission payout on every confirmed booking.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                <li>✔️ Share 10% discount codes with friends</li>
                <li>✔️ Earn 10% cash payout on client booking totals</li>
                <li>✔️ Monthly bank transfers for earned referrals</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              {!affRecord ? (
                <form onSubmit={handleRegisterAffiliate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--cream)', fontSize: '0.95rem' }}>Partner Registration</h4>
                  <div className="form-group">
                    <label>Your Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={affEmail}
                      onChange={e => setAffEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Desired Promo Code (e.g. REFER5)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={affCode}
                      onChange={e => setAffCode(e.target.value)}
                      required
                    />
                  </div>
                  {affError && <div className="client-auth__error">{affError}</div>}
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register as Partner</button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <FiCheck size={36} className="text-gold" style={{ marginBottom: '8px' }} />
                  <h4 style={{ color: 'var(--cream)', marginBottom: '8px' }}>Partner Dashboard</h4>
                  <div className="card" style={{ padding: '12px', background: 'rgba(201,168,76,0.06)', border: '1px solid var(--gold)', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--silver)' }}>Referral Discount Code</div>
                    <strong className="text-gold" style={{ fontSize: '1.25rem' }}>{affRecord.code}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Earned Commission:</span>
                    <strong className="text-gold" style={{ fontSize: '1.1rem' }}><FiDollarSign /> ₹{affRecord.earnings || 0}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. VIP MEMBERSHIP */}
        {activeTab === 'vip' && (
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <FiAward size={48} className="text-gold" style={{ marginBottom: '16px' }} />
            <h3 className="font-heading" style={{ fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '8px' }}>Luminos VIP Client Elite</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Become a VIP member to gain priority slot bookings, zero rescheduling penalties, direct access to senior directors, and premium leather album binding upgrades.
            </p>
            <div className="card text-left" style={{ padding: '20px', background: 'rgba(201,168,76,0.04)', border: '1px solid var(--gold)' }}>
              <h4 style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '10px', fontSize: '0.95rem' }}>👑 Elite VIP Privileges:</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--cream-dim)' }}>
                <li>🌟 **Priority Rescheduling**: Change dates up to 48 hours prior with zero fees.</li>
                <li>🌟 **Free Album Upgrade**: Upgrade standard prints to premium hand-crafted leather boxes.</li>
                <li>🌟 **Director Shooting**: Senior photographers Mokshagnya & Kavitha lead your crew.</li>
                <li>🌟 **Micro-site**: Get a personalized event micro-website to share raw highlights with guests.</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowPromoPopup(true)}>
              Sign Up for VIP Newsletter Invitation
            </button>
          </div>
        )}
      </div>

      {/* Floating Lead Capture modal prompt */}
      {showPromoPopup && (
        <div className="blog-page__modal-overlay">
          <div className="blog-page__modal card glass-card animate-fade-in-scale">
            <button className="blog-page__modal-close" onClick={() => setShowPromoPopup(false)}>×</button>
            <FiMail size={36} className="text-gold" style={{ marginBottom: '12px' }} />
            <h3 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '8px' }}>Subscribe & Save 10%</h3>
            <p className="text-silver" style={{ fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Join our mailing list to receive exclusive editorial tips and get a **10% discount promo code** instantly.
            </p>

            {!promoSubmitted ? (
              <form onSubmit={handleSubscribePromo} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={promoEmail}
                  onChange={e => setPromoEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">Join</button>
              </form>
            ) : (
              <div className="card" style={{ padding: '12px', background: 'rgba(46,204,113,0.1)', border: '1px solid #2ecc71', borderRadius: '6px' }}>
                <span className="text-gold" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Use Coupon Code:</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)', marginTop: '4px' }}>WELCOME10</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--silver)', marginTop: '4px' }}>10% discount applied at checkout.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
