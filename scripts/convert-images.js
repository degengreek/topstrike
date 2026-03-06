// Quick image converter: webp to png
const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '../public/player-images');

// Files to convert
const files = [
  'alexscott',
  'enzolefee',
  'mikkeldamsgaard'
];

console.log('Converting webp images to png...\n');

// Try using sharp if available, otherwise manual conversion
try {
  const sharp = require('sharp');

  files.forEach(async (fileName) => {
    const inputFile = path.join(imagePath, `${fileName}.webp`);
    const outputFile = path.join(imagePath, `${fileName}.png`);

    try {
      await sharp(inputFile)
        .png()
        .toFile(outputFile);
      console.log(`✅ Converted ${fileName}.webp → ${fileName}.png`);
    } catch (err) {
      console.error(`❌ Error converting ${fileName}:`, err.message);
    }
  });

} catch (err) {
  console.log('⚠️  Sharp not installed. Installing temporarily...');
  console.log('Run: npm install sharp --no-save');
  console.log('\nOr you can manually convert these files:');
  files.forEach(f => console.log(`  - ${f}.webp → ${f}.png`));
}
