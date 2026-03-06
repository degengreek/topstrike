import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../public/player-database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const missing = db.filter(p => !p.imageUrl || !p.position || !p.team);

console.log('🔍 Players with Missing Data\n');
console.log('='.repeat(80));
console.log(`Total: ${missing.length} out of ${db.length} players\n`);

missing.forEach((player, index) => {
  const issues = [];
  if (!player.imageUrl) issues.push('❌ No Image');
  if (!player.position) issues.push('❌ No Position');
  if (!player.team) issues.push('❌ No Team');

  console.log(`${index + 1}. [ID: ${player.id}] ${player.name}`);
  console.log(`   ${issues.join(' | ')}`);
  console.log(`   Search: https://www.thesportsdb.com/search.php?s=${encodeURIComponent(player.name)}`);
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Summary:`);
console.log(`   Missing images: ${db.filter(p => !p.imageUrl).length}`);
console.log(`   Missing position: ${db.filter(p => !p.position).length}`);
console.log(`   Missing team: ${db.filter(p => !p.team).length}`);
console.log(`   Complete data: ${db.filter(p => p.imageUrl && p.position && p.team).length}`);
