# LuminosBook — Photography Studio Portfolio & Booking Website

> Developed by: Chepuri Mokshagnya · Chelimi Kavitha · Veerupaka Harshavardhan Reddy

A full-stack web application for **Luminos Studio** — featuring a premium photography portfolio, online booking system, and a secure admin dashboard.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- (Optional) Cloudinary account for image uploads

### 1. Clone / Open the project
```
cd "UPDATED LUMINOUS STUDIO"
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Configure environment variables
Edit `server/.env` with your credentials:
```env
MONGO_URI=mongodb://localhost:27017/luminosbook
JWT_SECRET=your_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Seed the database (first time only)
```bash
npm run seed
```
This creates:
- Admin user: `admin` / `admin123`
- 6 sample photography services
- 12 sample portfolio images

### 5. Start the application
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 📁 Project Structure

```
UPDATED LUMINOUS STUDIO/
├── client/                  # React.js Frontend (Vite)
│   └── src/
│       ├── api/             # Axios client with JWT interceptor
│       ├── components/      # Navbar, Footer, Lightbox, ServiceCard, HeroSlider
│       ├── context/         # CartContext, AuthContext
│       └── pages/
│           ├── Home.jsx
│           ├── Portfolio.jsx
│           ├── Services.jsx
│           ├── Cart.jsx
│           ├── Booking.jsx
│           └── admin/
│               ├── AdminLogin.jsx
│               ├── AdminDashboard.jsx
│               ├── PortfolioManager.jsx
│               ├── ServiceManager.jsx
│               └── BookingManager.jsx
├── server/                  # Node.js + Express Backend
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   ├── middleware/          # JWT auth, Cloudinary upload
│   ├── server.js            # Express entry point
│   └── seed.js              # Database seeder
└── package.json             # Root workspace runner
```

---

## 🌐 Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Hero slider, featured portfolio, service highlights, CTA |
| Portfolio | `/portfolio` | Category filters, masonry grid, lightbox viewer |
| Services | `/services` | Service cards with pricing, add-to-cart |
| Cart | `/cart` | Selected services, running total, proceed to booking |
| Booking | `/booking` | 3-step form, confirmation, email notification |
| Admin Login | `/admin/login` | Secure JWT authentication |
| Admin Dashboard | `/admin` | Stats overview, quick actions |
| Portfolio Mgr | `/admin/portfolio` | Upload/delete images, toggle featured |
| Service Mgr | `/admin/services` | CRUD operations for services |
| Booking Mgr | `/admin/bookings` | View, confirm, cancel bookings |

---

## 🔑 Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> Change via MongoDB after seeding for production use.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Styling | Vanilla CSS (custom design system) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Image Storage | Cloudinary |
| Email | Nodemailer (Gmail) |
| Dev Tools | concurrently, nodemon |

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Gmail account
2. Create an App Password: Google Account → Security → App passwords
3. Add to `server/.env`: `EMAIL_USER` and `EMAIL_PASS`

---

## ☁️ Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the Dashboard
3. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env`
