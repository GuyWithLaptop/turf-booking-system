# Building Android APK from PWA

This guide will help you convert your PWA into a downloadable Android APK using Bubblewrap.

## Prerequisites

- Node.js installed
- Java JDK 11+ installed
- Android SDK installed

## Step 1: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

## Step 2: Initialize TWA Project

```bash
bubblewrap init --manifest https://turf-booking-system-ahbj.onrender.com/manifest.json
```

## Step 3: Build the APK

```bash
bubblewrap build
```

## Step 4: Sign the APK (for production)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Sign the APK:
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk my-key-alias
```

3. Align the APK:
```bash
zipalign -v 4 app-release-unsigned.apk TurfBooking.apk
```

## Alternative: Use PWABuilder

1. Go to https://www.pwabuilder.com/
2. Enter your URL: `https://turf-booking-system-ahbj.onrender.com`
3. Click "Build My PWA"
4. Select "Android" platform
5. Configure options:
   - Package ID: `com.turfbooking.app`
   - App name: `Turf Booking System`
   - Version: `1.0.0`
6. Download the generated APK

## Alternative: Use CloudAPK

1. Go to https://www.cloudapk.com/
2. Enter your URL: `https://turf-booking-system-ahbj.onrender.com`
3. Fill in app details
4. Click "Generate APK"
5. Download the APK

## Testing the APK

1. Transfer APK to Android device
2. Enable "Install from Unknown Sources" in Settings
3. Install the APK
4. Launch the app

## Publishing to Google Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Prepare store listing (screenshots, description, icon)
3. Upload signed APK
4. Fill out content rating questionnaire
5. Set pricing and distribution
6. Submit for review

## App Configuration

The app uses these PWA features:
- **Offline Support**: Service Worker caches key pages
- **Push Notifications**: Booking reminders and alerts
- **Install Prompt**: Add to Home Screen
- **Background Sync**: Sync bookings when back online

## Notification Features

The app sends notifications for:
- Booking reminders (1 hour before)
- New booking confirmations
- Booking updates

## Requirements for APK

1. HTTPS enabled (✅ Already done with Render)
2. Valid manifest.json (✅ Already configured)
3. Service Worker registered (✅ Already implemented)
4. Icons (192x192, 512x512) (⚠️ Update with your logo)

## Update Icons

Replace these files with your branded icons:
- `/public/icon-192.png`
- `/public/icon-512.png`

Recommended tool: https://realfavicongenerator.net/
