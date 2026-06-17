require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const Image = require('./models/Image');

const sampleServices = [
  {
    name: 'Wedding Photography',
    description: 'Complete wedding day coverage with a team of professional photographers capturing every precious moment.',
    price: 45000,
    category: 'wedding',
    popular: true,
    features: [
      'Full day coverage (10 hours)',
      '2 professional photographers',
      '500+ edited photos',
      'Online gallery delivery',
      'Printed photo album (50 pages)',
      'Drone aerial shots included'
    ]
  },
  {
    name: 'Wedding Cinematic Video',
    description: 'Cinematic wedding film that tells your love story with breathtaking visuals and emotional storytelling.',
    price: 35000,
    category: 'wedding',
    popular: true,
    features: [
      'Full day videography',
      '4K cinematic quality',
      '10-15 minute highlight film',
      'Full ceremony & reception film',
      'Same-day reel for social media',
      'Background music licensed'
    ]
  },
  {
    name: 'Birthday Celebration Package',
    description: 'Capture every laugh, cake cut, and dance move at your birthday celebration in stunning detail.',
    price: 15000,
    category: 'birthday',
    popular: false,
    features: [
      '4 hours of coverage',
      '1 professional photographer',
      '200+ edited photos',
      'Online gallery delivery',
      'Same-day previews (5 photos)',
      'Candid & posed shots'
    ]
  },
  {
    name: 'Corporate Event Coverage',
    description: 'Professional documentation of corporate events, conferences, product launches, and team events.',
    price: 25000,
    category: 'corporate',
    popular: false,
    features: [
      '8 hours of coverage',
      'Headshots for up to 20 people',
      '300+ edited corporate photos',
      'Quick 48-hour turnaround',
      'High-res print-ready files',
      'Commercial usage rights'
    ]
  },
  {
    name: 'Portrait Session',
    description: 'Stunning individual or family portrait sessions at your choice of location or our premium studio.',
    price: 8000,
    category: 'portrait',
    popular: false,
    features: [
      '2 hours session',
      '2 outfit changes',
      '50+ edited portraits',
      'Indoor/outdoor location',
      'Digital files included',
      'Print packages available'
    ]
  },
  {
    name: 'Pre-Wedding Shoot',
    description: 'Romantic pre-wedding photo session at a beautiful location to celebrate your upcoming union.',
    price: 20000,
    category: 'wedding',
    popular: false,
    features: [
      '6 hours location shoot',
      '150+ edited photos',
      'Multiple locations',
      'Styling guidance provided',
      'Same-day 10-photo preview',
      'Engagement album option'
    ]
  }
];

const sampleImages = [
  { title: 'Golden Hour Wedding', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200', publicId: 'demo-1', featured: true },
  { title: 'Bridal Portrait', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200', publicId: 'demo-2', featured: true },
  { title: 'Wedding Reception', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200', publicId: 'demo-3', featured: false },
  { title: 'Couple in Garden', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200', publicId: 'demo-4', featured: false },
  { title: 'Birthday Cake Moment', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', publicId: 'demo-5', featured: true },
  { title: 'Birthday Celebration', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200', publicId: 'demo-6', featured: false },
  { title: 'Kids Birthday Party', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200', publicId: 'demo-7', featured: false },
  { title: 'Corporate Conference', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200', publicId: 'demo-8', featured: true },
  { title: 'Business Team Photo', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200', publicId: 'demo-9', featured: false },
  { title: 'Product Launch Event', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200', publicId: 'demo-10', featured: false },
  { title: 'Award Ceremony', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200', publicId: 'demo-11', featured: false },
  { title: 'Romantic Pre-Wedding', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200', publicId: 'demo-12', featured: false }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Image.deleteMany({});

    // Create admin user
    const admin = new User({ username: 'admin', password: 'admin123' });
    await admin.save();
    console.log('✅ Admin user created: admin / admin123');

    // Insert services
    await Service.insertMany(sampleServices);
    console.log(`✅ ${sampleServices.length} services seeded`);

    // Insert images
    await Image.insertMany(sampleImages);
    console.log(`✅ ${sampleImages.length} portfolio images seeded`);

    console.log('\n🎉 Database seeded successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
