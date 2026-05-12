const fs = require('fs');
const path = require('path');

const sourceFolder = path.join(__dirname, '../../pf2e-14-dev/packs/pf2e/equipment');
const outputFile = path.join(__dirname, '../data/items.json');

const files = fs.readdirSync(sourceFolder)
  .filter(f => f.endsWith('.json'));

// console.log(`Found ${files.length} files`);

const items = files.map(f => {
    const raw = fs.readFileSync(path.join(sourceFolder, f), 'utf8');
    return JSON.parse(raw);
});

console.log(`Loaded ${items.length} items`);
console.log('First item name:', items[0].name);