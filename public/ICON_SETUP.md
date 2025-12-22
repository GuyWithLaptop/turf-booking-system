# PWA Icon Setup Instructions

## Steps to Add the Logo as PWA Icon:

1. **Save the logo image**:
   - Save the uploaded logo as `logo.png` in the `/public` directory

2. **Generate icon sizes** (use an online tool or command):
   
   ### Option A: Online Tool (Easiest)
   - Go to https://www.websiteplanet.com/webtools/favicon-generator/
   - Upload your logo.png
   - Download the generated icons
   - Rename them to `icon-192.png` and `icon-512.png`
   - Replace the existing files in `/public`

   ### Option B: Using ImageMagick (if installed)
   ```bash
   convert logo.png -resize 192x192 icon-192.png
   convert logo.png -resize 512x512 icon-512.png
   ```

   ### Option C: Using online image resizer
   - Go to https://imageresizer.com/
   - Upload logo.png
   - Resize to 192x192, download as icon-192.png
   - Resize to 512x512, download as icon-512.png

3. The manifest.json is already configured to use these icons!

## Current Configuration:
The manifest.json already references:
- icon-192.png (192x192)
- icon-512.png (512x512)

Just replace these files with your logo in the correct sizes.
