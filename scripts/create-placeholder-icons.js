/**
 * Creates simple placeholder PWA icons
 * These are basic colored squares that can be replaced later with your actual logo
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = 'public/icons';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a simple SVG template
function createSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1E40AF"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ChMS</text>
</svg>`;
}

console.log('🎨 Creating placeholder PWA icons...\n');

sizes.forEach((size) => {
  const svg = createSVG(size);
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  // For now, we'll create SVG files that can be converted to PNG
  // Users can convert these using ImageMagick or online tools
  const svgPath = path.join(outputDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created: icon-${size}x${size}.svg`);
});

console.log('\n📝 Note: These are SVG placeholders.');
console.log('   To convert to PNG, you can:');
console.log('   1. Use an online SVG to PNG converter');
console.log('   2. Use ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('   3. Replace with your actual church logo/icon\n');
console.log('   Or install sharp and use the generate-icons.js script with a source image.');

