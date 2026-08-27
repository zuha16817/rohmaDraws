# Rohma Draws Studio (rohmadraws.com)

Official e-commerce portfolio and fine art acquisition platform for contemporary artist **Rohma Draws** ([rohmadraws.com](https://rohmadraws.com)).

Built with a high-performance modern tech stack featuring responsive design, dynamic inventory management, instant archival digital fulfillment, commission bookings, and secure international Stripe payments.

---

## ✨ Features

- **🎨 Immersive Fine Art Gallery**: High-resolution showcase of original works, limited edition prints, and digital master downloads.
- **💳 Multi-Currency & Stripe Live Checkout**: Seamless global checkout supporting Cards, Apple Pay, Google Pay, and localized bank rails.
- **📦 Smart Order Routing**:
  - **Physical Originals & Prints**: Dedicated studio preparation manifest and courier tracking workflow.
  - **Digital Downloads**: Instant automated delivery with high-resolution master file proxy and email delivery.
- **🛠️ Artist Admin Dashboard (`/admin`)**:
  - Real-time inventory control and 1-tap stock/availability toggling.
  - New artwork publishing with image upload and pricing controls.
  - Commission inquiry workflow management.
- **✉️ Automated Studio Notifications**: Custom email service for customer receipts and artist order alerts via `studio@rohmadraws.com`.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend API**: PHP 8.2 (RESTful Architecture, PDO MySQL)
- **Database**: MySQL (Relational schema for products, orders, inquiries, settings)
- **Payments**: Stripe API (Hosted Checkout & Webhooks)
- **Deployment**: High-speed Apache/LiteSpeed hosting with SSL

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/zuha16817/rohmaDraws.git
cd rohmaDraws
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your configuration:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_ADMIN_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

For database configuration, create `api/config/database.local.php`:
```php
<?php
return [
    'host' => 'localhost',
    'db_name' => 'your_database_name',
    'username' => 'your_database_user',
    'password' => 'your_database_password'
];
```

### 4. Development Server
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
```

---

## 🔒 Security & Privacy Notice
All production API keys, live payment tokens, artist credentials, and database passwords are kept strictly in gitignored environment configuration files.

---

## 📄 License
© 2026 Rohma Draws Studio. All artwork, imagery, and rights reserved.
