import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { FiSliders, FiHelpCircle, FiEye, FiCompass, FiCamera, FiMapPin, FiGrid, FiArrowRight, FiInfo } from 'react-icons/fi';
import api from '../api';
import './InteractiveTools.css';

const basePackagesList = [
  { _id: '1', name: 'Wedding Photography', price: 45000, category: 'wedding' },
  { _id: '2', name: 'Wedding Cinematic Video', price: 35000, category: 'wedding' },
  { _id: '3', name: 'Birthday Celebration Package', price: 15000, category: 'birthday' },
  { _id: '4', name: 'Corporate Event Coverage', price: 25000, category: 'corporate' },
  { _id: '5', name: 'Portrait Session', price: 8000, category: 'portrait' }
];

const addonsList = [
  { id: 'drone', name: '4K Aerial Drone Shots', price: 10000 },
  { id: 'album', name: 'Premium Leather Album (50 pages)', price: 5000 },
  { id: 'extra', name: 'Additional Photographer (Full Day)', price: 8000 },
  { id: 'framing', name: 'Large Wooden Frame Prints (x3)', price: 3000 },
  { id: 'express', name: 'Express 48-Hour Delivery', price: 4000 }
];

const studioHotspots = [
  { id: 1, x: '25%', y: '40%', title: 'Client Consultation Lounge', desc: 'Where we map out event schedules, storyboards, and customization plans with you over coffee.' },
  { id: 2, x: '55%', y: '65%', title: 'Main Shooting Vault', desc: 'Equipped with professional Godox lighting arrays, modifiers, softboxes, and seamless backdrops.' },
  { id: 3, x: '80%', y: '30%', title: 'Premium Frame Showcase', desc: 'Touch and feel our handcrafted leather album bindings and solid wood frames.' }
];

const posesStyles = [
  {
    name: 'Luxury Wedding Poses',
    poses: ['Golden hour walk hand-in-hand', 'Over-the-shoulder bridal veil gaze', 'Candid laughing whisper', 'Forehead kiss silhouette']
  },
  {
    name: 'Candid Portrait Poses',
    poses: ['Leaning against architectural textures', 'Dynamic walking capture', 'Sitting laughing portrait', 'Soft look-down smile']
  },
  {
    name: 'Corporate Headshots Poses',
    poses: ['Confident folded arms pose', 'Soft 45-degree angle profile', 'Working laptop focus shot', 'Friendly candid speaker']
  }
];

const venuesGuide = [
  { name: 'Grand Ballroom Palace', category: 'indoor', advice: 'Requires wide-angle f/2.8 lenses. Best colors are captured under warm ambient chandelier fills.' },
  { name: 'Golden Lake Lawn', category: 'outdoor', advice: 'Golden hour happens at 4:30 PM - 5:15 PM. Best angles face away from the direct lake glare.' },
  { name: 'Jubilee Luxury Studio', category: 'studio', advice: 'Perfect for minimalist editorial shoots. Controlled lighting ensures stunning high-fashion portraits.' }
];

const InteractiveTools = () => {
  const { addItem } = useCart();
  const [activeToolTab, setActiveToolTab] = useState('calculator'); // 'calculator' | 'beforeafter' | 'tour' | 'poses'
  
  // Calculator states
  const [selectedBase, setSelectedBase] = useState(basePackagesList[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  
  // AI recommendation states
  const [aiEvent, setAiEvent] = useState('wedding');
  const [aiBudget, setAiBudget] = useState('high');
  const [aiGuests, setAiGuests] = useState('medium');
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // Before After slider position
  const [sliderPos, setSliderPos] = useState(50);
  
  // Studio walkthrough hotspot active details
  const [activeHotspot, setActiveHotspot] = useState(null);
  
  // Venue filtering state
  const [venueFilter, setVenueFilter] = useState('all');

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const getCalculatorTotal = () => {
    return selectedBase.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  };

  const handleBookCustom = () => {
    const total = getCalculatorTotal();
    const customService = {
      _id: 'custom-' + Date.now(),
      name: `Bespoke Package (${selectedBase.name})`,
      price: total,
      description: `Bespoke package including: ${selectedAddons.map(a => a.name).join(', ') || 'No add-ons selected'}`,
      category: selectedBase.category,
      features: ['Custom Selected Package', ...selectedAddons.map(a => a.name)]
    };
    addItem(customService);
  };

  const handleRunAIRecommendation = (e) => {
    e.preventDefault();
    let pkg = '';
    let why = '';
    let priceEstimate = 0;
    
    if (aiEvent === 'wedding') {
      if (aiBudget === 'high') {
        pkg = 'Premium Wedding Cinema & Photo Bundle';
        why = 'Includes 2 full-day shooters, complete cinematic film, drone coverage, and deluxe leather prints. Ideal for large luxury venues.';
        priceEstimate = 80000;
      } else {
        pkg = 'Classic Wedding Package';
        why = 'Our standard 10-hour single shooter wedding coverage yielding 500+ high-res edited digital files. Perfect for intimate events.';
        priceEstimate = 45000;
      }
    } else if (aiEvent === 'birthday') {
      pkg = 'Birthday Celebration & Reels coverage';
      why = 'Includes 4 hours of coverage plus 3 edited high-impact vertical video reels ready for Instagram & TikTok posting.';
      priceEstimate = 19000;
    } else {
      pkg = 'Corporate Branding & Headshot Suite';
      why = 'Combines event panel coverage with dedicated high-end backdrop headshot slots for leadership teams. Fast 48hr delivery.';
      priceEstimate = 29000;
    }
    
    setAiRecommendation({ pkg, why, priceEstimate });
  };

  const applyAIRecommendationToCalc = () => {
    if (!aiRecommendation) return;
    const matchingBase = basePackagesList.find(p => p.category === aiEvent) || basePackagesList[0];
    setSelectedBase(matchingBase);
    // Add drone and album if budget is high
    if (aiBudget === 'high') {
      setSelectedAddons([addonsList[0], addonsList[1]]);
    } else {
      setSelectedAddons([]);
    }
    setActiveToolTab('calculator');
  };

  return (
    <div className="tools-page container section animate-fade-in">
      <div className="admin__page-header text-center">
        <h2 className="display-md font-heading">Interactive Studio <span className="text-gold">Tools</span></h2>
        <p className="text-silver">Build packages, get AI suggestions, view editing before/afters, and tour the studio</p>
      </div>

      {/* Tabs */}
      <div className="tools-page__tabs">
        <button className={`tools-page__tab ${activeToolTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveToolTab('calculator')}>
          <FiSliders /> Pricing Calculator & AI Quiz
        </button>
        <button className={`tools-page__tab ${activeToolTab === 'beforeafter' ? 'active' : ''}`} onClick={() => setActiveToolTab('beforeafter')}>
          <FiEye /> Before / After Showcase
        </button>
        <button className={`tools-page__tab ${activeToolTab === 'tour' ? 'active' : ''}`} onClick={() => setActiveToolTab('tour')}>
          <FiCompass /> 360° Studio Tour
        </button>
        <button className={`tools-page__tab ${activeToolTab === 'poses' ? 'active' : ''}`} onClick={() => setActiveToolTab('poses')}>
          <FiCamera /> Pose & Venue Guides
        </button>
      </div>

      <div className="tools-page__content card animate-fade-in" key={activeToolTab}>
        {/* 1. CALCULATOR & AI RECOM */}
        {activeToolTab === 'calculator' && (
          <div className="grid-2 gap-lg">
            {/* Custom package calculator */}
            <div className="tools-page__calc card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--gold)', marginBottom: '20px' }}>Custom Package Builder</h3>
              
              <div className="form-group">
                <label>Select Base Service Package</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {basePackagesList.map(p => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedBase(p)}
                      className={`tools-page__option card ${selectedBase._id === p._id ? 'selected' : ''}`}
                      style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <strong className="text-gold">₹{p.price.toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Add Bespoke Upgrades & Add-ons</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addonsList.map(a => {
                    const isSelected = !!selectedAddons.find(item => item.id === a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggleAddon(a)}
                        className={`tools-page__option card ${isSelected ? 'selected' : ''}`}
                        style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={`checkbox-box ${isSelected ? 'checked' : ''}`} style={{ width: '18px', height: '18px', border: '1px solid var(--gold)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected && <span style={{ width: '10px', height: '10px', background: 'var(--gold)', borderRadius: '2px' }} />}
                          </div>
                          <span>{a.name}</span>
                        </div>
                        <strong className="text-gold">+₹{a.price.toLocaleString('en-IN')}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>Bespoke Quotation Estimate</div>
                  <strong className="text-gold" style={{ fontSize: '1.6rem' }}>₹{getCalculatorTotal().toLocaleString('en-IN')}</strong>
                </div>
                <button className="btn btn-primary" onClick={handleBookCustom}>
                  Book Custom Package <FiArrowRight />
                </button>
              </div>
            </div>

            {/* AI suggestion panel */}
            <div className="tools-page__ai-recom card" style={{ padding: '24px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>AI Package Recommendation</h3>
              <p className="text-silver" style={{ fontSize: '0.8rem', marginBottom: '20px' }}>
                Answer 3 quick questions and let our AI planner suggest the most optimal configurations.
              </p>

              <form onSubmit={handleRunAIRecommendation} style={{ display: 'flex', flexPrompt: 'column', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Event Category</label>
                  <select className="form-input" value={aiEvent} onChange={e => setAiEvent(e.target.value)}>
                    <option value="wedding">Wedding / Pre-Wedding</option>
                    <option value="birthday">Birthday Party / Social Gatherings</option>
                    <option value="corporate">Corporate Event / Seminars</option>
                    <option value="portrait">Individual / Family Portraits</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Budget Range</label>
                  <select className="form-input" value={aiBudget} onChange={e => setAiBudget(e.target.value)}>
                    <option value="low">Standard (Under ₹20,000)</option>
                    <option value="medium">Bespoke (₹20,000 - ₹40,000)</option>
                    <option value="high">Luxury Elite (₹40,000+)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estimated Guest Count</label>
                  <select className="form-input" value={aiGuests} onChange={e => setAiGuests(e.target.value)}>
                    <option value="small">Intimate Gathering (Under 50)</option>
                    <option value="medium">Medium Size (50 - 200)</option>
                    <option value="large">Grand Celebration (200+)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-outline-gold" style={{ width: '100%' }}>Generate AI Recommendation</button>
              </form>

              {aiRecommendation && (
                <div className="card" style={{ marginTop: '20px', padding: '16px', background: 'rgba(201,168,76,0.05)', border: '1px dashed var(--gold)', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>🤖 Suggested: {aiRecommendation.pkg}</h4>
                  <p className="text-silver" style={{ fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '12px' }}>{aiRecommendation.why}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>Est: <strong className="text-gold">₹{aiRecommendation.priceEstimate.toLocaleString('en-IN')}</strong></span>
                    <button className="btn btn-primary btn-sm" onClick={applyAIRecommendationToCalc}>
                      Load in Calculator
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. BEFORE AFTER SLIDER */}
        {activeToolTab === 'beforeafter' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>Retouching & Editing Showcase</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              Drag the golden center slider to compare RAW camera captures with our final color-graded edits.
            </p>

            <div className="beforeafter__container" style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.3)' }}>
              {/* Underlay (RAW Image) */}
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000"
                alt="RAW Camera Capture"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.9) contrast(0.8)' }}
              />
              <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>RAW Capture</span>

              {/* Overlay (Retouched Image) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${sliderPos}%`,
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000"
                  alt="Color Graded Retouched"
                  style={{ width: '640px', maxWidth: 'none', height: '360px', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(201,168,76,0.8)', color: 'var(--charcoal)', fontWeight: 600, fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Luminos Edit</span>
              </div>

              {/* Slider Line & Handle */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: '2px', background: 'var(--gold)', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                  <FiSliders color="var(--charcoal)" size={14} />
                </div>
              </div>

              {/* Range Input mapping to mouse drags */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={e => setSliderPos(parseInt(e.target.value))}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize' }}
              />
            </div>
          </div>
        )}

        {/* 3. 360 WALKTHROUGH TOUR */}
        {activeToolTab === 'tour' && (
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '8px' }}>Interactive 360° Studio Tour</h3>
            <p className="text-silver" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              Explore our physical consulting and photography spaces. Click a hotspot to view details.
            </p>

            <div style={{ position: 'relative', width: '100%', height: '380px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Panoramic Wide Studio Background */}
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200"
                alt="Studio Wide Tour Panorama"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }}
              />

              {/* Hotspot Dots */}
              {studioHotspots.map(spot => (
                <button
                  key={spot.id}
                  onClick={() => setActiveHotspot(spot)}
                  style={{
                    position: 'absolute',
                    top: spot.y,
                    left: spot.x,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    border: '3px solid #fff',
                    boxShadow: '0 0 12px var(--gold)',
                    cursor: 'pointer',
                    animation: 'pulse 1.8s infinite'
                  }}
                  aria-label={spot.title}
                />
              ))}

              {/* Popup Hotspot details */}
              {activeHotspot && (
                <div className="glass-card animate-fade-in-scale" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '380px', padding: '16px', background: 'rgba(13,13,13,0.92)', border: '1px solid var(--gold)', borderRadius: '8px', textAlign: 'left' }}>
                  <h4 style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{activeHotspot.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', lineHeight: '1.5' }}>{activeHotspot.desc}</p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '8px', padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setActiveHotspot(null)}>Close</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. POSES & VENUE PORTFOLIOS */}
        {activeToolTab === 'poses' && (
          <div className="grid-2 gap-lg">
            {/* Poses Guide */}
            <div className="card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '14px' }}><FiCamera /> Event Pose Inspirations</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posesStyles.map(style => (
                  <div key={style.name}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--cream)', marginBottom: '8px', letterSpacing: '0.03em' }}>{style.name}</h4>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {style.poses.map((p, idx) => (
                        <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--silver)' }}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Guide & recommendations */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '10px' }}><FiMapPin /> Venue Portfolios & Guidelines</h3>
              <p className="text-silver" style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
                Check recommended setups and times based on our previous bookings at local venues.
              </p>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['all', 'indoor', 'outdoor', 'studio'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setVenueFilter(cat)}
                    className={`btn btn-sm ${venueFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {venuesGuide
                  .filter(v => venueFilter === 'all' || v.category === venueFilter)
                  .map(venue => (
                    <div key={venue.name} className="card" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--gold)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>{venue.name}</strong>
                      <div className="text-silver" style={{ fontSize: '0.78rem', marginTop: '4px', fontStyle: 'italic' }}>
                        💡 {venue.advice}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveTools;
