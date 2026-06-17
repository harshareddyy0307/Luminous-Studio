import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import './Testimonials.css';

const REVIEWS = [
  {
    id: 1,
    name: 'Ananya & Rahul',
    role: 'Wedding Photography',
    stars: 5,
    text: 'Luminos Studio made our wedding look like a fairy tale. The team was incredibly professional, blended into the crowd, and captured candid emotions beautifully. We will cherish these pictures forever!',
    date: 'Dec 2025'
  },
  {
    id: 2,
    name: 'Vikram Malhotra',
    role: 'Corporate Launch',
    stars: 5,
    text: 'Highly professional service. The turn-around time for our event photos was less than 48 hours, and the quality was outstanding. We will definitely be booking them for all future company events.',
    date: 'Oct 2025'
  },
  {
    id: 3,
    name: 'Pooja Reddy',
    role: 'Pre-Wedding Shoot',
    stars: 5,
    text: 'Our pre-wedding shoot was so much fun! The photographers made us feel extremely comfortable, gave great posing direction, and found the most stunning sunset spot. Highly recommend!',
    date: 'Nov 2025'
  },
  {
    id: 4,
    name: 'The Sharma Family',
    role: 'First Birthday Portrait',
    stars: 5,
    text: 'Capturing a toddler is hard, but the photographers at Luminos were so patient and friendly. The birthday gallery is full of vibrant, happy pictures. Thank you so much!',
    date: 'Jan 2026'
  }
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  return (
    <section className="testimonials section-sm">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <span className="section-label">Testimonials</span>
          <h2 className="display-sm font-heading">What Our Clients Say</h2>
          <p className="text-silver" style={{ marginTop: '8px' }}>Real experiences from real customers</p>
        </div>

        <div className="testimonials__carousel glass-card animate-fade-in-scale">
          {/* Stars */}
          <div className="testimonials__stars">
            {[...Array(REVIEWS[index].stars)].map((_, i) => (
              <FiStar key={i} className="testimonials__star-icon fill-gold" />
            ))}
          </div>

          {/* Review text */}
          <blockquote className="testimonials__quote">
            "{REVIEWS[index].text}"
          </blockquote>

          {/* Client info */}
          <div className="testimonials__client">
            <div className="testimonials__avatar">
              {REVIEWS[index].name[0]}
            </div>
            <div>
              <cite className="testimonials__name">{REVIEWS[index].name}</cite>
              <span className="testimonials__role">{REVIEWS[index].role} • {REVIEWS[index].date}</span>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="testimonials__nav">
            <button className="testimonials__btn" onClick={handlePrev} aria-label="Previous review">
              <FiChevronLeft size={20} />
            </button>
            <span className="testimonials__indicator">
              {index + 1} / {REVIEWS.length}
            </span>
            <button className="testimonials__btn" onClick={handleNext} aria-label="Next review">
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;