const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'other'],
    default: 'other'
  },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);
