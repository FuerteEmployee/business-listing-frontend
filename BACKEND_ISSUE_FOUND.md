# 🔴 BACKEND ISSUE - Social Links Not Being Stored

## Problem Confirmed
Frontend sends social links to the backend, but the backend is NOT returning them in the response.

## How to Debug

1. **Go to Admin Settings** → Homepage Settings → Social Media Links
2. **Enter Instagram URL:** `https://instagram.com/yourprofile`
3. **Click "Deploy Config"**
4. **Look for the NEW Debug Panel** (black box at top) labeled "🔧 Debug Information"
5. **Click to expand** and compare:
   - ✈️ **SENT TO BACKEND**: Shows your Instagram URL
   - 📥 **RECEIVED FROM BACKEND**: Shows if it's empty/null
   - If they don't match = Backend issue ❌

## What the Backend Needs to Do

The Backend `/settings` endpoint (`PUT /api/settings`) must:

### ✅ Current Working:
- Saves site name, colors, emails, footer text
- Returns them in the response

### ❌ Currently Broken:
- NOT saving `homepage.socialLinks[]`
- NOT returning `homepage.socialLinks[]` in response

### The Fix Needed:

The backend needs to ensure that when this JSON is sent:

```json
{
  "homepage": {
    "socialLinks": [
      { "platform": "Instagram", "url": "https://instagram.com/profile", "icon": "Instagram" },
      { "platform": "Facebook", "url": "https://facebook.com/page", "icon": "Facebook" },
      { "platform": "Linkedin", "url": "https://linkedin.com/company", "icon": "Linkedin" },
      { "platform": "Youtube", "url": "https://youtube.com/@channel", "icon": "Youtube" }
    ]
  }
}
```

It is:
1. **Stored in the database** under `settings.homepage.socialLinks`
2. **Returned in the response** with the same data

## API Request/Response Format

### Request (PUT /api/settings)
```json
{
  "siteName": "...",
  "primaryColor": "...",
  "homepage": {
    "socialLinks": [
      { "platform": "Instagram", "url": "...", "icon": "Instagram" },
      { "platform": "Facebook", "url": "...", "icon": "Facebook" },
      { "platform": "Linkedin", "url": "...", "icon": "Linkedin" },
      { "platform": "Youtube", "url": "...", "icon": "Youtube" }
    ]
  }
}
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "homepage": {
      "socialLinks": [
        { "platform": "Instagram", "url": "...", "icon": "Instagram" },
        { "platform": "Facebook", "url": "...", "icon": "Facebook" },
        { "platform": "Linkedin", "url": "...", "icon": "Linkedin" },
        { "platform": "Youtube", "url": "...", "icon": "Youtube" }
      ]
    }
  }
}
```

## Backend Code Location

This is likely in:
- `/api/routes/settings.js` or `.ts`
- `/api/controllers/settingsController.js` or `.ts`
- The Settings model/schema

### Common Issues to Check

1. **Schema doesn't include socialLinks**
   - Add `socialLinks: Array` to the Settings schema

2. **Whitelist/AllowList filtering**
   - Make sure `homepage.socialLinks` is in the allowed fields list

3. **Middleware stripping the field**
   - Check if there's middleware removing unknown fields

4. **Database transaction not completing**
   - Ensure the save operation actually completes

## Temporary Frontend Workaround

The frontend now has:
- ✅ **localStorage backup** - Data is saved locally even if backend fails
- ✅ **Debug panel** - Clear visibility of the issue
- ✅ **Console logs** - Debugging information in browser DevTools

So the UI *appears* to work, but data won't persist across page refreshes unless the backend is fixed.

## Next Steps

1. Check backend `/settings` endpoint code
2. Verify the Settings model includes `homepage.socialLinks` 
3. Ensure the save operation includes this field
4. Test with the Debug Panel to confirm data round-trips correctly

---
**Status:** 🔴 **BLOCKED ON BACKEND**
- Frontend implementation: ✅ Complete
- Data persistence: ❌ Blocked - Backend configuration needed
