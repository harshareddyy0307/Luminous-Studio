const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventType: { type: String, default: '' },
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  bookingReference: { type: String, unique: true }
}, { timestamps: true });

BookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference = 'LB-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
