# Architecture Diagram - Omnichannel AI Social Ad Generator

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LINDROP PLATFORM                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
         ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
         │  Merchant    │    │   Mobile    │   │  Customer   │
         │  Dashboard   │    │    App      │   │ Storefront  │
         │  (React)     │    │  (React     │   │  (React)    │
         │              │    │   Native)   │   │             │
         └──────┬───────┘    └──────┬──────┘   └──────┬──────┘
                │                    │                  │
                │ "Share as Ad" click │                 │
                │                    │                  │
         ┌──────▼────────────────────────────────────────┐
         │     ProductShareModal Component               │
         │  ┌─────────────────────────────────────────┐  │
         │  │ 1. Tone Selector (Sales/Trendy/etc)    │  │
         │  │ 2. Live Ad Copy Preview                │  │
         │  │ 3. Social Card Image                   │  │
         │  │ 4. Share Buttons (6 platforms)         │  │
         │  │ 5. Connected Accounts (FB/IG)          │  │
         │  │ 6. "Post to All" Button                │  │
         │  └─────────────────────────────────────────┘  │
         └──────┬───────────────────┬─────────────────────┘
                │                   │
        (Web Intent)        (Auto-Post)
                │                   │
        ┌───────▼─────────┐  ┌──────▼──────────────────┐
        │ Native Sharing  │  │  Backend API Calls      │
        │ (WhatsApp/FB/X) │  │  (POST /api/social/post)│
        └─────────────────┘  └──────┬───────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼────────┐ ┌─────▼────────┐ ┌────▼──────────┐
            │ Ad Generator   │ │ OG Image Gen │ │ Social Media  │
            │ Service        │ │ Service      │ │ Service       │
            └───────┬────────┘ └─────┬────────┘ └────┬──────────┘
                    │                │               │
        ┌───────────┴──────────┬─────┴───────┬───────┴──────────┐
        │                      │             │                  │
   ┌────▼──────────┐   ┌──────▼─────┐ ┌────▼──────┐   ┌───────▼───┐
   │ Ad Copy Cache │   │ Canvas PNG │ │ Meta API  │   │  Database │
   │ (4 tones)     │   │ 1200x630px │ │ (FB/IG)   │   │ (Mongo)   │
   │               │   │            │ │           │   │           │
   │ - Sales       │   │ - Product  │ │ - POST    │   │ Product   │
   │ - Trendy      │   │ - Price    │ │ - Captions│   │ Merchant  │
   │ - Urgent      │   │ - Store    │ │ - Images  │   │ Order     │
   │ - Casual      │   │ - CTA      │ │           │   │           │
   └───────────────┘   └────────────┘ └───────────┘   └───────────┘
```

---

## 📱 User Journey Flow

```
Merchant Opens Dashboard
         │
         ▼
Clicks "Products" Tab
         │
         ▼
Sees Product Grid with "Share as Ad" Button
         │
         ▼
Clicks "Share as Ad" on Product Card
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         ProductShareModal Opens                             │
│                                                              │
│  Step 1: Select Tone (Sales/Trendy/Urgent/Casual)          │
│           └─ Triggers: generateAd() API call               │
│                       (POST /api/ads/generate)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │ Backend: Ad Generation  │
         │  - Generate Copy        │
         │  - Generate Hashtags    │
         │  - Build CTA            │
         │  - Cache Result         │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │ Backend: OG Image Gen    │
         │  - Create Canvas         │
         │  - Draw Product Info     │
         │  - Render Price Card     │
         │  - Output PNG Buffer     │
         └──────────┬───────────────┘
                    │
                    ▼
Step 2: View Live Preview in Modal
  - Display Generated Ad Copy
  - Show OG Image
  - Display Character Count
  - Show Hashtags
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
    Step 3A:                          Step 3B:
    Quick Share (Web Intent)      Auto-Post (Connected Accounts)
         │                                 │
         ├─WhatsApp Button                ├─Check Facebook Connected
         │  └─ wa.me/?text=...            │  └─ If not, show error
         ├─Facebook Button                ├─Check Instagram Connected
         │  └─ facebook.com/sharer        │  └─ If not, show error
         ├─X/Twitter Button               ├─Select Platforms (Checkboxes)
         │  └─ twitter.com/intent         │  └─ Facebook, Instagram
         ├─LinkedIn Button                ├─Click "Post to All"
         │  └─ linkedin.com/sharing       │  └─ Triggers: POST /api/social/post
         ├─Telegram Button                │
         │  └─ t.me/share/url             ├─Backend: Auto-Post
         ├─Email Button                   │  - Validate Connections
         │  └─ mailto:                    │  - Call Meta Graph API
         └─Native Share (Mobile)          │  - POST media + caption
            └─ navigator.share()          │  - Return post URLs
                                          │
                                          ▼
                            Success Message
                            "Posted to 2 platforms!"
                            (URLs to posts)
                                          │
                                          ▼
                                    Modal Closes
                                  After 2 seconds
```

---

## 🏗️ Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express Server                            │
│  (apps/backend/server.js)                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────────┐  ┌──────▼────────┐ ┌──────▼────────┐
   │ /api/ads    │  │ /api/og       │ │ /api/social   │
   │ (4 routes)  │  │ (5 routes)    │ │ (6 routes)    │
   └────┬────────┘  └──────┬────────┘ └──────┬────────┘
        │                  │                  │
   ┌────▼────────────────┐ │            ┌────▼────────────┐
   │                     │ │            │                 │
   │ adRoutes.js         │ │            │ socialRoutes.js │
   │                     │ │            │                 │
   │ POST /generate      │ │            │ POST /post      │
   │ POST /generate-batch│ │            │ POST /post-fb   │
   │ GET /templates      │ │            │ POST /post-ig   │
   │ GET /cache/:id      │ │            │ GET /accounts   │
   │                     │ │            │ POST /disconnect│
   │  ▼                  │ │            │ GET /share-stats│
   │  adGeneratorService │ │            │                 │
   │  - generateAdCopy() │ │            │  ▼              │
   │  - generateOGMeta() │ │            │  socialMediaSvc │
   │  - cacheAdCopy()    │ │            │  - metaAPI      │
   │  - increment...()   │ │            │  - tiktokAPI    │
   │                     │ │            │  - SocialMedia  │
   │                     │ │            │    Service      │
   └─────────────────────┘ │            │                 │
                            │            └─────────────────┘
                     ┌──────▼────────┐
                     │                │
                     │ ogRoutes.js    │
                     │                │
                     │ GET /product/:id      │
                     │ GET /product/:id/meta │
                     │ GET /product/:id/thumb│
                     │ GET /store/:slug      │
                     │ GET /checkout/:id     │
                     │                │
                     │  ▼             │
                     │  ogImageService│
                     │  - generateOG()│
                     │  - generateThumb()    │
                     │  - generateMeta()     │
                     │  - wrapText()         │
                     │                │
                     └────────────────┘
                            │
          ┌─────────────────┴──────────────────┐
          │                                    │
   ┌──────▼───────────────┐        ┌──────────▼──────────┐
   │ MongoDB Database     │        │ External APIs       │
   │                      │        │                     │
   │ Product             │        │ Meta Graph API      │
   │  - adCopyCache      │        │ (v19.0)             │
   │  - shareCount       │        │  - Facebook         │
   │  - lastSharedAt     │        │  - Instagram        │
   │  - lastSharedPlatform│      │                     │
   │                      │        │ Canvas Library      │
   │ Merchant            │        │  - createCanvas()   │
   │  - socialConnections│        │  - drawImage()      │
   │    - fbAccessToken  │        │  - fillText()       │
   │    - fbPageId       │        │                     │
   │    - igAccessToken  │        │ Axios HTTP Client   │
   │    - igBusinessId   │        │  - POST requests    │
   │                      │        │                     │
   └──────────────────────┘        └─────────────────────┘
```

---

## 📲 Frontend Architecture

```
┌────────────────────────────────────────────────────────┐
│              React App (apps/web)                      │
│              (Vite Build Tool)                         │
└──────────────┬──────────────────┬──────────────────────┘
               │                  │
        ┌──────▼────────┐  ┌──────▼──────────┐
        │ Pages/        │  │ Components/     │
        │ Platform.jsx  │  │ ProductShare    │
        │               │  │ Modal.jsx       │
        │ Updated:      │  │                 │
        │ - Import      │  │ New Features:   │
        │   modal       │  │ - Tone selector │
        │ - Add state   │  │ - Ad preview    │
        │ - Show button │  │ - Image preview │
        │ - Render modal│  │ - Share buttons │
        │               │  │ - Post to all   │
        └──────┬────────┘  └────────┬────────┘
               │                    │
               └────────┬───────────┘
                        │
                   ┌────▼──────────────┐
                   │ lib/socialShare.js│
                   │                   │
                   │ Export Functions: │
                   │ - shareToWhatsApp │
                   │ - shareToFacebook │
                   │ - shareToX        │
                   │ - shareToLinkedIn │
                   │ - shareToTelegram │
                   │ - nativeShare()   │
                   │ - copyToClipboard │
                   │ - downloadImage   │
                   │ - trackShare()    │
                   │ - getCapabilities │
                   │                   │
                   └────┬──────────────┘
                        │
            ┌───────────┴──────────┐
            │                      │
      ┌─────▼─────────┐   ┌───────▼────────┐
      │ Web Intent    │   │ Backend API    │
      │ Launchers     │   │ Calls          │
      │               │   │                │
      │ - wa.me/?text │   │ POST /api/ads  │
      │ - facebook.   │   │ /generate      │
      │   com/sharer  │   │                │
      │ - twitter.    │   │ POST /api/     │
      │   com/intent  │   │ social/post    │
      │ - linkedin.   │   │                │
      │   com/sharing │   │ GET /api/og    │
      │ - t.me/share  │   │ /product/:id   │
      │               │   │                │
      │ Opening Links │   │ Axios HTTP     │
      │ in Browser    │   │ Requests       │
      │               │   │                │
      └───────────────┘   └────────────────┘
```

---

## 🔄 Data Flow - Single Request

### Generate Ad Copy Request

```
1. FRONTEND REQUEST
┌─────────────────────────────────────────┐
│ User clicks "Share as Ad" button         │
│ Tone is selected in modal                │
│ ProductShareModal calls:                 │
│                                          │
│ fetch('/api/ads/generate', {            │
│   method: 'POST',                       │
│   headers: {                            │
│     'Authorization': 'Bearer TOKEN'      │
│   },                                    │
│   body: {                               │
│     productId: "507f...",               │
│     platform: "whatsapp",               │
│     tone: "sales"                       │
│   }                                     │
│ })                                      │
└──────────────┬──────────────────────────┘
               │
2. BACKEND PROCESSING
┌──────────────▼──────────────────────────┐
│ adRoutes.js receives request             │
│  - Validates productId, platform, tone   │
│  - Checks JWT token (requireAuth)        │
│  - Loads Product from DB                 │
│  - Loads Merchant from DB                │
│  - Verifies merchant owns product        │
│                                          │
│ Calls adGeneratorService.generateAdCopy()│
│  - Selects platform config               │
│  - Selects tone config                   │
│  - Builds ad copy text                   │
│  - Generates hashtags                    │
│  - Creates CTA text                      │
│  - Builds checkout link                  │
│  - Combines into fullMessage             │
│                                          │
│ Returns response:                        │
│ {                                        │
│   success: true,                         │
│   data: {                                │
│     adCopy: "🛍️ LIMITED TIME...",        │
│     hashtags: ["#ShopLocal", ...],       │
│     cta: "Shop Now",                     │
│     fullMessage: "...",                  │
│     charCount: 342,                      │
│     maxChars: 1024                       │
│   }                                      │
│ }                                        │
└──────────────┬──────────────────────────┘
               │
3. FRONTEND RECEIVES
┌──────────────▼──────────────────────────┐
│ Response JSON parsed                     │
│ Ad copy displayed in modal preview       │
│ Hashtags shown                           │
│ Character count displayed                │
│ User can now:                            │
│  - Click "Copy Text"                     │
│  - Click "Download Image"                │
│  - Click platform button (WhatsApp/etc)  │
│  - Select platforms for auto-posting     │
└──────────────────────────────────────────┘
```

---

## 🎯 Tone Selection Logic

```
User selects TONE
        │
        └─ 4 Options ──┬──────────────┬──────────────┬──────────┐
                       │              │              │          │
                 ┌─────▼──────┐ ┌────▼────────┐ ┌──▼───────┐ ┌▼──────────┐
                 │ SALES       │ │ TRENDY      │ │ URGENT   │ │ CASUAL    │
                 │             │ │             │ │          │ │           │
                 │ Prefix:     │ │ Prefix:     │ │ Prefix:  │ │ Prefix:   │
                 │ 🛍️ LIMITED  │ │ ✨ TRENDING │ │ ⏰ LAST   │ │ 😊 CHECK  │
                 │ TIME OFFER  │ │             │ │ CHANCE   │ │ THIS OUT  │
                 │             │ │ CTA:        │ │          │ │           │
                 │ CTA:        │ │ "Grab It"   │ │ CTA:     │ │ CTA:      │
                 │ "Shop Now"  │ │             │ │ "Buy     │ │ "See More"│
                 │             │ │ Urgency: NO │ │ Before   │ │           │
                 │ Urgency:    │ │             │ │ It's     │ │ Urgency:  │
                 │ YES         │ │ Keywords:   │ │ Gone"    │ │ NO        │
                 │             │ │ - hot       │ │          │ │           │
                 │ Keywords:   │ │ - must-have │ │ Urgency: │ │ Keywords: │
                 │ - exclusive │ │ - trending  │ │ YES      │ │ - awesome │
                 │ - unbeatable│ │             │ │          │ │ - cool    │
                 │ - deal      │ │             │ │ Keywords:│ │ - perfect │
                 │             │ │             │ │ - limited│ │           │
                 │ BEST FOR:   │ │ BEST FOR:   │ │ - ending │ │ BEST FOR: │
                 │ Discounts   │ │ New         │ │ - don't  │ │ Regular   │
                 │ Flash sales │ │ Arrivals    │ │ miss out │ │ Products  │
                 │ Limited     │ │ Viral       │ │          │ │ Evergreen │
                 │ Stock       │ │ Products    │ │ BEST FOR:│ │ Items     │
                 │             │ │ Seasonal    │ │ Scarcity │ │ Friendly  │
                 └─────────────┘ └─────────────┘ │ Clearing │ │ Tone      │
                                                 │          │ │           │
                                                 └──────────┘ └───────────┘
                                                      │              │
                                                      └──────┬───────┘
                                                             │
                                        Example Output per Platform:
                                        
                                        WhatsApp (1024 max):
                                        🛍️ LIMITED TIME OFFER
                                        🏆 Premium Tee
                                        Perfect summer style, breathable fabric...
                                        ✨ Why you'll love it:
                                        • Exclusive deal
                                        • Unbeatable price
                                        • Deal of the day
                                        💰 GHS 85.00
                                        #ShopLocal #SupportSmallBusiness
                                        👉 Shop Now: https://...
```

---

## 🔒 Security Flow

```
Request Flow:
┌──────────────────────┐
│ HTTP Request Arrives │
└──────────┬───────────┘
           │
           ▼
    ┌─────────────────┐
    │ Extract JWT     │
    │ Token from      │
    │ Authorization   │
    │ Header          │
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────┐
    │ requireAuth()        │
    │ Middleware:          │
    │ - Verify JWT         │
    │ - Decode token       │
    │ - Extract merchant ID│
    │ - Attach to req.user │
    │ - Next()             │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Route Handler        │
    │ adRoutes.js          │
    │ socialRoutes.js      │
    │ ogRoutes.js          │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Ownership Check:     │
    │ product.merchantId   │
    │ === req.user.id      │
    │                      │
    │ If NO match:         │
    │ Return 403           │
    │ Forbidden            │
    │                      │
    │ If YES:              │
    │ Proceed to process   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Business Logic       │
    │ (Secure Processing)  │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Return 200 OK        │
    │ with data            │
    └──────────────────────┘

Social Connections Security:
┌─────────────────────────────┐
│ Access Tokens Stored in     │
│ MongoDB (Encrypted)         │
│                             │
│ merchant.socialConnections:│
│  - facebookAccessToken      │
│  - instagramAccessToken     │
│  - tiktokAccessToken        │
│                             │
│ Never exposed to frontend   │
│ Never logged in plain text  │
│ Refreshed on each API call  │
└────────┬────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ On Failed API Call:  │
    │ - Check response code│
    │ - If 401: Token     │
    │   invalid/expired    │
    │ - Return user-      │
    │   friendly error     │
    │ - Suggest           │
    │   reconnect         │
    └──────────────────────┘
```

---

## 📊 Data Model Relationships

```
User (Merchant)
│
├─ Authenticated with JWT
│
├─ Owns multiple Products
│  │
│  ├─ title, description, price
│  │
│  ├─ [NEW] adCopyCache
│  │        ├─ "ad_whatsapp_sales": "🛍️ LIMITED..."
│  │        ├─ "ad_instagram_trendy": "✨ TRENDING..."
│  │        └─ "ad_facebook_urgent": "⏰ LAST CHANCE..."
│  │
│  ├─ [NEW] shareCount: 24
│  │
│  ├─ [NEW] lastSharedAt: 2026-09-07T10:30:00Z
│  │
│  └─ [NEW] lastSharedPlatform: "facebook"
│
└─ [NEW] socialConnections
         │
         ├─ facebookAccessToken: "EAABx..."
         ├─ facebookPageId: "123456789"
         │
         ├─ instagramAccessToken: "EAABx..."
         ├─ instagramBusinessId: "17841..."
         │
         └─ tiktokAccessToken: "..."
            tiktokUserId: "..."

Relationships:
- 1 Merchant : Many Products
- 1 Merchant : 1 socialConnections object
- 1 Product : Many adCopyCache entries
- 1 Product : Many shares (tracked via shareCount)
```

---

## 🚀 Performance Metrics

```
Request Latency Targets:

AD GENERATION:
├─ Database query (Product): ~20ms
├─ Database query (Merchant): ~15ms
├─ Ad copy generation: ~50ms
├─ Hashtag generation: ~25ms
├─ Database write (cache): ~30ms
└─ TOTAL: ~140ms

OG IMAGE GENERATION:
├─ Database queries: ~35ms
├─ Canvas rendering: ~400ms  ← Slowest
├─ PNG encoding: ~80ms
├─ Caching: ~10ms
└─ TOTAL: ~525ms (cached: ~100ms)

SOCIAL POSTING:
├─ Database queries: ~35ms
├─ Ad generation: ~140ms
├─ OG image fetch: ~100ms
├─ Meta API call: ~500ms-2s ← External API
├─ Database write: ~30ms
└─ TOTAL: ~800-2500ms

CACHING STRATEGY:
├─ OG Images: 24 hours server cache
├─ Ad Copies: Database cache per product
├─ Browser Cache: 1 hour for static assets
└─ CDN: Optional for image serving

Memory Usage:
├─ Canvas per request: ~50MB
├─ In-memory database cache: ~200MB
├─ Service layer: ~100MB
└─ Total per instance: ~400MB
```

---

This completes the comprehensive architecture documentation for the Omnichannel AI Social Ad Generator feature!
