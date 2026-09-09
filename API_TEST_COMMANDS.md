# Quick API Test Commands

Use these commands to quickly test each feature endpoint locally. Replace placeholders with actual IDs from your database.

## Prerequisites

```bash
# Start the server
cd apps/backend && npm run dev

# In another terminal, have these ready:
export PRODUCT_ID="YOUR_PRODUCT_ID_FROM_DB"
export ORDER_ID="YOUR_ORDER_ID_FROM_DB"
export MERCHANT_TOKEN="YOUR_JWT_TOKEN_FROM_LOGIN"
```

---

## 1. WhatsApp Webhook Verification

```bash
# Meta verification (GET request)
curl -X GET "http://localhost:5000/api/assistant/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=lindrop-webhook&hub.challenge=CHALLENGE_TOKEN_HERE"

# Expected: 200 OK with plain text response of the challenge
```

---

## 2. Simulate Incoming WhatsApp Message

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
            "id": "wamid.test123",
            "text": { "body": "What is the price of the classic tee?" }
          }]
        }
      }]
    }],
    "object": "whatsapp_business_account"
  }'

# Expected: 200 OK
```

---

## 3. Create Checkout Session (Card & MoMo)

### Card Payment
```bash
curl -X POST http://localhost:5000/api/checkout/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "quantity": 1,
    "customerName": "Kwesi Amponsah",
    "customerPhone": "0241234567",
    "deliveryAddress": "123 Osu Avenue, Accra",
    "email": "kwesi@example.com",
    "paymentMethod": "paystack",
    "platformFeePercent": 2.5
  }'

# Expected: authorizationUrl for Paystack checkout page
```

### Mobile Money (USSD Push)
```bash
curl -X POST http://localhost:5000/api/checkout/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "quantity": 2,
    "customerName": "Ama Osei",
    "customerPhone": "0501234567",
    "deliveryAddress": "Kumasi Central Market, Ashanti",
    "paymentMethod": "momo_ussd",
    "ussdNetwork": "MTN",
    "platformFeePercent": 2.5
  }'

# Expected: ussdPush object with dial instruction
```

---

## 4. Get Shipping Quote

```bash
# Accra to Labone (Bolt Send)
curl -X GET "http://localhost:5000/api/fulfillment/quote?latitude=5.6037&longitude=-0.1870&provider=bolt-send"

# Kumasi (Yango)
curl -X GET "http://localhost:5000/api/fulfillment/quote?latitude=6.6667&longitude=-1.6167&provider=yango"

# Local rider network (default)
curl -X GET "http://localhost:5000/api/fulfillment/quote?latitude=5.6037&longitude=-0.1870"

# Expected: shipping fee, ETA, and provider label
```

---

## 5. Dispatch Courier for Order

```bash
curl -X POST http://localhost:5000/api/fulfillment/orders/$ORDER_ID/dispatch \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 5.6037,
    "longitude": -0.1870,
    "provider": "bolt-send",
    "deliveryAddress": "456 Osu, Accra",
    "customerPhone": "0501234567"
  }'

# Expected: tracking code, ETA, and tracking URL
```

---

## 6. Queue Offline POS Sale

```bash
curl -X POST http://localhost:5000/api/pos/offline \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Walk-in Customer #1",
    "customerPhone": "offline",
    "deliveryAddress": "In-person pickup",
    "totalAmount": 250.00,
    "items": [
      {
        "title": "Classic Tee (Black)",
        "quantity": 2,
        "unitPrice": 100.00
      },
      {
        "title": "Shorts",
        "quantity": 1,
        "unitPrice": 50.00
      }
    ]
  }'

# Expected: order object with syncStatus "pending"
```

---

## 7. Sync Offline POS Sales

```bash
curl -X POST http://localhost:5000/api/pos/sync \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales": [
      {
        "customerName": "Walk-in #1",
        "customerPhone": "offline",
        "deliveryAddress": "In-person",
        "totalAmount": 200.00,
        "items": [
          { "title": "Classic Tee", "quantity": 2, "unitPrice": 100.00 }
        ]
      },
      {
        "customerName": "Walk-in #2",
        "customerPhone": "offline",
        "deliveryAddress": "In-person",
        "totalAmount": 150.00,
        "items": [
          { "title": "Shorts", "quantity": 1, "unitPrice": 150.00 }
        ]
      }
    ]
  }'

# Expected: syncedCount and list of synced order IDs
```

---

## 8. Queue Abandoned Cart Recovery

```bash
curl -X POST http://localhost:5000/api/recovery/queue \
  -H "Authorization: Bearer $MERCHANT_TOKEN"

# Expected: list of queued recovery messages with WhatsApp links
```

---

## 9. Get Merchant Dashboard Stats

```bash
curl -X GET http://localhost:5000/api/merchants/dashboard-stats \
  -H "Authorization: Bearer $MERCHANT_TOKEN"

# Expected: total sales, active orders, views, conversion rate
```

---

## 10. List Merchant Orders

```bash
curl -X GET http://localhost:5000/api/orders/merchant \
  -H "Authorization: Bearer $MERCHANT_TOKEN"

# Expected: array of all merchant orders with payment/delivery status
```

---

## Helper: Get JWT Token (for tests requiring auth)

```bash
# Register (if new merchant)
REGISTER=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "businessName": "Test Store",
    "phone": "0501234567"
  }')

# Extract token
MERCHANT_TOKEN=$(echo $REGISTER | jq -r '.token')
echo $MERCHANT_TOKEN

# Or login
LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

MERCHANT_TOKEN=$(echo $LOGIN | jq -r '.token')
echo $MERCHANT_TOKEN
```

---

## Helper: Get Product ID (for checkout tests)

```bash
# Create a product
PRODUCT=$(curl -s -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Classic Tee",
    "description": "Premium cotton tee",
    "price": 100.00,
    "inventoryCount": 50,
    "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
  }')

# Extract ID
PRODUCT_ID=$(echo $PRODUCT | jq -r '._id')
echo $PRODUCT_ID

# Or list existing products
curl -s -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq '.[] | {id: ._id, title: .title, price: .price}'
```

---

## Useful Tools

- **jq** — Parse JSON responses: `brew install jq`
- **Postman** — GUI for API testing: https://www.postman.com/
- **Insomnia** — Alternative REST client: https://insomnia.rest/
- **curl** — Built-in command-line tool

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Missing/invalid JWT token | Login first and use correct token |
| `404 Product not found` | Product ID doesn't exist | Create a product or use correct ID |
| `503 Paystack not configured` | Missing `PAYSTACK_SECRET_KEY` | Add key to `.env` |
| `403 WhatsApp credentials missing` | Missing WhatsApp env vars | Add to `.env`: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| `Cannot POST /api/...` | Route not registered | Check server is running and route is added to server.js |

