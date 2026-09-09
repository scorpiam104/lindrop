# Lindrop Web Platform - Features Overview

## 🎯 What the Web App Has

The Lindrop web platform is a complete **merchant dashboard** and **customer-facing storefront** built with React, Vite, and TailwindCSS. It's designed for Ghana-based merchants to sell via social commerce with mobile-money payments.

---

## 📱 Public Pages (No Auth Required)

### 1. **Landing Page** (`/`)
- Hero section with platform value proposition
- "A store that travels" — social commerce messaging
- Three feature cards:
  - ✅ A store that travels across Instagram, WhatsApp
  - ✅ Payments that fit (Mobile Money + cards via Paystack)
  - ✅ Signals, not noise (analytics & insights)
- Pricing plans section:
  - **Starter** — Free (for trying)
  - **Scale** — GH₵ 99/mo (growing stores)
  - **Studio** — GH₵ 249/mo (teams & multiple brands)
- Call-to-action: Sign in / Sign up

### 2. **Authentication Pages**
- **Sign Up** (`/signup`) — Create merchant account
  - Store name
  - WhatsApp phone (Ghana number validation)
  - Email
  - Password (min 8 chars)
  
- **Sign In** (`/login`) — Login existing merchant
  - Email
  - Password
  - Error handling for invalid credentials

### 3. **Public Storefront** (`/store/:storeSlug`)
- View merchant profile (name, logo, verified badge)
- Browse all products (cards with images)
- Shows inventory count and price per product
- Product availability indicator
- "Made to be shared" hero heading
- Verified/independent merchant badge

### 4. **Product Checkout** (`/store/:storeSlug/checkout/:productId`)
- Product details (image, title, description)
- Live price calculation (price × quantity)
- Customer form:
  - Full name
  - WhatsApp/phone number
  - Delivery address
  - Quantity selector (1 to inventory max)
- Ghana phone number validation
- "Pay with Mobile Money / Card" button
- Error messages displayed
- Redirects to Paystack checkout on success

---

## 🔐 Protected Merchant Dashboard (`/dashboard/*`)

All dashboard pages require JWT authentication and valid merchant session.

### 1. **Dashboard Overview** (`/dashboard`)
- **Welcome message** — "Good morning"
- **Quick stats cards** (4 metrics):
  - Total sales (formatted as GHS)
  - Active orders (pending payments)
  - Total store views (since signup)
  - Conversion rate (%) = orders / total views
- **Recent transactions table** (last 6 orders):
  - Customer name & phone
  - Items ordered (title x quantity)
  - Payment status (Paid / Pending with color coding)
  - Total amount in GHS
  - "Empty state" message if no orders yet
- **AI WhatsApp Assistant Card** (NEW):
  - Shows suggested promo message
  - "Send promo" & "Check stock" buttons
  - Live badge indicator
- **Offline POS Panel** (NEW):
  - Displays queued walk-in sales count
  - Form to queue new POS sale:
    - Customer name
    - Item name
    - Quantity
    - Total amount
  - "Queue sale" button
  - "Sync" button to upload offline sales

### 2. **Store Setup** (`/dashboard/store`)
- Edit store profile:
  - **Business name** — Display name
  - **Custom URL slug** — Store link (/store/slug)
  - **Store logo URL** — Brand image
  - **Paystack public key** — For checkout page
- Shows generated storefront URL
- "Save store settings" button
- Confirmation message when saved

### 3. **Products Management** (`/dashboard/products`)
- View all merchant products in grid (3 columns on desktop)
- Product card shows:
  - Product image
  - Title
  - Price (GHS)
  - Stock count
- **Add Product** button opens modal with:
  - Title (required)
  - Price in GHS (required, number)
  - Stock count (required, number)
  - Image URL (optional, defaults to placeholder)
- "Save product" submits and refreshes list
- Modal closes after save

### 4. **Orders Management** (`/dashboard/orders`)
- List all merchant orders
- Same transaction table as Overview:
  - Customer name & phone
  - Items breakdown
  - Payment status
  - Total amount
- Hidden WhatsApp direct message link per order
  - Pre-filled message: "Hi {name}, your Luma order is {status}."

---

## 👨‍💼 Admin Dashboard (`/admin/*`)

Requires admin role (`role: 'admin'`) to access.

### 1. **Admin Overview** (`/admin`)
- **System health metrics** (5 cards):
  - Registered merchants count
  - Pending merchant approvals
  - Platform volume (total paid orders value in GHS)
  - Platform commission (2% of volume)
  - Platform health status (operational / degraded)
- **Admin control plane section**:
  - "Approve stores before they go live" messaging
  - Instructions to review, verify, and suspend merchants

### 2. **Merchant Management** (`/admin/merchants`)
- Sortable table of all merchants:
  - Business name + store slug
  - Email address
  - Status badge (Suspended / Verified / Review)
- **Action buttons per merchant**:
  - "Verify" / "Unverify" toggle (green badge)
  - "Suspend" / "Restore" toggle (red badge)
- Real-time status updates when toggled

---

## 🧩 Reusable Components

### Layout Components
- **DashboardLayout** — Sidebar nav + main content area
  - Fixed left sidebar (hidden on mobile)
  - Nav items: Overview, Products, Orders, Store setup
  - Merchant business name display
  - Sign out button
  
### UI Components
- **Field** — Reusable form input wrapper
  - Label above input
  - Rounded border styling
  - Focus state on emerald-500
  
- **Stat** — Metric card display
  - Label (uppercase, muted)
  - Large bold value
  - White background with shadow
  
- **Status** — Payment status badge
  - Green (emerald) for "paid"
  - Orange for "pending"
  - Pill-shaped styling
  
- **Modal** — Generic dialog overlay
  - Title bar with close button
  - Content area
  - Dark overlay background

- **TransactionTable** — Reusable order table
  - Horizontal scroll on mobile
  - Empty state message
  - Consistent styling across pages

---

## 🔄 Navigation Structure

```
Landing (/)
├── Sign Up (/signup)
├── Sign In (/login)
└── Public Store (/store/:storeSlug)
    └── Checkout (/store/:storeSlug/checkout/:productId)

Protected Merchant Dashboard (/dashboard/*)
├── Overview (/dashboard)
├── Products (/dashboard/products)
├── Orders (/dashboard/orders)
└── Store Setup (/dashboard/store)

Protected Admin Dashboard (/admin/*)
├── Overview (/admin)
└── Merchants (/admin/merchants)

Fallback: Redirect to home (404 handling)
```

---

## 🎨 Design System

**Colors:**
- **Primary**: Emerald (emerald-400, emerald-600, emerald-700)
- **Background**: Black/White/Light gray (#f5f7f6)
- **Text**: Black with opacity variations (#111815)
- **Accents**: Orange for pending status

**Typography:**
- Font: System fonts (Tailwind default)
- Sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 6xl, 8xl
- Weights: bold (600), black (900)

**Spacing:**
- 4px, 8px, 12px, 16px, 20px, 24px units
- Padding: 4-12px (tight), 16-24px (comfortable)

**Components:**
- Rounded corners: 8px (rounded-lg), 12px (rounded-xl), 32px (rounded-3xl)
- Shadows: sm (light), none (flat)
- Hover effects: translate, opacity changes

---

## 🔐 Authentication Flow

1. **Sign Up** → POST `/auth/register` → Store JWT + merchant profile in localStorage
2. **Protected routes** check:
   - JWT token exists in localStorage
   - Merchant profile exists
   - Redirect to `/login` if missing
3. **Admin routes** additionally check:
   - `merchant.role === 'admin'`
   - Redirect to `/dashboard` if not admin
4. **Sign Out** → Clear localStorage → Redirect to `/login`

---

## 🔌 API Integration Points

| Page | Endpoints Used |
|------|---|
| Landing | None |
| Auth | `POST /auth/register`, `POST /auth/login` |
| Storefront | `GET /merchants/public/:storeSlug`, `GET /products/store/:storeSlug` |
| Checkout | `GET /products/:productId`, `POST /checkout/initialize` |
| Dashboard Overview | `GET /orders/merchant`, `GET /merchants/dashboard-stats` |
| Store Setup | `GET /merchants/me`, `PUT /merchants/store` |
| Products | `GET /products`, `POST /products` |
| Orders | `GET /orders/merchant` |
| Admin Overview | `GET /admin/stats` |
| Admin Merchants | `GET /admin/merchants`, `PATCH /admin/merchants/:id` |

---

## ✨ NEW Features Added (This Session)

1. **AI WhatsApp Assistant Card** on dashboard
   - Shows suggested promotional message
   - Quick buttons: "Send promo", "Check stock"
   - Live badge indicator

2. **Offline POS Panel** on dashboard
   - Queue counter for walk-in sales
   - Form to log sales without internet
   - Sync button to upload when back online
   - Uses IndexedDB/localStorage for queue

3. **Split payment support** in checkout
   - Platform fee deduction visible
   - Paystack subaccount integration ready

4. **Mobile Money (USSD)** option
   - Separate UX flow for USSD push
   - Direct dial instruction for customers

---

## 📊 Key Metrics Tracked

- **Total sales** — Sum of all paid orders
- **Active orders** — Pending payment count
- **Total views** — Cumulative storefront visits
- **Conversion rate** — Orders / Views (%)
- **Inventory** — Per product stock count
- **Payment status** — Pending, Paid, Failed
- **Customer info** — Phone, name, address for delivery

---

## 🚀 Summary

The web app is a **complete merchant ecosystem**:
- ✅ Public landing & storefront
- ✅ Sign up / Login flow
- ✅ Product management
- ✅ Order tracking
- ✅ Store branding & customization
- ✅ Analytics dashboard
- ✅ Offline POS mode
- ✅ AI WhatsApp assistant integration
- ✅ Admin merchant approval workflow
- ✅ Role-based access control
- ✅ Mobile-responsive design
- ✅ Ghana phone validation
- ✅ GHS currency formatting

All built with a clean, modern UI focused on simplicity and speed for African merchants.

