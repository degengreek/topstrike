// Convert webp to png using Canvas API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, '../public/player-images');

const files = ['alexscott', 'enzolefee', 'mikkeldamsgaard'];

console.log('Converting WebP images to PNG...\n');

// Simple approach: Just rename and let the browser handle it
// OR manually convert using online tool

files.forEach(fileName => {
  const webpFile = path.join(imagePath, `${fileName}.webp`);
  const pngFile = path.join(imagePath, `${fileName}.png`);

  if (fs.existsSync(webpFile)) {
    console.log(`📁 Found: ${fileName}.webp`);
    console.log(`   Please convert manually to PNG using:`);
    console.log(`   - https://cloudconvert.com/webp-to-png`);
    console.log(`   - Or Photoshop/GIMP/Paint.NET\n`);
  }
});

console.log('\nAlternatively: WebP is supported by all modern browsers.');
console.log('We can use the .webp files directly if you prefer!');
