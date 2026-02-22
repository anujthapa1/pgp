# Pabitra Ganesh Suppliers - Delivery Management

Dispatcher and driver operations platform with real-time tracking, customer notifications, and proof-of-delivery workflows.

## Core capabilities

- Two role-based login portals:
  - Dispatcher portal (5 staff accounts)
  - Driver portal (15 driver accounts)
- Customer order form (name, email, phone, address, items)
- Standard auto-dispatch to least-busy driver
- Real-time simulated live driver tracking on customer map view
- Dispatch-driver built-in chat
- Driver payment calculation dashboard
- Proof-of-delivery with one photo and one signature
- Historical order report + notification history
- Instant customer feedback collection after delivery
- Email/Phone support links
- Mobile installable app behavior (PWA manifest + service worker)

## Customer notifications (Email/SMS/WhatsApp)

When status changes:

- `picked_up -> out_for_delivery`: customer receives live tracking notification
- `out_for_delivery -> delivered`: customer receives delivery confirmation

Delivery channels are prepared as:

- Email (if customer email is present)
- SMS
- WhatsApp

By default notifications are logged locally.

For real delivery you now have two options:

- Use a Slack webhook directly in `VITE_NOTIFICATION_WEBHOOK_URL`
- Use the included real provider gateway (`scripts/notification-gateway.mjs`) with Resend + Twilio

### Real provider gateway setup (recommended)

1. Copy `.env.example` to `.env`
2. Fill provider credentials:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_SMS_FROM`
   - `TWILIO_WHATSAPP_FROM`
3. Keep frontend webhook target as:

```bash
VITE_NOTIFICATION_WEBHOOK_URL=http://localhost:8787/notify
```

4. Start gateway:

```bash
npm run gateway
```

5. In another terminal, start app:

```bash
npm run dev
```

The frontend posts event payloads to `/notify`; gateway forwards to real providers and returns per-channel status.

## Default demo accounts

Dispatcher accounts:

- `DISP-100` to `DISP-104` (password: `password`)

Driver accounts:

- `DRV-100` to `DRV-114` (password: `password`)

## Local development

```bash
npm install
npm run dev
```

If testing real notifications locally, run `npm run gateway` in parallel.

## Build and deploy (GitHub Pages)

```bash
npm run build
npm run deploy
```

The build includes `dist/404.html` to support SPA deep links on GitHub Pages.
