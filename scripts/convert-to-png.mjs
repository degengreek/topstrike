import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, '../public/player-images');

const files = [
  'alexscott',
  'enzolefee',
  'mikkeldamsgaard'
];

console.log('🖼️  Converting WebP images to PNG...\n');

async function convertImages() {
  for (const fileName of files) {
    const inputFile = path.join(imagePath, `${fileName}.webp`);
    const outputFile = path.join(imagePath, `${fileName}.png`);

    try {
      await sharp(inputFile)
        .png()
        .toFile(outputFile);
      console.log(`✅ Converted: ${fileName}.webp → ${fileName}.png`);
    } catch (err) {
      console.error(`❌ Error converting ${fileName}:`, err.message);
    }
  }

  console.log('\n✅ All conversions complete!');
}

convertImages();
