// ─── App State ────────────────────────────────────────────

const state = {
  items: [],
  merchants: [],
  userItems: [],
  ancestries: [],
  currentMerchant: null
};

// Adds filtering for columns in Custom Items
let existingSortColumn = 'name';
let existingSortDirection = 'asc';

// Navigation stack
const navStack = [];

// ─── Utilities ────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID();
}

function badgeClass(rarity) {
  if (!rarity) return '';
  return `badge-${rarity.toLowerCase()}`;
}

function rarityFromIndex(index) {
  return ['common', 'uncommon', 'rare', 'unique'][index] || 'common';
}

function formatBulk(bulk) {
  if (bulk === null || bulk === undefined || bulk === '') return '—';
  return bulk.toString();
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanDescription(html) {
  if (!html) return '';
  let clean = html.replace(/@UUID\[[^\]]*\]/g, '');
  clean = clean.replace(/<\/p>/gi, '\n').replace(/<p>/gi, '');
  clean = clean.replace(/<[^>]*>/g, '');
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  return clean;
}

let currentEditItem = null;

// ─── Data Loading ─────────────────────────────────────────

async function init() {
  await loadItems();
  await loadAncestries();
  loadMerchants();
  loadUserItems();
  applySettingsToForm(loadSettings());
}

async function loadItems() {
  try {
    const response = await fetch('data/items.json');
    state.items = await response.json();
    console.log(`Loaded ${state.items.length} items`);
  } catch (err) {
    console.error('Failed to load items.json:', err);
  }
}

async function loadAncestries() {
  try {
    const response = await fetch('data/ancestries.json');
    const allAncestries = await response.json();

    const allTraits = new Set();
    state.items.forEach(item => {
      (item.traits || []).forEach(trait => allTraits.add(trait.toLowerCase()));
    });

    state.ancestries = allAncestries.filter(ancestry =>
      allTraits.has(ancestry.toLowerCase())
    );

    console.log(`Loaded ${state.ancestries.length} ancestries with items`);
    populateAncestryDropdown();
  } catch (err) {
    console.error('Failed to load ancestries.json:', err);
  }
}

function populateAncestryDropdown() {
  const selects = [
    document.getElementById('ancestry-select'),
    document.getElementById('default-ancestry-select')
  ];

  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="any" selected>Any</option>';
    state.ancestries.forEach(ancestry => {
      const option = document.createElement('option');
      option.value = ancestry.toLowerCase();
      option.textContent = ancestry;
      select.appendChild(option);
    });
  });
}

// ─── Navigation ───────────────────────────────────────────

function showScreen(id) {
  const current = document.querySelector('.screen.active');
  if (current) navStack.push(current.id);
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-custom-existing') initExistingItems();
  updateBackButton();
}

function goHome() {
  navStack.length = 0;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
  updateBackButton();
}

function goBack() {
  if (navStack.length === 0) return;
  const previous = navStack.pop();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(previous).classList.add('active');
  if (previous === 'screen-custom-existing') initExistingItems();
  updateBackButton();
}

function updateBackButton() {
  const btn = document.getElementById('back-btn');
  if (!btn) return;
  const current = document.querySelector('.screen.active');
  const isHome = current?.id === 'screen-home';
  btn.style.display = isHome ? 'none' : 'flex';
}

// ─── New Merchant Form ────────────────────────────────────

function toggleFilters() {
  const body = document.getElementById('filters-body');
  const icon = document.getElementById('filters-icon');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  icon.className = isOpen ? 'ti ti-chevron-right' : 'ti ti-chevron-down';
}

// ─── Merchant Result ──────────────────────────────────────

function setFilterActive(btn, group) {
  const allBtns = document.querySelectorAll('.filter-btn');
  const groupBtns = Array.from(allBtns).filter(b => b.getAttribute('onclick').includes(group));
  groupBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Generator Config ─────────────────────────────────────

const SETTLEMENT_LEVEL = {
  'village': 4,
  'town': 8,
  'city': 14,
  'metropolis': 20
};

const ECONOMY_CONFIG = {
  'frontier':  { multiplier: 0.5,  levelBias: 'low',      categoryBias: [] },
  'military':  { multiplier: 0.75, levelBias: 'mid',      categoryBias: ['weapon', 'armor'] },
  'trade-hub': { multiplier: 1,    levelBias: 'none',     categoryBias: [] },
  'academic':  { multiplier: 0.75, levelBias: 'mid',      categoryBias: ['scroll', 'alchemical', 'tool'] },
  'arcane':    { multiplier: 0.9,  levelBias: 'mid-high', categoryBias: ['magical', 'arcane', 'scroll', 'wand'] },
  'divine':    { multiplier: 0.9,  levelBias: 'mid',      categoryBias: ['divine', 'holy', 'healing'] }
};

const STORE_TYPES = {
  'any':          { types: [],                             traits: [] },
  'blacksmith':   { types: ['weapon', 'armor', 'shield'], traits: [] },
  'bowyer':       { types: ['ammo'],                      traits: ['bow', 'crossbow', 'ranged'] },
  'alchemist':    { types: ['consumable'],                traits: ['alchemical', 'bomb', 'poison', 'elixir', 'mutagen'] },
  'arcane-goods': { types: [],                            traits: ['magical', 'arcane', 'scroll', 'wand', 'staff'] },
  'divine-goods': { types: [],                            traits: ['divine', 'holy', 'unholy', 'healing'] },
  'general-store':{ types: ['equipment', 'consumable'],   traits: [] }
};

const STOCKING_STYLE = {
  'broad':   { min: 25, max: 35, adjacent: true,  highLevelBias: false },
  'focused': { min: 12, max: 18, adjacent: false, highLevelBias: false },
  'curated': { min: 5,  max: 8,  adjacent: false, highLevelBias: true }
};

// ─── Merchant Generator ───────────────────────────────────

function generateMerchant() {
  const name = document.getElementById('merchant-name-input').value.trim();
  const settlement = document.getElementById('settlement-select').value;
  const economy = document.getElementById('economy-select').value;
  const ancestry = document.getElementById('ancestry-select').value;
  const storeType = document.getElementById('store-type-select').value;
  const stockingStyle = document.getElementById('stocking-style-select').value;
  const arcaneTilt = parseInt(document.getElementById('arcane-display').textContent) / 100;
  const pricingModifier = parseInt(document.getElementById('price-display').textContent) / 100;

  const rarityCheckboxes = document.querySelectorAll('#screen-merchant-new .checkbox-group input[type="checkbox"]');
  const allowedRarities = ['common', 'uncommon', 'rare', 'unique'].filter((r, i) => rarityCheckboxes[i]?.checked);

  const maxLevel = SETTLEMENT_LEVEL[settlement] || 14;
  const economyConfig = ECONOMY_CONFIG[economy] || ECONOMY_CONFIG['trade-hub'];
  const storeConfig = STORE_TYPES[storeType] || STORE_TYPES['any'];
  const styleConfig = STOCKING_STYLE[stockingStyle] || STOCKING_STYLE['focused'];

  // Step 1 — filter eligible items
  let pool = state.items.filter(item => {
    if (item.level > maxLevel) return false;
    if (!allowedRarities.includes(item.rarity?.toLowerCase())) return false;

    if (storeConfig.types.length > 0 || storeConfig.traits.length > 0) {
      const itemTraits = item.traits || [];
      const hasType = storeConfig.types.length > 0 && storeConfig.types.includes(item.type);
      const hasTrait = storeConfig.traits.length > 0 && storeConfig.traits.some(t => itemTraits.includes(t));
      if (!hasType && !hasTrait) return false;
    }

    if (ancestry && ancestry !== 'any') {
      if (!(item.traits || []).includes(ancestry)) return false;
    }

    return true;
  });

  if (pool.length === 0) {
    alert('No items match these parameters. Try adjusting your filters.');
    return;
  }

  // Step 2 — assign weights
  pool = pool.map(item => {
    let weight = 1;

    weight *= getLevelWeight(item.level, maxLevel, economyConfig.levelBias, styleConfig.highLevelBias);

    const isMagical = (item.traits || []).some(t => ['magical', 'arcane', 'divine'].includes(t));
    if (isMagical) weight *= (1 + arcaneTilt * 2);
    else weight *= (1 + (1 - arcaneTilt) * 0.5);

    if (economyConfig.categoryBias.length > 0) {
      const hasBias = economyConfig.categoryBias.some(t => (item.traits || []).includes(t));
      if (hasBias) weight *= 1.5;
    }

    return { ...item, weight };
  });

  // Step 3 — pick items by weighted random
  const baseCount = Math.floor(
    (styleConfig.min + Math.random() * (styleConfig.max - styleConfig.min))
    * economyConfig.multiplier
  );
  const count = Math.max(3, baseCount);
  const selected = weightedSample(pool, count);

  // Step 4 — assign quantities
  const inventory = selected.map(item => ({
    id: item.id,
    quantity: generateQuantity(item, economy, storeType)
  }));

  // Step 5 — build merchant object
  const merchant = {
    id: generateId(),
    name: name || null,
    currency: generateCurrency(settlement, economy),
    inventory,
    generatorSettings: {
      settlementSize: settlement,
      economy,
      ancestry,
      storeType,
      stockingStyle,
      arcaneTilt,
      pricingModifier,
      rarity: allowedRarities
    }
  };

  displayMerchantResult(merchant);
}

function getLevelWeight(itemLevel, maxLevel, levelBias, highLevelBias) {
  const ratio = itemLevel / maxLevel;
  if (highLevelBias) return 0.5 + ratio;
  switch (levelBias) {
    case 'low':      return Math.max(0.1, 1 - ratio * 1.5);
    case 'mid':      return 1 - Math.abs(ratio - 0.5);
    case 'mid-high': return 0.3 + ratio * 0.7;
    case 'none':
    default:         return 1;
  }
}

function weightedSample(pool, count) {
  const results = [];
  const available = [...pool];

  for (let n = 0; n < count && available.length > 0; n++) {
    let rand = Math.random() * available.reduce((sum, i) => sum + i.weight, 0);
    for (let i = 0; i < available.length; i++) {
      rand -= available[i].weight;
      if (rand <= 0) {
        results.push(available[i]);
        available.splice(i, 1);
        break;
      }
    }
  }
  return results;
}

function generateQuantity(item, economy, storeType) {
  const isConsumable = ['consumable', 'ammo'].includes(item.type);
  const isCommon = item.rarity?.toLowerCase() === 'common';
  const isFrontier = economy === 'frontier';

  if (item.rarity?.toLowerCase() === 'unique') return 1;
  if (item.rarity?.toLowerCase() === 'rare') return 1;

  let base = isConsumable ? Math.floor(Math.random() * 8) + 3
           : isCommon     ? Math.floor(Math.random() * 3) + 1
           :                1;

  if (isFrontier) base = Math.max(1, Math.floor(base * 0.5));
  return base;
}

function generateCurrency(settlement, economy) {
  const base = { 'village': 50, 'town': 200, 'city': 800, 'metropolis': 3000 };
  const multiplier = { 'frontier': 0.5, 'military': 0.8, 'trade-hub': 1, 'academic': 0.9, 'arcane': 1.1, 'divine': 0.9 };
  const gp = Math.floor((base[settlement] || 200) * (multiplier[economy] || 1) * (0.8 + Math.random() * 0.4));
  return { gp, sp: Math.floor(Math.random() * 10), cp: Math.floor(Math.random() * 10) };
}

function displayMerchantResult(merchant) {
  state.currentMerchant = merchant;

  document.getElementById('result-name').textContent = merchant.name || 'Unnamed Merchant';
  const s = merchant.generatorSettings;
  document.getElementById('result-subtitle').textContent = [
    s.ancestry !== 'any' ? capitalise(s.ancestry) : null,
    capitalise(s.storeType.replace(/-/g, ' ')),
    capitalise(s.settlementSize),
    capitalise(s.economy.replace(/-/g, ' '))
  ].filter(Boolean).join(' · ');

  const currency = merchant.currency;
  document.getElementById('result-currency').textContent =
    [currency.gp ? `${currency.gp} gp` : null,
     currency.sp ? `${currency.sp} sp` : null,
     currency.cp ? `${currency.cp} cp` : null]
    .filter(Boolean).join(' · ') || '—';

  document.getElementById('result-item-count').textContent = merchant.inventory.length;
  document.getElementById('result-rarity').textContent = s.rarity.map(capitalise).join(' · ');
  document.getElementById('result-max-level').textContent = SETTLEMENT_LEVEL[s.settlementSize] || '—';

  renderInventory(merchant.inventory);
  showScreen('screen-merchant-result');
}

function renderInventory(inventory) {
  const container = document.getElementById('result-inventory');

  if (inventory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-wand"></i>
        <p>No inventory yet</p>
        <span>Hit Generate to stock this merchant</span>
      </div>`;
    return;
  }

  const groups = {};
  inventory.forEach(({ id, quantity }) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    const category = item.category || item.type || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push({ ...item, quantity });
  });

  container.innerHTML = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => `
      <p class="category-heading">${capitalise(category)}</p>
      ${items.sort((a, b) => a.level - b.level).map(item => `
        <div class="list-row">
          <span class="col-item-name row-title">${item.name}</span>
          <span class="col-qty row-meta">${item.quantity}</span>
          <span class="col-level row-meta">${item.level ?? '—'}</span>
          <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
          <span class="col-price row-meta">${formatPrice(item.price)}</span>
          <span class="col-rarity"><span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span></span>
        </div>
      `).join('')}
    `).join('');
}

// ─── Save Merchant ────────────────────────────────────────

function saveMerchant() {
  if (!state.currentMerchant) return;

  const existing = state.merchants.findIndex(m => m.id === state.currentMerchant.id);
  if (existing >= 0) {
    state.merchants[existing] = state.currentMerchant;
  } else {
    state.merchants.push(state.currentMerchant);
  }

  saveMerchants();
  renderMerchantsList();

  const btn = document.querySelector('#screen-merchant-result .btn-secondary');
  btn.innerHTML = '<i class="ti ti-check"></i> Saved';
  setTimeout(() => {
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save';
  }, 1500);
}

// ─── Regenerate Merchant ──────────────────────────────────

function regenerateMerchant() {
  if (!state.currentMerchant) return;

  const s = state.currentMerchant.generatorSettings;
  const maxLevel = SETTLEMENT_LEVEL[s.settlementSize] || 14;
  const economyConfig = ECONOMY_CONFIG[s.economy] || ECONOMY_CONFIG['trade-hub'];
  const storeConfig = STORE_TYPES[s.storeType] || STORE_TYPES['any'];
  const styleConfig = STOCKING_STYLE[s.stockingStyle] || STOCKING_STYLE['focused'];

  let pool = state.items.filter(item => {
    if (item.level > maxLevel) return false;
    if (!s.rarity.includes(item.rarity?.toLowerCase())) return false;

    if (storeConfig.types.length > 0 || storeConfig.traits.length > 0) {
      const itemTraits = item.traits || [];
      const hasType = storeConfig.types.length > 0 && storeConfig.types.includes(item.type);
      const hasTrait = storeConfig.traits.length > 0 && storeConfig.traits.some(t => itemTraits.includes(t));
      if (!hasType && !hasTrait) return false;
    }

    if (s.ancestry && s.ancestry !== 'any') {
      if (!(item.traits || []).includes(s.ancestry)) return false;
    }

    return true;
  });

  if (pool.length === 0) {
    alert('No items match these parameters. Try adjusting your filters.');
    return;
  }

  pool = pool.map(item => {
    let weight = 1;
    weight *= getLevelWeight(item.level, maxLevel, economyConfig.levelBias, styleConfig.highLevelBias);
    const isMagical = (item.traits || []).some(t => ['magical', 'arcane', 'divine'].includes(t));
    if (isMagical) weight *= (1 + s.arcaneTilt * 2);
    else weight *= (1 + (1 - s.arcaneTilt) * 0.5);
    if (economyConfig.categoryBias.length > 0) {
      const hasBias = economyConfig.categoryBias.some(t => (item.traits || []).includes(t));
      if (hasBias) weight *= 1.5;
    }
    return { ...item, weight };
  });

  const baseCount = Math.floor(
    (styleConfig.min + Math.random() * (styleConfig.max - styleConfig.min))
    * economyConfig.multiplier
  );
  const count = Math.max(3, baseCount);
  const selected = weightedSample(pool, count);

  const inventory = selected.map(item => ({
    id: item.id,
    quantity: generateQuantity(item, s.economy, s.storeType)
  }));

  state.currentMerchant.inventory = inventory;
  state.currentMerchant.currency = generateCurrency(s.settlementSize, s.economy);

  const existingIndex = state.merchants.findIndex(m => m.id === state.currentMerchant.id);
  if (existingIndex >= 0) {
    state.merchants[existingIndex] = state.currentMerchant;
    saveMerchants();
  }

  renderInventory(state.currentMerchant.inventory);

  const currency = state.currentMerchant.currency;
  document.getElementById('result-currency').textContent =
    [currency.gp ? `${currency.gp} gp` : null,
     currency.sp ? `${currency.sp} sp` : null,
     currency.cp ? `${currency.cp} cp` : null]
    .filter(Boolean).join(' · ') || '—';
  document.getElementById('result-item-count').textContent = inventory.length;
}

// ─── Open Saved Merchant ──────────────────────────────────

function openMerchant(id) {
  const merchant = state.merchants.find(m => m.id === id);
  if (!merchant) return;
  state.currentMerchant = merchant;
  displayMerchantResult(merchant);
}

// ─── Create From Existing ─────────────────────────────────

let selectedExistingItem = null;

function initExistingItems() {
  selectedExistingItem = null;
  document.getElementById('copy-item-btn').disabled = true;
  renderExistingItems();
}

function renderExistingItems() {
  const search = document.getElementById('item-search').value.toLowerCase();
  const typeBtn = document.querySelector('#screen-custom-existing .filter-row:nth-child(2) .filter-btn.active');
  const rarityBtn = document.querySelector('#screen-custom-existing .filter-row:nth-child(3) .filter-btn.active');
  const levelMin = parseInt(document.getElementById('level-min').value);
  const levelMax = parseInt(document.getElementById('level-max').value);

  const typeFilter = typeBtn ? typeBtn.textContent.trim() : 'Any';
  const rarityFilter = rarityBtn ? rarityBtn.textContent.trim() : 'Any';

  const filtered = state.items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (typeFilter !== 'Any' && item.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (rarityFilter !== 'Any' && item.rarity?.toLowerCase() !== rarityFilter.toLowerCase()) return false;
    if (item.level < levelMin || item.level > levelMax) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[existingSortColumn];
    let valB = b[existingSortColumn];

    if (existingSortColumn === 'price') {
      valA = (a.price?.gp || 0) * 100 + (a.price?.sp || 0) * 10 + (a.price?.cp || 0);
      valB = (b.price?.gp || 0) * 100 + (b.price?.sp || 0) * 10 + (b.price?.cp || 0);
    }

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'string') {
      return existingSortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return existingSortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const container = document.getElementById('existing-items-list');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-search"></i>
        <p>No items found</p>
        <span>Try adjusting your search or filters</span>
      </div>`;
    return;
  }

  container.innerHTML = sorted.slice(0, 200).map(item => `
    <div class="list-row" onclick="selectExistingItem(this, '${item.id}')">
      <span class="col-item-name row-title">${item.name}</span>
      <span class="col-detail row-meta">${item.type || '—'}</span>
      <span class="col-level row-meta">${item.level ?? '—'}</span>
      <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
      <span class="col-price row-meta">${formatPrice(item.price)}</span>
      <span class="col-rarity">
        <span class="badge ${badgeClass(item.rarity)}">${item.rarity || '—'}</span>
      </span>
    </div>
  `).join('');
}

function selectExistingItem(row, itemId) {
  document.querySelectorAll('#existing-items-list .list-row').forEach(r => {
    r.classList.remove('selected');
    r.querySelector('.col-item-name').style.color = '';
  });
  row.classList.add('selected');
  row.querySelector('.col-item-name').style.color = '#5B7F95';
  selectedExistingItem = state.items.find(i => i.id === itemId);
  document.getElementById('copy-item-btn').disabled = false;
}

function formatPrice(price) {
  if (!price) return '—';
  if (typeof price === 'string') return price;
  const parts = [];
  if (price.gp) parts.push(`${price.gp} gp`);
  if (price.sp) parts.push(`${price.sp} sp`);
  if (price.cp) parts.push(`${price.cp} cp`);
  return parts.join(' · ') || '—';
}

function copyExistingItem() {
  if (!selectedExistingItem) return;

  const copy = {
    id: generateId(),
    sourceId: selectedExistingItem.id,
    name: selectedExistingItem.name,
    type: selectedExistingItem.type || '',
    category: selectedExistingItem.category || '',
    level: selectedExistingItem.level ?? 0,
    price: selectedExistingItem.price || null,
    bulk: selectedExistingItem.bulk ?? '',
    rarity: selectedExistingItem.rarity || 'common',
    traits: selectedExistingItem.traits || [],
    source: selectedExistingItem.source || '',
    description: selectedExistingItem.description || ''
  };

  openItemForm(copy);
}

function openItemForm(item) {
  document.getElementById('item-name-input').value = item.name || '';
  document.getElementById('item-type-select').value = capitalise(item.type) || '';
  document.getElementById('item-category-select').value = capitalise(item.category) || '';
  document.getElementById('item-level-input').value = item.level ?? '';
  document.getElementById('item-rarity-select').value = capitalise(item.rarity) || 'Common';

  const priceVal = formatPrice(item.price);
  document.getElementById('item-price-input').value = priceVal === '—' ? '' : priceVal;

  const bulkVal = formatBulk(item.bulk);
  document.getElementById('item-bulk-input').value = bulkVal === '—' ? '' : bulkVal;

  const wrapper = document.getElementById('traits-wrapper');
  const tagInput = wrapper.querySelector('.tag-input');
  wrapper.querySelectorAll('.tag').forEach(t => t.remove());
  (item.traits || []).forEach(trait => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${trait} <button onclick="this.parentElement.remove()" aria-label="Remove tag">×</button>`;
    wrapper.insertBefore(tag, tagInput);
  });

  document.getElementById('item-source-input').value = item.source || '';
  document.getElementById('item-description-input').value = cleanDescription(item.description || '');

  currentEditItem = item;
  showScreen('screen-custom-new');
}

// ---- Sort function ---------------------------------------

function sortExistingItems(column) {
  if (existingSortColumn === column) {
    existingSortDirection = existingSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    existingSortColumn = column;
    existingSortDirection = 'asc';
  }
  updateSortHeaders();
  renderExistingItems();
}

function updateSortHeaders() {
  const columns = ['name', 'type', 'level', 'bulk', 'price', 'rarity'];
  columns.forEach(col => {
    const icon = document.getElementById(`sort-icon-${col}`);
    const header = icon?.parentElement;
    if (!icon || !header) return;
    if (col === existingSortColumn) {
      header.classList.add('active-sort');
      icon.className = existingSortDirection === 'asc'
        ? 'ti ti-chevron-up'
        : 'ti ti-chevron-down';
      icon.classList.remove('sort-icon-inactive');
    } else {
      header.classList.remove('active-sort');
      icon.className = 'ti ti-chevron-up sort-icon-inactive';
    }
  });
}

// ─── Tag Input ────────────────────────────────────────────

function addTag(e, input) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const val = input.value.trim().replace(/,$/, '');
  if (!val) return;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.innerHTML = `${val} <button onclick="this.parentElement.remove()" aria-label="Remove tag">×</button>`;
  input.parentElement.insertBefore(tag, input);
  input.value = '';
}

// ─── Settings ─────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  settlementSize: 'city',
  economy: 'trade-hub',
  ancestry: 'any',
  storeType: 'any',
  stockingStyle: 'focused',
  arcaneTilt: 20,
  pricingModifier: 0,
  rarity: ['common', 'uncommon']
};

function loadSettings() {
  return loadFromStorage('settings') || DEFAULT_SETTINGS;
}

function saveSettings() {
  const settings = {
    settlementSize: document.getElementById('default-settlement-select').value,
    economy: document.getElementById('default-economy-select').value,
    ancestry: document.getElementById('default-ancestry-select').value,
    storeType: document.getElementById('default-store-type-select').value,
    stockingStyle: document.getElementById('default-stocking-style-select').value,
    arcaneTilt: parseInt(document.getElementById('default-arcane-slider').value),
    pricingModifier: parseInt(document.getElementById('default-price-slider').value),
    rarity: ['common', 'uncommon', 'rare', 'unique'].filter((r, i) =>
      document.querySelectorAll('#screen-settings .checkbox-group input[type="checkbox"]')[i]?.checked
    )
  };
  saveToStorage('settings', settings);

  const btn = document.getElementById('save-settings-btn');
  btn.innerHTML = '<i class="ti ti-check"></i> Saved';
  setTimeout(() => {
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Defaults';
  }, 1500);
}

function applySettingsToForm(settings) {
  // Merchant form
  document.getElementById('settlement-select').value = settings.settlementSize;
  document.getElementById('economy-select').value = settings.economy;
  document.getElementById('store-type-select').value = settings.storeType;
  document.getElementById('stocking-style-select').value = settings.stockingStyle;

  // Settings form
  document.getElementById('default-settlement-select').value = settings.settlementSize;
  document.getElementById('default-economy-select').value = settings.economy;
  document.getElementById('default-store-type-select').value = settings.storeType;
  document.getElementById('default-stocking-style-select').value = settings.stockingStyle;

  // Arcane tilt — merchant form
  const arcaneInput = document.querySelector('#screen-merchant-new input[type="range"]:nth-of-type(1)');
  if (arcaneInput) {
    arcaneInput.value = settings.arcaneTilt;
    document.getElementById('arcane-display').textContent = settings.arcaneTilt + '%';
  }

  // Arcane tilt — settings form
  const defaultArcaneSlider = document.getElementById('default-arcane-slider');
  if (defaultArcaneSlider) {
    defaultArcaneSlider.value = settings.arcaneTilt;
    document.getElementById('default-arcane-display').textContent = settings.arcaneTilt + '%';
  }

  // Pricing modifier — merchant form
  const priceInput = document.querySelector('#screen-merchant-new input[type="range"]:nth-of-type(2)');
  if (priceInput) {
    priceInput.value = settings.pricingModifier;
    const v = settings.pricingModifier;
    document.getElementById('price-display').textContent = (v > 0 ? '+' : '') + v + '%';
  }

  // Pricing modifier — settings form
  const defaultPriceSlider = document.getElementById('default-price-slider');
  if (defaultPriceSlider) {
    defaultPriceSlider.value = settings.pricingModifier;
    document.getElementById('default-price-display').textContent =
      (settings.pricingModifier > 0 ? '+' : '') + settings.pricingModifier + '%';
  }

  // Rarity checkboxes — merchant form
  const rarities = ['common', 'uncommon', 'rare', 'unique'];
  document.querySelectorAll('#screen-merchant-new .checkbox-group input[type="checkbox"]')
    .forEach((cb, i) => { cb.checked = settings.rarity.includes(rarities[i]); });

  // Rarity checkboxes — settings form
  document.querySelectorAll('#screen-settings .checkbox-group input[type="checkbox"]')
    .forEach((cb, i) => { cb.checked = settings.rarity.includes(rarities[i]); });

  // Ancestry — applied after dropdown is populated
  const applyAncestry = () => {
    document.getElementById('ancestry-select').value = settings.ancestry || 'any';
    const defaultAncestrySelect = document.getElementById('default-ancestry-select');
    if (defaultAncestrySelect) defaultAncestrySelect.value = settings.ancestry || 'any';
  };

  if (state.ancestries.length > 0) {
    applyAncestry();
  } else {
    setTimeout(applyAncestry, 500);
  }
}

function setTheme(btn, theme) {
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Theme switching logic will go here
}

function toggleDefaultFilters() {
  const body = document.getElementById('default-filters-body');
  const icon = document.getElementById('default-filters-icon');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  icon.className = isOpen ? 'ti ti-chevron-right' : 'ti ti-chevron-down';
}

function copyPath() {
  const path = document.getElementById('data-path').textContent;
  navigator.clipboard.writeText(path).then(() => {
    const btn = document.querySelector('.btn-copy');
    btn.innerHTML = '<i class="ti ti-check"></i> Copied';
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-copy"></i> Copy';
    }, 1500);
  });
}

function formatPriceModifier(val, displayId) {
  const v = parseInt(val);
  document.getElementById(displayId).textContent = (v > 0 ? '+' : '') + v + '%';
}

// ─── localStorage Helpers ─────────────────────────────────

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
}

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Failed to load ${key}:`, err);
    return null;
  }
}

// ─── Merchants ────────────────────────────────────────────

function loadMerchants() {
  state.merchants = loadFromStorage('merchants') || [];
  renderMerchantsList();
}

function saveMerchants() {
  saveToStorage('merchants', state.merchants);
}

function renderMerchantsList() {
  const container = document.getElementById('merchants-list');
  const count = document.getElementById('merchants-count');
  count.textContent = `${state.merchants.length} saved`;

  if (state.merchants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-building-store"></i>
        <p>No merchants yet</p>
        <span>Hit New Merchant to generate your first one</span>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="list-header">
      <span class="col-name">Name</span>
      <span class="col-detail">Ancestry</span>
      <span class="col-detail">Type</span>
      <span class="col-detail-wide">Settlement · Economy</span>
      <span class="col-detail">Level</span>
      <span class="col-rarity">Rarity</span>
    </div>
    ${state.merchants.map(merchant => {
      const s = merchant.generatorSettings;
      const maxLevel = SETTLEMENT_LEVEL[s.settlementSize] || '—';
      const rarity = s.rarity.length === 4 ? 'All' : s.rarity.map(capitalise).join(', ');
      const ancestryDisplay = s.ancestry && s.ancestry !== 'any' ? capitalise(s.ancestry) : '—';
      const storeDisplay = capitalise(s.storeType.replace(/-/g, ' '));
      const settlementDisplay = capitalise(s.settlementSize);
      const economyDisplay = capitalise(s.economy.replace(/-/g, ' '));
      const rarityBadge = s.rarity[0] || 'common';

return `
  <div class="list-row" onclick="openMerchant('${merchant.id}')">
    <span class="col-name row-title">${merchant.name || '<span class="muted">Unnamed Merchant</span>'}</span>
    <span class="col-detail row-meta">${ancestryDisplay}</span>
    <span class="col-detail row-meta">${storeDisplay}</span>
    <span class="col-detail-wide row-meta">${settlementDisplay} · ${economyDisplay}</span>
    <span class="col-detail row-meta">1–${maxLevel}</span>
    <span class="col-rarity"><span class="badge badge-${rarityBadge}">${rarity}</span></span>
    <button class="btn-delete" onclick="deleteMerchant(event, '${merchant.id}')">
      <i class="ti ti-trash"></i>
    </button>
  </div>
`;
    }).join('')}
  `;
}

// ─── User Items ───────────────────────────────────────────

function loadUserItems() {
  state.userItems = loadFromStorage('userItems') || [];
  renderUserItemsList();
}

function saveUserItems() {
  saveToStorage('userItems', state.userItems);
}

function renderUserItemsList() {
  const container = document.getElementById('custom-list');
  const count = document.getElementById('custom-count');
  count.textContent = `${state.userItems.length} item${state.userItems.length !== 1 ? 's' : ''}`;

  if (state.userItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-database"></i>
        <p>No custom items yet</p>
        <span>Create a homebrew item or copy and modify an existing one</span>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="list-header">
      <span class="col-item-name">Name</span>
      <span class="col-detail">Type</span>
      <span class="col-level">Level</span>
      <span class="col-bulk">Bulk</span>
      <span class="col-price">Price</span>
      <span class="col-rarity">Rarity</span>
    </div>
    ${state.userItems.map(item => `
      <div class="list-row" onclick="editUserItem('${item.id}')">
        <span class="col-item-name row-title">
          ${item.name}
          ${item.sourceId ? '<i class="ti ti-tool" style="font-size: 12px; color: #5B7F95; margin-left: 4px;" title="Modified from existing item"></i>' : ''}
        </span>
        <span class="col-detail row-meta">${item.type || '—'}</span>
        <span class="col-level row-meta">${item.level ?? '—'}</span>
        <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
        <span class="col-price row-meta">${typeof item.price === 'string' ? item.price : formatPrice(item.price)}</span>
        <span class="col-rarity"><span class="badge ${badgeClass(item.rarity)}">${item.rarity || '—'}</span></span>
        <button class="btn-delete" onclick="deleteUserItem(event, '${item.id}')">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    `).join('')}
  `;
}

function saveUserItem() {
  const name = document.getElementById('item-name-input').value.trim();
  if (!name) {
    alert('Please enter a name for the item.');
    return;
  }

  const traits = Array.from(document.querySelectorAll('#traits-wrapper .tag'))
    .map(tag => tag.textContent.trim().replace('×', '').trim());

  const item = {
    id: currentEditItem?.id || generateId(),
    sourceId: currentEditItem?.sourceId || null,
    name,
    type: document.getElementById('item-type-select').value,
    category: document.getElementById('item-category-select').value,
    level: parseInt(document.getElementById('item-level-input').value) || 0,
    rarity: document.getElementById('item-rarity-select').value.toLowerCase(),
    price: document.getElementById('item-price-input').value.trim() || null,
    bulk: document.getElementById('item-bulk-input').value.trim() || null,
    traits,
    source: document.getElementById('item-source-input').value.trim(),
    description: document.getElementById('item-description-input').value.trim()
  };

  const existingIndex = state.userItems.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    state.userItems[existingIndex] = item;
  } else {
    state.userItems.push(item);
  }

  saveUserItems();
  renderUserItemsList();
  clearItemForm();
  showScreen('screen-custom-data');
}

function clearItemForm() {
  document.getElementById('item-name-input').value = '';
  document.getElementById('item-type-select').value = '';
  document.getElementById('item-category-select').value = '';
  document.getElementById('item-level-input').value = '';
  document.getElementById('item-rarity-select').value = 'Common';
  document.getElementById('item-price-input').value = '';
  document.getElementById('item-bulk-input').value = '';
  document.getElementById('item-source-input').value = '';
  document.getElementById('item-description-input').value = '';
  const wrapper = document.getElementById('traits-wrapper');
  wrapper.querySelectorAll('.tag').forEach(t => t.remove());
  currentEditItem = null;
}

function editUserItem(id) {
  const item = state.userItems.find(i => i.id === id);
  if (!item) return;
  openItemForm(item);
}

// ─── Import / Export ──────────────────────────────────────

function exportData(type) {
  const data = type === 'merchants' ? state.merchants : state.userItems;
  const filename = type === 'merchants' ? 'merchants.json' : 'user-items.json';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(type) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid format');
        if (type === 'merchants') {
          state.merchants = data;
          saveMerchants();
          renderMerchantsList();
        } else {
          state.userItems = data;
          saveUserItems();
          renderUserItemsList();
        }
        alert(`Successfully imported ${data.length} ${type === 'merchants' ? 'merchants' : 'items'}.`);
      } catch (err) {
        alert('Failed to import — make sure the file is a valid JSON export from this app.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ─── Reset ────────────────────────────────────────────────

function resetAllData() {
  if (!confirm('This will permanently delete all your merchants and custom items. This cannot be undone. Are you sure?')) return;
  state.merchants = [];
  state.userItems = [];
  saveMerchants();
  saveUserItems();
  renderMerchantsList();
  renderUserItemsList();
  alert('All data has been reset.');
}

// ─── Filter helpers ───────────────────────────────────────

function setSearchFilter(btn, group) {
  const row = btn.parentElement;
  row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderExistingItems();
}

function updateLevelRange(slider, displayId) {
  const min = parseInt(document.getElementById('level-min').value);
  const max = parseInt(document.getElementById('level-max').value);
  document.getElementById('level-min-val').textContent = min;
  document.getElementById('level-max-val').textContent = max;
  renderExistingItems();
}

function filterItems() {
  renderExistingItems();
}

// ─── Delete ───────────────────────────────────────────────

function deleteMerchant(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this merchant? This cannot be undone.')) return;
  state.merchants = state.merchants.filter(m => m.id !== id);
  saveMerchants();
  renderMerchantsList();
}

function deleteUserItem(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this item? This cannot be undone.')) return;
  state.userItems = state.userItems.filter(i => i.id !== id);
  saveUserItems();
  renderUserItemsList();
}

// ─── Start the app ────────────────────────────────────────

init();
