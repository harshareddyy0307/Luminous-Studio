import { useEffect, useCallback } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Lightbox.css';

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  const current = images[currentIndex];

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!current) return null;

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        <FiX size={24} />
      </button>

      <button
        className="lightbox__nav lightbox__nav--prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
      >
        <FiChevronLeft size={32} />
      </button>

      <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.cloudinaryUrl}
          alt={current.title}
          className="lightbox__image animate-fade-in-scale"
          key={current._id || currentIndex}
        />
        <div className="lightbox__caption">
          <span className="lightbox__title">{current.title}</span>
          <span className="lightbox__counter">{currentIndex + 1} / {images.length}</span>
        </div>
      </div>

      <button
        className="lightbox__nav lightbox__nav--next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
      >
        <FiChevronRight size={32} />
      </button>
    </div>
  );
};

export default Lightbox;
