# PWA Icons

This directory contains the Progressive Web App (PWA) icons.

## Required Icons

The following icon sizes are required for PWA support:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (required)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (required)

## Generating Icons

You can generate these icons from a single source image (recommended: 512x512 or larger) using:

1. **Online Tools:**
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

2. **Command Line:**
   ```bash
   # Using ImageMagick (if installed)
   convert source-icon.png -resize 192x192 icon-192x192.png
   convert source-icon.png -resize 512x512 icon-512x512.png
   ```

3. **Using Node.js script:**
   ```bash
   npm install sharp
   node scripts/generate-icons.js
   ```

## Icon Guidelines

- Use a square image (1:1 aspect ratio)
- Recommended size: 512x512 pixels or larger
- Format: PNG with transparency
- Design should be simple and recognizable at small sizes
- Use your church logo or a simplified version

## Temporary Placeholder

If you don't have icons yet, you can use a simple colored square or your church logo. The app will still work, but users won't see a custom icon when installing the PWA.

