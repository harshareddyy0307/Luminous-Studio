// Luminous Studio Express Server Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'luminosbook_secret_2024';
let tempOTPs = {}; // mapping of username -> { otp, user }

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'https://luminous-studio-harsha.web.app', 'https://luminous-studio-harsha.firebaseapp.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logger to record API activity in Render logs
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API LOG] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Database Setup (PostgreSQL with Neon Cloud Sync & Local Fallback) ──────
const { Pool } = require('pg');
const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const dbFile = (name) => path.join(DB_DIR, `${name}.json`);

let memoryDB = {};
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('🔌 Connected to Neon PostgreSQL database.');
} else {
  console.log('📁 Using local JSON files only (no DATABASE_URL provided).');
}

const getPgType = (key, val) => {
  if (key === '_id') return 'VARCHAR(255) PRIMARY KEY';
  if (typeof val === 'number') return 'NUMERIC';
  if (typeof val === 'boolean') return 'BOOLEAN';
  if (Array.isArray(val)) return 'JSONB';
  if (typeof val === 'object' && val !== null) return 'JSONB';
  return 'TEXT';
};

const syncToNativeTable = async (name, data) => {
  if (!pool) return;
  try {
    if (!data || data.length === 0) {
      await pool.query(`DROP TABLE IF EXISTS "${name}"`);
      await pool.query(`CREATE TABLE IF NOT EXISTS "${name}" (_id VARCHAR(255) PRIMARY KEY, data JSONB)`);
      return;
    }

    const sample = data[0];
    await pool.query(`DROP TABLE IF EXISTS "${name}"`);

    const columns = Object.keys(sample).map(key => {
      return `"${key}" ${getPgType(key, sample[key])}`;
    });
    const createQuery = `CREATE TABLE IF NOT EXISTS "${name}" (${columns.join(', ')})`;
    await pool.query(createQuery);

    const cols = Object.keys(sample);
    for (const row of data) {
      const colNames = [];
      const colValues = [];
      const colPlaceholders = [];

      cols.forEach((col, idx) => {
        colNames.push(`"${col}"`);
        let val = row[col];
        if (val === undefined) val = null;

        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          colValues.push(JSON.stringify(val));
        } else {
          colValues.push(val);
        }
        colPlaceholders.push(`$${idx + 1}`);
      });

      const queryText = `INSERT INTO "${name}" (${colNames.join(', ')}) VALUES (${colPlaceholders.join(', ')})`;
      await pool.query(queryText, colValues);
    }
  } catch (err) {
    console.error(`❌ Background native table sync error for ${name}:`, err.message);
  }
};

const initDatabase = async () => {
  const tableNames = [
    'users', 'services', 'images', 'bookings', 'loginHistory',
    'subscribers', 'leads', 'expenses', 'employees', 'blogs',
    'affiliates', 'contracts', 'giftcards'
  ];

  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS json_databases (
          name VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Neon Table json_databases verified/created.');

      for (const name of tableNames) {
        const res = await pool.query('SELECT data FROM json_databases WHERE name = $1', [name]);
        if (res.rows.length > 0) {
          memoryDB[name] = res.rows[0].data;
        } else {
          const localData = readLocalDB(name);
          memoryDB[name] = localData;
          await pool.query(
            'INSERT INTO json_databases (name, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()',
            [name, JSON.stringify(localData)]
          );
        }
        // Sync to native SQL tables in the background on startup
        syncToNativeTable(name, memoryDB[name]).catch(() => {});
      }
      console.log('✅ All database tables loaded from Neon.');
      return;
    } catch (err) {
      console.error('❌ Failed to load from Neon Postgres, falling back to local files:', err);
    }
  }

  for (const name of tableNames) {
    memoryDB[name] = readLocalDB(name);
  }
  console.log('✅ All database tables loaded from local JSON files.');
};

const readLocalDB = (name) => {
  try {
    const f = dbFile(name);
    if (!fs.existsSync(f)) return [];
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch { return []; }
};

const readDB = (name) => {
  return memoryDB[name] || [];
};

const writeDB = (name, data) => {
  memoryDB[name] = data;
  try {
    fs.writeFileSync(dbFile(name), JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write local backup for ${name}:`, err);
  }

  if (pool) {
    pool.query(
      'INSERT INTO json_databases (name, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()',
      [name, JSON.stringify(data)]
    )
    .then(() => {
      // Async sync to native table in database
      return syncToNativeTable(name, data);
    })
    .catch(err => {
      console.error(`❌ Neon sync error for table ${name}:`, err.message);
    });
  }
};

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Seed Initial Data ─────────────────────────────────────────────────────────
const seedIfEmpty = async () => {
  // Admin user
  const usersList = readDB('users');
  if (!usersList.some(u => u.username.toLowerCase() === 'admin')) {
    const hashed = await bcrypt.hash('Admin@123', 12);
    usersList.push({
      _id: genId(),
      username: 'admin',
      password: hashed,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    writeDB('users', usersList);
    console.log('✅ Default admin user seeded: admin / Admin@123');
  }

  // Services
  if (readDB('services').length === 0) {
    writeDB('services', [
      { _id: genId(), name: 'Wedding Photography', description: 'Complete wedding day coverage with a team of professional photographers capturing every precious moment.', price: 45000, category: 'wedding', popular: true, features: ['Full day coverage (10 hours)', '2 professional photographers', '500+ edited photos', 'Online gallery delivery', 'Printed photo album (50 pages)', 'Drone aerial shots included'], createdAt: new Date().toISOString() },
      { _id: genId(), name: 'Wedding Cinematic Video', description: 'Cinematic wedding film that tells your love story with breathtaking visuals and emotional storytelling.', price: 35000, category: 'wedding', popular: true, features: ['Full day videography', '4K cinematic quality', '10-15 minute highlight film', 'Full ceremony & reception film', 'Same-day reel for social media', 'Background music licensed'], createdAt: new Date().toISOString() },
      { _id: genId(), name: 'Birthday Celebration Package', description: 'Capture every laugh, cake cut, and dance move at your birthday celebration in stunning detail.', price: 15000, category: 'birthday', popular: false, features: ['4 hours of coverage', '1 professional photographer', '200+ edited photos', 'Online gallery delivery', 'Same-day previews (5 photos)', 'Candid & posed shots'], createdAt: new Date().toISOString() },
      { _id: genId(), name: 'Corporate Event Coverage', description: 'Professional documentation of corporate events, conferences, product launches, and team events.', price: 25000, category: 'corporate', popular: false, features: ['8 hours of coverage', 'Headshots for up to 20 people', '300+ edited corporate photos', 'Quick 48-hour turnaround', 'High-res print-ready files', 'Commercial usage rights'], createdAt: new Date().toISOString() },
      { _id: genId(), name: 'Portrait Session', description: 'Stunning individual or family portrait sessions at your choice of location or our premium studio.', price: 8000, category: 'portrait', popular: false, features: ['2 hours session', '2 outfit changes', '50+ edited portraits', 'Indoor/outdoor location', 'Digital files included', 'Print packages available'], createdAt: new Date().toISOString() },
      { _id: genId(), name: 'Pre-Wedding Shoot', description: 'Romantic pre-wedding photo session at a beautiful location to celebrate your upcoming union.', price: 20000, category: 'wedding', popular: false, features: ['6 hours location shoot', '150+ edited photos', 'Multiple locations', 'Styling guidance provided', 'Same-day 10-photo preview', 'Engagement album option'], createdAt: new Date().toISOString() }
    ]);
    console.log('✅ 6 services seeded');
  }

  // Portfolio images
  if (readDB('images').length === 0) {
    writeDB('images', [
      { _id: genId(), title: 'Golden Hour Wedding', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200', publicId: 'demo-1', featured: true, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Bridal Portrait', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200', publicId: 'demo-2', featured: true, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Wedding Reception', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200', publicId: 'demo-3', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Couple in Garden', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200', publicId: 'demo-4', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Birthday Cake Moment', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', publicId: 'demo-5', featured: true, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Birthday Celebration', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200', publicId: 'demo-6', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Kids Birthday Party', category: 'birthday', cloudinaryUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200', publicId: 'demo-7', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Corporate Conference', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200', publicId: 'demo-8', featured: true, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Business Team Photo', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200', publicId: 'demo-9', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Product Launch Event', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200', publicId: 'demo-10', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Award Ceremony', category: 'corporate', cloudinaryUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200', publicId: 'demo-11', featured: false, createdAt: new Date().toISOString() },
      { _id: genId(), title: 'Romantic Pre-Wedding', category: 'wedding', cloudinaryUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200', publicId: 'demo-12', featured: false, createdAt: new Date().toISOString() }
    ]);
    console.log('✅ 12 portfolio images seeded');
  }

  if (readDB('bookings').length === 0) writeDB('bookings', []);
  if (readDB('loginHistory').length === 0) writeDB('loginHistory', []);
  if (readDB('subscribers').length === 0) writeDB('subscribers', []);
  if (readDB('leads').length === 0) writeDB('leads', []);
  if (readDB('expenses').length === 0) writeDB('expenses', []);
  if (readDB('employees').length === 0) writeDB('employees', [
    { _id: genId(), name: 'Mokshagnya Chepuri', role: 'Lead Photographer', leaveDays: 2, attendance: 95, createdAt: new Date().toISOString() },
    { _id: genId(), name: 'Harshavardhan Reddy', role: 'Cinematographer & Drone Pilot', leaveDays: 1, attendance: 98, createdAt: new Date().toISOString() },
    { _id: genId(), name: 'Kavitha Chelimi', role: 'Senior Photo Editor', leaveDays: 3, attendance: 92, createdAt: new Date().toISOString() }
  ]);
  if (readDB('blogs').length === 0) writeDB('blogs', [
    { _id: genId(), title: 'How to Prepare for Your Pre-Wedding Photo Shoot', slug: 'prepare-pre-wedding', category: 'Wedding', content: 'Pre-wedding shoots are a beautiful way for couples to express their love. Here are 5 quick tips to prepare: dress comfortably, choose an inspiring location, plan around golden hour lighting, practice candid interactions, and coordinate colors with your partner.', author: 'Luminos Editorial', createdAt: new Date().toISOString() },
    { _id: genId(), title: 'Ultimate Guide to Event Lighting Design', slug: 'event-lighting', category: 'Technique', content: 'Lighting is everything in photography. In this guide, we dive into key light, fill light, rim light setup, off-camera speedlights, and editing techniques in Lightroom to make your event portraits pop.', author: 'Harsha Reddy', createdAt: new Date().toISOString() }
  ]);
  if (readDB('affiliates').length === 0) writeDB('affiliates', []);
  if (readDB('contracts').length === 0) writeDB('contracts', []);
  if (readDB('giftcards').length === 0) writeDB('giftcards', [
    { _id: genId(), code: 'GIFT5000', balance: 5000, expiresAt: '2027-12-31', createdAt: new Date().toISOString() }
  ]);
};

// ─── Auth Middleware ────────────────────────────────────────────────────────────
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const users = readDB('users');
    const user = users.find(u => u._id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ message: 'Token invalid' }); }
};

// ─── Multer (local storage for demo) ──────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, genId() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readDB('users');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase());

    const loginAttempt = {
      _id: genId(),
      username: username || 'unknown',
      timestamp: new Date().toISOString(),
      status: 'failed',
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection?.remoteAddress || 'unknown'
    };

    if (!user || !(await bcrypt.compare(password, user.password))) {
      const history = readDB('loginHistory');
      history.unshift(loginAttempt);
      writeDB('loginHistory', history.slice(0, 100));
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    loginAttempt.status = 'success';
    const history = readDB('loginHistory');
    history.unshift(loginAttempt);
    writeDB('loginHistory', history.slice(0, 100));

    const role = user.role || 'admin';
    // 2FA OTP requirement is disabled for easy remote/multi-device access
    const token = jwt.sign({ id: user._id, username: user.username, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, role });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/auth/verify', protect, (req, res) => res.json({ valid: true, user: req.user }));

// ─── ADMIN PROFILE & CREDENTIAL ROUTES ────────────────────────────────────────

// GET /api/admin/profile — return current admin username
app.get('/api/admin/profile', protect, (req, res) => {
  try {
    const users = readDB('users');
    const user = users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ message: 'Admin not found' });
    res.json({ username: user.username, createdAt: user.createdAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/update-credentials — change username and/or password
app.put('/api/admin/update-credentials', protect, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword)
      return res.status(400).json({ message: 'Current password is required to make changes.' });

    const users = readDB('users');
    const idx = users.findIndex(u => u._id === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'Admin account not found.' });

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, users[idx].password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });

    // Check new username not taken by another account
    if (newUsername && newUsername !== users[idx].username) {
      const taken = users.find(u => u.username === newUsername && u._id !== users[idx]._id);
      if (taken) return res.status(409).json({ message: 'That username is already taken.' });
      users[idx].username = newUsername.trim();
    }

    // Hash and update new password
    if (newPassword) {
      const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+])[A-Za-z\d@$!%*?&#^()_+]{8,}$/;
      if (!strengthRegex.test(newPassword))
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
        });
      users[idx].password = await bcrypt.hash(newPassword, 12);
    }

    users[idx].updatedAt = new Date().toISOString();
    writeDB('users', users);

    // Issue a fresh JWT with the updated username
    const token = jwt.sign({ id: users[idx]._id, username: users[idx].username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Credentials updated successfully.', username: users[idx].username, token });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/reset-password — emergency reset via ADMIN_RESET_SECRET env var
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { resetSecret, newPassword } = req.body;
    const secret = process.env.ADMIN_RESET_SECRET || 'luminos-reset-2024';
    if (resetSecret !== secret)
      return res.status(403).json({ message: 'Invalid reset secret.' });
    if (!newPassword)
      return res.status(400).json({ message: 'newPassword is required.' });
    const users = readDB('users');
    if (users.length === 0) return res.status(404).json({ message: 'No admin user found.' });
    users[0].password = await bcrypt.hash(newPassword, 12);
    users[0].updatedAt = new Date().toISOString();
    writeDB('users', users);
    res.json({ message: `Password reset for user "${users[0].username}". Please log in with your new password.` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/login-history — fetch admin login history
app.get('/api/admin/login-history', protect, (req, res) => {
  try {
    res.json(readDB('loginHistory'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/subscribers — subscribe to newsletter (public)
app.post('/api/subscribers', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }
    const subscribers = readDB('subscribers');
    if (subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: 'You are already subscribed!' });
    }
    const newSub = { _id: genId(), email: email.toLowerCase(), timestamp: new Date().toISOString() };
    subscribers.unshift(newSub);
    writeDB('subscribers', subscribers);
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/subscribers — list newsletter subscribers (admin)
app.get('/api/admin/subscribers', protect, (req, res) => {
  try {
    res.json(readDB('subscribers'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/leads — submit AI Chatbot lead (public)
app.post('/api/leads', (req, res) => {
  try {
    const { name, email, phone, packageInquiry } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({ message: 'Name and at least one contact method (email or phone) are required.' });
    }
    const leads = readDB('leads');
    const newLead = { _id: genId(), name, email, phone, packageInquiry, timestamp: new Date().toISOString() };
    leads.unshift(newLead);
    writeDB('leads', leads);
    res.status(201).json({ message: 'Lead recorded successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/leads — fetch AI Chatbot leads (admin)
app.get('/api/admin/leads', protect, (req, res) => {
  try {
    res.json(readDB('leads'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/backup — download a full backup of all JSON databases (admin)
app.get('/api/admin/backup', protect, (req, res) => {
  try {
    const backup = {
      users: readDB('users').map(({ password, ...u }) => u), // Exclude hashed passwords for safety
      services: readDB('services'),
      images: readDB('images'),
      bookings: readDB('bookings'),
      loginHistory: readDB('loginHistory'),
      leads: readDB('leads'),
      subscribers: readDB('subscribers'),
      backupDate: new Date().toISOString()
    };
    res.setHeader('Content-disposition', `attachment; filename=luminosbook_backup_${Date.now()}.json`);
    res.setHeader('Content-type', 'application/json');
    res.json(backup);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/bookings/booked-dates — fetch booked dates (public)
app.get('/api/bookings/booked-dates', (req, res) => {
  try {
    const bookings = readDB('bookings');
    const bookedDates = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .map(b => b.date); // Array of YYYY-MM-DD
    res.json([...new Set(bookedDates)]); // Unique dates
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PORTFOLIO ROUTES ──────────────────────────────────────────────────────────
app.get('/api/portfolio', (req, res) => {
  let images = readDB('images').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.category && req.query.category !== 'all')
    images = images.filter(i => i.category === req.query.category);
  res.json(images);
});

app.post('/api/portfolio', protect, upload.single('image'), (req, res) => {
  try {
    const { title, category, featured } = req.body;
    const imageUrl = req.file
      ? `http://localhost:${PORT}/uploads/${req.file.filename}`
      : req.body.cloudinaryUrl || '';
    const newImg = { _id: genId(), title, category: category || 'other', cloudinaryUrl: imageUrl, publicId: req.file?.filename || genId(), featured: featured === 'true', createdAt: new Date().toISOString() };
    const images = readDB('images');
    images.unshift(newImg);
    writeDB('images', images);
    res.status(201).json(newImg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/portfolio/:id', protect, (req, res) => {
  const images = readDB('images');
  const img = images.find(i => i._id === req.params.id);
  if (!img) return res.status(404).json({ message: 'Not found' });
  // Delete local file if exists
  if (img.publicId && !img.publicId.startsWith('demo-')) {
    const fp = path.join(uploadsDir, img.publicId);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  writeDB('images', images.filter(i => i._id !== req.params.id));
  res.json({ message: 'Deleted' });
});

app.patch('/api/portfolio/:id/featured', protect, (req, res) => {
  const images = readDB('images');
  const idx = images.findIndex(i => i._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  images[idx].featured = !images[idx].featured;
  writeDB('images', images);
  res.json(images[idx]);
});

// ─── SERVICES ROUTES ───────────────────────────────────────────────────────────
app.get('/api/services', (req, res) => {
  res.json(readDB('services').sort((a, b) => a.price - b.price));
});

app.get('/api/services/:id', (req, res) => {
  const s = readDB('services').find(s => s._id === req.params.id);
  if (!s) return res.status(404).json({ message: 'Not found' });
  res.json(s);
});

app.post('/api/services', protect, (req, res) => {
  const newS = { _id: genId(), ...req.body, createdAt: new Date().toISOString() };
  const services = readDB('services');
  services.push(newS);
  writeDB('services', services);
  res.status(201).json(newS);
});

app.put('/api/services/:id', protect, (req, res) => {
  const services = readDB('services');
  const idx = services.findIndex(s => s._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  services[idx] = { ...services[idx], ...req.body, _id: req.params.id };
  writeDB('services', services);
  res.json(services[idx]);
});

app.delete('/api/services/:id', protect, (req, res) => {
  const services = readDB('services');
  if (!services.find(s => s._id === req.params.id)) return res.status(404).json({ message: 'Not found' });
  writeDB('services', services.filter(s => s._id !== req.params.id));
  res.json({ message: 'Deleted' });
});

// ─── BOOKINGS ROUTES ───────────────────────────────────────────────────────────
const genRef = () => 'LB-' + Date.now().toString(36).toUpperCase();

app.get('/api/bookings/stats', protect, (req, res) => {
  const bookings = readDB('bookings');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  res.json({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: confirmed.length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: confirmed.reduce((s, b) => s + (b.totalAmount || 0), 0)
  });
});

app.get('/api/bookings', protect, (req, res) => {
  let bookings = readDB('bookings').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.status) bookings = bookings.filter(b => b.status === req.query.status);
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  try {
    const newBooking = {
      _id: genId(),
      ...req.body,
      status: 'pending',
      bookingReference: genRef(),
      createdAt: new Date().toISOString()
    };
    const bookings = readDB('bookings');
    bookings.unshift(newBooking);
    writeDB('bookings', bookings);

    // Try send email (silently fail if not configured)
    try {
      const nodemailer = require('nodemailer');
      if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
        const servicesList = (newBooking.services || []).map(s => `• ${s.name} — ₹${(s.price||0).toLocaleString('en-IN')}`).join('\n');
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: newBooking.email,
          subject: `Booking Confirmed — Ref: ${newBooking.bookingReference} | Luminos Studio`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#f5f0e8;padding:32px;border-radius:12px;"><h1 style="color:#c9a84c;">Luminos Studio</h1><h2>Booking Received!</h2><p>Dear <strong>${newBooking.customerName}</strong>,</p><p>Thank you! Your booking reference is <strong style="color:#c9a84c;">${newBooking.bookingReference}</strong>.</p><p>Total: <strong>₹${(newBooking.totalAmount||0).toLocaleString('en-IN')}</strong></p><p>We'll contact you within 24 hours.</p></div>`
        }).catch(() => {});
      }
    } catch {}

    res.status(201).json({ message: 'Booking submitted successfully', booking: newBooking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/bookings/:id/status', protect, (req, res) => {
  const bookings = readDB('bookings');
  const idx = bookings.findIndex(b => b._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  bookings[idx].status = req.body.status;
  writeDB('bookings', bookings);
  res.json(bookings[idx]);
});

app.delete('/api/bookings/:id', protect, (req, res) => {
  const bookings = readDB('bookings');
  if (!bookings.find(b => b._id === req.params.id)) return res.status(404).json({ message: 'Not found' });
  writeDB('bookings', bookings.filter(b => b._id !== req.params.id));
  res.json({ message: 'Deleted' });
});

// ─── OTP 2FA VERIFY ───────────────────────────────────────────────────────────
app.post('/api/auth/verify-2fa', (req, res) => {
  try {
    const { username, code } = req.body;
    if (!username || !code) return res.status(400).json({ message: 'Username and Code are required.' });
    const record = tempOTPs[username];
    if (!record || record.otp !== code) {
      return res.status(401).json({ message: 'Invalid 2FA verification code.' });
    }
    delete tempOTPs[username];
    const token = jwt.sign({ id: record.user.id, username: record.user.username, role: record.user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: record.user.username, role: record.user.role });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── CUSTOMER REGISTRATION ─────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, phone, fullName } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password, and email are required.' });
    }
    const users = readDB('users');
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: 'Username or Email is already registered.' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const newUser = {
      _id: genId(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      fullName: fullName?.trim() || username,
      password: hashed,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeDB('users', users);
    res.status(201).json({ message: 'Customer account registered successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── EXPENSE TRACKER ───────────────────────────────────────────────────────────
app.get('/api/admin/expenses', protect, (req, res) => {
  res.json(readDB('expenses'));
});

app.post('/api/admin/expenses', protect, (req, res) => {
  try {
    const expenses = readDB('expenses');
    const newExp = { _id: genId(), ...req.body, createdAt: new Date().toISOString() };
    expenses.unshift(newExp);
    writeDB('expenses', expenses);
    res.status(201).json(newExp);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/expenses/:id', protect, (req, res) => {
  try {
    const expenses = readDB('expenses');
    writeDB('expenses', expenses.filter(e => e._id !== req.params.id));
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── EMPLOYEE & ATTENDANCE ─────────────────────────────────────────────────────
app.get('/api/admin/employees', protect, (req, res) => {
  res.json(readDB('employees'));
});

app.post('/api/admin/employees', protect, (req, res) => {
  try {
    const employees = readDB('employees');
    const newEmp = { _id: genId(), ...req.body, createdAt: new Date().toISOString() };
    employees.push(newEmp);
    writeDB('employees', employees);
    res.status(201).json(newEmp);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/employees/:id', protect, (req, res) => {
  try {
    const employees = readDB('employees');
    writeDB('employees', employees.filter(e => e._id !== req.params.id));
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── BLOGS ─────────────────────────────────────────────────────────────────────
app.get('/api/blogs', (req, res) => {
  res.json(readDB('blogs'));
});

app.post('/api/blogs', protect, (req, res) => {
  try {
    const blogs = readDB('blogs');
    const newBlog = { _id: genId(), ...req.body, createdAt: new Date().toISOString() };
    blogs.unshift(newBlog);
    writeDB('blogs', blogs);
    res.status(201).json(newBlog);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/blogs/:id', protect, (req, res) => {
  try {
    const blogs = readDB('blogs');
    writeDB('blogs', blogs.filter(b => b._id !== req.params.id));
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DIGITAL CONTRACTS ─────────────────────────────────────────────────────────
app.get('/api/contracts', protect, (req, res) => {
  try {
    const email = req.query.email;
    const contracts = readDB('contracts');
    if (email) {
      res.json(contracts.filter(c => c.customerEmail.toLowerCase() === email.toLowerCase()));
    } else {
      res.json(contracts);
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/contracts/sign', protect, (req, res) => {
  try {
    const { bookingId, customerEmail, signatureData } = req.body;
    const contracts = readDB('contracts');
    const idx = contracts.findIndex(c => c.bookingId === bookingId);
    const record = {
      _id: idx !== -1 ? contracts[idx]._id : genId(),
      bookingId,
      customerEmail: customerEmail.toLowerCase(),
      signed: true,
      signatureData,
      signedAt: new Date().toISOString()
    };
    if (idx !== -1) {
      contracts[idx] = record;
    } else {
      contracts.push(record);
    }
    writeDB('contracts', contracts);
    res.json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GIFT CARDS ────────────────────────────────────────────────────────────────
app.get('/api/giftcards/:code', (req, res) => {
  try {
    const cards = readDB('giftcards');
    const card = cards.find(c => c.code.toUpperCase() === req.params.code.toUpperCase());
    if (!card) return res.status(404).json({ message: 'Gift card not found.' });
    res.json(card);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/giftcards', (req, res) => {
  try {
    const { code, balance, expiresAt } = req.body;
    const cards = readDB('giftcards');
    const newCard = { _id: genId(), code: code.toUpperCase(), balance: parseFloat(balance), expiresAt, createdAt: new Date().toISOString() };
    cards.unshift(newCard);
    writeDB('giftcards', cards);
    res.status(201).json(newCard);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── AFFILIATES ────────────────────────────────────────────────────────────────
app.get('/api/affiliates', protect, (req, res) => {
  res.json(readDB('affiliates'));
});

app.post('/api/affiliates/register', (req, res) => {
  try {
    const { email, code } = req.body;
    const list = readDB('affiliates');
    if (list.find(a => a.email.toLowerCase() === email.toLowerCase() || a.code.toUpperCase() === code.toUpperCase())) {
      return res.status(409).json({ message: 'Email or Promo Code already registered.' });
    }
    const newAff = { _id: genId(), email: email.toLowerCase(), code: code.toUpperCase(), earnings: 0, createdAt: new Date().toISOString() };
    list.unshift(newAff);
    writeDB('affiliates', list);
    res.status(201).json(newAff);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── AI CONTENT WRITER ─────────────────────────────────────────────────────────
app.post('/api/admin/ai-writer', protect, (req, res) => {
  try {
    const { prompt, type } = req.body;
    let result = '';
    if (type === 'instagram') {
      result = `📸 Capturing moments, creating memories. ✨\n\n"${prompt}"\n\nShot on Sony A7R V. #LuminosStudio #PhotographyStory #LuxuryWedding #PreWedding #CandidPortraits`;
    } else if (type === 'email') {
      result = `Dear Client,\n\nThank you for reaching out to Luminos Studio. Regarding your request: "${prompt}", we would be absolutely delighted to capture your special day.\n\nOur team specializes in premium, luxury cinematic storytelling, and we ensure every emotional detail is preserved. Let us know a convenient time for a quick phone consultation.\n\nWarm regards,\nLuminos Studio Team`;
    } else {
      result = `Luminos Studio presents a premium bespoke experience: "${prompt}". Handcrafted album configurations, premium 4K drone cinematography, and professional editing workflows ensure your photos look timeless.`;
    }
    res.json({ result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: pool ? 'neon-postgres' : 'json-file', timestamp: new Date().toISOString() }));

// ─── Start ─────────────────────────────────────────────────────────────────────
initDatabase()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 LuminosBook Server running!');
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   DB:  ${pool ? 'Neon PostgreSQL' : 'JSON file store'}`);
      console.log(`   Admin login: admin / Admin@123`);
      console.log('');
    });
  })
  .catch(err => {
    console.error('❌ Server failed to initialize:', err);
  });
