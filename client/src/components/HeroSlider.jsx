import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronDown } from 'react-icons/fi';
import './HeroSlider.css';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
    category: 'Wedding',
    title: 'Where Love Becomes',
    titleGold: 'Art',
    sub: 'Capturing the most precious moments of your special day'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    category: 'Birthday',
    title: 'Celebrate Every',
    titleGold: 'Milestone',
    sub: 'Birthday stories told through beautiful, candid frames'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80',
    category: 'Corporate',
    title: 'Your Brand,',
    titleGold: 'Elevated',
    sub: 'Professional corporate photography that speaks volumes'
  }
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 800);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timerRef.current);
  }, []);

  const slide = slides[current];

  return (
    <section className="hero" id="hero">
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hero__slide ${i === current ? 'hero__slide--active' : ''}`}
          style={{ backgroundImage: `url(${s.image})` }}
        />
      ))}

      {/* Overlay */}
      <div className="hero__overlay" />

      {/* Content */}
      <div className="container hero__content">
        <div className="hero__text" key={current}>
          <span className="section-label hero__label">{slide.category}</span>
          <h1 className="hero__title display-xl">
            {slide.title}<br />
            <span className="text-gold">{slide.titleGold}</span>
          </h1>
          <p className="hero__sub">{slide.sub}</p>
          <div className="hero__cta">
            <Link to="/portfolio" className="btn btn-primary btn-lg">
              View Portfolio <FiArrowRight />
            </Link>
            <Link to="/booking" className="btn btn-secondary btn-lg">
              Book a Session
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="hero__stats">
          {[
            { value: '500+', label: 'Events Shot' },
            { value: '12+', label: 'Years Experience' },
            { value: '98%', label: 'Client Satisfaction' }
          ].map((stat) => (
            <div key={stat.label} className="hero__stat">
              <span className="hero__stat-value">{stat.value}</span>
              <span className="hero__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="hero__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === current ? 'hero__dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="hero__scroll">
        <FiChevronDown className="hero__scroll-icon" />
      </div>
    </section>
  );
};

export default HeroSlider;
