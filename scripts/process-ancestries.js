const fs = require('fs');
const path = require('path');

const ANCESTRY_DIR = '/home/chris/Documents/pf2e-14-dev/packs/pf2e/ancestries/';
const OUTPUT_FILE = path.join(__dirname, '../data/ancestries.json');

function processAncestries() {
  const files = fs.readdirSync(ANCESTRY_DIR).filter(f => f.endsWith('.json'));
  
  const ancestries = files
    .map(file => {
      try {
        const raw = fs.readFileSync(path.join(ANCESTRY_DIR, file), 'utf8');
        const data = JSON.parse(raw);
        return data.name;
      } catch (err) {
        console.error(`Failed to read ${file}:`, err);
        return null;
      }
    })
    .filter(Boolean)
    .sort();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(ancestries, null, 2));
  console.log(`Wrote ${ancestries.length} ancestries to data/ancestries.json`);
}

processAncestries();