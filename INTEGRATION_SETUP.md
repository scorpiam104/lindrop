# Lindrop Social Commerce Platform - Integration Setup & Testing Guide

This guide walks you through configuring and testing the real API integrations for WhatsApp, Paystack, and courier dispatch.

## 1. Environment Setup

Copy the example file and fill in your actual credentials:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### Required Credentials

#### Paystack
1. Sign up at https://dashboard.paystack.com
2. Navigate to **Settings > API Keys & Webhooks**
3. Copy your `Secret Key` and `Public Key`
4. To enable split payments:
   - Go to **Settings > Subaccounts**
   - Create a subaccount for your marketplace
   - Copy the subaccount code (e.g., `ACCT_xxx...`)

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SUBACCOUNT_CODE=ACCT_xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### WhatsApp Business API (Meta)
1. Create a Meta Business Account at https://business.facebook.com
2. Navigate to **Apps > Your Apps > Lindrop (or create new)**
3. Add **WhatsApp** product
4. In WhatsApp settings:
   - Get your **Phone Number ID** from **Senders > Phone Numbers**
   - Get your **Access Token** from **System Users > Generate new token** with `whatsapp_business_messaging` permission
   - Choose a custom **Verify Token** (you pick this)

```env
WHATSAPP_ACCESS_TOKEN=EAABxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=lindrop-webhook
```

#### MongoDB
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and get the connection string
3. Replace `username` and `password` in your connection string

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/lindrop
```

#### App URLs
```env
APP_URL=http://localhost:5173
API_URL=http://localhost:5000/api
PORT=5000
JWT_SECRET=your-long-random-secret-key
```

#### Optional Settings
```env
RECOVERY_CHECK_INTERVAL_MS=300000
COURIER_PROVIDER=local-rider
```

---

## 2. API Endpoint Testing

### Test Data
Use these test phone numbers and amounts for development:

**Ghana Test Numbers (Paystack Mobile Money):**
- MTN: +233 (024, 050-059)
- Vodafone: +233 (020, 025)
- AirtelTigo: +233 (027, 026)

**Test Amount:** GH₵ 10.00 (will succeed on test account)

### 2.1 WhatsApp Webhook Verification

Before Meta will send messages to your webhook, you need to verify it.

**Endpoint:** `POST /api/assistant/whatsapp/webhook`

**Verification Request (from Meta):**
```http
GET /api/assistant/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=lindrop-webhook&hub.challenge=CHALLENGE_VALUE
```

Expected response: `200 OK` with the challenge value as plain text.

**cURL Test:**
```bash
curl -X GET "http://localhost:5000/api/assistant/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=lindrop-webhook&hub.challenge=test123"
```

---

### 2.2 Incoming WhatsApp Message Webhook

**Endpoint:** `POST /api/assistant/whatsapp/webhook`

**Test Payload (simulating Meta sending a customer message):**
```json
{
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "value": {
            "metadata": {
              "phone_number_id": "123456789012345"
            },
            "messages": [
              {
                "from": "233501234567",
                "type": "text",
                "id": "wamid.xxx",
                "text": {
                  "body": "What's the price of Classic Tee?"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:5000/api/assistant/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "metadata": { "phone_number_id": "123456789012345" },
          "messages": [{
            "from": "233501234567",
            "type": "text",
            "id": "wamid.xxx",
            "text": { "body": "price classic tee" }
          }]
        }
      }]
    }],
    "object": "whatsapp_business_account"
  }'
```

**Expected Response:** `200 OK` (webhook processed)

---

### 2.3 Initialize Checkout (Paystack)

**Endpoint:** `POST /api/checkout/initialize`

**Test Request:**
```json
{
  "productId": "YOUR_PRODUCT_ID",
  "quantity": 1,
  "customerName": "John Doe",
  "customerPhone": "0501234567",
  "deliveryAddress": "123 Main St, Accra",
  "email": "customer@example.com",
  "paymentMethod": "paystack",
  "platformFeePercent": 2.5
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:5000/api/checkout/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_FROM_DB",
    "quantity": 1,
    "customerName": "Test Customer",
    "customerPhone": "0501234567",
    "deliveryAddress": "Accra, Ghana",
    "email": "test@example.com",
    "paymentMethod": "paystack",
    "platformFeePercent": 2.5
  }'
```

**Expected Response:**
```json
{
  "orderId": "ORDER_ID",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "PAYSTACK_REFERENCE",
  "paymentMethod": "paystack",
  "split": {
    "totalAmount": 100.00,
    "platformFeePercent": 2.5,
    "platformFee": 2.50,
    "merchantShare": 97.50
  }
}
```

---

### 2.4 Test Mobile Money (MoMo USSD)

**Endpoint:** `POST /api/checkout/initialize`

**Test Request (MoMo):**
```json
{
  "productId": "YOUR_PRODUCT_ID",
  "quantity": 1,
  "customerName": "Kwame Asante",
  "customerPhone": "0241234567",
  "deliveryAddress": "Kumasi, Ashanti Region",
  "paymentMethod": "momo_ussd",
  "ussdNetwork": "MTN",
  "platformFeePercent": 2.5
}
```

**Expected Response (includes USSD prompt):**
```json
{
  "orderId": "ORDER_ID",
  "reference": "PAYSTACK_REFERENCE",
  "paymentMethod": "momo-ussd",
  "ussdPush": {
    "network": "MTN",
    "prompt": "Dial *170# and select the MoMo push prompt to authorize GH₵ 100.00.",
    "amount": 100.00,
    "reference": "PAYSTACK_REFERENCE"
  },
  "split": { ... }
}
```

---

### 2.5 Shipping Quote (Geo-Based)

**Endpoint:** `GET /api/fulfillment/quote`

**Test Request:**
```bash
curl -X GET "http://localhost:5000/api/fulfillment/quote?latitude=5.6037&longitude=-0.1870&provider=bolt-send"
```

**Expected Response:**
```json
{
  "provider": "bolt-send",
  "providerLabel": "Bolt Send",
  "distanceKm": 5.79,
  "fee": 19.73,
  "etaMinutes": 46,
  "currency": "GHS"
}
```

---

### 2.6 Dispatch Courier

**Endpoint:** `POST /api/fulfillment/orders/:orderId/dispatch`

**Headers:**
```
Authorization: Bearer YOUR_MERCHANT_TOKEN
```

**Test Request:**
```json
{
  "latitude": 5.6037,
  "longitude": -0.1870,
  "provider": "yango",
  "deliveryAddress": "123 Main St, Accra",
  "customerPhone": "0501234567"
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:5000/api/fulfillment/orders/ORDER_ID/dispatch \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 5.6037,
    "longitude": -0.1870,
    "provider": "yango",
    "deliveryAddress": "123 Main St, Accra",
    "customerPhone": "0501234567"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "orderId": "ORDER_ID",
  "provider": "yango",
  "trackingCode": "CRT-12345678",
  "status": "dispatched",
  "etaMinutes": 45,
  "shippingFee": 22.30,
  "trackingUrl": "https://maps.google.com/?q=5.6037,-0.1870"
}
```

---

### 2.7 Offline POS - Queue Sale

**Endpoint:** `POST /api/pos/offline`

**Headers:**
```
Authorization: Bearer MERCHANT_TOKEN
```

**Test Request:**
```json
{
  "customerName": "Walk-in Customer",
  "customerPhone": "offline",
  "deliveryAddress": "In-person pickup",
  "totalAmount": 150.00,
  "items": [
    {
      "title": "Classic Tee",
      "quantity": 2,
      "unitPrice": 75.00
    }
  ]
}
```

**Expected Response:**
```json
{
  "order": {
    "_id": "OFFLINE_ORDER_ID",
    "paymentStatus": "paid",
    "paymentMethod": "offline-pos",
    "syncStatus": "pending"
  },
  "synced": false,
  "status": "queued-offline"
}
```

---

### 2.8 Offline POS - Sync to Server

**Endpoint:** `POST /api/pos/sync`

**Headers:**
```
Authorization: Bearer MERCHANT_TOKEN
```

**Test Request:**
```json
{
  "sales": [
    {
      "customerName": "Walk-in #1",
      "customerPhone": "offline",
      "deliveryAddress": "In-person",
      "totalAmount": 150.00,
      "items": [
        {
          "title": "Classic Tee",
          "quantity": 2,
          "unitPrice": 75.00
        }
      ]
    }
  ]
}
```

**Expected Response:**
```json
{
  "syncedCount": 1,
  "sales": ["SYNCED_ORDER_ID"]
}
```

---

### 2.9 Abandoned Cart Recovery Queue

**Endpoint:** `POST /api/recovery/queue`

**Headers:**
```
Authorization: Bearer MERCHANT_TOKEN
```

**Test Request:**
```bash
curl -X POST http://localhost:5000/api/recovery/queue \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

**Expected Response:**
```json
{
  "queuedCount": 2,
  "queued": [
    {
      "orderId": "ORDER_ID",
      "customerName": "Ama",
      "recoveryStatus": "queued",
      "recoveryMessage": "Hi Ama, you left Classic Tee x1 in your cart. Complete it here: ...",
      "whatsappLink": "https://wa.me/233501234567?text=..."
    }
  ]
}
```

---

## 3. Paystack Webhook Configuration

After testing checkout, configure Paystack to send payment confirmations to your API.

1. Go to **Settings > API Keys & Webhooks > Webhooks**
2. Add webhook URL: `https://your-domain.com/api/checkout/webhook`
3. Select events:
   - `charge.success`
   - `charge.failed` (optional)
4. Copy your webhook signing secret (for production)

**Test Webhook from Paystack Dashboard:**
- Paystack provides a "Send Test Event" button
- Verify your endpoint returns `200 OK`

---

## 4. Meta WhatsApp Webhook Configuration

1. Go to your Meta app dashboard
2. Navigate to **WhatsApp > Configuration**
3. Set webhook URL: `https://your-domain.com/api/assistant/whatsapp/webhook`
4. Set verify token: `lindrop-webhook` (or your custom token)
5. Subscribe to webhook fields:
   - `messages`
   - `message_template_status_update`
6. Save and test

**Meta will send a GET request to verify**, which your `/api/assistant/whatsapp/webhook` endpoint handles automatically.

---

## 5. Local Development & Testing

### Start the Server
```bash
cd apps/backend
npm run dev
```

The server will:
- Connect to MongoDB
- Start the Express server on port 5000
- Begin the abandoned cart recovery scheduler

### Test with Postman / Insomnia

Import this collection into Postman:

```json
{
  "info": {
    "name": "Lindrop API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Initialize Checkout",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": { "raw": "http://localhost:5000/api/checkout/initialize" },
        "body": {
          "mode": "raw",
          "raw": "{\"productId\": \"YOUR_ID\", \"quantity\": 1, \"customerName\": \"Test\", \"customerPhone\": \"0501234567\", \"deliveryAddress\": \"Accra\"}"
        }
      }
    },
    {
      "name": "Get Shipping Quote",
      "request": {
        "method": "GET",
        "url": { "raw": "http://localhost:5000/api/fulfillment/quote?latitude=5.6037&longitude=-0.1870&provider=bolt-send" }
      }
    },
    {
      "name": "Queue Offline Sale",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer YOUR_TOKEN" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "url": { "raw": "http://localhost:5000/api/pos/offline" },
        "body": {
          "mode": "raw",
          "raw": "{\"customerName\": \"Walk-in\", \"totalAmount\": 150, \"items\": [{\"title\": \"Tee\", \"quantity\": 1, \"unitPrice\": 150}]}"
        }
      }
    }
  ]
}
```

---

## 6. Troubleshooting

### Paystack Integration
- **Error:** "Subaccount not found"
  - Verify `PAYSTACK_SUBACCOUNT_CODE` in `.env`
  - Check subaccount is active in Paystack dashboard
  - Use the code from **Settings > Subaccounts**

- **Error:** "Invalid amount"
  - Ensure amount is in GHS (platform uses GH₵)
  - Amount must be a number with max 2 decimals

### WhatsApp Integration
- **Error:** "WhatsApp Business API credentials not configured"
  - Verify `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env`
  - Check token hasn't expired (refresh from Meta dashboard)
  - Ensure phone number is verified in Meta Business Account

- **Messages not arriving:**
  - Verify webhook URL is publicly accessible
  - Check Meta webhook configuration points to correct URL
  - Ensure verify token matches in `.env`

### Database Connection
- **Error:** "MongoDB unavailable"
  - Verify `MONGO_URI` connection string
  - Check MongoDB Atlas IP whitelist includes your IP
  - Ensure database user password is URL-encoded

---

## 7. Deployment Checklist

Before going to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use production Paystack keys (not test)
- [ ] Verify all env vars are set on your server
- [ ] Test Paystack webhooks with real transactions
- [ ] Configure Meta WhatsApp webhook on production URL
- [ ] Set up error logging (e.g., Sentry, LogRocket)
- [ ] Enable CORS for production frontend domain
- [ ] Set up SSL/TLS certificate
- [ ] Test full order flow (checkout → payment → recovery → dispatch)
- [ ] Monitor recovery scheduler logs for errors

---

## Quick Reference

| Service | Required Keys | Docs |
|---------|--------------|------|
| Paystack | Secret Key, Public Key, Subaccount Code | https://paystack.com/docs/api/transaction/initialize |
| WhatsApp Meta | Access Token, Phone Number ID, Verify Token | https://developers.facebook.com/docs/whatsapp/cloud-api |
| MongoDB | Connection String | https://www.mongodb.com/docs/atlas |
| Courier (Bolt Send) | Provider API Key | https://developer.bolt.eu/ |
| Courier (Yango) | Provider API Key | https://business.yango.com/ |

