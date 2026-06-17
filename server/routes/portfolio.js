const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { protect } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');

// GET /api/portfolio — public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    const images = await Image.find(filter).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/portfolio — admin only
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, category, featured } = req.body;
    const image = new Image({
      title,
      category: category || 'other',
      cloudinaryUrl: req.file.path,
      publicId: req.file.filename,
      featured: featured === 'true'
    });
    await image.save();
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/portfolio/:id — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    await cloudinary.uploader.destroy(image.publicId);
    await image.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/portfolio/:id/featured — toggle featured
router.patch('/:id/featured', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    image.featured = !image.featured;
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
