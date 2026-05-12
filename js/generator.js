(function (global) {
  "use strict";

  var App = (global.MerchantApp = global.MerchantApp || {});

  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickWeighted(rng, entries, getWeight) {
    var total = 0;
    var i;
    var w = [];
    for (i = 0; i < entries.length; i++) {
      var wi = Math.max(0, getWeight(entries[i], i));
      w.push(wi);
      total += wi;
    }
    if (total <= 0) return -1;
    var r = rng() * total;
    for (i = 0; i < entries.length; i++) {
      r -= w[i];
      if (r <= 0) return i;
    }
    return entries.length - 1;
  }

  function getStoreCategories(storeTypes, storeId) {
    for (var i = 0; i < storeTypes.length; i++) {
      if (storeTypes[i].id === storeId) return storeTypes[i].categories.slice();
    }
    return ["adventuring"];
  }

  function itemMatchesStore(item, categories, storeId) {
    if (storeId === "pawnbroker") return true;
    for (var i = 0; i < categories.length; i++) {
      if (item.category === categories[i]) return true;
    }
    if (categories.indexOf("general_mix") >= 0) return true;
    return false;
  }

  var MAGIC_CATEGORIES = { magic: true, scroll: true, wand: true, staff: true, talisman: true };

  function locationMatches(item, loc) {
    var tags = item.tags && item.tags.locations;
    if (!tags || !tags.length) return true;
    if (tags.indexOf(loc.id) >= 0) return true;
    var lt = loc.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (lt.indexOf(tags[i]) >= 0) return true;
    }
    return false;
  }

  function rarityAllowed(rarity, mode, wealthMaxLevel, itemLevel) {
    if (mode === "common_only") return rarity === "common";
    if (mode === "uncommon_ok") return rarity === "common" || rarity === "uncommon";
    if (mode === "rare_elite") {
      if (rarity === "common" || rarity === "uncommon") return true;
      if (rarity === "rare") return wealthMaxLevel >= 10 && itemLevel >= 8;
    }
    return rarity === "common";
  }

  function scoreItem(item, params) {
    var w = 1;
    var loc = params.locationObj;
    var race = params.raceObj;
    if (!locationMatches(item, loc)) w *= 0.25;

    var aff = (item.tags && item.tags.affinities) || [];
    var rAff = race.affinity || [];
    var a;
    for (a = 0; a < aff.length; a++) {
      if (rAff.indexOf(aff[a]) >= 0) w *= 1.35;
    }

    var lt = loc.tags || [];
    for (a = 0; a < aff.length; a++) {
      if (lt.indexOf(aff[a]) >= 0) w *= 1.15;
    }

    if (item.illegal) {
      if (params.reputationObj && params.reputationObj.illegalBias) w *= params.reputationObj.illegalBias;
      else w *= 0.2;
    } else if (params.reputationObj && params.reputationObj.legalBias) {
      w *= 1.05;
    }

    if (params.storeId === "pawnbroker") {
      if (item.category === "luxury" || item.category === "gem" || item.tags && item.tags.notes === "curio") w *= 1.4;
      else if (item.category === "weapon" || item.category === "armor") w *= 0.85;
    }

    var cheap = item.priceGp <= 1;
    if (params.stockPolicy === "broad" && cheap) w *= 1.2;
    if (params.stockPolicy === "deep" && cheap) w *= 0.85;

    var mm = params.magicMult != null ? params.magicMult : 1;
    if (mm !== 1 && MAGIC_CATEGORIES[item.category]) w *= mm;

    return w;
  }

  function rollQuantity(rng, item, policy, settlementMult) {
    var p = item.priceGp;
    var cat = item.category;
    var mult = settlementMult || 1;

    if (cat === "ammunition" || cat === "food" || item.name.indexOf("Torch") >= 0 || item.name.indexOf("Oil") >= 0) {
      var base = 4 + Math.floor(rng() * 10);
      if (policy === "deep") base = Math.floor(base * 1.6);
      if (policy === "broad") base = Math.floor(base * 0.75);
      return Math.max(1, Math.floor(base * mult));
    }

    if (cat === "alchemical" || cat === "healing" || cat === "scroll" || cat === "consumable") {
      var q = 1 + Math.floor(rng() * 4);
      if (p >= 20) q = 1 + Math.floor(rng() * 2);
      if (policy === "deep" && p < 15) q += 1 + Math.floor(rng() * 3);
      if (policy === "broad" && p < 10) q = Math.max(1, q - 1);
      return Math.max(1, Math.floor(q * mult));
    }

    if (cat === "weapon" || cat === "weapon_ranged" || cat === "armor" || cat === "shield" || cat === "armor_light") {
      var u = 1;
      if (p <= 2 && rng() < 0.35) u = 2;
      if (policy === "deep" && p <= 1 && rng() < 0.5) u += 1;
      return Math.max(1, Math.min(4, u));
    }

    if (cat === "magic" || cat === "wand" || cat === "staff") {
      return 1;
    }

    if (p < 0.5) {
      var bulk = 6 + Math.floor(rng() * 14);
      if (policy === "deep") bulk = Math.floor(bulk * 1.5);
      return Math.max(1, Math.floor(bulk * mult));
    }

    if (p < 5) return Math.max(1, Math.floor((1 + Math.floor(rng() * 3)) * Math.min(1.3, mult)));

    return 1;
  }

  /**
   * @param {object} params
   * @returns {{ lines: { name: string, qty: number, unitPriceGp: number, lineTotalGp: number, level: number, rarity: string, bulk?: string }[], totals: { listPriceGp: number, skuCount: number }, meta: object }}
   */
  function generateInventory(params) {
    var cfg = App.config;
    var catalog = App.catalog;
    var seed = params.seed != null && String(params.seed).length ? hashString(String(params.seed)) : (Math.random() * 0xffffffff) >>> 0;
    var rng = mulberry32(seed);

    var loc = cfg.locations.find(function (l) {
      return l.id === params.locationId;
    });
    var race = cfg.merchantRaces.find(function (r) {
      return r.id === params.raceId;
    });
    var wealth = cfg.wealthTiers.find(function (w) {
      return w.id === params.wealthId;
    });
    var settlement = cfg.settlementSizes.find(function (s) {
      return s.id === params.settlementId;
    });
    var reputation = cfg.reputations.find(function (r) {
      return r.id === params.reputationId;
    });

    if (!loc) loc = cfg.locations[0];
    if (!race) race = cfg.merchantRaces[0];
    if (!wealth) wealth = cfg.wealthTiers[2];
    if (!settlement) settlement = cfg.settlementSizes[2];
    if (!reputation) reputation = cfg.reputations[0];

    var storeCats = getStoreCategories(cfg.storeTypes, params.storeId);

    var demand = cfg.marketDemand.find(function (d) {
      return d.id === params.marketDemandId;
    });
    if (!demand) demand = cfg.marketDemand[1];

    var arcane = cfg.arcaneTilt.find(function (a) {
      return a.id === params.arcaneTiltId;
    });
    if (!arcane) arcane = cfg.arcaneTilt[1];

    var maxLevel = wealth.maxItemLevel;
    if (params.settlementId === "hamlet") maxLevel = Math.max(0, maxLevel - 1);
    if (params.settlementId === "metropolis") maxLevel = maxLevel + 1;

    var budget = wealth.budgetGp * (settlement.stockMult || 1) * (demand.budgetMult || 1);
    if (reputation.priceVar) budget *= 1 + reputation.priceVar;

    var variety = Math.round(wealth.variety * (settlement.stockMult || 1));
    if (params.stockPolicy === "broad") variety = Math.round(variety * 1.2);
    if (params.stockPolicy === "deep") variety = Math.round(variety * 0.85);
    variety = Math.max(6, variety);

    var rarityMode = params.rarityMode || "uncommon_ok";

    var pool = [];
    for (var i = 0; i < catalog.length; i++) {
      var it = catalog[i];
      if (!itemMatchesStore(it, storeCats, params.storeId)) continue;
      if (it.level > maxLevel) continue;
      if (!rarityAllowed(it.rarity, rarityMode, maxLevel, it.level)) continue;
      pool.push(it);
    }

    if (!pool.length) {
      return {
        lines: [],
        totals: { listPriceGp: 0, skuCount: 0 },
        meta: { seed: seed, note: "No items matched filters; relax wealth, location, or store type." },
      };
    }

    var scored = pool.map(function (it) {
      return {
        item: it,
        weight: scoreItem(it, {
          locationObj: loc,
          raceObj: race,
          storeId: params.storeId,
          stockPolicy: params.stockPolicy,
          reputationObj: reputation,
          magicMult: arcane.magicMult,
        }),
      };
    });

    var lines = [];
    var spent = 0;
    var guard = 0;
    var maxGuard = variety * 25;

    while (lines.length < variety && spent < budget * 0.98 && guard++ < maxGuard) {
      var idx = pickWeighted(
        rng,
        scored,
        function (s) {
          return s.weight;
        }
      );
      if (idx < 0) break;
      var entry = scored[idx];
      var item = entry.item;
      var qty = rollQuantity(rng, item, params.stockPolicy, settlement.stockMult);
      var unit = item.priceGp;
      var lineTotal = unit * qty;

      if (lineTotal > budget - spent) {
        if (unit > budget - spent) {
          entry.weight *= 0.35;
          continue;
        }
        qty = Math.max(1, Math.floor((budget - spent) / unit));
        lineTotal = unit * qty;
      }

      var existing = -1;
      var li;
      for (li = 0; li < lines.length; li++) {
        if (lines[li].name === item.name) {
          existing = li;
          break;
        }
      }
      if (existing >= 0) {
        var merged = lines[existing];
        var addQty = qty;
        var newTotal = (merged.qty + addQty) * merged.unitPriceGp;
        if (newTotal > budget - spent + merged.lineTotalGp) {
          addQty = Math.max(0, Math.floor((budget - spent + merged.lineTotalGp) / merged.unitPriceGp) - merged.qty);
        }
        if (addQty <= 0) {
          entry.weight *= 0.5;
          continue;
        }
        spent -= merged.lineTotalGp;
        merged.qty += addQty;
        merged.lineTotalGp = merged.qty * merged.unitPriceGp;
        spent += merged.lineTotalGp;
      } else {
        lines.push({
          name: item.name,
          qty: qty,
          unitPriceGp: unit,
          lineTotalGp: lineTotal,
          level: item.level,
          rarity: item.rarity,
          bulk: item.bulk,
          category: item.category,
        });
        spent += lineTotal;
      }

      entry.weight *= 0.65;
    }

    lines.sort(function (a, b) {
      if (b.level !== a.level) return b.level - a.level;
      return b.lineTotalGp - a.lineTotalGp;
    });

    var listPrice = 0;
    for (var j = 0; j < lines.length; j++) listPrice += lines[j].lineTotalGp;

    return {
      lines: lines,
      totals: { listPriceGp: Math.round(listPrice * 100) / 100, skuCount: lines.length },
      meta: {
        seed: seed,
        seedHint: params.seed,
        budgetGp: Math.round(budget * 100) / 100,
        spentGp: Math.round(spent * 100) / 100,
        maxItemLevel: maxLevel,
        location: loc.label,
        race: race.label,
        wealth: wealth.label,
        demand: demand.label,
        arcane: arcane.label,
        store: (cfg.storeTypes.find(function (s) { return s.id === params.storeId; }) || {}).label || params.storeId,
      },
    };
  }

  App.generateInventory = generateInventory;
})(typeof window !== "undefined" ? window : globalThis);
