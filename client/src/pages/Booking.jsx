import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiFileText, FiCheck, FiArrowRight, FiShare2, FiGift } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import api from '../api';
import './Booking.css';

// ─── Countdown Timer Component ───
const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        Mins: Math.floor((difference / 1000 / 60) % 60),
        Secs: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const timerComponents = [];
  Object.keys(timeLeft).forEach((interval) => {
    timerComponents.push(
      <div key={interval} className="countdown__box card">
        <span className="countdown__number text-gold">{timeLeft[interval]}</span>
        <span className="countdown__unit">{interval}</span>
      </div>
    );
  });

  return (
    <div className="countdown" style={{ marginTop: '24px' }}>
      <h4 className="countdown__title" style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silver)', marginBottom: '12px' }}>
        Days Remaining Until Your Event
      </h4>
      <div className="countdown__grid" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {timerComponents.length ? timerComponents : <span>Your event day is here! 🎉</span>}
      </div>
    </div>
  );
};

const steps = ['Your Details', 'Event Info', 'Confirm'];

const Booking = () => {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState({
    customerName: '', email: '', phone: '',
    eventDate: '', eventType: '', notes: ''
  });
  const [errors, setErrors] = useState({});
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    api.get('/bookings/booked-dates')
      .then(({ data }) => setBookedDates(data))
      .catch(() => {});
  }, []);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.customerName.trim()) errs.customerName = 'Name is required';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
      if (!form.phone.trim() || form.phone.length < 10) errs.phone = 'Valid phone required';
    }
    if (step === 1) {
      if (!form.eventDate) {
        errs.eventDate = 'Event date is required';
      } else if (bookedDates.includes(form.eventDate)) {
        errs.eventDate = 'This date is already fully booked! Please select another date.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        eventDate: form.eventDate,
        eventType: form.eventType,
        notes: form.notes,
        services: items.map(i => ({ serviceId: i._id, name: i.name, price: i.price })),
        totalAmount: total || 0
      };
      const { data } = await api.post('/bookings', payload);
      setBooking(data.booking);
      clearCart();
    } catch (err) {
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (booking) {
    const points = Math.floor((booking.totalAmount || 0) / 100);
    const referralLink = `${window.location.origin}/booking?ref=${booking.bookingReference}`;

    return (
      <div className="booking page-top">
        <div className="container section" style={{ maxWidth: '640px' }}>
          <div className="booking__success animate-fade-in-scale">
            <div className="booking__success-icon"><FiCheck /></div>
            <h2 className="display-sm">Booking <span className="text-gold">Confirmed!</span></h2>
            <p className="text-silver" style={{ marginBottom: '20px' }}>Thank you, <strong className="text-cream">{booking.customerName}</strong>! Your booking has been received. We'll contact you within 24 hours.</p>
            
            <div className="booking__ref card">
              <div className="booking__ref-label">Your Booking Reference</div>
              <div className="booking__ref-code text-gold font-heading">{booking.bookingReference}</div>
              <div className="booking__ref-note text-silver">A confirmation email has been sent to {booking.email}</div>
            </div>

            {/* Loyalty points */}
            {points > 0 && (
              <div className="booking__rewards card" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '16px' }}>
                <FiGift className="text-gold" size={20} />
                <span style={{ fontSize: '0.85rem' }}>You've earned <strong className="text-gold">{points} loyalty points</strong> from this booking!</span>
              </div>
            )}

            {/* Referral program */}
            <div className="booking__referral card" style={{ marginTop: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                <FiShare2 className="text-gold" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Refer a Friend Program</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--silver)', marginBottom: '12px' }}>Share this link. When they book, you both get a 10% discount on your next session!</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input readOnly value={referralLink} className="form-input" style={{ fontSize: '0.75rem', padding: '8px 12px' }} />
                <button className="btn btn-primary btn-sm" onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  alert('Referral link copied to clipboard!');
                }}>Copy</button>
              </div>
            </div>

            {/* Event Countdown */}
            {booking.eventDate && <CountdownTimer targetDate={booking.eventDate} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking page-top">
      <div className="container section-sm">
        {/* Header */}
        <div className="booking__header">
          <div className="section-label">Book a Session</div>
          <h1 className="display-sm">Complete Your <span className="text-gold">Booking</span></h1>
        </div>

        {/* Progress steps */}
        <div className="booking__steps">
          {steps.map((label, i) => (
            <div key={i} className={`booking__step ${i === step ? 'booking__step--active' : ''} ${i < step ? 'booking__step--done' : ''}`}>
              <div className="booking__step-circle">{i < step ? <FiCheck /> : i + 1}</div>
              <span className="booking__step-label">{label}</span>
              {i < steps.length - 1 && <div className="booking__step-line" />}
            </div>
          ))}
        </div>

        <div className="booking__layout">
          {/* Form area */}
          <div className="booking__form card animate-fade-in" key={step}>
            {step === 0 && (
              <div className="booking__fields">
                <h3 className="booking__field-title">Contact Information</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="customerName"><FiUser /> Full Name</label>
                  <input id="customerName" name="customerName" className={`form-input ${errors.customerName ? 'form-input--error' : ''}`} value={form.customerName} onChange={update} placeholder="Your full name" />
                  {errors.customerName && <span className="form-error">{errors.customerName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email"><FiMail /> Email Address</label>
                  <input id="email" name="email" type="email" className={`form-input ${errors.email ? 'form-input--error' : ''}`} value={form.email} onChange={update} placeholder="your@email.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone"><FiPhone /> Phone Number</label>
                  <input id="phone" name="phone" className={`form-input ${errors.phone ? 'form-input--error' : ''}`} value={form.phone} onChange={update} placeholder="+91 XXXXX XXXXX" />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="booking__fields">
                <h3 className="booking__field-title">Event Details</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="eventDate"><FiCalendar /> Event Date</label>
                  <input id="eventDate" name="eventDate" type="date" className={`form-input ${errors.eventDate ? 'form-input--error' : ''}`} value={form.eventDate} onChange={update} min={new Date().toISOString().split('T')[0]} />
                  {errors.eventDate && <span className="form-error">{errors.eventDate}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="eventType">Event Type</label>
                  <select id="eventType" name="eventType" className="form-input" value={form.eventType} onChange={update}>
                    <option value="">Select event type</option>
                    <option>Wedding</option>
                    <option>Birthday</option>
                    <option>Corporate Event</option>
                    <option>Pre-Wedding Shoot</option>
                    <option>Portrait Session</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="notes"><FiFileText /> Additional Notes</label>
                  <textarea id="notes" name="notes" className="form-input" value={form.notes} onChange={update} placeholder="Any special requirements, venue details, or preferences..." rows={4} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="booking__confirm">
                <h3 className="booking__field-title">Review & Confirm</h3>
                <div className="booking__confirm-grid">
                  <div>
                    <div className="booking__confirm-label">Name</div>
                    <div className="booking__confirm-val">{form.customerName}</div>
                  </div>
                  <div>
                    <div className="booking__confirm-label">Email</div>
                    <div className="booking__confirm-val">{form.email}</div>
                  </div>
                  <div>
                    <div className="booking__confirm-label">Phone</div>
                    <div className="booking__confirm-val">{form.phone}</div>
                  </div>
                  <div>
                    <div className="booking__confirm-label">Event Date</div>
                    <div className="booking__confirm-val">{form.eventDate ? new Date(form.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
                  </div>
                  <div>
                    <div className="booking__confirm-label">Event Type</div>
                    <div className="booking__confirm-val">{form.eventType || '—'}</div>
                  </div>
                  {form.notes && (
                    <div className="booking__confirm-full">
                      <div className="booking__confirm-label">Notes</div>
                      <div className="booking__confirm-val">{form.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="booking__actions">
              {step > 0 && (
                <button className="btn btn-secondary" onClick={back}>Back</button>
              )}
              {step < 2 && (
                <button className="btn btn-primary" onClick={next}>
                  Next Step <FiArrowRight />
                </button>
              )}
              {step === 2 && (
                <button className="btn btn-primary" onClick={submit} disabled={loading} id="confirm-booking">
                  {loading ? 'Processing...' : 'Confirm Booking'} {!loading && <FiCheck />}
                </button>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="booking__sidebar card">
            <h4 className="booking__sidebar-title">Selected Services</h4>
            {items.length === 0 ? (
              <p className="text-silver" style={{fontSize:'0.875rem'}}>No services selected. <a href="/services" className="text-gold">Browse services</a></p>
            ) : (
              <ul className="booking__sidebar-items">
                {items.map(item => (
                  <li key={item._id} className="booking__sidebar-item">
                    <span>{item.name}</span>
                    <span className="text-gold">₹{item.price.toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="booking__sidebar-total">
              <span>Total</span>
              <span className="text-gold font-heading" style={{fontSize:'1.5rem'}}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
