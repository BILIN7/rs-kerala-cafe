# 🍽️ UK Food Ordering App

A full-stack food ordering web app inspired by [tastyoven.co.uk](https://tastyoven.co.uk), built for UK-based restaurants.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + MongoDB
- **Payments**: Stripe · PayPal · Square · GoCardless
- **Real-time**: Socket.io (order tracking)
- **Notifications**: Twilio (SMS) + SendGrid (Email)
- **Storage**: Cloudinary (menu images)

## Project Structure

```
food-ordering-app/
├── frontend/    # Next.js 14 App
└── backend/     # Express.js API
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run seed     # Seed sample menu data
npm run dev      # Starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your .env.local values
npm run dev      # Starts on http://localhost:3000
```

## Payment Gateway Setup

### Stripe (UK Cards)
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API Keys
3. Set up webhook: `stripe listen --forward-to localhost:5000/api/payments/stripe/webhook`

### PayPal
1. Create app at [developer.paypal.com](https://developer.paypal.com)
2. Get Client ID & Secret from sandbox

### Square
1. Create account at [developer.squareup.com](https://developer.squareup.com)
2. Get access token and location ID

### GoCardless (Bank Debit - UK)
1. Create account at [gocardless.com](https://gocardless.com)
2. Get API access token from Dashboard

## UK-Specific Features
- 💷 GBP currency throughout
- 📮 UK postcode validation
- 🕐 Europe/London timezone
- 🌿 Allergen labeling (UK food law)
- 🔒 GDPR-compliant user data handling
- 📋 VAT display on receipts

## Pages
| Page | URL |
|------|-----|
| Homepage | `/` |
| Menu | `/menu` |
| Checkout | `/checkout` |
| Order Confirmation | `/order/[id]/confirmation` |
| Order Tracking | `/order/[id]/track` |
| Login | `/login` |
| Register | `/register` |
| Admin Dashboard | `/admin` |

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/menu/categories` | Get categories |
| GET | `/api/menu/featured` | Get featured items |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/my` | Get my orders |
| GET | `/api/orders/:id/track` | Track order |
| POST | `/api/payments/stripe/create-intent` | Stripe payment |
| POST | `/api/payments/paypal/capture` | PayPal capture |
| POST | `/api/payments/square/create-payment` | Square payment |
| POST | `/api/payments/gocardless/create-mandate` | GoCardless bank debit |
| POST | `/api/coupons/validate` | Validate coupon |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/admin/orders` | Admin: get orders |
| PUT | `/api/admin/orders/:id/status` | Admin: update status |
| GET | `/api/admin/analytics` | Admin: analytics |
