# BillQR — QR-Based Product Billing System

A full-stack web application for QR-code-driven product scanning, cart management, and billing.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Database:** MySQL (Hostinger compatible)
- **QR Codes:** `qrcode` npm package (server-side, instant)
- **PDF:** `jsPDF` + `jspdf-autotable` (client-side)

---

## Quick Start

### 1. Configure Database

Edit `server/.env` with your MySQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=billqr
JWT_SECRET=your_long_random_secret
BASE_URL=http://localhost:5173
```

### 2. Set Up Database

```bash
# Create tables
cd server && npm run schema

# Seed default admin + sample data
npm run seed
```

Default admin credentials: `admin@billqr.com` / `admin123`

### 3. Start Backend

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### 4. Start Frontend

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## Features

### Admin Panel (`/admin`)
- 📊 **Dashboard** — Live stats, recharts charts (orders/week, stock by category), low-stock alerts
- 📦 **Products** — Add/edit/delete, inline brand/category creation, image URL or file upload
- 🔲 **QR Codes** — Instant server-side generation, download PNG, print label
- 📈 **Stock Management** — Add/subtract/set stock with reason tracking
- 🛒 **Orders** — List with filters, order detail view, PDF invoice download

### Customer Panel (`/scan/:token`)
- 📷 Scan QR → view product details, price, stock status
- ➕ Quantity stepper with live subtotal preview
- 🛒 Cart persisted in `localStorage` across sessions
- 📋 Clean invoice with itemized bill and PDF download
- 💳 Dummy payment flow (structured for real gateway integration)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Admin login |
| GET | `/api/scan/:token` | Public | Product by QR token |
| POST | `/api/orders` | Public | Create order (with stock decrement) |
| GET | `/api/orders/:id` | Public | Order + items |
| POST | `/api/orders/:id/pay` | Public | Mark order paid |
| GET | `/api/products` | Admin | Product list |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| PATCH | `/api/products/:id/stock` | Admin | Update stock |
| GET | `/api/products/:id/qr` | Admin | Get QR data URL |
| GET | `/api/dashboard/summary` | Admin | Analytics summary |

---

## Folder Structure

```
BillQR/
├── server/
│   ├── server.js
│   ├── .env
│   └── src/
│       ├── controllers/  (auth, products, orders, scan, dashboard, brands, categories)
│       ├── middleware/   (auth.js — JWT)
│       ├── routes/       (all route files)
│       └── utils/        (db.js, qrGenerator.js, schema.sql, seed.js)
│
└── client/
    └── src/
        ├── admin/
        │   ├── pages/    (Login, Dashboard, Products, ProductForm, Orders, OrderDetail)
        │   └── components/ (AdminLayout, QRModal, StockModal)
        ├── customer/
        │   ├── pages/    (ScanLanding, Cart, Invoice, Payment)
        │   └── components/ (CartBar, InAppScanner)
        └── shared/       (api.js, cartStore.js, AuthContext.jsx, invoicePDF.js)
```

---

## Payment Integration (Future)

The dummy payment in `Payment.jsx` calls `POST /api/orders/:id/pay`.
To add Razorpay/Stripe, replace the `simulatePay()` function body with the real SDK call.
