(function (global) {
  "use strict";

  global.MerchantApp = global.MerchantApp || {};
  global.MerchantApp.config = {
    locations: [
      { id: "metropolis", label: "Major metropolis", tags: ["urban", "trade"] },
      { id: "city", label: "City", tags: ["urban"] },
      { id: "town", label: "Town", tags: ["urban", "rural"] },
      { id: "village", label: "Village", tags: ["rural"] },
      { id: "borderland", label: "Borderland fort", tags: ["military", "rural"] },
      { id: "wilderness", label: "Wilderness outpost", tags: ["wilderness"] },
      { id: "coastal", label: "Coastal port", tags: ["coastal", "trade", "urban"] },
      { id: "mining", label: "Mining camp", tags: ["underground", "industrial"] },
      { id: "academy", label: "Arcane academy", tags: ["scholarly", "urban"] },
      { id: "temple", label: "Temple district", tags: ["divine", "urban"] },
      { id: "underground", label: "Underground settlement", tags: ["underground"] },
      { id: "planar", label: "Planar nexus", tags: ["planar", "magic"] },
    ],

    merchantRaces: [
      { id: "human", label: "Human", affinity: ["general", "trade"] },
      { id: "elf", label: "Elf", affinity: ["finesse", "magic", "nature"] },
      { id: "dwarf", label: "Dwarf", affinity: ["sturdy", "craft", "underground"] },
      { id: "gnome", label: "Gnome", affinity: ["curious", "magic", "craft"] },
      { id: "halfling", label: "Halfling", affinity: ["comfort", "food", "luck"] },
      { id: "half_elf", label: "Half-elf", affinity: ["finesse", "trade"] },
      { id: "half_orc", label: "Half-orc", affinity: ["military", "sturdy"] },
      { id: "goblin", label: "Goblin", affinity: ["scrap", "curious", "volatile"] },
      { id: "orc", label: "Orc", affinity: ["military", "sturdy"] },
      { id: "tiefling", label: "Tiefling", affinity: ["magic", "urban"] },
      { id: "aasimar", label: "Aasimar", affinity: ["divine", "scholarly"] },
      { id: "catfolk", label: "Catfolk", affinity: ["finesse", "wilderness"] },
      { id: "kobold", label: "Kobold", affinity: ["underground", "scrap", "craft"] },
      { id: "lizardfolk", label: "Lizardfolk", affinity: ["wilderness", "sturdy"] },
      { id: "other", label: "Other / mixed", affinity: ["general"] },
    ],

    storeTypes: [
      { id: "general", label: "General goods", categories: ["adventuring", "tools", "containers", "food"] },
      { id: "weaponsmith", label: "Weaponsmith", categories: ["weapon", "weapon_accessory"] },
      { id: "armorer", label: "Armorer", categories: ["armor", "shield"] },
      { id: "blacksmith", label: "Blacksmith (arms & armor)", categories: ["weapon", "armor", "shield", "weapon_accessory"] },
      { id: "alchemist", label: "Alchemist / apothecary", categories: ["alchemical", "consumable", "healing"] },
      { id: "arcane", label: "Arcane curiosities", categories: ["magic", "scroll", "wand", "staff", "talisman"] },
      { id: "divine", label: "Religious supplies", categories: ["divine", "healing", "consumable"] },
      { id: "scholar", label: "Books & maps", categories: ["book", "scroll", "tool_scholarly"] },
      { id: "jeweler", label: "Jeweler & luxuries", categories: ["luxury", "gem", "magic"] },
      { id: "tanner", label: "Tanner & leather", categories: ["armor_light", "containers", "adventuring"] },
      { id: "provisioner", label: "Provisioner / inn supplies", categories: ["food", "drink", "comfort", "adventuring"] },
      { id: "fletcher", label: "Fletcher & bowyer", categories: ["weapon_ranged", "ammunition"] },
      { id: "pawnbroker", label: "Pawnbroker (mixed oddities)", categories: ["general_mix"] },
    ],

    wealthTiers: [
      { id: "shoestring", label: "Shoestring (pushcart)", maxItemLevel: 1, budgetGp: 12, variety: 10 },
      { id: "modest", label: "Modest stall", maxItemLevel: 2, budgetGp: 45, variety: 16 },
      { id: "established", label: "Established shop", maxItemLevel: 4, budgetGp: 180, variety: 24 },
      { id: "prosperous", label: "Prosperous boutique", maxItemLevel: 7, budgetGp: 750, variety: 32 },
      { id: "elite", label: "Elite emporium", maxItemLevel: 12, budgetGp: 5000, variety: 40 },
      { id: "vault", label: "Vault-tier (rare stock)", maxItemLevel: 17, budgetGp: 25000, variety: 36 },
    ],

    settlementSizes: [
      { id: "hamlet", label: "Hamlet", stockMult: 0.75 },
      { id: "village", label: "Village", stockMult: 0.9 },
      { id: "town", label: "Town", stockMult: 1 },
      { id: "city", label: "City", stockMult: 1.15 },
      { id: "metropolis", label: "Metropolis", stockMult: 1.35 },
    ],

    reputations: [
      { id: "unknown", label: "Unknown", priceVar: 0 },
      { id: "local", label: "Local favorite", priceVar: -0.05 },
      { id: "shady", label: "Shady dealer", priceVar: 0.08, illegalBias: 1.4 },
      { id: "guild", label: "Guild licensed", priceVar: 0.05, legalBias: 1.2 },
      { id: "exclusive", label: "Exclusive clientele", priceVar: 0.12 },
    ],

    stockPolicies: [
      { id: "broad", label: "Broad selection (more SKUs, smaller stacks)" },
      { id: "balanced", label: "Balanced" },
      { id: "deep", label: "Deep stacks (fewer SKUs, more quantity)" },
    ],

    itemRaritiesAllowed: [
      { id: "common_only", label: "Common only" },
      { id: "uncommon_ok", label: "Allow uncommon" },
      { id: "rare_elite", label: "Elite stock (rare at high wealth)" },
    ],

    marketDemand: [
      { id: "slack", label: "Slack season", budgetMult: 0.88 },
      { id: "steady", label: "Steady trade", budgetMult: 1 },
      { id: "brisk", label: "Brisk demand", budgetMult: 1.12 },
    ],

    /** Bias toward scrolls, talismans, runes, etc. */
    arcaneTilt: [
      { id: "mundane", label: "Mostly mundane stock", magicMult: 0.72 },
      { id: "typical", label: "Typical mix", magicMult: 1 },
      { id: "arcane_boom", label: "Arcane-heavy shelves", magicMult: 1.5 },
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
