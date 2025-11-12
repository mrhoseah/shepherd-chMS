# Progressive Web App (PWA) Setup

Your Church Management System is now configured as a Progressive Web App (PWA)! This allows users to install the app on their devices (phones, tablets, desktops) for a native app-like experience.

## ✅ What's Already Configured

- ✅ Service Worker for offline functionality
- ✅ Web App Manifest
- ✅ PWA meta tags
- ✅ Install prompt component
- ✅ Basic caching strategy

## 📱 Installing the App

### For Users:

1. Visit the website on a supported device
2. Look for the install prompt (appears after a few seconds)
3. Or use browser menu:
   - **Chrome/Edge (Android)**: Tap the menu (⋮) → "Install app" or "Add to Home screen"
   - **Safari (iOS)**: Tap Share button → "Add to Home Screen"
   - **Chrome/Edge (Desktop)**: Click the install icon in the address bar

### Features:

- **Offline Access**: Basic pages work offline
- **Fast Loading**: Cached resources load instantly
- **App-like Experience**: Runs in standalone mode (no browser UI)
- **Home Screen Icon**: Appears on device home screen

## 🎨 Adding Your App Icons

Currently, placeholder SVG icons are in `public/icons/`. You need to convert them to PNG format.

### Option 1: Using Your Logo

1. Prepare a square logo (512x512 pixels or larger, PNG format)
2. Place it at `public/icon-source.png`
3. Install sharp: `npm install sharp`
4. Run: `node scripts/generate-icons.js`

### Option 2: Manual Conversion

1. Use an online tool like [CloudConvert](https://cloudconvert.com/svg-to-png) or [Convertio](https://convertio.co/svg-png/)
2. Convert each SVG file in `public/icons/` to PNG
3. Keep the same filename (e.g., `icon-192x192.png`)

### Option 3: Using ImageMagick

```bash
# Install ImageMagick first, then:
cd public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert icon-${size}x${size}.svg icon-${size}x${size}.png
done
```

### Required PNG Files:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` ⭐ (Required)
- `icon-384x384.png`
- `icon-512x512.png` ⭐ (Required)

## 🔧 Configuration

### Updating App Name/Description

Edit `public/manifest.json`:

```json
{
  "name": "Your Church Name - CMS",
  "short_name": "CMS",
  "description": "Your description here"
}
```

### Changing Theme Color

1. Update `theme_color` in `public/manifest.json`
2. Update `themeColor` in `app/layout.tsx` (generateMetadata function)

### Customizing Service Worker

Edit `public/sw.js` to customize caching behavior.

## 🧪 Testing PWA

### Chrome DevTools:

1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Test "Service Workers"
5. Use "Lighthouse" to audit PWA features

### Testing Install Prompt:

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Visit on a supported browser
4. The install prompt should appear

## 📝 Notes

- Service Worker only registers in **production mode** (`npm run build && npm start`)
- Icons must be PNG format (not SVG) for PWA
- HTTPS is required for PWA features (except localhost)
- The install prompt only appears on supported browsers/devices

## 🐛 Troubleshooting

### Install prompt not showing?

- Make sure you're in production mode
- Check browser console for errors
- Verify manifest.json is accessible at `/manifest.json`
- Ensure service worker is registered (check Application tab)

### Icons not showing?

- Verify PNG files exist in `public/icons/`
- Check file sizes match manifest.json
- Clear browser cache and reload

### Service Worker not working?

- Check browser console for errors
- Verify `public/sw.js` exists
- Ensure you're using HTTPS (or localhost)

## 🚀 Next Steps

1. **Add your icons**: Convert SVG placeholders to PNG
2. **Customize manifest**: Update app name, description, theme color
3. **Test installation**: Build and test on different devices
4. **Optimize caching**: Customize service worker for your needs

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

