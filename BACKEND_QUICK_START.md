# Backend Quick-Start: Fix Social Links Storage

**TL;DR**: Backend is not storing or returning social media links. This guide has all the code you need.

---

## The Issue

Frontend sends:
```json
PUT /api/settings
{
  "homepage": {
    "socialLinks": [
      { "platform": "Instagram", "url": "https://instagram.com/yourprofile", "icon": "Instagram" },
      { "platform": "Facebook", "url": "https://facebook.com/yourpage", "icon": "Facebook" },
      { "platform": "Linkedin", "url": "https://linkedin.com/company/yourcompany", "icon": "Linkedin" },
      { "platform": "Youtube", "url": "https://youtube.com/@yourchannel", "icon": "Youtube" }
    ]
  }
}
```

Backend **should** return the same data in response, but it's currently **returning empty/null**.

---

## Step 1: Update Settings Schema (5 min)

**File**: `models/Settings.js` or `models/settings.ts`

Find the `homepage` object in your schema and add this field:

```javascript
homepage: {
    type: {
        // ... existing fields ...
        socialLinks: [{
            platform: { 
                type: String, 
                enum: ['Facebook', 'Instagram', 'Linkedin', 'Youtube'],
                required: true 
            },
            url: String,
            icon: String
        }]
    },
    default: () => ({
        socialLinks: []
    })
}
```

**If using TypeScript**:
```typescript
interface ISocialLink {
    platform: 'Facebook' | 'Instagram' | 'Linkedin' | 'Youtube';
    url: string;
    icon: string;
}

interface IHomepage {
    // ... existing ...
    socialLinks: ISocialLink[];
}
```

---

## Step 2: Update Settings Controller (5 min)

**File**: `controllers/settingsController.js` or `controllers/settings.ts`

Replace your `PUT /api/settings` handler with this:

```javascript
exports.updateSettings = async (req, res) => {
    try {
        console.log("📥 Received update:", JSON.stringify(req.body, null, 2));
        
        // Verify user is admin
        if (req.user?.role !== 'Super Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Find or create settings document
        let settings = await Settings.findOne();
        
        if (!settings) {
            // If no settings exist, create new one
            settings = new Settings(req.body);
        } else {
            // Update existing settings
            // ⚠️ IMPORTANT: This line includes homepage.socialLinks
            Object.assign(settings, req.body);
        }

        // Save to database
        const saved = await settings.save();
        console.log("💾 Saved to DB:", JSON.stringify(saved, null, 2));

        // ⚠️ CRITICAL: Return the field in response
        res.json({
            success: true,
            message: "Settings updated successfully",
            data: saved.toObject()
        });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update settings",
            error: error.message
        });
    }
};
```

**Also add the GET handler** (if it doesn't exist):

```javascript
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = {};
        }

        res.json({
            success: true,
            data: settings.toObject ? settings.toObject() : settings
        });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch settings"
        });
    }
};
```

---

## Step 3: Verify Routes (2 min)

**File**: `routes/settings.js` or `routes/settings.ts`

Make sure your routes look like this:

```javascript
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Both routes should exist
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, updateSettings);

module.exports = router;
```

---

## Step 4: Check for Blockers (2 min)

### ❌ Check 1: Field Validation Middleware
Search your code for any middleware that validates allowed fields:

```javascript
// ❌ BAD - This will block socialLinks
const allowedFields = ['siteName', 'primaryColor', 'footerText'];

// ✅ GOOD - Include all fields or use 'homepage'
const allowedFields = [
    'siteName', 
    'primaryColor', 
    'homepage', // This covers nested socialLinks
    'rankingWeights'
];
```

### ❌ Check 2: Body Parser Settings
Make sure body parser can handle the JSON size:

```javascript
app.use(express.json({ limit: '50mb' })); // Should be fine
```

### ❌ Check 3: MongoDB Connection
Verify settings are actually being saved:

```javascript
// Run in MongoDB shell:
db.settings.findOne()
// Check if "homepage.socialLinks" exists and has data
```

---

## Step 5: Test It (5 min)

### Test with cURL:
```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Test Platform",
    "homepage": {
      "socialLinks": [
        {
          "platform": "Instagram",
          "url": "https://instagram.com/test",
          "icon": "Instagram"
        }
      ]
    }
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "siteName": "Test Platform",
    "homepage": {
      "socialLinks": [
        {
          "platform": "Instagram",
          "url": "https://instagram.com/test",
          "icon": "Instagram"
        }
      ]
    }
  }
}
```

### Check MongoDB:
```javascript
db.settings.findOne()
// Should show:
// { 
//   homepage: { 
//     socialLinks: [ ... ]  ← This should exist
//   }
// }
```

---

## Step 6: Verify from Frontend (3 min)

1. Go to Admin Settings in frontend
2. Go to **Homepage Settings** tab
3. Find **Social Media Links** section
4. Enter Instagram URL: `https://instagram.com/test`
5. Click **Deploy Config**
6. Look for 🔧 **Debug Information** button at top
7. Expand it
8. You should see:
   - ✈️ **SENT**: `[{ platform: 'Instagram', ... }]`
   - 📥 **RECEIVED**: `[{ platform: 'Instagram', ... }]` ← Should match!

If RECEIVED is empty, one of the steps above wasn't done correctly.

---

## Common Issues & Fixes

### Issue #1: "socialLinks is not defined"
**Fix**: Make sure schema field is spelled exactly `socialLinks` (camelCase)

### Issue #2: Return empty object instead of with socialLinks
**Fix**: Use `settings.toObject()` instead of `settings` when returning

### Issue #3: Middleware stripping the field
**Fix**: Check field whitelisting - either add field or use wildcard

### Issue #4: Schema validation error
**Fix**: Make sure enum values match: `['Facebook', 'Instagram', 'Linkedin', 'Youtube']`

---

## Files to Update

1. ✅ `models/Settings.js` - Add schema field
2. ✅ `controllers/settingsController.js` - Update PUT handler
3. ✅ `routes/settings.js` - Verify routes exist
4. ✅ Check middleware for field filtering

---

## Total Time: ~20 minutes

- Step 1 (Schema): 5 min
- Step 2 (Controller): 5 min  
- Step 3 (Routes): 2 min
- Step 4 (Blockers): 2 min
- Step 5 (Test): 5 min
- Step 6 (Verify): 3 min

---

## Questions?

1. Check logs - should see "📥 Received update:" and "💾 Saved to DB:"
2. Check MongoDB directly - run `db.settings.findOne()` 
3. Check frontend debug panel - it shows exactly what's being sent/received
4. Look in Network tab of browser DevTools - see actual request/response

That's it! Once you merge these changes, social links should work end-to-end.
