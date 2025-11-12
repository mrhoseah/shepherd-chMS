/**
 * Script to generate PWA icons from a source image
 * 
 * Usage:
 *   node scripts/generate-icons.js [source-image-path]
 * 
 * Requirements:
 *   npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = process.argv[2] || 'public/icon-source.png';
const outputDir = 'public/icons';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Source image not found: ${sourceImage}`);
  console.log('\n📝 To generate icons:');
  console.log('   1. Place your source icon (512x512 or larger) at:', sourceImage);
  console.log('   2. Run: node scripts/generate-icons.js');
  console.log('\n   Or specify a different source:');
  console.log('   node scripts/generate-icons.js path/to/your/icon.png');
  process.exit(1);
}

console.log(`🖼️  Generating icons from: ${sourceImage}`);
console.log(`📁 Output directory: ${outputDir}\n`);

// Generate icons for each size
Promise.all(
  sizes.map((size) => {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    return sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✅ Generated: icon-${size}x${size}.png`);
      })
      .catch((error) => {
        console.error(`❌ Error generating icon-${size}x${size}.png:`, error.message);
      });
  })
)
  .then(() => {
    console.log('\n✨ All icons generated successfully!');
  })
  .catch((error) => {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  });

