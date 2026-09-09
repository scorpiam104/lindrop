# Omnichannel AI Social Ad Generator & Auto-Poster Feature Documentation

## 🎯 Overview

The **Omnichannel AI Social Ad Generator & Auto-Poster** (1-Click Social Ad Toolkit) enables Lindrop merchants to create high-converting product ads and share them across all major social platforms with a single click.

This feature combines two powerful capabilities:
- **Frontend 1-Click Web Share**: Using Web Intent links and OS share sheets for native app sharing
- **Backend Automated Direct-Publishing**: Integrating social APIs (Meta Graph API) for auto-posting to connected accounts

---

## 📋 Architecture

### Backend Structure

```
apps/backend/
├── services/
│   ├── adGeneratorService.js       # AI ad copy generation (4 tones)
│   ├── ogImageService.js           # Dynamic social card image generation
│   └── socialMediaService.js       # Meta Graph API integration
├── routes/
│   ├── adRoutes.js                 # Ad generation endpoints
│   ├── ogRoutes.js                 # OG image serving endpoints
│   └── socialRoutes.js             # Social posting endpoints
└── models/
    ├── Product.js                  # Updated with adCopyCache, shareCount
    └── Merchant.js                 # Updated with socialConnections
```

### Frontend Structure

```
apps/web/src/
├── components/
│   └── ProductShareModal.jsx       # Share modal with tone selector & preview
├── lib/
│   └── socialShare.js              # Web Intent launchers & share utilities
└── pages/
    └── Platform.jsx                # Integrated modal into Products page
```

---

## 🚀 API Endpoints

### Ad Generation

#### `POST /api/ads/generate`
Generate platform-specific ad copy for a product.

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "platform": "whatsapp",
  "tone": "sales"
}
```

**Valid Platforms:** `whatsapp`, `instagram`, `facebook`, `x`, `linkedin`, `tiktok`, `general`
**Valid Tones:** `sales`, `trendy`, `urgent`, `casual`

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "whatsapp",
    "tone": "sales",
    "adCopy": "🛍️ LIMITED TIME OFFER\n\n🏆 Premium Tee...",
    "hashtags": ["#ShopLocal", "#SupportSmallBusiness", ...],
    "cta": "Shop Now",
    "checkoutLink": "https://lindrop.app/store/mystore/checkout/507f1f77bcf86cd799439011",
    "fullMessage": "🛍️ LIMITED TIME OFFER\n\n🏆 Premium Tee...\n\n👉 Shop Now: https://...",
    "charCount": 342,
    "maxChars": 1024
  }
}
```

#### `POST /api/ads/generate-batch`
Generate ads for multiple platforms at once.

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "platforms": ["whatsapp", "facebook", "instagram"],
  "tone": "trendy"
}
```

**Response:** Array of ad data for each platform.

#### `GET /api/ads/templates`
Get available templates, tones, and platform configurations.

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": ["whatsapp", "instagram", "facebook", ...],
    "tones": ["sales", "trendy", "urgent", "casual"],
    "configs": { ... }
  }
}
```

#### `GET /api/ads/cache/:productId`
Get cached ad copies for a product.

---

### OG Image Generation

#### `GET /api/og/product/:productId`
Generate and serve dynamic OpenGraph image (PNG).

**Response:** PNG image buffer (1200x630px)
**Headers:**
- `Content-Type: image/png`
- `Cache-Control: public, max-age=86400` (24-hour cache)

#### `GET /api/og/product/:productId/meta`
Get OpenGraph metadata tags as JSON.

**Response:**
```json
{
  "success": true,
  "productId": "507f1f77bcf86cd799439011",
  "metaTags": {
    "ogTitle": "Premium Tee",
    "ogDescription": "...",
    "ogImage": "https://api.lindrop.app/api/og/product/507f1f77bcf86cd799439011",
    "twitterCard": "summary_large_image",
    ...
  }
}
```

#### `GET /api/og/product/:productId/thumbnail`
Generate smaller thumbnail image for platform cards.

**Query Parameters:**
- `size` (optional): Thumbnail size in pixels (default: 600)

---

### Social Media Posting

#### `POST /api/social/post`
Post product to all selected connected social accounts.

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "platforms": ["facebook", "instagram"],
  "tone": "sales"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "507f1f77bcf86cd799439011",
  "postResults": {
    "successful": [
      {
        "success": true,
        "platform": "facebook",
        "postId": "123456789",
        "url": "https://facebook.com/123456789"
      }
    ],
    "failed": [],
    "summary": { "total": 2, "success": 2, "failed": 0 }
  }
}
```

#### `POST /api/social/post-facebook`
Post directly to connected Facebook Page.

#### `POST /api/social/post-instagram`
Post directly to connected Instagram Business Account.

#### `GET /api/social/accounts`
Get merchant's connected social accounts status.

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": "My Store",
    "accounts": [
      { "platform": "facebook", "connected": true, "accountName": "My Store FB Page" },
      { "platform": "instagram", "connected": true, "accountName": "my_store_ig" }
    ]
  }
}
```

#### `POST /api/social/disconnect/:platform`
Disconnect a social media account.

#### `GET /api/social/share-stats/:productId`
Get sharing statistics for a product.

---

## 🎨 Frontend Components

### ProductShareModal.jsx

Modal component with the following features:

1. **Tone Selector**
   - 4 tone options: Sales Booster, Trendy, Limited Offer, Casual
   - Live preview updates when tone changes

2. **Ad Copy Preview**
   - Real-time generated ad text
   - Emoji-enhanced, platform-optimized
   - Character count indicator
   - Copy to clipboard button

3. **Social Card Preview**
   - Dynamic OG image showing product + price + store info
   - Cached for 24 hours

4. **Quick Share Buttons** (Web Intent)
   - WhatsApp
   - Facebook
   - X (Twitter)
   - LinkedIn
   - Instagram (native share on mobile)
   - Email

5. **Connected Accounts** (Auto-Posting)
   - Checkboxes for Facebook & Instagram
   - "Post to All" button for bulk posting

**Props:**
```jsx
<ProductShareModal
  product={{ _id, title, price, description, image }}
  merchant={{ name, storeSlug, socialConnections }}
  isOpen={boolean}
  onClose={() => {}}
/>
```

---

## 📚 Frontend Utilities (socialShare.js)

### Core Functions

```javascript
// Web Intent Launchers
shareToWhatsApp(text, url)
shareToFacebook(url, quote)
shareToX(text, url, hashtags)
shareToLinkedIn(url, title)
shareToTelegram(text, url)
shareViaEmail(subject, body, url)

// Native Share (iOS/Android)
await nativeShare(title, text, url, imageUrl)

// Clipboard & Download
await copyToClipboard(text, url)
await downloadImage(imageUrl, filename)

// Utilities
generateShareLinks(text, url, platforms)
getShareCapabilities() // Returns device capabilities
trackShare(productId, platform, merchantId)
```

---

## 🗄️ Database Schema Updates

### Product Model

```javascript
{
  // Existing fields...
  
  // NEW: Ad Generation Cache
  adCopyCache: Map<String, String>, // {"ad_whatsapp_sales": "..."}
  
  // NEW: Share Analytics
  shareCount: Number,
  lastSharedAt: Date,
  lastSharedPlatform: String
}
```

### Merchant Model

```javascript
{
  // Existing fields...
  
  // NEW: Social Connections
  socialConnections: {
    facebookAccessToken: String,
    facebookPageId: String,
    instagramAccessToken: String,
    instagramBusinessId: String,
    tiktokAccessToken: String,
    tiktokUserId: String
  }
}
```

---

## 🛠️ Installation & Setup

### Backend Dependencies

```bash
cd apps/backend
npm install canvas @napi-rs/canvas axios
```

**Note:** Canvas requires native build tools:
- **Linux:** `apt-get install build-essential python3`
- **macOS:** Xcode Command Line Tools
- **Windows:** Visual Studio Build Tools

### Frontend Dependencies

```bash
cd apps/web
npm install canvas-confetti
# (lucide-react already installed)
```

---

## 📋 Environment Variables

Add to `.env`:

```env
# Social Media & Ad Generation
META_GRAPH_API_VERSION=v19.0
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# OG Image Generation (Canvas)
CANVAS_FONT_PATH=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
OG_IMAGE_CACHE_TTL=86400

# Social Media Auto-Posting
FACEBOOK_PAGE_ID=your-facebook-page-id
INSTAGRAM_BUSINESS_ID=your-instagram-business-account-id
TIKTOK_BUSINESS_ACCOUNT_ID=your-tiktok-business-account-id

# App URLs (for checkout links in ads)
APP_URL=https://lindrop.app
```

---

## 🔗 User Flow

### 1. Generate Ad (Web)
```
Merchant → Products Dashboard
         → Click "Share as Ad" on product
         → ProductShareModal opens
         → Select tone (Sales/Trendy/Urgent/Casual)
         → See live preview
```

### 2. Share Ad (Web Intent)
```
Merchant → Click platform button (WhatsApp/Facebook/X/etc)
         → Platform Web Intent opens
         → Pre-filled text + product link
         → Merchant completes share in native app
```

### 3. Auto-Post (Connected Account)
```
Merchant → Connect Facebook/Instagram in settings
         → Select platforms in modal
         → Click "Post to All"
         → Backend: Generate ad → Get OG image → Post to Meta API
         → Confirmation with post URLs
```

### 4. Analytics
```
Backend tracks: Share count, last shared platform, cached ad copies
Frontend displays: Share stats in ad cache view
```

---

## 🎯 Ad Copy Tones

### 1. **Sales Booster** 🛍️
- **Prefix:** "LIMITED TIME OFFER"
- **CTA:** "Shop Now"
- **Keywords:** exclusive, unbeatable, deal of the day
- **Use Case:** Flash sales, discounts, limited stock

### 2. **Trendy** ✨
- **Prefix:** "TRENDING"
- **CTA:** "Grab It"
- **Keywords:** hot, must-have, everyone's talking about
- **Use Case:** New arrivals, viral products, seasonal items

### 3. **Urgent** ⏰
- **Prefix:** "LAST CHANCE"
- **CTA:** "Buy Before It's Gone"
- **Keywords:** limited stock, ending soon, don't miss out
- **Use Case:** Clearance, restocking delays, scarcity

### 4. **Casual** 😊
- **Prefix:** "Check This Out"
- **CTA:** "See More"
- **Keywords:** awesome, cool, perfect for you
- **Use Case:** Regular products, recommendations, evergreen items

---

## 🖼️ OG Image Specification

**Dimensions:** 1200x630px (Facebook/LinkedIn standard)
**Format:** PNG with transparency support

**Layout:**
- **Top:** Store name + "Verified" badge
- **Left (40%):** Product image placeholder
- **Right (60%):**
  - Product title (36pt bold)
  - Description (16pt)
  - Price badge (amber, prominent)
  - CTA button (amber)
  - Store branding (footer)

**Caching:** 24 hours (can be invalidated if product price changes)

---

## 🔒 Security & Permissions

### Authentication
- All endpoints require JWT token (`requireAuth` middleware)
- Merchants can only access their own products
- Admins can view all product shares

### Social API Keys
- Stored securely in Merchant `socialConnections`
- Never exposed to frontend
- Access tokens refreshed on each use
- Failed posts return user-friendly error messages

### Rate Limiting
- Ad generation: 100 per merchant per day
- Social posting: 50 per merchant per day
- Share tracking: Unlimited (lightweight)

---

## 🐛 Troubleshooting

### Canvas Module Installation Fails
**Error:** `gyp ERR! build error` during npm install

**Solution:**
```bash
# Ensure build tools are installed
# macOS: xcode-select --install
# Windows: npm install --global windows-build-tools
# Ubuntu: sudo apt-get install build-essential python3
```

### OG Images Not Rendering
**Error:** 404 when accessing `/api/og/product/:id`

**Check:**
1. Product exists in database
2. Merchant exists in database
3. `APP_URL` environment variable is set correctly
4. Canvas module is installed

### Social Posting Fails
**Error:** `Failed to post to Facebook: Invalid access token`

**Check:**
1. Merchant has connected social accounts (`/api/social/accounts`)
2. Access token is not expired (refresh in account settings)
3. Facebook Page/Instagram account is a Business Account
4. Meta Graph API version matches (`META_GRAPH_API_VERSION`)

---

## 📊 Analytics & Metrics

### Share Tracking
- **shareCount:** Total times product was shared
- **lastSharedAt:** Timestamp of most recent share
- **lastSharedPlatform:** Which platform was used last
- **adCopyCache size:** Number of cached ad variations

### Endpoint: `GET /api/social/share-stats/:productId`

---

## 🚀 Performance Optimizations

1. **OG Image Caching:** 24-hour server-side cache
2. **Ad Copy Caching:** Stored in Product document to avoid regeneration
3. **Batch Generation:** Multi-platform ads generated in parallel
4. **Social Posting Queue:** Failed posts can be retried
5. **Lazy Loading:** Share modal only loads when opened

---

## 🔮 Future Enhancements

1. **AI Product Copy Generation**
   - Auto-generate product descriptions using Claude/GPT
   - SEO-optimized titles and meta descriptions

2. **Video Ad Generation**
   - Auto-create short-form video ads for TikTok/Reels
   - Product showcase with music/effects

3. **Influencer Integration**
   - Connect with nano-influencers for paid posts
   - Campaign analytics and ROI tracking

4. **A/B Testing**
   - Test multiple ad copy versions
   - Track conversion by tone/platform
   - Recommend best-performing variations

5. **Scheduled Publishing**
   - Queue ads for future posting
   - Optimal posting time suggestions
   - Timezone handling for global audiences

6. **Advanced Analytics**
   - Click-through rate per ad/platform
   - Conversion tracking from share to purchase
   - Social ROI dashboard

---

## 📞 Support & Integration

### Required Third-Party Integrations

1. **Meta Graph API** (Facebook, Instagram)
   - App ID & Secret from Meta Developers
   - Business Account setup
   - Permissions: `pages_manage_posts`, `instagram_basic`

2. **Canvas Library** (Image Generation)
   - Node.js native module for image rendering
   - Custom fonts support for brand customization

3. **Web Share API** (Native Sharing)
   - Browser support: Chrome 89+, Safari 12.1+, Edge 89+
   - Graceful fallback to Web Intents

---

## ✅ Testing Checklist

- [ ] Backend syntax validation: `node --check` all new files
- [ ] Frontend build: `npm run build` completes without errors
- [ ] Ad generation: POST `/api/ads/generate` returns valid copy
- [ ] OG image: GET `/api/og/product/:id` serves PNG image
- [ ] Web share: Click share buttons open correct platforms
- [ ] Modal integration: "Share as Ad" button appears on products
- [ ] Social posting: "Post to All" works with connected accounts
- [ ] Error handling: Graceful errors when APIs fail
- [ ] Mobile responsive: Modal works on mobile devices
- [ ] Performance: OG image loads within 500ms

