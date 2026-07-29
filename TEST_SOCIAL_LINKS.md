# Social Media Links - Testing Guide

## Debug Steps

### 1. Open Browser DevTools
- Press `F12` → Go to **Console** tab
- You'll see all the 🔗📤📥 logs

### 2. Test in Admin Settings
1. Go to: `http://localhost:5173/admin/settings`
2. Click on **"Homepage Settings"** tab
3. Scroll to **"SOCIAL MEDIA LINKS"** section
4. Fill in the social media URLs:
   ```
   Instagram: https://instagram.com/yourprofile
   Facebook: https://facebook.com/yourpage
   LinkedIn: https://linkedin.com/company/yourcompany
   YouTube: https://youtube.com/@yourchannel
   ```
5. Click **"Deploy Config"** button

### 3. Check Console Logs (in order)
Look for these logs appearing:
```
💾 Backed up to localStorage: {socialLinks: [...]}
📤 Sending to API: {...}
📥 API Response: {...}
✅ Settings saved successfully
```

### 4. Check Network Tab
- Press `F12` → **Network** tab
- Click **"Deploy Config"** again
- Look for a `PUT` request to `/settings`
- Click on it → **Response** tab
- Check if `homepage.socialLinks` is in the response

### 5. Test localStorage Fallback
Run this in console:
```javascript
// Check if data was backed up to localStorage
console.log(JSON.parse(localStorage.getItem('homepage_settings_backup')).socialLinks);

// This should show your configured social links
```

### 6. Check Homepage Footer
1. Go to homepage: `http://localhost:5173/`
2. Scroll to footer
3. Check console logs:
   ```
   🔗 Footer received settings: {...}
   🔗 Social links from API: [...]
   ```
4. Social media icons should appear clickable in the footer

## If Icons Don't Show

Run this in console to force load from localStorage:
```javascript
const backup = JSON.parse(localStorage.getItem('homepage_settings_backup'));
console.log('Social links in localStorage:', backup.socialLinks);
```

If this shows your social links but the footer doesn't display them, the issue is **backend not storing the data**.

## Expected Behavior

✅ **Working:**
- Input fields accept URLs
- Console shows all logs ✓
- localStorage has the data ✓
- Footer shows social icons and they're clickable ✓

❌ **Issue - Backend Not Storing:**
- Console shows: `📥 API Response` but `socialLinks` is missing or empty
- localStorage has the data but homepage footer doesn't show it
- API saves other settings (site name, etc) but not social links

## API Endpoint Being Called

```
PUT http://localhost:4597/api/settings
```

The backend needs to accept and store:
```json
{
  "homepage": {
    "socialLinks": [
      { "platform": "Instagram", "url": "...", "icon": "Instagram" },
      // ... more
    ]
  }
}
```

## Report Issues
If you see any errors, share:
1. What the console shows
2. The full API Response JSON
3. Whether localStorage has the data
