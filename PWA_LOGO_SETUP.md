# How to Add Your Logo to the PWA

Your FS Sports Club logo is ready to be used! Follow these simple steps:

## Quick Method (Recommended)

### Step 1: Save the Logo
Save the uploaded logo image as `logo.png` in the `public/` folder of your project.

### Step 2: Generate Icons

**Option A - Using Online Tool (No Installation Required):**
1. Go to [https://www.websiteplanet.com/webtools/favicon-generator/](https://www.websiteplanet.com/webtools/favicon-generator/)
2. Upload your `logo.png`
3. Download the generated icons
4. Rename them:
   - Android icon 192x192 → `icon-192.png`
   - Android icon 512x512 → `icon-512.png`
5. Replace the existing `icon-192.png` and `icon-512.png` in the `public/` folder

**Option B - Using the Automated Script:**
```bash
# Install sharp for image processing
npm install sharp --save-dev

# Save your logo as public/logo.png first, then run:
node scripts/generate-icons.js
```

**Option C - Manual Resize:**
1. Use any image editor (Photoshop, GIMP, etc.)
2. Resize the logo to 192x192 pixels, save as `icon-192.png`
3. Resize the logo to 512x512 pixels, save as `icon-512.png`
4. Save both in the `public/` folder

### Step 3: Deploy
After replacing the icons, commit and push:
```bash
git add public/icon-192.png public/icon-512.png
git commit -m "Update PWA icons with FS Sports Club logo"
git push
```

## What's Already Configured

✅ `manifest.json` is already set up to use these icons  
✅ PWA settings are configured  
✅ Theme colors match your brand (emerald green)  

## File Locations
- Icons should be in: `/public/`
  - `icon-192.png` - Small icon (192x192)
  - `icon-512.png` - Large icon (512x512)
- Manifest: `/public/manifest.json`

## Testing
After deploying, you can test the PWA:
1. Open your site on mobile
2. Look for "Add to Home Screen" option
3. Your new logo should appear!

---

**Current App Name:** FS Sports Club - Turf Booking  
**Short Name:** FS Sports  
**Theme Color:** #10b981 (Emerald Green)
