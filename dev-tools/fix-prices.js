// fix-prices.js
// Run with: node fix-prices.js
// Reads data/items.json, converts string prices to {gp, sp, cp} objects, writes in place.

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'items.json');
const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let fixed = 0;
let skipped = 0;

function parseStringPrice(str) {
  if (!str || typeof str !== 'string') return null;
  const result = {};
  const gp = str.match(/(\d+(?:\.\d+)?)\s*gp/i);
  const sp = str.match(/(\d+(?:\.\d+)?)\s*sp/i);
  const cp = str.match(/(\d+(?:\.\d+)?)\s*cp/i);
  if (!gp && !sp && !cp) return null; // unrecognised format, leave alone
  if (gp) result.gp = parseFloat(gp[1]);
  if (sp) result.sp = parseFloat(sp[1]);
  if (cp) result.cp = parseFloat(cp[1]);
  return result;
}

const updated = items.map(item => {
  if (!item.price || typeof item.price !== 'string') return item;
  const parsed = parseStringPrice(item.price);
  if (!parsed) {
    console.warn(`  Skipped unrecognised price on "${item.name}": "${item.price}"`);
    skipped++;
    return item;
  }
  fixed++;
  return { ...item, price: parsed };
});

fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
console.log(`Done. Fixed: ${fixed}, Skipped: ${skipped}, Total: ${items.length}`);
