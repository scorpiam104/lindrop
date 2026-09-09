# Site Plus Up Commerce Engines

## Runtime architecture

The implementation uses the existing Express + MongoDB backend as the system of record:

```text
WhatsApp Cloud API -> /api/webhooks/whatsapp -> WhatsAppSession/Redis -> Product
                                              -> Order -> Paystack /charge
Paystack webhook -> WebhookEvent idempotency ledger -> Mongo transaction -> inventory decrement
                                                    -> WhatsApp receipt + ReferralGroup
React dashboard -> /api/merchant/dashboard -> Merchant/Product/Order/ReferralGroup
POS routes -> atomic Order + Product inventory transaction
```

Redis is used for low-latency session reads when `REDIS_URL` is configured. A short-lived in-memory adapter is used only when Redis is not configured, which keeps local development usable but should not be used for a multi-instance deployment.

## State machine

WhatsApp sessions move through:

`IDLE -> PRODUCT_VIEWED -> AWAITING_MOMO_NUMBER -> PAYMENT_PENDING -> COMPLETED`

Sessions are persisted in `WhatsAppSession` with a 30-minute Redis TTL and MongoDB TTL expiry. Payment settlement is driven by Paystack `charge.success`, never by the client callback.

## API surface

### WhatsApp and Paystack webhooks

- `GET /api/webhooks/whatsapp` Meta verification challenge.
- `POST /api/webhooks/whatsapp` message and interactive button listener.
- `POST /api/webhooks/paystack` signed Paystack webhook.
- `POST /api/checkout/webhook` remains as a backwards-compatible alias and uses the same idempotent settlement service.

Customers can send `BUY <product id>`. Stocked products receive an interactive Buy Now button. The button asks for `phone network`, starts Paystack `/charge`, and waits for the signed webhook before marking the order paid or decrementing stock.

### Merchant dashboard

- `GET /api/merchant/dashboard` sales feed, products, and active group-buy referrals.
- `POST /api/merchant/dashboard/products` product creator plus quick-link and QR URL.
- `PATCH /api/merchant/dashboard/products/:productId/inventory` atomic inventory update and channel-sync state.
- `GET /api/merchant/dashboard/bot` bot configuration.
- `PUT /api/merchant/dashboard/bot` bot configuration update.
- `GET /api/refer/:token` referral status.
- `GET /api/orders/:orderId/receipt` paid digital receipt JSON.

All dashboard endpoints require the existing Bearer JWT middleware.

## Idempotency and rollback rules

- Every WhatsApp message ID and Paystack event ID is unique in `WebhookEvent`.
- A duplicate webhook returns `200` without charging, decrementing, or sending another receipt.
- Inventory is decremented with an atomic `$gte` query inside the payment transaction.
- Failed MoMo charge attempts mark the pending order `failed`; no inventory is reserved before payment success.
- POS order creation and inventory decrement use the same Mongo transaction.
- Referral rewards transition `active -> reward_pending -> rewarded`; a failed Paystack transfer returns the group to `active` for retry.

## Required production configuration

Set these values in `apps/backend/.env`:

`MONGO_URI`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_CASHBACK_RECIPIENT`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `PUBLIC_APP_URL`, and `REDIS_URL`.

MongoDB transactions require a replica set, including MongoDB Atlas. Configure Paystack to send `charge.success` to `/api/webhooks/paystack` and Meta to send messages to `/api/webhooks/whatsapp`.