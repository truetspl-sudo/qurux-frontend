# QURUX MAKEOVER & ACADEMY — MASTER REFERENCE NOTE

> **Last Updated:** September 9, 2026
> **Version:** Production Live
> **Frontend:** https://www.qurux.in (Vercel)
> **Backend:** https://api.qurux.in (Railway)
> **Database:** MongoDB Atlas (qurux cluster)

---

## 1. PROJECT OVERVIEW

QURUX Makeover & Academy is a beauty services platform with:
- **Customer Website** — booking, shopping, courses, BOB wallet
- **Admin Panel** — manage everything (customers, bookings, payments, salons, etc.)
- **Partner Salon Dashboard** — vendors manage their assigned bookings
- **BOB (Bank of Beauty)** — savings wallet with benefit calculations

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Mongoose (MongoDB ODM) |
| Database | MongoDB Atlas (srv connection) |
| Frontend Deploy | Vercel (scope: qurux) |
| Backend Deploy | Railway (believable-perfection project) |
| Auth | JWT (jsonwebtoken), localStorage |
| Payments | Manual (admin verifies via WhatsApp) |

---

## 3. ENVIRONMENT VARIABLES

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.qurux.in
```

### Backend (Railway env)
```
MONGODB_URI=mongodb+srv://truetspl_db_user:MCxOddzsGeFK0oC7@qurux.yz0c3ld.mongodb.net/qurux?appName=qurux
JWT_SECRET=(auto-generated)
CORS_ORIGIN=https://www.qurux.in,https://quruxfrontend.vercel.app
PORT=8080
```

---

## 4. API ROUTES MAP

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | No | Register new customer (fullName, mobile, password) |
| POST | /api/auth/login | No | Login (userId + password) → token + user |
| PATCH | /api/auth/forgot-password | No | Request password reset |
| PATCH | /api/auth/reset-password | No | Set new password with reset token |

### Customers (Admin)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/admin/customers | Admin | List all customers |
| PATCH | /api/admin/customers/:id/approve | Admin | Approve + assign userId |
| PATCH | /api/admin/customers/:id/reject | Admin | Reject customer |

### Services
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/services | No | List all active services |
| GET | /api/services/all | Admin | List all (including inactive) |
| POST | /api/services | Admin | Create service |
| PATCH | /api/services/:id | Admin | Update service |
| DELETE | /api/services/:id | Admin | Delete service |

### Salons
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/salons | No | List approved salons (public) |
| GET | /api/salons/all | Admin | List all salons |
| GET | /api/salons/my-salon | Partner | Get own salon |
| POST | /api/salons/register | No | Register new salon (with photos, Google map, WhatsApp) |
| PATCH | /api/salons/:id | Admin | Update salon (approve/reject/edit) |
| PATCH | /api/salons/:id/approve | Admin | Approve salon + create partner account |

### Bookings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/bookings | User/Admin | List bookings (role-filtered) |
| POST | /api/bookings | Customer | Create booking |
| PATCH | /api/bookings/:id/status | Admin | Update status (CONFIRMED/CANCELLED) |
| PATCH | /api/bookings/:id/start | Partner | Start service (→ IN_PROGRESS + startedAt) |
| PATCH | /api/bookings/:id/partner-complete | Partner | Mark done (→ PARTNER_COMPLETED) |
| PATCH | /api/bookings/:id/close | Admin | Close + payment reconciliation + payout |
| PATCH | /api/bookings/:id/reopen | Admin | Reopen closed booking for edit |
| GET | /api/bookings/:id/invoice | User | Generate invoice data (JSON) |

### Orders (Shop)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/orders | User/Admin | List orders |
| POST | /api/orders | Customer | Create order |
| PATCH | /api/orders/:id/status | Admin | Update order status |

### Payments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/payments | Admin | List payment proofs |
| PATCH | /api/payments/:id/approve | Admin | Approve payment |
| PATCH | /api/payments/:id/reject | Admin | Reject payment |

### EMI
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/emi | User/Admin | List EMI plans (with populated customer) |
| POST | /api/emi | Customer | Create EMI plan |
| GET | /api/emi/:id | User | Get single plan details |
| POST | /api/emi/:id/pay | User | Submit flexible payment |
| PATCH | /api/emi/:planId/approve/:paymentId | Admin | Approve EMI payment |
| PATCH | /api/emi/:planId/reject/:paymentId | Admin | Reject EMI payment |

### Wallet (BOB)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/wallet | User | Get own wallet |
| GET | /api/wallet/all | Admin | List all wallets |
| POST | /api/wallet/deposit | User | Request deposit |
| POST | /api/wallet/use | User | Use wallet balance |
| POST | /api/wallet/promotional | Admin | Credit promotional balance |
| GET | /api/wallet/lookup/:customerId | Admin | Check customer balance |

### Payouts (Vendor)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/payouts | Admin | List all payouts |
| GET | /api/payouts/earnings/:salonId | Partner | Vendor earnings ledger |
| GET | /api/payouts/summary | Admin | Salon-wise aggregated stats |
| PATCH | /api/payouts/:id/share | Admin | Set vendor net payout |
| PATCH | /api/payouts/:id/pay | Admin | Mark payout as paid |
| POST | /api/payouts/settle/:month | Admin | Monthly settlement |

### Ratings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/ratings | Public | List ratings |
| POST | /api/ratings | Customer | Submit rating |
| DELETE | /api/ratings/:id | Admin | Delete rating |

---

## 5. DATABASE MODELS

### User
```
userId, fullName, email, mobile, password, role (CUSTOMER/ADMIN/SALON_OWNER),
status (PENDING/APPROVED/REJECTED), dob, address, avatar,
bobAccountNumber, bobStatus
```

### Booking
```
bookingId, customerId, serviceName, serviceCategory, serviceLocation (HOME/SALON),
address, salonId, salonName, date, timeSlot, customerName, customerPhone, customerEmail,
amount (listed), listedPrice, finalPrice, paymentMethod (FULL/EMI/BOB/MIXED),
bobPaidAmount, cashAmount, emiAmount, paymentStatus (PENDING/PAID/PARTIAL),
paidVia (CASH/UPI/BOB/EMI), status (PENDING/CONFIRMED/IN_PROGRESS/PARTNER_COMPLETED/COMPLETED/CANCELLED),
startedAt, partnerCompletedAt, closedAt, adminRemarks, rating,
paymentCollectionMethod (COMPANY/VENDOR_DIRECT),
vendorDirectAmount, companyCollectedAmount,
gstSlab, basePrice, gstAmount, cgst, sgst,
platformCommission, vendorGrossPayout, vendorNetPayout,
walletTransactionId
```

### Salon
```
name, slug, type (UNISEX/WOMEN_ONLY/WOMENS/MENS/HOME_STUDIO/MAKEUP_STUDIO),
address, city, pincode, gstNumber, image,
frontImage, interiorImages[], workImages[], certificates[],
googleMapUrl, whatsappLink,
ownerName, ownerEmail, ownerMobile, alternatePhone,
yearsOfExperience, teamSize, servicesOffered[], about,
userId, servicesIds[], status (PENDING/APPROVED/REJECTED),
rating: { stars, count }
```

### Service
```
name, slug, category, subcategory, price, duration, description,
image, includes [], isActive
```

### Payout
```
salonId, salonName, bookingId, bookingCode, customerId, customerName, serviceName,
listedPrice, finalPrice, paymentCollectionMethod, companyCollectedAmount, vendorDirectAmount,
bobWalletUsed, emiPending, gstSlab, basePrice, gstAmount, cgst, sgst,
commissionRate (10%), platformCommission, vendorGrossPayout, vendorNetPayout,
status (PENDING/SETTLED/PAID/PARTIAL), paidAmount, paidAt, paidVia, transactionRef,
settledMonth, adminRemarks, closedAt
```

### EMIPlan
```
customerId (populated: fullName, mobile, email, userId),
purchaseType (SERVICE/PRODUCT/COURSE), purchaseName,
bookingId, orderId, totalAmount, bobPaidAmount, paidAmount, pendingAmount,
paymentHistory [{ amount, transactionId, screenshotUrl, status, submittedAt, approvedAt }],
status (ACTIVE/COMPLETED/CANCELLED),
tenureDays (180), lateFeePerDay (10), totalLateFee, lastLateFeeCalc
```

### Wallet
```
customerId, accountNumber,
deposits [{ originalAmount, usedAmount, depositDate, status, benefitEnabled, reference, screenshotUrl }],
usageHistory [{ amount, description, date, balanceAfter }],
promotionalBalance, promotionalHistory []
```

### Product, Course, Order, Payment, Rating, WhatsAppDispatch, PasswordReset

---

## 6. BUSINESS RULES

### Booking Flow
```
Customer Book → Admin Approve (assign vendor) → Partner Start Service (IN_PROGRESS) →
Partner Complete (PARTNER_COMPLETED) → Admin Verify + Payment Update + Close (COMPLETED) →
Customer Rating
```

### Payment Rules
1. **NO payment at booking time** — only payment mode is saved
2. Payment collected after service, admin closes with payment details
3. **Full Payment** — paid = final price, due = 0
4. **EMI** — min 25% down payment, rest becomes EMI balance (flexible, no fixed date)
5. **BOB Wallet** — deducts from customer's BOB balance (FIFO)
6. Admin can never give rating — only customer rates
7. **Edit always available** — admin can reopen closed bookings

### GST Rules (Tax-Inclusive)
- Final Price is **tax-inclusive** (GST already included)
- Base = Final Price / (1 + GST Rate / 100)
- GST = Final Price - Base
- CGST = GST / 2, SGST = GST / 2
- Slabs: 0%, 5%, 12%, 18%, 28%

### Vendor Payout Formula
```
Vendor Gross Payout = Final Price - Platform Commission (10%)
Net Payout Due = Gross - Direct Payment to Vendor
```

### EMI Late Fee
- Tenure: 6 months (180 days) — 0% interest
- After 180 days: ₹10/day automated penalty

### BOB Wallet Benefit
- 30 days after deposit: 20% benefit
- Each additional month: +10% benefit
- Maximum: 100% extra
- FIFO deduction order

---

## 7. ADMIN PANEL PAGES

| Page | Route | Key Features |
|------|-------|-------------|
| Dashboard | /admin | Stats overview |
| Customers | /admin/customers | Approve/reject, search, status filter |
| Password Resets | /admin/password-resets | Approve password changes |
| Salons/Vendors | /admin/salons | Approve/reject, salon type, manage, service assignment |
| Services | /admin/services | CRUD, category filter, edit button |
| Bookings | /admin/bookings | View all, status filter, customer details modal, View/Edit buttons |
| Products | /admin/products | CRUD, category filter, Coming Soon banner |
| Courses | /admin/courses | CRUD, edit button |
| Orders | /admin/orders | Status filter, view details |
| Payments | /admin/payments | Type + Status filter, approve/reject |
| EMI | /admin/emi | Status filter (incl. Overdue), customer details, WhatsApp reminder |
| BOB Wallet | /admin/bob | Excel-style customer table, search, wallet overview, credit |
| Ratings | /admin/ratings | Star filter, delete reviews |
| Service Closures | /admin/closures | **Main payment page** — multi-filter, GST slab, vendor payout, WhatsApp invoice |
| Data Sheet | /admin/datasheet | Excel-style monthly reports (bookings, orders, EMI, wallet, services) |
| Content | /admin/content | Website content management |
| Settings | /admin/settings | Admin settings |

---

## 8. PARTNER SALON DASHBOARD

Route: /salon/dashboard

### Features
- Login with userId + password (same auth as customer)
- View assigned bookings (only own salon — isolation rule)
- **Start Service** button (PENDING/CONFIRMED → IN_PROGRESS + startedAt)
- **Complete Service** button (IN_PROGRESS → PARTNER_COMPLETED)
- WhatsApp-to-Customer button (IN_PROGRESS + CONFIRMED)
- WhatsApp-to-Admin button (PARTNER_COMPLETED + COMPLETED)
- Cannot see customer's BOB wallet balance

---

## 9. CUSTOMER FACING PAGES

| Page | Route | Description |
|------|-------|-------------|
| Home | / | Hero slider (clickable → /book), feature cards, why choose, download app icon |
| Book | /book | Service selection with category filter + Browse All Services |
| Booking | /booking | Salon picker, payment mode, time slot (10AM-9:30PM), submit |
| Shop | /shop | Products (Coming Soon banner — no products shown) |
| Academy | /academy | Courses listing |
| Salons | /salons | Partner salon list with ratings, service count |
| Salon Detail | /salons/[slug] | Salon info, images, services, ratings, book now |
| BOB | /bob | Wallet dashboard, deposit (UPI barcode), savings |
| BOB Payment | /bob/payment | Deposit with transaction ID + screenshot |
| Account | /account | Login / Register / Forgot Password |
| Dashboard | /account/dashboard | Customer bookings, EMI, rating |
| Invoice | /invoice/[id] | Printable invoice (Print/Save as PDF) |

---

## 10. DESIGN SYSTEM

### Colors
- **Primary Pink:** #ec4899 (pink-600)
- **Rose Gold:** gradient from pink-500 to rose-600
- **Background:** pink-50 via white to slate-100
- **Success:** green-600
- **Warning:** orange-600
- **Error:** red-600

### Typography
- **Logo:** QURUX script (Great Vibes) — pink gradient, cropped PNG
- **Headings:** System font, font-black
- **Body:** System font, text-sm/text-base

### Components
- Rounded cards: rounded-2xl, rounded-3xl
- Buttons: rounded-full, pink-600 bg
- Badges: rounded-full, colored bg + text
- Filter buttons: pink/green/purple filled when active
- Admin filter bars: consistent button-style across all pages

---

## 11. DEPLOYMENT

### Frontend (Vercel)
```bash
cd quruxfrontend
npx vercel --prod --yes --scope qurux
```
- Auto-deploys on git push (if connected)
- Manual: `npx vercel --prod --yes --scope qurux`
- Domain: www.qurux.in

### Backend (Railway)
```bash
cd quruxbacken+database
git push origin master
```
- Auto-deploys on git push
- URL: qurux-backend-production.up.railway.app
- Custom domain: api.qurux.in

### Database (MongoDB Atlas)
- Cluster: qurux.yz0c3ld.mongodb.net
- DB: qurux
- User: truetspl_db_user

---

## 12. CRITICAL RULES (NEVER BREAK)

1. **Admin manual approval** — everything goes through admin
2. **No payment at booking** — payment after service only
3. **Customer-only ratings** — admin never rates
4. **Partner isolation** — salon sees only own bookings
5. **GST is tax-inclusive** — final price includes GST
6. **EMI min 25%** — must pay 25% upfront for EMI
7. **FIFO wallet deduction** — oldest deposits used first
8. **finalPrice ≤ 2x listed** — sanity check on close
9. **Edit always available** — admin can reopen closed bookings
10. **Manual WhatsApp** — no auto WhatsApp, all manual
11. **No partial payment mode** — balance auto-converts to EMI

---

## 13. KNOWN ISSUES / TODO

- [ ] Invoice PDF generation (currently JSON endpoint + printable HTML page)
- [ ] Auto late fee calculation cron job (₹10/day after 180 days)
- [ ] Email invoice dispatch
- [ ] Product shop is "Coming Soon" — no real products yet
- [ ] Partner salon dashboard needs earnings/ledger page
- [ ] Admin payout management page (routes exist, no UI page)
- [ ] Salon registration photos — currently base64 in form (need cloud upload for production)
- [ ] WhatsApp Dispatch page removed — consider if needed again

---

## 14. QUICK EDIT REFERENCE

### To add a new admin page:
1. Create `app/admin/[name]/page.tsx`
2. Add to `components/admin/AdminLayout.tsx` sidebar
3. Add API route in backend if needed

### To add a new API route:
1. Create `routes/[name].js`
2. Mount in `server.js`: `app.use("/api/[name]", require("./routes/[name]"))`
3. Add frontend API calls in `lib/api.ts`

### To modify booking flow:
1. Check `routes/bookings.js` — all booking routes
2. Check `app/admin/closures/page.tsx` — admin closure UI
3. Check `app/salon/dashboard/page.tsx` — partner dashboard

### To modify payment logic:
1. `routes/bookings.js` — close route (line ~250)
2. `utils/walletUse.js` — wallet FIFO deduction
3. `utils/emiSync.js` — EMI plan creation

### To modify salon registration:
1. `app/salon/register/page.tsx` — registration form
2. `models/Salon.js` — salon schema
3. `routes/salons.js` — backend routes

---

*This document is the single source of truth for the QURUX project. Update it whenever major changes are made.*
