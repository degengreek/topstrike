import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/player-database.json'), 'utf-8'));
const verifiedData = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/player-data.json'), 'utf-8'));

const missing = db.filter(p => !p.imageUrl || !p.position || !p.team);

const reallyMissing = [];
const hasVerified = [];

missing.forEach(player => {
  if (player.name.includes('DO NOT BUY')) return;

  const verified = verifiedData.players[player.name];

  if (verified && verified.verified) {
    hasVerified.push({ ...player, verifiedData: verified });
  } else {
    reallyMissing.push(player);
  }
});

console.log('✅ HAS VERIFIED DATA (needs sync to cache):\n');
hasVerified.forEach(p => {
  console.log(`[ID: ${p.id}] ${p.name}`);
  console.log(`  Verified: ${p.verifiedData.position} at ${p.verifiedData.team}`);
});

console.log('\n❌ TRULY MISSING (no verified data anywhere):\n');
reallyMissing.forEach(p => {
  const issues = [];
  if (!p.imageUrl) issues.push('No Image');
  if (!p.position) issues.push('No Position');
  if (!p.team) issues.push('No Team');
  console.log(`[ID: ${p.id}] ${p.name} - ${issues.join(', ')}`);
});

console.log(`\n📊 Summary:`);
console.log(`  Has verified data (needs sync): ${hasVerified.length}`);
console.log(`  Truly missing: ${reallyMissing.length}`);
