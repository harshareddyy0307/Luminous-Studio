import { useState } from 'react';
import { FiMessageSquare, FiX, FiSend, FiShare2 } from 'react-icons/fi';
import './WhatsAppWidget.css';

const WhatsAppWidget = ({ phoneNumber = '+917989856610', studioName = 'Luminos Studio' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(`Hi ${studioName}, I am interested in booking your photography services.`);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setMessage('');
    setIsOpen(false);
  };

  const shareCurrentPage = () => {
    const text = `Hi ${studioName}, I am interested in booking your photography services. Check my selection: ${window.location.href}`;
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="whatsapp-widget">
      {/* Popover */}
      {isOpen && (
        <div className="whatsapp-widget__popover glass-card animate-fade-in-scale">
          <div className="whatsapp-widget__header">
            <div className="whatsapp-widget__brand">
              <div className="whatsapp-widget__avatar">L</div>
              <div>
                <h4 className="whatsapp-widget__title">{studioName}</h4>
                <span className="whatsapp-widget__status">Online • Typically replies in 1hr</span>
              </div>
            </div>
            <button className="whatsapp-widget__close" onClick={() => setIsOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          <div className="whatsapp-widget__body">
            <p className="whatsapp-widget__intro">
              Hello! How can we help capture your beautiful moments today?
            </p>
            <button className="whatsapp-widget__share-btn" onClick={shareCurrentPage}>
              <FiShare2 size={14} /> Share current page context
            </button>
          </div>

          <form onSubmit={handleSend} className="whatsapp-widget__form">
            <input
              type="text"
              className="whatsapp-widget__input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              required
            />
            <button type="submit" className="whatsapp-widget__send" aria-label="Send">
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`whatsapp-widget__toggle ${isOpen ? 'whatsapp-widget__toggle--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contact us on WhatsApp"
      >
        <FiMessageSquare size={22} />
        <span className="whatsapp-widget__tooltip">Chat on WhatsApp</span>
      </button>
    </div>
  );
};

export default WhatsAppWidget;