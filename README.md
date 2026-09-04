# KaintLook — MERN E-commerce

Full-stack fashion storefront built across the roadmap: frontend UI, auth (JWT + roles),
backend REST APIs, MongoDB models, shopping flow, payments (Razorpay + COD), and an
admin dashboard.

## Project structure

```
kaintlook-auth/
├── backend/     Express + MongoDB API (auth, products, cart, wishlist, orders,
│                categories, reviews, coupons, addresses, payments, users, analytics)
└── frontend/    React + Vite storefront, checkout flow, and admin dashboard
```

## Setup

### Backend

```bash
cd kaintlook-auth/backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run dev
```

Runs on `http://localhost:5000` by default.

### Frontend

```bash
cd kaintlook-auth/frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev
```

Runs on `http://localhost:5173` by default.

### First admin user

Every user registers as `role: "user"` by default. To make yourself an admin, either:
- Update your user document directly in MongoDB (`role: "admin"`), or
- Register normally, then have an existing admin promote you from **Admin → Users**.

## What's included

| Roadmap item | Status |
|---|---|
| Frontend (navbar, hero, product grid, search, filters, cart/wishlist UI, dark/light mode) | ✅ `frontend/src/pages/Home.jsx` |
| Authentication (JWT, register/login, protected routes, admin role) | ✅ |
| Backend REST APIs | ✅ |
| MongoDB models (Users, Products, Categories, Orders, Reviews, Wishlist, Cart) | ✅ |
| Shopping flow (product details, cart, coupons, address, checkout, tracking) | ✅ |
| Payments (Razorpay covering UPI/cards/netbanking, COD, signature verification) | ✅ |
| Admin dashboard (products, inventory, orders, users, categories, analytics) | ✅ |

## Known follow-up

`Home.jsx` (the storefront landing page) currently displays **placeholder demo
products** defined in the file itself, not live data from the database. Every other
page (`ProductDetail`, `Cart`, `Checkout`, the admin `Products` page, etc.) is fully
wired to the real backend APIs. To finish connecting the homepage, replace its static
`NEW_ARRIVALS` / `TRENDING` arrays with a `fetch` to `GET /api/products`, and point
each product card's "Add to Cart" / link to the real product `_id` the same way
`ProductDetail.jsx` already does.

## Notes

- The in-chat file previewer can't render these pages standalone — they use
  `react-router-dom` and import each other, which the previewer doesn't support.
  This is expected; the code runs normally once `npm install` is done in a real project.
- You'll need your own Razorpay account for `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
