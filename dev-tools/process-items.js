const fs = require('fs');
const path = require('path');

const sourceFolder = path.join(__dirname, '../../pf2e-14-dev/packs/pf2e/equipment');
const outputFile = path.join(__dirname, '../data/items.json');

const files = fs.readdirSync(sourceFolder)
  .filter(f => f.endsWith('.json'));


// creates an array of files found in ../packs/pf2e/equipment
const items = files.map(f => {
    const raw = fs.readFileSync(path.join(sourceFolder, f), 'utf8');
    return JSON.parse(raw);
});


// creates a new .json file of those items with only the descriptors we need
const cleaned = items
    .filter(item => item.system?.level?.value !== undefined)
    .map(item => ({
        id: item._id,
        name: item.name,
        img: item.img,
        type: item.type,
        category: item.system.category,
        level: item.system.level.value,
        price: item.system.price.value,
        bulk: item.system.bulk.value,
        rarity: item.system.traits.rarity,
        traits: item.system.traits.value,
        source: item.system.publication.title,
        description: item.system.description.value
    }));

    fs.writeFileSync(outputFile, JSON.stringify(cleaned, null, 2));