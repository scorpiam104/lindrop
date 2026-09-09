# Quick Reference Guide - Social Ad Generator

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/backend && npm install canvas @napi-rs/canvas axios
cd apps/web && npm install canvas-confetti
```

### 2. Set Environment Variables
```bash
# .env
APP_URL=http://localhost:5173
META_GRAPH_API_VERSION=v19.0
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
```

### 3. Start Backend
```bash
cd apps/backend
npm start  # http://localhost:5000
```

### 4. Start Frontend
```bash
cd apps/web
npm run dev  # http://localhost:5173
```

---

## 📱 Feature Usage Flow

```
Dashboard → Products → Click "Share as Ad" on Product Card
    ↓
ProductShareModal Opens
    ↓
Select Tone (Sales/Trendy/Urgent/Casual)
    ↓
View Live Preview + OG Image
    ↓
Choose Option:
  A) Click Platform Button (WhatsApp/Facebook/X/LinkedIn/Telegram)
     → Opens Web Intent in Browser
     → Pre-filled with ad copy + checkout link
  B) Check Facebook/Instagram Boxes → Click "Post to All"
     → Sends POST request to backend
     → Backend calls Meta Graph API
     → Posts directly to accounts
```

---

## 🔗 API Quick Reference

### Generate Ad Copy
```bash
curl -X POST http://localhost:5000/api/ads/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "platform": "whatsapp",
    "tone": "sales"
  }'
```

### Get OG Image
```bash
# Returns PNG image
curl http://localhost:5000/api/og/product/507f1f77bcf86cd799439011 -o product.png
```

### Post to Social Media
```bash
curl -X POST http://localhost:5000/api/social/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "platforms": ["facebook", "instagram"],
    "tone": "sales"
  }'
```

### Get Connected Accounts
```bash
curl http://localhost:5000/api/social/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 Tone Cheat Sheet

| Tone | Icon | Prefix | CTA | Best For |
|------|------|--------|-----|----------|
| **Sales** | 🛍️ | LIMITED TIME OFFER | Shop Now | Discounts, Flash Sales |
| **Trendy** | ✨ | TRENDING | Grab It | New Arrivals, Viral |
| **Urgent** | ⏰ | LAST CHANCE | Buy Before It's Gone | Scarcity, Ending Soon |
| **Casual** | 😊 | Check This Out | See More | Regular, Evergreen |

---

## 🎨 Tone Selection Guide

### Choose SALES When:
- Product has limited stock ✓
- Running a time-limited promotion ✓
- Offering a discount ✓
- Want to create urgency ✓

### Choose TRENDY When:
- New product just launched ✓
- Product is viral or popular ✓
- Targeting younger audience ✓
- Seasonal or trending category ✓

### Choose URGENT When:
- Stock really is limited ✓
- Closeout or clearance sale ✓
- Restocking delay expected ✓
- Want maximum FOMO ✓

### Choose CASUAL When:
- Evergreen product ✓
- Building community engagement ✓
- Sharing recommendations ✓
- No time pressure needed ✓

---

## 🖼️ Platform Optimization

| Platform | Max Length | Hashtags | Features |
|----------|-----------|----------|----------|
| **WhatsApp** | 1024 chars | 3 | Emojis, Links, Quick reply |
| **Instagram** | 2200 chars | 30 | Hashtags, Mentions, Story-friendly |
| **Facebook** | 63206 chars | 10 | Hashtags, Links, Engagement focus |
| **X/Twitter** | 280 chars | 5 | Concise, Hashtags, Mentions |
| **LinkedIn** | 3000 chars | 5 | Professional, Hashtags |
| **Telegram** | 4096 chars | 10 | Direct, Hashtags, Code-friendly |

---

## 💾 Database Schema Reference

### Product Fields Added
```javascript
adCopyCache: Map {
  "ad_whatsapp_sales": "🛍️ LIMITED TIME OFFER\n🏆 Premium Tee...",
  "ad_instagram_trendy": "✨ TRENDING\n🏆 Premium Tee...",
  // ... more cached copies
}
shareCount: 24  // Total shares
lastSharedAt: Date  // 2026-09-07T10:30:00Z
lastSharedPlatform: String  // "facebook"
```

### Merchant Fields Added
```javascript
socialConnections: {
  facebookAccessToken: "EAABx...",
  facebookPageId: "123456789",
  instagramAccessToken: "EAABx...",
  instagramBusinessId: "17841...",
  tiktokAccessToken: "...",
  tiktokUserId: "..."
}
```

---

## 🐛 Troubleshooting

### Issue: "Canvas module not found"
**Solution:** Install build tools
```bash
# macOS
xcode-select --install

# Ubuntu
sudo apt-get install build-essential python3

# Windows
npm install --global windows-build-tools
```

### Issue: OG image returns 404
**Solution:** Check:
1. Product exists in database
2. `APP_URL` is set in .env
3. Backend is running on correct port

### Issue: Facebook posting fails
**Solution:** Check:
1. Facebook account connected (`GET /api/social/accounts`)
2. Access token not expired
3. Facebook Page is Business Account
4. Account has `pages_manage_posts` permission

### Issue: Web share button doesn't open
**Solution:** Check:
1. Browser developer console for errors
2. Platform URL encoding (spaces → %20)
3. Browser supports Web Intents (most modern browsers do)

---

## 📊 Analytics Endpoints

### Get Share Stats
```bash
curl http://localhost:5000/api/social/share-stats/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "productId": "507f1f77bcf86cd799439011",
  "shareCount": 24,
  "lastShared": "2026-09-07T10:30:00Z",
  "lastSharedPlatform": "facebook",
  "adCacheSize": 8
}
```

---

## 🔐 Security Checklist

✅ JWT token required on all POST endpoints
✅ Ownership validation (users can only access their products)
✅ Social tokens stored securely in DB
✅ No sensitive data in error messages
✅ Rate limiting on ad generation
✅ CORS configured
✅ Helmet security headers enabled
✅ Input validation on all endpoints

---

## 📈 Performance Tips

1. **Reduce OG Image Generation**
   - Cache set to 24 hours by default
   - Only regenerates if product price changes

2. **Optimize Ad Generation**
   - Ad copy cached per product
   - Reuse cache for same tone/platform

3. **Minimize Social API Calls**
   - Batch multi-platform posting
   - Connection status checked before posting
   - Failed posts can be retried

4. **Frontend Performance**
   - Modal lazy-loaded (only loads when opened)
   - Images preloaded in background
   - Debounce share button clicks

---

## 🚀 Deployment Checklist

- [ ] Install build dependencies for canvas
- [ ] Set all `.env` variables
- [ ] Test database connection
- [ ] Configure Meta app for production
- [ ] Connect real Facebook/Instagram accounts
- [ ] Set proper `APP_URL` (production domain)
- [ ] Test all 15 API endpoints
- [ ] Verify OG images render correctly
- [ ] Monitor social API rate limits
- [ ] Setup error logging/monitoring

---

## 📚 File Location Reference

### Backend
```
apps/backend/
├── services/
│   ├── adGeneratorService.js          # Ad copy generation
│   ├── ogImageService.js              # OG image generation
│   └── socialMediaService.js          # Social API integration
├── routes/
│   ├── adRoutes.js                    # /api/ads routes
│   ├── ogRoutes.js                    # /api/og routes
│   └── socialRoutes.js                # /api/social routes
├── models/
│   ├── Product.js                     # Updated with new fields
│   └── Merchant.js                    # Updated with new fields
└── server.js                          # Updated with route imports
```

### Frontend
```
apps/web/src/
├── components/
│   └── ProductShareModal.jsx          # Share modal UI
├── lib/
│   └── socialShare.js                 # Web Intent utilities
└── pages/
    └── Platform.jsx                   # Updated Products page
```

### Documentation
```
Root directory:
├── SOCIAL_AD_FEATURE.md               # Full feature docs
├── SOCIAL_AD_IMPLEMENTATION_SUMMARY.md # Implementation guide
├── ARCHITECTURE_DIAGRAMS.md           # Architecture & flows
├── FILE_MANIFEST.md                   # File reference
└── QUICK_REFERENCE.md                 # This file
```

---

## 💡 Pro Tips

### For Merchants
- Use **Sales** tone for limited-time promotions
- Use **Trendy** tone for new products
- Test different tones and track which gets most shares
- Update product images for better OG cards
- Connect Facebook/Instagram for auto-posting

### For Developers
- Monitor social API rate limits in production
- Check browser console for share button issues
- Test with real product data before deploying
- Verify Canvas rendering on production server
- Keep social access tokens fresh

### For Support
- Always check `.env` configuration first
- Look at backend logs for API errors
- Check browser console for frontend errors
- Verify product/merchant data in DB
- Test with curl before debugging frontend

---

## 🎓 Learning Resources

### Canvas Library
- [Canvas npm](https://www.npmjs.com/package/canvas)
- [Canvas API Docs](https://www.npmjs.com/package/canvas)
- [Drawing on Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

### Meta Graph API
- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Media Objects](https://developers.facebook.com/docs/instagram-api/reference/media)

### Web Share API
- [Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [Web Intent URLs](https://www.w3.org/TR/web-intents/)

---

## 📞 Support Contacts

### For Issues:
1. Check troubleshooting section above
2. Review error message carefully
3. Check `.env` configuration
4. Review SOCIAL_AD_FEATURE.md
5. Check backend logs
6. Check browser console

### Common Error Codes:
- **400:** Invalid request data (check payload)
- **401:** Invalid JWT token (reauthenticate)
- **403:** Ownership violation (wrong product owner)
- **404:** Resource not found (verify IDs)
- **500:** Server error (check logs)

---

## ✅ Validation Checklist Before Deployment

- [ ] All backend syntax passes `node --check`
- [ ] Web build completes without errors
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] Canvas module installs successfully
- [ ] Meta app configured for production
- [ ] Test all 15 API endpoints
- [ ] Test share buttons on mobile
- [ ] Test auto-posting with test accounts
- [ ] Verify OG images render
- [ ] Check performance metrics
- [ ] Review security checklist
- [ ] Setup monitoring/logging
- [ ] Train team on feature usage

---

## 🎯 Success Metrics to Track

1. **Usage Metrics**
   - Ad generation requests per day
   - Share clicks per platform
   - Auto-post success rate

2. **Engagement Metrics**
   - Checkout link clicks from shares
   - Conversion rate by platform
   - Avg time from share to purchase

3. **Quality Metrics**
   - OG image render time
   - Social API latency
   - Error rate

4. **User Satisfaction**
   - Feature adoption rate
   - Support tickets
   - User feedback

