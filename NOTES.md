# ClubFlow — Project Notes

One project, three folders: `backend/`, `mobile/`, `web/`.

---

## Architecture Overview

| Layer | Stack |
|-------|-------|
| **Backend** | Node.js + Express 5 + TypeScript + Prisma ORM + PostgreSQL |
| **Mobile** | React Native + Expo SDK 56 + Expo Router + TanStack Query + Zustand |
| **Web** | React + Vite + React Router + TanStack Query (PWA, installable) |
| **Payments** | Razorpay (orders + webhook HMAC-SHA256 verification) |
| **File Storage** | Cloudinary (avatars, receipts, event covers) + Supabase Storage (avatars, mobile) |
| **Push Notifications** | Expo Server SDK (backend) + expo-notifications (mocked on Expo Go) |
| **Auth** | JWT access + refresh tokens, RefreshToken model with `revokedAt` rotation |
| **Cron** | node-cron — monthly dues generation, daily payment reminders, hourly event reminders |

---

## Features Added

### Authentication
- JWT access + refresh token pair on login/register
- Refresh token rotation: each use issues a new token and revokes the old one (`revokedAt`)
- Queue-based 401 interceptor on both mobile and web: concurrent requests that hit 401 wait in a queue while one token refresh runs; once done, all queued requests replay with the new token
- Logout revokes the refresh token in the DB

### Club Management
- Multi-tenant: every user belongs to exactly one club via `ClubMembership`
- Club settings: update name, description, logo URL
- Currency locked to INR across all monetary fields
- Soft-delete pattern (`deletedAt` + `isActive: false`) throughout

### Member Management
- Create / list / update / soft-delete members (admin)
- Members can update their own profile (name, phone, email, avatar, DOB, blood group, emergency contact)
- Profile completion percentage (DOB + blood group + emergency contact = 100 %)
- Avatar upload via Supabase Storage (mobile) / Cloudinary (backend)
- Old avatar deleted from Cloudinary when replaced
- Phone numbers normalized to E.164 format on save (`+91XXXXXXXXXX` for 10-digit Indian numbers)

### Dues & Payments
- **DuesPlan**: admin creates plans with per-period (month/year) amounts; generates `Payment` rows for all active members
- Dues generated on the 1st of each month by cron; missed-month recovery runs on server startup
- Payment statuses: `PENDING → PAID / OVERDUE`
- Members can pay via Razorpay (native checkout on mobile, web redirect)
- Admin can mark any payment as paid in cash (offline)
- Razorpay webhook: HMAC-SHA256 verification against raw body
- Paise conversion uses `Decimal.mul(100).toFixed(0)` to avoid JS floating-point errors
- `ENABLE_MOCK_PAY` env guard prevents mock payment endpoint in production

### Special Collections
- One-off charges (festivals, events, etc.) billed to all active members immediately
- Auto-assigns open collections to newly added members
- Admin can archive (soft-delete) a collection; payment records are kept
- Collection stats (paid count, pending count, collected amount, pending amount) computed from existing `Payment` rows — no extra DB call

### Expenses
- Admin creates expenses with category (predefined list), amount, description, optional receipt
- Receipt uploaded to Cloudinary; old receipt deleted when expense is soft-deleted

### Events
- Create / list / detail / edit / soft-delete events
- RSVP (Going / Maybe / Not Going) per member
- Default mobile list filter: upcoming events
- Admin can edit an event from the detail screen (edit button → prefilled form)
- Event cover image deleted from Cloudinary on delete
- Push notification sent to all members on event creation

### Announcements
- Admin creates, publishes, and deletes announcements
- Push notification + in-app notification sent to all members on publish
- Admin sees a delete button on each announcement card (mobile); confirmation dialog before delete

### Notifications
- In-app notification center (bell icon)
- Mark individual / all as read
- Push token registration on login; dead tokens (`DeviceNotRegistered`) cleaned up automatically

### Dashboard
- **Member dashboard**: current month due, recent payments, upcoming events
- **Admin dashboard**: balance card (total collection, expenses, available balance), member stats, recent payments, upcoming events
- "See All" navigation links wired up on mobile admin dashboard
- Negative balance shown with red gradient + warning on BalanceCard
- Profile completion nudge (web) dismissed state persisted in `sessionStorage`

### Cron Jobs
- `generate-dues` — 1st of every month, 08:00 IST: generates dues for all active clubs
- `payment-reminder` — daily 09:00 IST: notifies members with pending dues
- `event-reminder` — hourly: notifies members 24–25 h before event start
- Startup recovery: if server missed the 1st-of-month cron, it re-runs on boot

### Dev Tooling (Mobile)
- `scripts/update-ip.ps1` — updates `EXPO_PUBLIC_API_URL` in `.env` with current LAN IP automatically
- Razorpay and expo-notifications mocked at `src/lib/` for Expo Go compatibility

---

## 47 Problems & Solutions

### Auth

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 1 | Web/mobile 401 interceptor only retried one request; concurrent requests caused race conditions | ✅ Fixed | Upgraded to queue-based interceptor: `isRefreshing` flag + `failedQueue` array; all concurrent 401s wait, one refresh runs, queue drains |
| 2 | Web stored auth tokens in module-level variable — lost on page reload | ✅ Fixed | Moved to `localStorage` with `getItem`/`setItem` wrappers |
| 3 | No forgot-password / OTP reset flow | ⏳ Deferred | Large standalone feature; not yet implemented |
| 4 | Logout did not revoke the refresh token in the DB | ✅ Already done | `logoutService` calls `prisma.refreshToken.update({ data: { revokedAt: new Date() } })` |

### Club Settings

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 5 | Logo upload — no file size / type validation before upload | N/A | No logo upload UI exists in mobile or web yet; validate when the UI is built |
| 6 | Changing `monthlyFee` on the club model wouldn't affect existing pending payments | N/A | `monthlyFee` is not in `updateClubSchema`; per-period pricing is managed entirely via DuesPlans |
| 7 | `currency` field in `createSpecialCollectionSchema` accepted any 3-char string | ✅ Fixed | Changed to `z.literal('INR').optional()` |

### Members

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 8 | Soft-delete didn't set `isActive: false` | ✅ Already done | Service sets both `deletedAt: new Date()` and `isActive: false` in one update |
| 9 | Replacing an avatar left the old image orphaned in Cloudinary | ✅ Fixed | `extractCloudinaryPublicId()` helper; `cloudinary.uploader.destroy()` called fire-and-forget when `avatarUrl` changes |
| 10 | Phone numbers stored in inconsistent formats (raw digits, with spaces, etc.) | ✅ Fixed | `toE164()` transform in `members.schema.ts`: 10-digit → `+91XXXXXXXXXX`; `91XXXXXXXXXX` → `+91XXXXXXXXXX`; already `+` prefixed → kept |

### Profile

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 11 | Profile completion % recalculated on every access — potential performance issue | ✅ Not a problem | Pure synchronous function over already-loaded fields; no extra DB call needed |

### Payments — Razorpay

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 12 | `react-native-razorpay` is a native module that crashes Expo Go | ✅ By design | Mocked at `src/lib/razorpay-mock.ts`; real payments require `eas build --profile development` |
| 13 | `mockPayment` endpoint accessible in production | ✅ Fixed | `ENABLE_MOCK_PAY=true` env var required; throws `ValidationError` otherwise |
| 14 | Razorpay webhook IP allowlist not documented | ✅ Documented | Added to `AGENTS.md`: IPs `52.44.130.86/87`, `52.90.3.196/197`, `54.210.151.36/37`; verify at razorpay.com/docs before deploy |
| 15 | Paise conversion `Number(amount) * 100` loses precision for Decimal amounts | ✅ Fixed | Changed to `parseInt(payment.amount.mul(100).toFixed(0), 10)` |

### Dues Plans

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 16 | Creating a dues plan for past months silently generated back-dues with no warning | ✅ Already done | `hasPastMonths` computed in `CreateDuesPlanScreen`; yellow warning banner shown |
| 17 | Duplicate `DuesPlanPeriod` rows possible | ✅ Already done | Prisma schema has `@@unique([planId, month, year])` constraint |
| 18 | Deleting a dues plan had no warning about pending dues being cancelled | ✅ Already done | `handleDelete` in `DuesPlansScreen` shows Alert with pending count, paid count, and future-dues warning before confirming |

### Special Collections

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 19 | New members didn't get billed for already-open special collections | ✅ Fixed | `createMemberService` transaction queries open collections and creates `Payment` rows for each |
| 20 | No way to close/archive a special collection once created | ✅ Fixed | `DELETE /special-collections/:id` backend endpoint (soft-delete); archive icon button + confirm dialog in `SpecialCollectionDetailScreen` |
| 21 | Collection stats required a separate DB aggregation query | ✅ Not a problem | Stats computed from `payments` already joined in `listSpecialCollectionsService`; no extra query |

### Expenses

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 22 | Expense category was a free-text field — inconsistent data | ✅ Already done | `CATEGORIES` constant in `AddExpenseScreen` with icon picker; category stored as enum-like key |
| 23 | Deleting an expense left the receipt orphaned in Cloudinary | ✅ Fixed | `deleteExpenseService` fetches `receiptUrl` then calls `cloudinary.uploader.destroy()` after soft-delete |

### Finance / Balance

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 24 | No visual warning when available balance goes negative | ✅ Fixed | `BalanceCard` switches gradient to red and shows "Expenses exceed collections" when `availableBalance < 0` |

### Events

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 25 | No push notification when a new event was created | ✅ Already done | `createEventService` calls `sendPushNotifications` to all members |
| 26 | Mobile events list defaulted to showing all events | ✅ Already done | `EventsListScreen` initialises `filter = 'upcoming'` |
| 27 | Backend `updateEventService` existed but no mobile edit screen | ✅ Fixed | `CreateEventScreen` extended with optional `eventId` + `initialValues` props (edit mode); admin edit button added to `EventDetailScreen`; `EditEvent` screen added to `AdminNavigator` |
| 28 | Deleting an event left the cover image orphaned in Cloudinary | ✅ Fixed | `deleteEventService` fetches `coverImageUrl` then calls `cloudinary.uploader.destroy()` |

### Announcements

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 29 | No push notification when an announcement was published | ✅ Already done | `publishAnnouncementService` calls `notifyMembersOfAnnouncement` which sends push + in-app notifications |
| 30 | No way to delete announcements from mobile | ✅ Fixed | `deleteAnnouncementApi` added; `useDeleteAnnouncement` hook added; admin trash icon on each card with confirm dialog |
| 31 | Announcement body rendered as plain text — no markdown support | N/A | Needs `react-native-markdown-display` (mobile) and `react-markdown` (web) — library install required, deferred |

### Push Notifications

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 32 | `expo-notifications` crashes Expo Go at startup | ✅ By design | Mocked at `src/lib/notifications-mock.ts`; real push requires EAS build |
| 33 | Stale push tokens (`DeviceNotRegistered`) accumulated in the DB | ✅ Fixed | `expo-push.ts` collects dead tokens per batch and calls `prisma.pushToken.deleteMany` after all chunks send |
| 34 | No reminder notification before events | ✅ Fixed | `event-reminder.cron.ts` — hourly cron checks for events starting 24–25 h from now; sends in-app + push notifications |
| 35 | No "mark all notifications as read" action | ✅ Already done | `POST /notifications/read-all` endpoint exists |

### Dashboard

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 36 | Dashboard loaded as one large query — no parallel loading per section | N/A | Backend serves one combined endpoint; splitting requires new API endpoints. Current approach is acceptable |
| 37 | Admin dues generation calculated wrong totals on dashboard | ✅ Already done | Dashboard service uses correct Prisma aggregation |
| 38 | "See All" links on mobile admin dashboard were non-functional | ✅ Fixed | Wired to `navigation.navigate('Events')` and `navigation.navigate('Finance')` |
| 39 | Profile completion nudge (web) re-appeared on every render | ✅ Fixed | Replaced module-level variable with `sessionStorage.getItem/setItem` keyed to `'profileNudgeDismissed'` |

### File Uploads

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 40 | Avatar upload failure in `AvatarPicker` was silently swallowed | ✅ Fixed | Added `Toast.show({ type: 'error', ... })` in the catch block; local preview URI reset on failure |

### Cron / Reliability

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 41 | If the server was down on the 1st of the month, that month's dues were never generated | ✅ Fixed | `runDuesGenerationIfMissed()` called in `bootstrap()` on startup; checks if dues already exist before generating |
| 42 | Cron-in-same-process risk not documented | ✅ Documented | Added to `AGENTS.md`: horizontal scale will fire duplicate tasks; use dedicated worker, distributed lock (Redlock), or managed scheduler |
| 43 | Payment reminder cron logic incorrect | ✅ Already correct | Cron finds all `PENDING` payments with `dueDate <= today` and sends per-user summary notification |

### Dev / DevOps

| # | Problem | Status | Solution |
|---|---------|--------|---------|
| 44 | Manually updating `EXPO_PUBLIC_API_URL` every time LAN IP changes | ✅ Fixed | `mobile/scripts/update-ip.ps1` — run once, auto-detects WiFi IP and rewrites `.env` |
| 45 | Expo Go version mismatch with SDK 56 | ✅ Already documented | `AGENTS.md`: download from `expo.dev/go`, not the Play Store |
| 46 | `npx expo start --lan` throws `ERR_STREAM_PREMATURE_CLOSE` | ✅ Already documented | `AGENTS.md`: use plain `npx expo start` |
| 47 | CORS allowed all origins in production | ✅ Fixed | CORS middleware checks `env.ALLOWED_ORIGINS` in production; comment added warning about setting it before deploy |

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EXPO_ACCESS_TOKEN=...        # For sending push notifications
ALLOWED_ORIGINS=https://...  # Comma-separated, production only
ENABLE_MOCK_PAY=true         # Development only — never set in production
PORT=5000
NODE_ENV=development
```

### Mobile (`mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api/v1   # Update with scripts/update-ip.ps1
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Known Mocks (Expo Go Limitations)

| Module | Mock location | Real testing requires |
|--------|--------------|----------------------|
| `react-native-razorpay` | `src/lib/razorpay-mock.ts` | `eas build --profile development` |
| `expo-notifications` | `src/lib/notifications-mock.ts` | `eas build --profile development` |

---

## Production Checklist

- [ ] Set `ALLOWED_ORIGINS` to the actual web app domain
- [ ] Set `NODE_ENV=production` and remove `ENABLE_MOCK_PAY`
- [ ] Verify Razorpay webhook IP allowlist at razorpay.com/docs/webhooks/setup-edit
- [ ] Run only one server replica, or add a distributed lock / dedicated cron worker
- [ ] Confirm Cloudinary storage limits and retention policy
- [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values (≥ 64 chars)
- [ ] Enable HTTPS (reverse proxy or hosting platform)
