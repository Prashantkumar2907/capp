# CAPP — Setup & Deployment Guide

Complete guide to set up and run the CAPP Restaurant Management application.

---

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+
- A **Supabase** account (free tier works)
- (Optional) **Razorpay** account for payment gateway

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** from Settings → API (keep secret!)

---

## 2. Run the Database Migration

1. Go to your Supabase project → **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire content and paste it into the SQL Editor
4. Click **Run** to execute

This creates all 13 tables, indexes, triggers, RLS policies, and helper functions.

---

## 3. Enable Realtime

1. Go to **Database → Replication** in your Supabase dashboard
2. Enable replication for these tables:
   - `orders`
   - `order_items`

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

---

## 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Where to find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (`http://localhost:3000` for dev) |

Optional (for Razorpay payments):

| Variable | Where to find |
|----------|---------------|
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same as above |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Webhooks |

---

## 5. Configure Supabase Auth

1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `http://localhost:3000` (or your production URL)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`

---

## 6. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. First-Time Setup

1. Visit the app and click **Get Started Free**
2. **Sign up** with your email and password
3. Confirm your email (check inbox or Supabase Auth → Users for auto-confirm)
4. You'll be redirected to **Onboarding** — create your organization
5. This automatically:
   - Creates your organization
   - Creates a default branch
   - Assigns you as **Owner**
6. You're now in the **Dashboard**!

---

## 8. Adding Menu Items

1. Go to **Dashboard → Menu**
2. Create **Categories** first (e.g., Starters, Main Course, Beverages)
3. Then add **Dishes** with name, price, category, and veg/non-veg flag
4. Dishes are automatically available at your default branch

---

## 9. Table QR Codes

1. Go to **Dashboard → Tables**
2. Tables are auto-created based on your branch's table count
3. Click any table to see its **QR Code**
4. Print/display the QR code at the physical table
5. Customers scan → browse menu → place order → pay via UPI

---

## 10. Staff Management

1. Go to **Dashboard → Staff**
2. Add staff members with name, email, and role
3. Available roles:
   - **Owner** — Full access
   - **Admin** — Nearly full access
   - **Manager** — Menu, orders, tables management
   - **Waiter** — Table view, order creation, mark served
   - **Kitchen** — Kitchen Display System (KDS)
   - **Cashier** — Payments and order management

---

## 11. Kitchen Display System

- Access via **Dashboard → Kitchen**
- Dark-themed interface for kitchen staff
- Shows active orders with per-item status
- Accept → Preparing → Ready workflow
- Audio alerts for new orders

---

## 12. Customer Ordering Flow

When a customer scans a table QR code:

1. They see the restaurant menu (no login required)
2. Browse by category, search dishes
3. Add items to cart with quantities
4. Review cart, add notes
5. Place order → UPI QR code displayed
6. Scan UPI QR to pay directly to restaurant's UPI VPA
7. View receipt and submit feedback

**URL pattern:** `/order/{branchId}/{tableNumber}`

---

## 13. UPI Payment Setup

For zero-fee UPI payments:

1. Go to **Dashboard → Settings**
2. Set your branch's **UPI VPA** (e.g., `yourshop@upi`)
3. When customers place orders, a UPI QR code is generated with:
   - Your UPI VPA as payee
   - Order amount pre-filled
   - Order number as reference

> **Note:** This is a direct UPI payment (zero transaction fees). For automatic payment verification, integrate Razorpay's UPI gateway.

---

## 14. Production Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

### Deploy to Netlify

```bash
npm run build
# Upload the .next folder or use Netlify CLI
```

### Key Production Steps

1. Update `NEXT_PUBLIC_APP_URL` to your production domain
2. Update Supabase Auth redirect URLs
3. Enable HTTPS
4. Set up Razorpay webhooks pointing to `https://yourdomain.com/api/v1/webhooks/razorpay`

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (sign-in, sign-up, etc.)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   └── dashboard/
│   │       ├── page.tsx     # Home (stats + charts)
│   │       ├── menu/        # Menu CRUD
│   │       ├── orders/      # Orders kanban
│   │       ├── tables/      # Table management + QR
│   │       ├── branches/    # Multi-branch management
│   │       ├── staff/       # Staff management
│   │       ├── analytics/   # Charts & insights
│   │       ├── payments/    # Payment history
│   │       ├── kitchen/     # Kitchen Display System
│   │       ├── waiter/      # Waiter interface
│   │       └── settings/    # Org & branch settings
│   ├── api/v1/webhooks/     # API routes
│   ├── auth/callback/       # OAuth callback
│   ├── onboarding/          # First-time setup
│   ├── order/               # Customer QR ordering
│   └── receipt/             # Order receipt + feedback
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific (sidebar)
│   └── providers.tsx        # App providers
├── hooks/                   # Custom hooks (auth, realtime)
├── lib/                     # Utils, Supabase clients, types
├── stores/                  # Zustand stores (cart)
└── middleware.ts            # Auth middleware
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| State | React Query + Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Animations | Framer Motion |
| Payments | UPI QR (zero-fee) + Razorpay |

---

## Troubleshooting

**Auth not working?**
- Check Supabase URL and Anon Key in `.env.local`
- Ensure redirect URLs are configured in Supabase Auth settings

**Tables not showing?**
- Make sure you ran the SQL migration
- Check RLS policies are applied

**Realtime not updating?**
- Enable replication for `orders` and `order_items` tables
- Check Supabase Dashboard → Database → Replication

**UPI QR not showing?**
- Set your UPI VPA in Dashboard → Settings → Current Branch

---

## License

MIT
