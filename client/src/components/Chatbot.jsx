import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiHelpCircle, FiCamera, FiCheck } from 'react-icons/fi';
import api from '../api';
import './Chatbot.css';

const FAQ_ANSWERS = {
  pricing: 'Our packages start from ₹8,000 for portrait sessions up to ₹45,000 for premium full-day wedding coverage. Check our Services page for details!',
  delivery: 'Standard photos take 7-10 days. Wedding cinematic films and printed albums are delivered within 3-4 weeks.',
  location: 'We are based in Hyderabad, Telangana, but our team is available for travel worldwide for wedding shoots.',
  drone: 'Yes! High-resolution drone aerial photography and videography are included for free in our premium wedding packages.'
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Photography Assistant. How can I help you capture your special moments today?' }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState('menu'); // 'menu' | 'suggest_event' | 'suggest_budget' | 'faq' | 'contact_name' | 'contact_email' | 'contact_phone' | 'done'
  
  // Lead collection state
  const [lead, setLead] = useState({ name: '', email: '', phone: '', packageInquiry: '' });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const handleAction = (type, value = '') => {
    if (type === 'suggest') {
      addMessage('user', 'Suggest a Package');
      addMessage('bot', 'Awesome! What type of event are you hosting?');
      setStep('suggest_event');
    } else if (type === 'faq') {
      addMessage('user', 'Browse FAQs');
      addMessage('bot', 'Which of these common questions can I answer for you?');
      setStep('faq');
    } else if (type === 'contact') {
      addMessage('user', 'Request a Callback / Get in Touch');
      addMessage('bot', 'Sure! Let\'s collect your details. What is your name?');
      setStep('contact_name');
    }
  };

  const handleSelectEvent = (event) => {
    addMessage('user', `It is a ${event}`);
    setLead(prev => ({ ...prev, packageInquiry: event }));
    addMessage('bot', `Excellent. What is your estimated budget?`);
    setStep('suggest_budget');
  };

  const handleSelectBudget = (budget) => {
    addMessage('user', `My budget is ${budget}`);
    let suggestion = '';
    if (lead.packageInquiry.toLowerCase().includes('wedding')) {
      suggestion = budget === 'High' 
        ? 'We highly recommend our "Wedding Photography & Cinematic Video Bundle" (₹80,000 value, featuring 2 photographers, drone, and printed albums).'
        : 'We recommend our "Wedding Photography Package" (₹45,000, featuring full day coverage and 500+ photos).';
    } else {
      suggestion = budget === 'High'
        ? 'We recommend our "Corporate Event Coverage" (₹25,000, 8 hours, full team).'
        : 'Our "Portrait Session" (₹8,000) or "Birthday Celebration Package" (₹15,000) would be a perfect fit.';
    }
    
    addMessage('bot', `${suggestion}\n\nWould you like our team to call you back to discuss this?`);
    setStep('menu');
  };

  const handleSelectFAQ = (key) => {
    addMessage('user', `Question about ${key}`);
    addMessage('bot', FAQ_ANSWERS[key]);
    addMessage('bot', 'Is there anything else I can help you with?');
    setStep('menu');
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const text = input.trim();
    addMessage('user', text);
    setInput('');

    if (step === 'contact_name') {
      setLead(prev => ({ ...prev, name: text }));
      addMessage('bot', `Thanks, ${text}! What is your email address?`);
      setStep('contact_email');
    } else if (step === 'contact_email') {
      setLead(prev => ({ ...prev, email: text }));
      addMessage('bot', `Got it. And finally, what is your phone number?`);
      setStep('contact_phone');
    } else if (step === 'contact_phone') {
      const finalLead = { ...lead, phone: text };
      setLead(finalLead);
      addMessage('bot', `Saving details...`);
      try {
        await api.post('/leads', finalLead);
        addMessage('bot', `✅ Thank you, ${finalLead.name}! Your request has been saved. Our studio manager will call you within 24 hours.`);
      } catch (err) {
        addMessage('bot', `Sorry, we couldn't save your request directly. Please call us at +917989856610.`);
      }
      setStep('menu');
    } else {
      // General NLP matcher
      const query = text.toLowerCase();
      if (query.includes('wedding') || query.includes('marriage')) {
        addMessage('bot', 'We specialize in weddings! Our Wedding Photography starts at ₹45,000. Would you like to check availability or request a quote?');
      } else if (query.includes('price') || query.includes('cost') || query.includes('rate')) {
        addMessage('bot', 'Our prices range from ₹8,000 to ₹45,000. You can view all our rates on the Services page.');
      } else if (query.includes('hello') || query.includes('hi')) {
        addMessage('bot', 'Hello! How can I help you today?');
      } else {
        addMessage('bot', 'I understand! Let me record your contact details so our coordinator can get back to you with custom details.');
        setStep('contact_name');
      }
    }
  };

  return (
    <div className="chatbot">
      {/* Popover */}
      {isOpen && (
        <div className="chatbot__window glass-card animate-fade-in-scale">
          <div className="chatbot__header">
            <div className="chatbot__brand">
              <div className="chatbot__avatar-logo"><FiCamera size={16} /></div>
              <div>
                <h4 className="chatbot__title">Luminos Assistant</h4>
                <span className="chatbot__status">Replies instantly</span>
              </div>
            </div>
            <button className="chatbot__close" onClick={() => setIsOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          <div className="chatbot__messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chatbot__msg chatbot__msg--${m.sender}`}>
                <div className="chatbot__msg-bubble">{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Context Options */}
          {step === 'menu' && (
            <div className="chatbot__options">
              <button className="chatbot__opt-btn" onClick={() => handleAction('suggest')}>
                💡 Suggest a Package
              </button>
              <button className="chatbot__opt-btn" onClick={() => handleAction('faq')}>
                ❓ Browse FAQs
              </button>
              <button className="chatbot__opt-btn" onClick={() => handleAction('contact')}>
                📞 Request Call Back
              </button>
            </div>
          )}

          {step === 'suggest_event' && (
            <div className="chatbot__options">
              <button className="chatbot__opt-btn" onClick={() => handleSelectEvent('Wedding')}>Wedding</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectEvent('Birthday')}>Birthday Party</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectEvent('Corporate Event')}>Corporate Event</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectEvent('Portrait Shoot')}>Portrait Session</button>
            </div>
          )}

          {step === 'suggest_budget' && (
            <div className="chatbot__options">
              <button className="chatbot__opt-btn" onClick={() => handleSelectBudget('Standard')}>Standard (Under ₹25k)</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectBudget('High')}>Premium (₹30k+)</button>
            </div>
          )}

          {step === 'faq' && (
            <div className="chatbot__options">
              <button className="chatbot__opt-btn" onClick={() => handleSelectFAQ('pricing')}>Pricing ranges?</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectFAQ('delivery')}>Delivery times?</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectFAQ('drone')}>Is Drone included?</button>
              <button className="chatbot__opt-btn" onClick={() => handleSelectFAQ('location')}>Do you travel?</button>
            </div>
          )}

          <form onSubmit={handleSend} className="chatbot__form">
            <input
              type="text"
              className="chatbot__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or type details..."
              required
            />
            <button type="submit" className="chatbot__send" aria-label="Send">
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`chatbot__toggle ${isOpen ? 'chatbot__toggle--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        <FiMessageSquare size={22} />
        <span className="chatbot__badge">AI</span>
      </button>
    </div>
  );
};

export default Chatbot;