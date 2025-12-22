#!/usr/bin/env node

/**
 * Icon Generator Script
 * This script helps generate PWA icons from a source logo
 * 
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Place your logo as 'public/logo.png'
 * 3. Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    
    const logoPath = path.join(__dirname, '../public/logo.png');
    
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo not found at public/logo.png');
      console.log('\n📝 Please:');
      console.log('1. Save your logo as public/logo.png');
      console.log('2. Run this script again');
      return;
    }

    console.log('🎨 Generating PWA icons from logo...\n');

    // Generate 192x192 icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '../public/icon-192.png'));
    console.log('✅ Generated icon-192.png');

    // Generate 512x512 icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '../public/icon-512.png'));
    console.log('✅ Generated icon-512.png');

    console.log('\n🎉 PWA icons generated successfully!');
    console.log('\nThe following icons were created:');
    console.log('  - public/icon-192.png (192x192)');
    console.log('  - public/icon-512.png (512x512)');
    console.log('\nYour PWA is now ready with the new logo!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Sharp module not found.\n');
      console.log('To use this script, install sharp:');
      console.log('  npm install sharp --save-dev\n');
      console.log('Or use an online tool to resize your logo:');
      console.log('  1. Go to https://www.iloveimg.com/resize-image');
      console.log('  2. Upload public/logo.png');
      console.log('  3. Resize to 192x192, save as icon-192.png');
      console.log('  4. Resize to 512x512, save as icon-512.png');
      console.log('  5. Place both files in the public/ directory');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();
