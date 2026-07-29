# Backend Fix: Social Links Not Being Stored/Returned

## Summary
The frontend is **correctly sending** social media links to `PUT /api/settings`, but the backend is **not storing them** in the database and **not returning them** in the response.

## Frontend Status ✅
- ✅ Sends: `PUT /api/settings` with `homepage.socialLinks[]`
- ✅ Expected Response: `data.data.homepage.socialLinks[]`
- ✅ Debug Panel: Visible for verification in Admin Settings → Homepage Settings
- ✅ LocalStorage Backup: Data saved locally as fallback

## Required Backend Changes

### 1. **Update Settings Schema** (CRITICAL)
The Settings model must include the `socialLinks` field.

**File**: `/backend/models/Settings.js` (or `.ts`)

```javascript
const settingsSchema = new Schema({
    siteName: String,
    primaryColor: String,
    secondaryColor: String,
    contactEmail: String,
    contactPhone: String,
    footerText: String,
    faviconUrl: String,
    logoUrl: String,
    rankingWeights: {
        reviews: { type: Number, default: 1.0 },
        distance: { type: Number, default: 1.0 },
        responseTime: { type: Number, default: 1.0 },
        premium: { type: Number, default: 1.5 }
    },
    homepage: {
        showHero: { type: Boolean, default: true },
        showRecentlyViewed: { type: Boolean, default: true },
        showBanners: { type: Boolean, default: true },
        showCategories: { type: Boolean, default: true },
        showDiscovery: { type: Boolean, default: true },
        showAds: { type: Boolean, default: true },
        showFeatured: { type: Boolean, default: true },
        showPopular: { type: Boolean, default: true },
        showLatest: { type: Boolean, default: true },
        showReviews: { type: Boolean, default: true },
        showCTA: { type: Boolean, default: true },
        showMobileApp: { type: Boolean, default: true },
        showFooter: { type: Boolean, default: true },
        footerText: String,
        footerSections: [{
            id: String,
            title: String,
            links: [{
                label: String,
                url: String,
                type: { type: String, enum: ['internal', 'external'] }
            }]
        }],
        heroTaglinePrefix: String,
        heroTaglineSuffix: String,
        countSource: String,
        fixedCount: String,
        searchPlaceholder: String,
        trendingSearches: [String],
        discoveryChips: [{
            id: String,
            name: String,
            slug: String,
            icon: String,
            color: String
        }],
        // 🔴 ADD THIS FIELD 🔴
        socialLinks: [{
            platform: { type: String, enum: ['Facebook', 'Instagram', 'Linkedin', 'Youtube'] },
            url: String,
            icon: String
        }]
    },
    // ... other fields
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
```

### 2. **Update Settings Controller** (CRITICAL)
Ensure the controller updates AND returns the `socialLinks` field.

**File**: `/backend/controllers/settingsController.js` (or `.ts`)

```javascript
// PUT /api/settings
exports.updateSettings = async (req, res) => {
    try {
        const { id, role } = req.user; // Assuming user is attached to req
        
        // 🔴 VERIFY ROLE: Only Super Admin should update settings
        if (role !== 'Super Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only Super Admin can update settings' 
            });
        }

        const updateData = req.body;
        console.log("📥 Received update data:", JSON.stringify(updateData, null, 2));

        // 🔴 CRITICAL: Don't filter out homepage.socialLinks
        // Find and update the settings document
        let settings = await Settings.findOne(); // Usually only one settings doc
        
        if (!settings) {
            // Create if doesn't exist
            settings = new Settings(updateData);
        } else {
            // Update existing
            // 🔴 ENSURE THIS INCLUDES homepage.socialLinks
            Object.assign(settings, updateData);
        }

        // Save to database
        const savedSettings = await settings.save();
        console.log("💾 Saved settings to DB:", JSON.stringify(savedSettings, null, 2));

        // 🔴 RETURN socialLinks IN RESPONSE
        res.json({
            success: true,
            message: "Settings updated successfully",
            data: {
                ...savedSettings.toObject(),
                // ENSURE THIS IS INCLUDED:
                homepage: {
                    ...savedSettings.homepage,
                    socialLinks: savedSettings.homepage?.socialLinks || [] // Critical!
                }
            }
        });

    } catch (error) {
        console.error("❌ Settings update error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update settings",
            error: error.message
        });
    }
};

// GET /api/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        if (!settings) {
            // Return defaults
            settings = {
                homepage: {
                    socialLinks: []
                }
            };
        }

        // 🔴 ENSURE socialLinks IS INCLUDED
        res.json({
            success: true,
            data: {
                ...settings.toObject(),
                homepage: {
                    ...settings.homepage,
                    socialLinks: settings.homepage?.socialLinks || []
                }
            }
        });

    } catch (error) {
        console.error("❌ Fetch settings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch settings"
        });
    }
};
```

### 3. **Check Settings Routes** (VERIFY)
Ensure the routes are correctly mapped.

**File**: `/backend/routes/settings.js` (or `.ts`)

```javascript
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// GET settings
router.get('/settings', authenticateToken, getSettings);

// PUT settings (update)
router.put('/settings', authenticateToken, updateSettings);

module.exports = router;
```

### 4. **Check for Middleware Issues** (VERIFY)
Make sure no middleware is stripping out the `homepage.socialLinks` field.

Common culprits:
- Field validation middleware that uses a whitelist
- Request body sanitization that removes unknown fields
- Middleware that validates against an old schema

**Example - Check your middleware:**
```javascript
// ❌ BAD - This will strip out socialLinks
const allowedFields = ['siteName', 'primaryColor', 'footerText']; // Missing socialLinks!

// ✅ GOOD - Include all fields
const allowedFields = [
    'siteName', 'primaryColor', 'secondaryColor', 
    'contactEmail', 'contactPhone', 'footerText',
    'homepage', // This includes nested socialLinks
    'rankingWeights'
];
```

## Testing the Fix

### 1. Start your dev server
```bash
npm start
```

### 2. Go to Admin Settings
- Navigate to: **Admin Panel** → **Settings** → **Homepage Settings**

### 3. Look for the Debug Panel
- Scroll to the top - you should see a black **"🔧 Debug Information"** button
- Click it to expand

### 4. Fill in Social Links
- In the **"SOCIAL MEDIA LINKS"** section, enter:
  - Instagram: `https://instagram.com/yourprofile`
  - Facebook: `https://facebook.com/yourpage`
  - LinkedIn: `https://linkedin.com/company/yourcompany`
  - YouTube: `https://youtube.com/@yourchannel`

### 5. Click "Deploy Config"

### 6. Check Debug Panel
- **✈️ SENT TO BACKEND**: Should show your URLs
- **📥 RECEIVED FROM BACKEND**: Should also show your URLs

If RECEIVED is empty/null, the backend still isn't working.

## Debugging Commands

### Check localStorage backup (if save fails but data was entered):
```javascript
// Run in browser console:
JSON.parse(localStorage.getItem('homepage_settings_backup')).socialLinks
```

### Check network request/response:
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Deploy Config"
4. Find the request to `/api/settings` (PUT)
5. Check the **Request Payload** → should include `homepage.socialLinks`
6. Check the **Response** → should include `data.data.homepage.socialLinks`

## Quick Checklist

- [ ] Settings schema includes `homepage.socialLinks` array
- [ ] Settings controller returns `homepage.socialLinks` in response
- [ ] No middleware is filtering/removing `homepage.socialLinks`
- [ ] Database document actually stores the field (check MongoDB directly)
- [ ] Both GET and PUT endpoints return the field
- [ ] Tested with Debug Panel and saw data round-trip correctly

## Expected Request Format (PUT /api/settings)
```json
{
  "siteName": "My Business Platform",
  "primaryColor": "#4f46e5",
  "homepage": {
    "showHero": true,
    "showRecentlyViewed": true,
    "socialLinks": [
      {
        "platform": "Instagram",
        "url": "https://instagram.com/yourprofile",
        "icon": "Instagram"
      },
      {
        "platform": "Facebook",
        "url": "https://facebook.com/yourpage",
        "icon": "Facebook"
      },
      {
        "platform": "Linkedin",
        "url": "https://linkedin.com/company/yourcompany",
        "icon": "Linkedin"
      },
      {
        "platform": "Youtube",
        "url": "https://youtube.com/@yourchannel",
        "icon": "Youtube"
      }
    ]
  }
}
```

## Expected Response Format (200 OK)
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "siteName": "My Business Platform",
    "primaryColor": "#4f46e5",
    "homepage": {
      "showHero": true,
      "showRecentlyViewed": true,
      "socialLinks": [
        {
          "platform": "Instagram",
          "url": "https://instagram.com/yourprofile",
          "icon": "Instagram"
        },
        // ... other platforms
      ]
    }
  }
}
```

## Still Not Working?

1. **Check Database Directly**
   ```mongodb
   db.settings.findOne()
   // Check if "homepage.socialLinks" exists and has data
   ```

2. **Check Logs**
   - Add `console.log()` statements in the controller
   - Verify the data is being received and processed

3. **Check Network**
   - DevTools → Network tab → PUT /api/settings
   - Verify request and response payloads

4. **Restart Backend**
   - Sometimes old code is still running
   - Kill and restart the Node.js process
