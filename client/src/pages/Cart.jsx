import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { items, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart page-top">
        <div className="container section text-center">
          <div className="cart__empty">
            <div className="cart__empty-icon"><FiShoppingCart /></div>
            <h2 className="display-sm">Your Cart is Empty</h2>
            <p className="text-silver">Browse our services and add packages to get started.</p>
            <Link to="/services" className="btn btn-primary btn-lg" style={{ marginTop: '24px' }}>
              Explore Services <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart page-top">
      <div className="container section">
        <div className="section-label">Review Order</div>
        <h1 className="display-sm" style={{ marginBottom: '40px' }}>
          Your <span className="text-gold">Cart</span>
        </h1>

        <div className="cart__layout">
          {/* Items */}
          <div className="cart__items">
            {items.map((item) => (
              <div key={item._id} className="cart__item card animate-fade-in">
                <div className="cart__item-info">
                  <span className="cart__item-cat">{item.category}</span>
                  <h3 className="cart__item-name font-heading">{item.name}</h3>
                  <p className="cart__item-desc">{item.description}</p>
                </div>
                <div className="cart__item-right">
                  <span className="cart__item-price text-gold font-heading">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <button
                    className="cart__remove"
                    onClick={() => removeItem(item._id)}
                    aria-label="Remove item"
                    id={`remove-${item._id}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}

            <Link to="/services" className="cart__back-link">
              <FiArrowLeft /> Add more services
            </Link>
          </div>

          {/* Summary */}
          <div className="cart__summary card">
            <h3 className="cart__summary-title">Order Summary</h3>

            <div className="cart__summary-lines">
              {items.map((item) => (
                <div key={item._id} className="cart__summary-line">
                  <span className="cart__summary-name">{item.name}</span>
                  <span>₹{item.price.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="cart__summary-total">
              <span>Total</span>
              <span className="text-gold font-heading" style={{ fontSize: '1.8rem' }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="cart__summary-note">
              Final pricing may be adjusted after consultation based on your specific requirements.
            </p>

            <Link to="/booking" className="btn btn-primary btn-full btn-lg">
              Proceed to Booking <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
