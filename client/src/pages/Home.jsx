import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCamera, FiHeart, FiBriefcase, FiAward, FiClock, FiUsers } from 'react-icons/fi';
import HeroSlider from '../components/HeroSlider';
import Lightbox from '../components/Lightbox';
import api from '../api';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import './Home.css';

const whyUs = [
  { icon: <FiCamera />, title: 'Expert Photographers', desc: 'A team of seasoned professionals with 12+ years of combined experience.' },
  { icon: <FiHeart />, title: 'Passionate Storytellers', desc: 'We capture emotions, not just images — every frame tells your unique story.' },
  { icon: <FiAward />, title: 'Award-Winning Work', desc: 'Recognized for excellence in photography with national awards.' },
  { icon: <FiClock />, title: '48-Hour Delivery', desc: 'Quick turnaround on edited galleries without compromising quality.' },
  { icon: <FiUsers />, title: '500+ Happy Clients', desc: 'Trusted by hundreds of families, couples, and businesses across the region.' },
  { icon: <FiBriefcase />, title: 'End-to-End Service', desc: 'From shoot planning to album delivery, we handle everything for you.' },
];

const Home = () => {
  const [featuredImages, setFeaturedImages] = useState([]);
  const [services, setServices] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    api.get('/portfolio').then(({ data }) => setFeaturedImages(data.filter(i => i.featured).slice(0, 6)));
    api.get('/services').then(({ data }) => setServices(data.slice(0, 3)));
  }, []);

  return (
    <div className="home">
      <HeroSlider />

      {/* Featured Portfolio */}
      <section className="section home__portfolio">
        <div className="container">
          <div className="text-center">
            <div className="section-label">Our Work</div>
            <h2 className="display-md">Featured <span className="text-gold">Portfolio</span></h2>
            <p className="home__section-sub">A curated selection of our finest photography work</p>
          </div>

          <div className="home__gallery animate-stagger">
            {featuredImages.length > 0
              ? featuredImages.map((img, i) => (
                  <div key={img._id} className="home__gallery-item" onClick={() => setLightboxIdx(i)}>
                    <img src={img.cloudinaryUrl} alt={img.title} loading="lazy" />
                    <div className="home__gallery-overlay">
                      <span className="home__gallery-title">{img.title}</span>
                      <span className="home__gallery-cat">{img.category}</span>
                    </div>
                  </div>
                ))
              : Array(6).fill(0).map((_, i) => <div key={i} className="skeleton home__gallery-item" style={{height: '280px'}} />)
            }
          </div>

          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link to="/portfolio" className="btn btn-outline-gold btn-lg">
              View Full Portfolio <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section home__why">
        <div className="home__why-bg" />
        <div className="container">
          <div className="text-center">
            <div className="section-label">Why Luminos</div>
            <h2 className="display-md">The <span className="text-gold">Luminos</span> Difference</h2>
            <p className="home__section-sub">What sets us apart from the rest</p>
          </div>
          <div className="grid-3 home__why-grid animate-stagger">
            {whyUs.map((item) => (
              <div key={item.title} className="home__why-card card">
                <div className="home__why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section">
        <div className="container">
          <div className="text-center">
            <div className="section-label">Our Packages</div>
            <h2 className="display-md">Photography <span className="text-gold">Services</span></h2>
            <p className="home__section-sub">Tailored packages for every occasion and budget</p>
          </div>
          <div className="grid-3 animate-stagger" style={{ marginTop: '48px' }}>
            {services.length > 0
              ? services.map((s) => (
                  <div key={s._id} className="home__service-preview card">
                    <span className="home__service-cat">{s.category}</span>
                    <h3 className="home__service-name font-heading">{s.name}</h3>
                    <p className="home__service-desc">{s.description}</p>
                    <div className="home__service-price">
                      <span>Starting from</span>
                      <strong className="text-gold">₹{s.price.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ))
              : Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{height:'280px', borderRadius:'12px'}} />)
            }
          </div>
          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link to="/services" className="btn btn-primary btn-lg">
              View All Services <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <Testimonials />

      {/* FAQ Accordion */}
      <FAQ />

      {/* CTA Banner */}
      <section className="home__cta-section">
        <div className="home__cta-bg" />
        <div className="container home__cta-content text-center">
          <div className="section-label">Ready to Begin?</div>
          <h2 className="display-md">Let's Create Something<br /><span className="text-gold">Extraordinary</span></h2>
          <p className="home__cta-sub">Book your photography session today and preserve your most precious memories forever.</p>
          <div className="home__cta-buttons">
            <Link to="/booking" className="btn btn-primary btn-lg">
              Book Your Session <FiArrowRight />
            </Link>
            <Link to="/services" className="btn btn-secondary btn-lg">
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={featuredImages}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => (i - 1 + featuredImages.length) % featuredImages.length)}
          onNext={() => setLightboxIdx((i) => (i + 1) % featuredImages.length)}
        />
      )}
    </div>
  );
};

export default Home;
