(function (global) {
  "use strict";

  /** @typedef {{ name: string, category: string, level: number, priceGp: number, rarity: string, bulk?: string, tags?: { locations?: string[], affinities?: string[], notes?: string } }} CatalogItem */

  /** @type {CatalogItem[]} */
  const items = [];

  function add(it) {
    items.push(it);
  }

  // --- Adventuring & tools ---
  add({ name: "Backpack", category: "adventuring", level: 0, priceGp: 1, rarity: "common", bulk: "L" });
  add({ name: "Bedroll", category: "adventuring", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Rope (50 ft.)", category: "adventuring", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Torch", category: "adventuring", level: 0, priceGp: 0.01, rarity: "common" });
  add({ name: "Flint and steel", category: "adventuring", level: 0, priceGp: 0.05, rarity: "common" });
  add({ name: "Waterskin", category: "adventuring", level: 0, priceGp: 0.05, rarity: "common" });
  add({ name: "Soap", category: "adventuring", level: 0, priceGp: 0.02, rarity: "common", tags: { affinities: ["comfort"] } });
  add({ name: "Tent (two-person)", category: "adventuring", level: 0, priceGp: 4, rarity: "common", bulk: "L" });
  add({ name: "Grappling hook", category: "adventuring", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Crowbar", category: "tools", level: 0, priceGp: 0.5, rarity: "common" });
  add({ name: "Hammer", category: "tools", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Pick", category: "tools", level: 0, priceGp: 0.2, rarity: "common", tags: { locations: ["mining", "underground"], affinities: ["underground", "craft"] } });
  add({ name: "Spade", category: "tools", level: 0, priceGp: 0.5, rarity: "common" });
  add({ name: "Thieves' tools", category: "tools", level: 0, priceGp: 3, rarity: "common", tags: { affinities: ["urban"] } });
  add({ name: "Artisan's tools (blacksmith)", category: "tools", level: 0, priceGp: 4, rarity: "common", tags: { affinities: ["craft"] } });
  add({ name: "Artisan's tools (carpenter)", category: "tools", level: 0, priceGp: 4, rarity: "common" });
  add({ name: "Artisan's tools (leather)", category: "tools", level: 0, priceGp: 4, rarity: "common", tags: { affinities: ["craft"] } });
  add({ name: "Repair kit", category: "tools", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Writing set", category: "tool_scholarly", level: 0, priceGp: 1, rarity: "common", tags: { affinities: ["scholarly"] } });
  add({ name: "Magnifying glass", category: "tool_scholarly", level: 3, priceGp: 40, rarity: "common" });
  add({ name: "Spyglass", category: "tool_scholarly", level: 4, priceGp: 20, rarity: "common", tags: { locations: ["coastal"] } });
  add({ name: "Compass", category: "tool_scholarly", level: 2, priceGp: 10, rarity: "common" });
  add({ name: "Bull's eye lantern", category: "adventuring", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Hooded lantern", category: "adventuring", level: 0, priceGp: 0.7, rarity: "common" });
  add({ name: "Oil (1 pint)", category: "adventuring", level: 0, priceGp: 0.01, rarity: "common" });
  add({ name: "Chalk (10 sticks)", category: "adventuring", level: 0, priceGp: 0.01, rarity: "common" });
  add({ name: "Mirror (hand)", category: "adventuring", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Manacles (simple)", category: "adventuring", level: 0, priceGp: 3, rarity: "common", tags: { affinities: ["military", "urban"] } });
  add({ name: "Goggles (smoke)", category: "adventuring", level: 0, priceGp: 0.5, rarity: "common", tags: { affinities: ["industrial"] } });

  // --- Containers ---
  add({ name: "Sack (cloth)", category: "containers", level: 0, priceGp: 0.01, rarity: "common" });
  add({ name: "Chest (wooden)", category: "containers", level: 0, priceGp: 0.6, rarity: "common", bulk: "2" });
  add({ name: "Chest (iron)", category: "containers", level: 2, priceGp: 25, rarity: "common", bulk: "3" });
  add({ name: "Belt pouch", category: "containers", level: 0, priceGp: 0.04, rarity: "common" });
  add({ name: "Bandolier", category: "containers", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Waterskin (fine)", category: "containers", level: 0, priceGp: 0.2, rarity: "common" });

  // --- Food & drink ---
  add({ name: "Rations (1 week)", category: "food", level: 0, priceGp: 0.4, rarity: "common" });
  add({ name: "Hardtack (bulk)", category: "food", level: 0, priceGp: 0.05, rarity: "common", tags: { affinities: ["military"] } });
  add({ name: "Travel bread", category: "food", level: 0, priceGp: 0.02, rarity: "common" });
  add({ name: "Salt (lb.)", category: "food", level: 0, priceGp: 0.05, rarity: "common" });
  add({ name: "Spices (common)", category: "food", level: 0, priceGp: 0.2, rarity: "common", tags: { affinities: ["comfort", "trade"] } });
  add({ name: "Cookware kit", category: "food", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Bottle (wine, common)", category: "drink", level: 0, priceGp: 0.1, rarity: "common", tags: { affinities: ["comfort"] } });
  add({ name: "Bottle (wine, fine)", category: "drink", level: 0, priceGp: 2, rarity: "common", tags: { affinities: ["luxury"] } });
  add({ name: "Ale (gallon)", category: "drink", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Tea (brick)", category: "drink", level: 0, priceGp: 0.3, rarity: "common", tags: { affinities: ["scholarly"] } });
  add({ name: "Coffee (raw)", category: "drink", level: 0, priceGp: 0.5, rarity: "common", tags: { locations: ["trade"] } });
  add({ name: "Honey (jar)", category: "food", level: 0, priceGp: 0.3, rarity: "common" });
  add({ name: "Dried fruit", category: "food", level: 0, priceGp: 0.15, rarity: "common" });

  // --- Comfort ---
  add({ name: "Cushioned chair", category: "comfort", level: 0, priceGp: 1, rarity: "common", tags: { affinities: ["comfort"] } });
  add({ name: "Fine blanket", category: "comfort", level: 0, priceGp: 0.5, rarity: "common" });
  add({ name: "Incense (block)", category: "comfort", level: 0, priceGp: 0.2, rarity: "common", tags: { affinities: ["divine", "luxury"] } });
  add({ name: "Playing cards", category: "comfort", level: 0, priceGp: 0.05, rarity: "common" });

  // --- Weapons (melee) ---
  add({ name: "Dagger", category: "weapon", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Club", category: "weapon", level: 0, priceGp: 0, rarity: "common" });
  add({ name: "Shortsword", category: "weapon", level: 0, priceGp: 0.9, rarity: "common" });
  add({ name: "Longsword", category: "weapon", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Rapier", category: "weapon", level: 0, priceGp: 2, rarity: "common", tags: { affinities: ["finesse", "urban"] } });
  add({ name: "Scimitar", category: "weapon", level: 0, priceGp: 1.5, rarity: "common" });
  add({ name: "Battle axe", category: "weapon", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Warhammer", category: "weapon", level: 0, priceGp: 1, rarity: "common", tags: { affinities: ["sturdy", "dwarf"] } });
  add({ name: "Greataxe", category: "weapon", level: 0, priceGp: 2, rarity: "common", tags: { affinities: ["military"] } });
  add({ name: "Greatsword", category: "weapon", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Spear", category: "weapon", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Trident", category: "weapon", level: 0, priceGp: 1, rarity: "common", tags: { locations: ["coastal"] } });
  add({ name: "Light mace", category: "weapon", level: 0, priceGp: 0.4, rarity: "common" });
  add({ name: "Heavy mace", category: "weapon", level: 0, priceGp: 0.9, rarity: "common", tags: { affinities: ["divine"] } });
  add({ name: "Glaive", category: "weapon", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Halberd", category: "weapon", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Kukri", category: "weapon", level: 0, priceGp: 0.6, rarity: "common", tags: { affinities: ["wilderness"] } });
  add({ name: "Hatchet", category: "weapon", level: 0, priceGp: 0.4, rarity: "common" });
  add({ name: "Light pick", category: "weapon", level: 0, priceGp: 0.4, rarity: "common", tags: { locations: ["mining"] } });

  // --- Ranged & ammo ---
  add({ name: "Shortbow", category: "weapon_ranged", level: 0, priceGp: 3, rarity: "common" });
  add({ name: "Longbow", category: "weapon_ranged", level: 0, priceGp: 6, rarity: "common", tags: { affinities: ["finesse"] } });
  add({ name: "Composite shortbow", category: "weapon_ranged", level: 1, priceGp: 14, rarity: "common" });
  add({ name: "Composite longbow", category: "weapon_ranged", level: 1, priceGp: 20, rarity: "common" });
  add({ name: "Crossbow (hand)", category: "weapon_ranged", level: 0, priceGp: 3, rarity: "common" });
  add({ name: "Crossbow (heavy)", category: "weapon_ranged", level: 0, priceGp: 4, rarity: "common" });
  add({ name: "Sling", category: "weapon_ranged", level: 0, priceGp: 0, rarity: "common" });
  add({ name: "Arrows (10)", category: "ammunition", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Bolts (10)", category: "ammunition", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Sling bullets (10)", category: "ammunition", level: 0, priceGp: 0.01, rarity: "common" });
  add({ name: "Blunt arrows (10)", category: "ammunition", level: 1, priceGp: 2, rarity: "uncommon" });
  add({ name: "Cold iron arrows (10)", category: "ammunition", level: 2, priceGp: 20, rarity: "uncommon", tags: { affinities: ["magic"] } });

  // --- Weapon accessories ---
  add({ name: "Weapon cord", category: "weapon_accessory", level: 0, priceGp: 0.05, rarity: "common" });
  add({ name: "Shield boss", category: "weapon_accessory", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Shield spikes", category: "weapon_accessory", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Doubling rings (etched pair, low)", category: "weapon_accessory", level: 3, priceGp: 70, rarity: "uncommon" });

  // --- Armor & shields ---
  add({ name: "Explorer's clothing", category: "armor_light", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Padded armor", category: "armor", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Leather armor", category: "armor", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Studded leather", category: "armor", level: 0, priceGp: 3, rarity: "common" });
  add({ name: "Chain shirt", category: "armor", level: 0, priceGp: 5, rarity: "common" });
  add({ name: "Hide armor", category: "armor", level: 0, priceGp: 2, rarity: "common", tags: { affinities: ["wilderness"] } });
  add({ name: "Scale mail", category: "armor", level: 0, priceGp: 4, rarity: "common" });
  add({ name: "Chain mail", category: "armor", level: 0, priceGp: 6, rarity: "common" });
  add({ name: "Breastplate", category: "armor", level: 0, priceGp: 8, rarity: "common", tags: { affinities: ["military"] } });
  add({ name: "Half plate", category: "armor", level: 0, priceGp: 18, rarity: "common" });
  add({ name: "Full plate", category: "armor", level: 2, priceGp: 30, rarity: "common" });
  add({ name: "Buckler", category: "shield", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Wooden shield", category: "shield", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Steel shield", category: "shield", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Tower shield", category: "shield", level: 0, priceGp: 10, rarity: "common" });

  // --- Alchemical & healing ---
  add({ name: "Minor healing potion", category: "healing", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Lesser healing potion", category: "healing", level: 3, priceGp: 12, rarity: "common" });
  add({ name: "Antidote (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Antiplague (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Elixir of life (minor)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Smokestick", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Sunrod", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Tanglefoot bag (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Thunderstone (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Acid flask (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Alchemist's fire (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Bottled lightning (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Cheetah elixir (lesser)", category: "alchemical", level: 1, priceGp: 3, rarity: "common" });
  add({ name: "Bestial mutagen (lesser)", category: "alchemical", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Silversheen", category: "alchemical", level: 2, priceGp: 6, rarity: "common" });
  add({ name: "Salve of antiparalysis (lesser)", category: "alchemical", level: 2, priceGp: 6, rarity: "common" });
  add({ name: "Holy water", category: "divine", level: 1, priceGp: 3, rarity: "common" });
  add({
    name: "Unholy water",
    category: "alchemical",
    level: 1,
    priceGp: 3,
    rarity: "common",
    tags: { affinities: ["shady"] },
    illegal: true,
  });
  add({ name: "Healing kit", category: "healing", level: 0, priceGp: 5, rarity: "common" });
  add({ name: "Holystone", category: "divine", level: 0, priceGp: 0.2, rarity: "common" });
  add({ name: "Religious symbol (wood)", category: "divine", level: 0, priceGp: 0.1, rarity: "common" });
  add({ name: "Religious symbol (silver)", category: "divine", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Religious text (prayer book)", category: "divine", level: 0, priceGp: 1, rarity: "common" });
  add({ name: "Censer", category: "divine", level: 0, priceGp: 0.5, rarity: "common" });

  // --- Scrolls & low magic ---
  add({ name: "Scroll of sleep (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Scroll of magic missile (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Scroll of heal (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Scroll of summon animal (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common", tags: { affinities: ["nature"] } });
  add({ name: "Scroll of burning hands (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Scroll of color spray (1st)", category: "scroll", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Scroll of gust of wind (2nd)", category: "scroll", level: 3, priceGp: 12, rarity: "common", tags: { locations: ["coastal"] } });
  add({ name: "Scroll of resist energy (2nd)", category: "scroll", level: 3, priceGp: 12, rarity: "common" });
  add({ name: "Wand of magic missile (1st, 5 charges)", category: "wand", level: 3, priceGp: 60, rarity: "uncommon" });
  add({ name: "Wand of heal (1st, 5 charges)", category: "wand", level: 3, priceGp: 60, rarity: "uncommon" });
  add({ name: "Staff of fire (entry)", category: "staff", level: 6, priceGp: 230, rarity: "uncommon", tags: { affinities: ["magic", "scholarly"] } });

  // --- Talismans & consumables ---
  add({ name: "Potency crystal (minor weapon)", category: "talisman", level: 2, priceGp: 7, rarity: "common" });
  add({ name: "Potency crystal (minor armor)", category: "talisman", level: 2, priceGp: 7, rarity: "common" });
  add({ name: "Monkey pin", category: "talisman", level: 1, priceGp: 4, rarity: "common" });
  add({ name: "Wolf fang", category: "talisman", level: 1, priceGp: 4, rarity: "common", tags: { affinities: ["wilderness"] } });
  add({ name: "Consumable snare kit", category: "consumable", level: 1, priceGp: 5, rarity: "common", tags: { affinities: ["wilderness"] } });

  // --- Books & maps ---
  add({ name: "Basic lore compendium", category: "book", level: 0, priceGp: 1, rarity: "common", tags: { affinities: ["scholarly"] } });
  add({ name: "Bestiary primer (regional)", category: "book", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Map (local roads)", category: "book", level: 0, priceGp: 0.5, rarity: "common" });
  add({ name: "Map (sea lanes)", category: "book", level: 0, priceGp: 1, rarity: "common", tags: { locations: ["coastal"] } });
  add({ name: "Cipher primer", category: "book", level: 1, priceGp: 5, rarity: "common", tags: { affinities: ["urban"] } });
  add({ name: "Spellbook (blank)", category: "book", level: 0, priceGp: 1, rarity: "common", tags: { affinities: ["magic", "scholarly"] } });

  // --- Luxury & gems ---
  add({ name: "Silver earrings", category: "luxury", level: 0, priceGp: 4, rarity: "common", tags: { affinities: ["luxury", "trade"] } });
  add({ name: "Gold ring (simple)", category: "luxury", level: 0, priceGp: 15, rarity: "common" });
  add({ name: "Fine cloak brooch", category: "luxury", level: 0, priceGp: 8, rarity: "common" });
  add({ name: "Uncut quartz", category: "gem", level: 0, priceGp: 2, rarity: "common" });
  add({ name: "Small ruby", category: "gem", level: 2, priceGp: 30, rarity: "common" });
  add({ name: "Pearl (common)", category: "gem", level: 0, priceGp: 10, rarity: "common", tags: { locations: ["coastal"] } });

  // --- Higher-level / rarer examples (vault & elite) ---
  add({ name: "Bag of holding (type I)", category: "magic", level: 4, priceGp: 75, rarity: "uncommon" });
  add({ name: "Cloak of resistance (+1)", category: "magic", level: 5, priceGp: 160, rarity: "uncommon" });
  add({ name: "Handwraps of mighty blows (+1)", category: "magic", level: 2, priceGp: 35, rarity: "uncommon" });
  add({ name: "Striking rune (weapon)", category: "magic", level: 4, priceGp: 65, rarity: "uncommon" });
  add({ name: "Resilient rune (armor, +1)", category: "magic", level: 4, priceGp: 65, rarity: "uncommon" });
  add({ name: "Healing potion (moderate)", category: "healing", level: 6, priceGp: 50, rarity: "common" });
  add({ name: "Dragon bile (grenade)", category: "alchemical", level: 6, priceGp: 50, rarity: "uncommon" });
  add({ name: "Dust of appearance", category: "magic", level: 6, priceGp: 50, rarity: "uncommon" });
  add({ name: "Lesser talisman of good fortune", category: "talisman", level: 6, priceGp: 50, rarity: "uncommon" });
  add({ name: "Adamantine chunk (small)", category: "gem", level: 8, priceGp: 500, rarity: "uncommon", tags: { affinities: ["craft", "mining"] } });
  add({ name: "+1 weapon potency crystal", category: "magic", level: 2, priceGp: 35, rarity: "uncommon" });
  add({ name: "Wand of widening (2nd)", category: "wand", level: 5, priceGp: 160, rarity: "rare", tags: { affinities: ["magic"] } });
  add({ name: "Greater healing potion", category: "healing", level: 12, priceGp: 500, rarity: "common" });
  add({ name: "Elixir of rejuvenation", category: "alchemical", level: 15, priceGp: 6000, rarity: "rare", tags: { affinities: ["luxury"] } });

  // --- Pawnbroker / mixed oddities (tag as container + luxury mix) ---
  add({ name: "Oddity: cracked monocle", category: "luxury", level: 0, priceGp: 0.5, rarity: "common", tags: { notes: "curio" } });
  add({ name: "Oddity: foreign coins (string)", category: "luxury", level: 0, priceGp: 2, rarity: "common", tags: { locations: ["trade"] } });
  add({ name: "Oddity: taxidermy weasel", category: "comfort", level: 0, priceGp: 1, rarity: "common" });

  global.MerchantApp = global.MerchantApp || {};
  global.MerchantApp.catalog = items;
})(typeof window !== "undefined" ? window : globalThis);
