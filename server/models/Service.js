const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  imageUrl: { type: String, default: '' },
  category: {
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'portrait', 'other'],
    default: 'other'
  },
  popular: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
