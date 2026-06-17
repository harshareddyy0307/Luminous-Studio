import { useState } from 'react';
import { FiCheck, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './ServiceCard.css';

const formatPrice = (price) =>
  '₹' + price.toLocaleString('en-IN');

const ServiceCard = ({ service }) => {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i._id === service._id);

  return (
    <div className={`service-card ${service.popular ? 'service-card--popular' : ''}`}>
      {service.popular && (
        <div className="service-card__badge">
          <FiStar size={12} /> Most Popular
        </div>
      )}

      <div className="service-card__header">
        <span className="service-card__category">{service.category}</span>
        <h3 className="service-card__name">{service.name}</h3>
        <p className="service-card__desc">{service.description}</p>
      </div>

      <div className="service-card__price">
        <span className="service-card__price-label">Starting from</span>
        <span className="service-card__price-amount">{formatPrice(service.price)}</span>
      </div>

      {service.features && service.features.length > 0 && (
        <ul className="service-card__features">
          {service.features.map((f, i) => (
            <li key={i} className="service-card__feature">
              <FiCheck className="service-card__check" size={14} />
              {f}
            </li>
          ))}
        </ul>
      )}

      <button
        className={`btn ${inCart ? 'btn-secondary' : 'btn-primary'} btn-full service-card__cta`}
        onClick={() => addItem(service)}
        disabled={inCart}
        id={`add-to-cart-${service._id}`}
      >
        <FiShoppingCart size={16} />
        {inCart ? 'Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ServiceCard;
