# Go! Merchants Go!

Go! Merchants Go! (GMG) is a lightning-fast, offline merchant generator for Paizo's Pathfinder 2nd Edition. It removes the need to spend your precious prep time poring through multiple sourcebooks to find interesting and relevant items for your players to derail your campaign with. Paizo's 5,600+ item catalog is already included — old classics like Longsword and Lesser Healing Potion, plus a ton of kit you didn't know existed.

Use it during pre-session planning or on the fly at the table. It's dead simple, crazy fast, and requires nothing but the browser you're already using.

> **Go! Merchants Go! is not published, endorsed, or specifically approved by Paizo Inc.**

---

## Features

- **Smart generation** — settlement size, economy, store type, ancestry, stocking style, arcane tilt, pricing modifier, and rarity filters all influence what ends up on the shelf
- **5,600+ items built in** — the entire Pathfinder 2E item catalog, no importing required
- **Firearms support** — guns are tagged and available as a dedicated store type
- **Expandable inventory** — add specific items to any merchant, modify quantities, or remove items entirely after generation
- **Item descriptions** — click any item to expand a full description panel with traits, stats, and source text
- **Homebrew support** — create items from scratch or copy and modify any existing item non-destructively
- **Save, import, and export** — back up your merchants and custom items as JSON, or share them with other GMs
- **Persistent defaults** — save your preferred generator settings so every new merchant starts where you want
- **Sample merchants** — four pre-generated merchants are ready the first time you open the app
- **No dependencies, no logins, no tracking** — GMG works offline and stores everything locally in your browser

---

## Installation

1. Download the latest release zip from the [Releases page](https://github.com/codeguy1134/gomerchantgo/releases)
2. Extract it anywhere you like
3. Open `index.html` in your browser

That's it. No install, no server, no account.

---

## Usage

### Merchants
The Merchants tab lists all your saved merchants. Hit **New Merchant** to open the generator form, where you can set:

- **Name** — optional; leave blank for an unnamed merchant
- **Settlement size** — controls the maximum item level (Village → 4, Town → 8, City → 14, Metropolis → 20)
- **Economy** — influences item quantity and category bias (Trade Hub, Academic, Arcane, Divine, Military, Frontier)
- **Ancestry** — filters items to those with matching ancestry traits
- **Store type** — focuses the inventory (Blacksmith, Alchemist, Arcane Goods, Divine Goods, General Store, Ranged Weapons, or Any)
- **Stocking style** — controls the number and quality of items (Broad, Focused, or Curated)
- **Arcane tilt** — weights the pool toward magical or mundane items
- **Pricing modifier** — adjusts displayed prices from −50% to +100%
- **Rarity** — include Common, Uncommon, Rare, and/or Unique items

Hit **Generate**. The result screen shows the merchant's inventory grouped by category, with currency on hand and item count. From here you can:

- **Save** the merchant to your list
- **Regenerate** using the same parameters for a fresh roll
- **Add Item** to manually add any item from the full catalog with a custom quantity
- **Modify Quantities** to edit any item's quantity inline, or remove items entirely
- Group and sort the inventory by category, rarity, or flat list; by level, price, or name
- Click any item to expand its full description

### Custom Items
The Custom Items tab lists your homebrew and modified items. Use **New Item** to create something from scratch, or **Create from Existing** to find an item in the catalog and copy it as a starting point. Modifications are non-destructive — the original item always remains in the catalog.

Custom items appear in the generator pool alongside published items, so your homebrew content shows up naturally in merchant inventories.

### Settings
Set persistent defaults for the generator so every new merchant starts with your preferred parameters. Changes only take effect after hitting **Save Defaults**.

The **Data** section lets you:
- Update the item database from GitHub with one click
- Export and import merchants and custom items as JSON for backup or sharing
- Reset all stored data (this cannot be undone — export first)

---

## Screenshots

[Merchant generation screen.](images/merchant-creation.png)

[Generated Merchant screen.](images/random-merchant.png)

[New Item screen.](images/new-item.png)

[Custom Item screen](images/custom-items.png)
---

## Data & Storage

> ⚠️ **Go! Merchants Go! stores all merchant and custom item data in your browser's localStorage.** Clearing your browser cache, cookies, or site data — or using the Reset button — will permanently delete everything. **Export your data regularly.**

Item data lives in `data/items.json`, `data/firearms.json`, and `data/ancestries.json`. These are read-only at runtime. The only file that updates over the network is `items.json`, and only when you explicitly click **Update** in Settings.

---

## Power Users

All data files are plain JSON. If you're comfortable in a text editor, you can inspect or edit them directly. A few things to keep in mind:

- `items.json` is large and dense. Any manual edits **will be overwritten** the next time you update from GitHub.
- `firearms.json` is the safe place to add new firearms — it's a simple list of item names that get patched onto the main item pool at load time, and it survives updates.
- Custom items created in the app are assigned UUIDs automatically. If you create items directly in JSON, use an online UUID generator to avoid conflicts.

---

## Contributing

The repo is currently private while the app is in early development. Contributions, bug reports, and feature requests will be welcome once it goes public.

---

## Legal

### ORC Notice

This product is licensed under the ORC License located at the Library of Congress at TX 9-307-067 and available online at [paizo.com/orclicense](https://paizo.com/orclicense), [azoralaw.com/orclicense](https://azoralaw.com/orclicense), and others. All warranties are disclaimed as set forth therein.

### Attribution Notice

This product is based on Licensed Material from the Pathfinder Second Edition product line, © Paizo Inc. The item data included in Go! Merchants Go! is drawn from across the full range of Pathfinder 2nd Edition publications. For the complete list of Paizo publications and their associated authors and copyright notices, visit [paizo.com](https://paizo.com).

Paizo, the Paizo golem logo, Pathfinder, and the Pathfinder logo are trademarks of Paizo Inc. Go! Merchants Go! is not published, endorsed, or specifically approved by Paizo Inc.

If you use our Licensed Material in your own published work, please credit us as follows:

*Go! Merchants Go! © 2026, Harrier Studios.*

### Reserved Material

Reserved Material elements in this product include, but may not be limited to: the name "Go! Merchants Go!", the name "Harrier Studios", and all original application code, design, and visual assets not derived from Paizo Licensed Material.

### Expressly Designated Licensed Material

This product contains no Expressly Designated Licensed Material.
---

*Made with too much coffee by Harrier Studios.*
