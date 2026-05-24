// ─── App State ────────────────────────────────────────────

const state = {
  items: [],
  merchants: [],
  userItems: [],
  ancestries: [],
  currentMerchant: null
};

let existingSortColumn = 'name';
let existingSortDirection = 'asc';

let inventoryGroupBy = 'category';
let inventorySortBy  = 'level';

let editModeActive = false;
let editModeSnapshot = [];

let modalSelectedItem = null;

const navStack = [];

const TAB_SCREENS = {
  'tab-merchants': ['screen-merchants', 'screen-merchant-new', 'screen-merchant-result'],
  'tab-custom':    ['screen-custom-data', 'screen-custom-new', 'screen-custom-existing'],
  'tab-settings':  ['screen-settings']
};

// ─── Utilities ────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID();
}

function badgeClass(rarity) {
  if (!rarity) return '';
  return `badge-${rarity.toLowerCase()}`;
}

function formatBulk(bulk) {
  if (bulk === null || bulk === undefined || bulk === '') return '—';
  return bulk.toString();
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTrait(trait) {
  return trait.replace(/-/g, ' ');
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

// ─── Gel Slider Helpers ───────────────────────────────────

function updateGelSlider(sliderId, fillId, thumbId, displayId, signed) {
  const slider = document.getElementById(sliderId);
  const fill   = document.getElementById(fillId);
  const thumb  = document.getElementById(thumbId);
  const display = displayId ? document.getElementById(displayId) : null;
  if (!slider || !fill || !thumb) return;

  const val = parseInt(slider.value);
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const pct = (val - min) / (max - min) * 100;
  const label = signed ? (val > 0 ? '+' : '') + val + '%' : val + '%';

  fill.style.width = pct + '%';
  thumb.style.left = pct + '%';
  thumb.textContent = label;
  if (display) display.textContent = label;
}

function syncGelSlider(sliderId, fillId, thumbId, displayId, signed) {
  // Set initial visual state from slider value — call on load
  updateGelSlider(sliderId, fillId, thumbId, displayId, signed);
}

function updateLevelSlider(sliderId, fillId, thumbId) {
  const slider = document.getElementById(sliderId);
  const fill   = document.getElementById(fillId);
  const thumb  = document.getElementById(thumbId);
  if (!slider || !fill || !thumb) return;

  const val = parseInt(slider.value);
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const pct = (val - min) / (max - min) * 100;

  fill.style.width = pct + '%';
  thumb.style.left = pct + '%';
  thumb.textContent = val;
}

// ─── Data Loading ─────────────────────────────────────────

async function init() {
  await loadItems();
  await loadFirearms();
  await loadAncestries();
  loadMerchants();
  loadUserItems();
  applySettingsToForm(loadSettings());
  checkForUpdates();
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

async function loadFirearms() {
  try {
    const response = await fetch('data/firearms.json');
    const names = await response.json();
    const nameSet = new Set(names.map(n => n.toLowerCase()));
    state.items.forEach(item => {
      if (nameSet.has(item.name?.toLowerCase())) {
        if (!item.traits) item.traits = [];
        if (!item.traits.includes('firearm')) item.traits.push('firearm');
      }
    });
    console.log(`Patched firearm traits onto ${names.length} items`);
  } catch (err) {
    console.error('Failed to load firearms.json:', err);
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
  updateTabBar(id);
}

function navigateTab(screenId) {
  navStack.length = 0;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'screen-custom-existing') initExistingItems();
  updateBackButton();
  updateTabBar(screenId);
}

function goBack() {
  if (navStack.length === 0) return;
  const previous = navStack.pop();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(previous).classList.add('active');
  if (previous === 'screen-custom-existing') initExistingItems();
  updateBackButton();
  updateTabBar(previous);
}

function updateBackButton() {
  const current = document.querySelector('.screen.active');
  if (!current) return;
  const topLevel = ['screen-merchants', 'screen-custom-data', 'screen-settings'];
  const isTopLevel = topLevel.includes(current.id);
  const btn = current.querySelector('.back-btn');
  if (btn) btn.style.display = isTopLevel ? 'none' : 'flex';
}

function updateTabBar(screenId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  for (const [tabId, screens] of Object.entries(TAB_SCREENS)) {
    if (screens.includes(screenId)) {
      document.getElementById(tabId)?.classList.add('active');
      break;
    }
  }
}

// ─── Filters Toggle ───────────────────────────────────────

function toggleFilters() {
  const body = document.getElementById('filters-body');
  const icon = document.getElementById('filters-icon');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  icon.className = isOpen ? 'ti ti-chevron-right' : 'ti ti-chevron-down';
}

function toggleDefaultFilters() {
  const body = document.getElementById('default-filters-body');
  const icon = document.getElementById('default-filters-icon');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  icon.className = isOpen ? 'ti ti-chevron-right' : 'ti ti-chevron-down';
}

// ─── Inventory View Controls ──────────────────────────────

function setInventoryGroup(btn, value) {
  if (editModeActive) return;
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  inventoryGroupBy = value;
  if (state.currentMerchant) renderInventory(state.currentMerchant.inventory);
}

function setInventorySort(btn, value) {
  if (editModeActive) return;
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  inventorySortBy = value;
  if (state.currentMerchant) renderInventory(state.currentMerchant.inventory);
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
  'ranged':       { types: ['ammo'],                      traits: ['bow', 'crossbow', 'ranged'] },
  'alchemist':    { types: ['consumable'],                traits: ['alchemical', 'bomb', 'poison', 'elixir', 'mutagen'] },
  'arcane-goods': { types: [],                            traits: ['magical', 'arcane', 'scroll', 'wand', 'staff'] },
  'divine-goods': { types: [],                            traits: ['divine', 'holy', 'unholy', 'healing'] },
  'general-store':{ types: ['equipment', 'consumable'],   traits: [] },
  'gunsmith':     { types: [],                            traits: ['firearm'] }
};

const STOCKING_STYLE = {
  'broad':   { min: 25, max: 35, adjacent: true,  highLevelBias: false },
  'focused': { min: 12, max: 18, adjacent: false, highLevelBias: false },
  'curated': { min: 5,  max: 8,  adjacent: false, highLevelBias: true }
};

// ─── Merchant Generator ───────────────────────────────────

function buildMerchant(config) {
  const {
    name = null,
    settlement = 'city',
    economy = 'trade-hub',
    ancestry = 'any',
    storeType = 'any',
    stockingStyle = 'focused',
    arcaneTilt = 0.2,
    pricingModifier = 0,
    rarity = ['common', 'uncommon'],
    includeTags = [],
    excludeTags = []
  } = config;

  const maxLevel = SETTLEMENT_LEVEL[settlement] || 14;
  const economyConfig = ECONOMY_CONFIG[economy] || ECONOMY_CONFIG['trade-hub'];
  const storeConfig = STORE_TYPES[storeType] || STORE_TYPES['any'];
  const styleConfig = STOCKING_STYLE[stockingStyle] || STOCKING_STYLE['focused'];

  let pool = state.items.filter(item => {
    if (item.level > maxLevel) return false;
    if (!rarity.includes(item.rarity?.toLowerCase())) return false;

    if (storeConfig.types.length > 0 || storeConfig.traits.length > 0) {
      const itemTraits = item.traits || [];
      const hasType = storeConfig.types.length > 0 && storeConfig.types.includes(item.type);
      const hasTrait = storeConfig.traits.length > 0 && storeConfig.traits.some(t => itemTraits.includes(t));
      if (!hasType && !hasTrait) return false;
    }

    if (ancestry && ancestry !== 'any') {
      if (!(item.traits || []).includes(ancestry)) return false;
    }

    const itemTraitsLower = (item.traits || []).map(t => t.toLowerCase());

    if (includeTags.length > 0) {
      if (!includeTags.some(t => itemTraitsLower.includes(t.replace(/\s+/g, '-')))) return false;
    }

    if (excludeTags.length > 0) {
      if (excludeTags.some(t => itemTraitsLower.includes(t.replace(/\s+/g, '-')))) return false;
    }

    return true;
  });

  if (pool.length === 0) return null;

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

  const baseCount = Math.floor(
    (styleConfig.min + Math.random() * (styleConfig.max - styleConfig.min))
    * economyConfig.multiplier
  );
  const count = Math.max(3, baseCount);
  const selected = weightedSample(pool, count);

  // ─── Guaranteed healing potions for alchemists and divine goods shops
  if (['alchemist', 'divine-goods'].includes(storeType)) {
    const selectedIds = new Set(selected.map(i => i.id));
    const healingPotions = state.items.filter(item =>
      /potion of healing/i.test(item.name) &&
      item.level <= maxLevel &&
      !selectedIds.has(item.id)
    );
    healingPotions.sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    const potionCount = Math.floor(Math.random() * 3) + 1;
    const potionPool = healingPotions.map(p => ({ ...p, weight: 1 / ((p.level ?? 0) + 1) }));
    const injected = weightedSample(potionPool, Math.min(potionCount, potionPool.length));
    injected.forEach(p => selected.push(p));
  }

  const inventory = selected.map(item => ({
    id: item.id,
    quantity: generateQuantity(item, economy, storeType)
  }));

  return {
    id: generateId(),
    name,
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
      rarity,
      includeTags,
      excludeTags
    }
  };
}

function generateMerchant() {
  const name = document.getElementById('merchant-name-input').value.trim();
  const settlement = document.getElementById('settlement-select').value;
  const economy = document.getElementById('economy-select').value;
  const ancestry = document.getElementById('ancestry-select').value;
  const storeType = document.getElementById('store-type-select').value;
  const stockingStyle = document.getElementById('stocking-style-select').value;
  const arcaneTilt = parseInt(document.getElementById('arcane-slider').value) / 100;
  const pricingModifier = parseInt(document.getElementById('price-slider').value) / 100;
  const rarityCheckboxes = document.querySelectorAll('#screen-merchant-new .checkbox-group input[type="checkbox"]');
  const rarity = ['common', 'uncommon', 'rare', 'unique'].filter((r, i) => rarityCheckboxes[i]?.checked);
  const includeRaw = document.getElementById('include-tags-input').value;
  const excludeRaw = document.getElementById('exclude-tags-input').value;
  const includeTags = includeRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const excludeTags = excludeRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  const merchant = buildMerchant({ name, settlement, economy, ancestry, storeType, stockingStyle, arcaneTilt, pricingModifier, rarity, includeTags, excludeTags });

  if (!merchant) {
    alert('No items match these parameters. Try adjusting your filters.');
    return;
  }

  displayMerchantResult(merchant);
}

function generateSampleMerchants() {
  const samples = [
    {
      name: "Durgin's Arms & Armour",
      settlement: 'city',
      economy: 'military',
      storeType: 'blacksmith',
      stockingStyle: 'focused',
      rarity: ['common', 'uncommon']
    },
    {
      name: "Thessaly's Curios",
      settlement: 'city',
      economy: 'arcane',
      storeType: 'arcane-goods',
      stockingStyle: 'curated',
      arcaneTilt: 0.9,
      rarity: ['common', 'uncommon', 'rare']
    },
    {
      name: "Mira's Remedies",
      settlement: 'town',
      economy: 'trade-hub',
      storeType: 'alchemist',
      stockingStyle: 'broad',
      rarity: ['common', 'uncommon']
    },
    {
      name: 'The Dusty Sack',
      settlement: 'village',
      economy: 'frontier',
      storeType: 'general-store',
      stockingStyle: 'broad',
      rarity: ['common']
    }
  ];

  samples.forEach(config => {
    const merchant = buildMerchant(config);
    if (merchant) state.merchants.push(merchant);
  });

  saveMerchants();
  renderMerchantsList();
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

// ─── Merchant Result Display ──────────────────────────────

function displayMerchantResult(merchant) {
  state.currentMerchant = merchant;

  if (editModeActive) exitEditMode(false);

  inventoryGroupBy = 'category';
  inventorySortBy  = 'level';
  document.querySelectorAll('#screen-merchant-result .filter-btn').forEach(btn => {
    const oc = btn.getAttribute('onclick') || '';
    btn.classList.toggle('active',
      oc.includes("'category'") || oc.includes("'level'"));
  });

  const s = merchant.generatorSettings;
  const nameEl = document.getElementById('result-name');
  nameEl.textContent = merchant.name || '';
  nameEl.style.display = merchant.name ? '' : 'none';
  document.getElementById('result-subtitle').textContent = [
    s.ancestry !== 'any' ? capitalise(s.ancestry) : null,
    capitalise(s.storeType.replace(/-/g, ' ')),
    capitalise(s.settlementSize),
    capitalise(s.economy.replace(/-/g, ' '))
  ].filter(Boolean).join(' · ');

  updateMerchantStats();
  renderInventory(merchant.inventory);
  showScreen('screen-merchant-result');
}

function updateMerchantStats() {
  const merchant = state.currentMerchant;
  if (!merchant) return;
  const currency = merchant.currency;
  document.getElementById('result-currency').textContent =
    [currency.gp ? `${currency.gp} gp` : null,
     currency.sp ? `${currency.sp} sp` : null,
     currency.cp ? `${currency.cp} cp` : null]
    .filter(Boolean).join(' · ') || '—';
  document.getElementById('result-item-count').textContent = merchant.inventory.length;
  document.getElementById('result-rarity').textContent =
    merchant.generatorSettings.rarity.map(capitalise).join(' · ');
  document.getElementById('result-max-level').textContent =
    SETTLEMENT_LEVEL[merchant.generatorSettings.settlementSize] || '—';
}

// ─── Inventory Rendering ──────────────────────────────────

function itemSortValue(item) {
  if (inventorySortBy === 'name')  return item.name?.toLowerCase() ?? '';
  if (inventorySortBy === 'price') {
    const p = item.price;
    if (!p || typeof p === 'string') return 0;
    return (p.gp || 0) * 100 + (p.sp || 0) * 10 + (p.cp || 0);
  }
  return item.level ?? 0;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const va = itemSortValue(a);
    const vb = itemSortValue(b);
    if (typeof va === 'string') return va.localeCompare(vb);
    return va - vb;
  });
}

function renderDescriptionPanel(item) {
  const mod = state.currentMerchant?.generatorSettings?.pricingModifier ?? 0;
  const meta = [
    item.type     ? { label: 'Type',     value: capitalise(item.type) }     : null,
    item.category ? { label: 'Category', value: capitalise(item.category) } : null,
    item.level != null ? { label: 'Level', value: item.level }              : null,
    item.bulk != null  ? { label: 'Bulk',  value: formatBulk(item.bulk) }   : null,
    item.price    ? { label: 'Price',    value: formatPriceWithModifier(item.price, mod) } : null,
    item.source   ? { label: 'Source',   value: item.source }               : null,
  ].filter(Boolean);

  const traits = (item.traits || []);
  const description = item.description ? cleanDescription(item.description) : null;

  return `
    <div class="item-description">
      <div class="item-description-inner">
        ${meta.length ? `
          <div class="item-desc-meta">
            ${meta.map(f => `
              <div class="item-desc-field">
                <span class="item-desc-label">${f.label}</span>
                <span class="item-desc-value">${f.value}</span>
              </div>
            `).join('')}
          </div>` : ''}
        ${traits.length ? `
          <div class="item-desc-traits">
            ${traits.map(t => `<span class="badge badge-trait">${capitalise(formatTrait(t))}</span>`).join('')}
          </div>` : ''}
        ${description
          ? `<p class="item-desc-text">${description}</p>`
          : `<p class="item-desc-empty">No description available.</p>`}
      </div>
    </div>`;
}

function toggleDescription(row) {
  if (editModeActive) return;
  const wrapper = row.closest('.item-wrapper');
  const panel = wrapper.querySelector('.item-description');
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.item-description.open').forEach(p => p.classList.remove('open'));
  if (!isOpen) panel.classList.add('open');
}

function renderItemRow(item) {
  const mod = state.currentMerchant?.generatorSettings?.pricingModifier ?? 0;
  return `
    <div class="item-wrapper">
      <div class="list-row grid-inventory" onclick="toggleDescription(this)">
        <span class="col-item-name row-title">${item.name}</span>
        <span class="col-qty row-meta">${item.quantity}</span>
        <span class="col-level row-meta">${item.level ?? '—'}</span>
        <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
        <span class="col-price row-meta">${formatPriceWithModifier(item.price, mod)}</span>
        <span class="col-rarity"><span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span></span>
      </div>
      ${renderDescriptionPanel(item)}
    </div>`;
}

function renderEditRow(item) {
  const mod = state.currentMerchant?.generatorSettings?.pricingModifier ?? 0;
  return `
    <div class="item-wrapper">
      <div class="list-row grid-inventory-edit">
        <span class="col-item-name row-title">${item.name}</span>
        <span class="col-qty">
          <div class="qty-stepper">
            <button class="qty-btn" onclick="stepEditQty(this, -1)">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" min="0" max="999"
              data-item-id="${item.id}" oninput="clampEditQty(this)" />
            <button class="qty-btn" onclick="stepEditQty(this, 1)">+</button>
          </div>
        </span>
        <span class="col-level row-meta">${item.level ?? '—'}</span>
        <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
        <span class="col-price row-meta">${formatPriceWithModifier(item.price, mod)}</span>
        <span class="col-rarity"><span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span></span>
        <span class="col-action">
          <button class="btn-delete" onclick="removeEditRow(this, '${item.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </span>
      </div>
    </div>`;
}

function stepEditQty(btn, delta) {
  const input = btn.parentElement.querySelector('.qty-input');
  input.value = Math.max(0, parseInt(input.value || 0) + delta);
}

function clampEditQty(input) {
  const v = parseInt(input.value);
  if (isNaN(v) || v < 0) input.value = 0;
}

function removeEditRow(btn, itemId) {
  btn.closest('.item-wrapper').remove();
}

function resolveInventory(inventory) {
  const resolved = [];
  inventory.forEach(({ id, quantity }) => {
    const item = state.items.find(i => i.id === id);
    if (item) resolved.push({ ...item, quantity });
  });
  return resolved;
}

function renderInventory(inventory) {
  const container = document.getElementById('result-inventory');
  const header    = document.getElementById('inventory-header');

  if (inventory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-wand"></i>
        <p>No inventory yet</p>
        <span>Hit Generate to stock this merchant</span>
      </div>`;
    return;
  }

  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'unique'];

  const getGroupKey = item =>
    inventoryGroupBy === 'rarity'
      ? (item.rarity?.toLowerCase() || 'common')
      : (item.category || item.type || 'other');

  if (editModeActive) {
    header.className = 'list-header grid-inventory-edit';
    header.innerHTML = `
      <span class="col-item-name">Item</span>
      <span class="col-qty">Quantity</span>
      <span class="col-level">Level</span>
      <span class="col-bulk">Bulk</span>
      <span class="col-price">Price</span>
      <span class="col-rarity">Rarity</span>
      <span class="col-action"></span>`;

    if (inventoryGroupBy === 'flat') {
      container.innerHTML = editModeSnapshot.map(renderEditRow).join('');
      return;
    }

    const groups = {};
    editModeSnapshot.forEach(item => {
      const key = getGroupKey(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) =>
      inventoryGroupBy === 'rarity'
        ? RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b)
        : a.localeCompare(b)
    );

    container.innerHTML = sortedKeys.map(key => `
      <p class="category-heading">${capitalise(key)}</p>
      ${groups[key].map(renderEditRow).join('')}
    `).join('');
    return;
  }

  // Normal mode
  header.className = 'list-header grid-inventory';
  header.innerHTML = `
    <span class="col-item-name">Item</span>
    <span class="col-qty">Qty</span>
    <span class="col-level">Level</span>
    <span class="col-bulk">Bulk</span>
    <span class="col-price">Price</span>
    <span class="col-rarity">Rarity</span>`;

  const resolved = resolveInventory(inventory);

  if (inventoryGroupBy === 'flat') {
    container.innerHTML = sortItems(resolved).map(renderItemRow).join('');
    return;
  }

  const groups = {};
  resolved.forEach(item => {
    const key = getGroupKey(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) =>
    inventoryGroupBy === 'rarity'
      ? RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b)
      : a.localeCompare(b)
  );

  container.innerHTML = sortedKeys.map(key => `
    <p class="category-heading">${capitalise(key)}</p>
    ${sortItems(groups[key]).map(renderItemRow).join('')}
  `).join('');
}

// ─── Quantity Edit Mode ───────────────────────────────────

function toggleQuantityEdit() {
  if (editModeActive) {
    saveQuantityEdit();
  } else {
    enterEditMode();
  }
}

function enterEditMode() {
  editModeActive = true;
  editModeSnapshot = resolveInventory(state.currentMerchant.inventory);

  const btn = document.getElementById('modify-qty-btn');
  btn.className = 'btn-save-qty';
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Quantities';

  renderInventory(state.currentMerchant.inventory);
}

function saveQuantityEdit() {
  const inputs = document.querySelectorAll('#result-inventory .qty-input');
  const zeros = [];

  inputs.forEach(input => {
    if (parseInt(input.value) === 0) {
      const wrapper = input.closest('.item-wrapper');
      const name = wrapper.querySelector('.col-item-name')?.textContent?.trim() || 'Unknown item';
      zeros.push(name);
    }
  });

  if (zeros.length > 0) {
    const proceed = confirm(
      `${zeros.length} item${zeros.length > 1 ? 's' : ''} ${zeros.length > 1 ? 'have' : 'has'} a quantity of 0 and will be removed:\n\n${zeros.join('\n')}\n\nContinue?`
    );
    if (!proceed) return;
  }

  const newInventory = [];
  document.querySelectorAll('#result-inventory .qty-input').forEach(input => {
    const qty = parseInt(input.value);
    if (qty > 0) {
      newInventory.push({ id: input.dataset.itemId, quantity: qty });
    }
  });

  state.currentMerchant.inventory = newInventory;
  autoSaveMerchant();
  exitEditMode(true);
}

function exitEditMode(rerender) {
  editModeActive = false;
  editModeSnapshot = [];

  const btn = document.getElementById('modify-qty-btn');
  btn.className = 'btn-secondary';
  btn.innerHTML = '<i class="ti ti-pencil"></i> Modify Quantities';

  if (rerender) {
    renderInventory(state.currentMerchant.inventory);
    updateMerchantStats();
  }
}

// ─── Auto-save ────────────────────────────────────────────

function autoSaveMerchant() {
  if (!state.currentMerchant) return;
  const existing = state.merchants.findIndex(m => m.id === state.currentMerchant.id);
  if (existing >= 0) {
    state.merchants[existing] = state.currentMerchant;
    saveMerchants();
    renderMerchantsList();
  }
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
  if (editModeActive) exitEditMode(false);

  const s = state.currentMerchant.generatorSettings;
  const merchant = buildMerchant({
    name: state.currentMerchant.name,
    settlement: s.settlementSize,
    economy: s.economy,
    ancestry: s.ancestry,
    storeType: s.storeType,
    stockingStyle: s.stockingStyle,
    arcaneTilt: s.arcaneTilt,
    pricingModifier: s.pricingModifier,
    rarity: s.rarity,
    includeTags: s.includeTags || [],
    excludeTags: s.excludeTags || []
  });

  if (!merchant) {
    alert('No items match these parameters. Try adjusting your filters.');
    return;
  }

  state.currentMerchant.inventory = merchant.inventory;
  state.currentMerchant.currency  = merchant.currency;

  const existingIndex = state.merchants.findIndex(m => m.id === state.currentMerchant.id);
  if (existingIndex >= 0) {
    state.merchants[existingIndex] = state.currentMerchant;
    saveMerchants();
  }

  renderInventory(state.currentMerchant.inventory);
  updateMerchantStats();
}

// ─── Open Saved Merchant ──────────────────────────────────

function openMerchant(id) {
  const merchant = state.merchants.find(m => m.id === id);
  if (!merchant) return;
  state.currentMerchant = merchant;
  displayMerchantResult(merchant);
}

// ─── Add Item Modal ───────────────────────────────────────

function openAddItemModal() {
  modalSelectedItem = null;
  document.getElementById('modal-item-search').value = '';
  document.getElementById('modal-qty-input').value = 1;
  document.getElementById('modal-qty-controls').style.visibility = 'hidden';
  document.getElementById('modal-selected-name').textContent = '—';
  document.getElementById('modal-confirm-btn').disabled = true;

  document.querySelectorAll('#add-item-modal .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === 'Any');
  });

  filterModalItems();
  document.getElementById('add-item-modal').classList.add('open');
}

function closeAddItemModal(e) {
  if (e && e.target !== document.getElementById('add-item-modal')) return;
  document.getElementById('add-item-modal').classList.remove('open');
  modalSelectedItem = null;
}

function filterModalItems() {
  const search     = document.getElementById('modal-item-search').value.toLowerCase();
  const typeBtn    = document.querySelector('#add-item-modal .filter-row:nth-child(2) .filter-btn.active');
  const rarityBtn  = document.querySelector('#add-item-modal .filter-row:nth-child(3) .filter-btn.active');
  const typeFilter   = typeBtn   ? typeBtn.textContent.trim()   : 'Any';
  const rarityFilter = rarityBtn ? rarityBtn.textContent.trim() : 'Any';

  const filtered = state.items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (typeFilter   !== 'Any' && item.type?.toLowerCase()   !== typeFilter.toLowerCase())   return false;
    if (rarityFilter !== 'Any' && item.rarity?.toLowerCase() !== rarityFilter.toLowerCase()) return false;
    return true;
  });

  const container = document.getElementById('modal-items-list');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-search"></i>
        <p>No items found</p>
        <span>Try adjusting your search or filters</span>
      </div>`;
    return;
  }

  container.innerHTML = filtered.slice(0, 200).map(item => `
    <div class="list-row grid-existing-items modal-item-row" onclick="selectModalItem(this, '${item.id}')">
      <span class="col-item-name row-title">${item.name}</span>
      <span class="col-detail row-meta">${capitalise(item.type) || '—'}</span>
      <span class="col-level row-meta">${item.level ?? '—'}</span>
      <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
      <span class="col-price row-meta">${formatPrice(item.price)}</span>
      <span class="col-rarity">
        <span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span>
      </span>
    </div>
  `).join('');
}

function setModalFilter(btn, group) {
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterModalItems();
}

function selectModalItem(row, itemId) {
  document.querySelectorAll('#modal-items-list .modal-item-row').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  modalSelectedItem = state.items.find(i => i.id === itemId);
  document.getElementById('modal-selected-name').textContent = modalSelectedItem?.name || '—';
  document.getElementById('modal-qty-controls').style.visibility = 'visible';
  document.getElementById('modal-confirm-btn').disabled = false;
}

function stepModalQty(delta) {
  const input = document.getElementById('modal-qty-input');
  input.value = Math.max(1, parseInt(input.value || 1) + delta);
}

function confirmAddItem() {
  if (!modalSelectedItem || !state.currentMerchant) return;

  const qty = Math.max(1, parseInt(document.getElementById('modal-qty-input').value) || 1);
  const existing = state.currentMerchant.inventory.find(e => e.id === modalSelectedItem.id);

  if (existing) {
    if (editModeActive) {
      const input = document.querySelector(`#result-inventory .qty-input[data-item-id="${modalSelectedItem.id}"]`);
      if (input) input.value = parseInt(input.value) + qty;
      else existing.quantity += qty;
    } else {
      existing.quantity += qty;
    }
  } else {
    state.currentMerchant.inventory.push({ id: modalSelectedItem.id, quantity: qty });
    if (editModeActive) {
      editModeSnapshot.push({ ...modalSelectedItem, quantity: qty });
      const container = document.getElementById('result-inventory');
      const div = document.createElement('div');
      div.innerHTML = renderEditRow({ ...modalSelectedItem, quantity: qty });
      container.appendChild(div.firstElementChild);
    }
  }

  if (!editModeActive) renderInventory(state.currentMerchant.inventory);

  autoSaveMerchant();
  updateMerchantStats();

  document.getElementById('add-item-modal').classList.remove('open');
  modalSelectedItem = null;
}

// ─── Create From Existing ─────────────────────────────────

let selectedExistingItem = null;

function initExistingItems() {
  selectedExistingItem = null;
  document.getElementById('copy-item-btn').disabled = true;
  renderExistingItems();
}

function renderExistingItems() {
  const search     = document.getElementById('item-search').value.toLowerCase();
  const typeBtn    = document.querySelector('#screen-custom-existing .filter-row:nth-child(2) .filter-btn.active');
  const rarityBtn  = document.querySelector('#screen-custom-existing .filter-row:nth-child(3) .filter-btn.active');
  const levelMin   = parseInt(document.getElementById('level-min').value);
  const levelMax   = parseInt(document.getElementById('level-max').value);

  const typeFilter   = typeBtn   ? typeBtn.textContent.trim()   : 'Any';
  const rarityFilter = rarityBtn ? rarityBtn.textContent.trim() : 'Any';

  const filtered = state.items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (typeFilter   !== 'Any' && item.type?.toLowerCase()   !== typeFilter.toLowerCase())   return false;
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
    <div class="item-wrapper">
      <div class="list-row grid-existing-items" onclick="selectExistingItem(this, '${item.id}'); toggleDescription(this)">
        <span class="col-item-name row-title">${item.name}</span>
        <span class="col-detail row-meta">${capitalise(item.type) || '—'}</span>
        <span class="col-level row-meta">${item.level ?? '—'}</span>
        <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
        <span class="col-price row-meta">${formatPrice(item.price)}</span>
        <span class="col-rarity">
          <span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span>
        </span>
      </div>
      ${renderDescriptionPanel(item)}
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
  if (price.pp) parts.push(`${price.pp} pp`);
  if (price.gp) parts.push(`${price.gp} gp`);
  if (price.sp) parts.push(`${price.sp} sp`);
  if (price.cp) parts.push(`${price.cp} cp`);
  return parts.join(' · ') || '—';
}

// Applies the pricing modifier to each denomination independently.
function formatPriceWithModifier(price, modifier) {
  if (!price || typeof price === 'string') return formatPrice(price);
  if (!modifier || modifier === 0) return formatPrice(price);
  const apply = val => val ? Math.max(1, Math.round(val * (1 + modifier))) : 0;
  const parts = [];
  if (price.pp) parts.push(`${apply(price.pp)} pp`);
  if (price.gp) parts.push(`${apply(price.gp)} gp`);
  if (price.sp) parts.push(`${apply(price.sp)} sp`);
  if (price.cp) parts.push(`${apply(price.cp)} cp`);
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

  const wrapper  = document.getElementById('traits-wrapper');
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

// ─── Sort ─────────────────────────────────────────────────

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
    const icon   = document.getElementById(`sort-icon-${col}`);
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
  rarity: ['common', 'uncommon'],
  includeTags: '',
  excludeTags: ''
};

function loadSettings() {
  return loadFromStorage('settings') || DEFAULT_SETTINGS;
}

function saveSettings() {
  const settings = {
    settlementSize: document.getElementById('default-settlement-select').value,
    economy:        document.getElementById('default-economy-select').value,
    ancestry:       document.getElementById('default-ancestry-select').value,
    storeType:      document.getElementById('default-store-type-select').value,
    stockingStyle:  document.getElementById('default-stocking-style-select').value,
    arcaneTilt:     parseInt(document.getElementById('default-arcane-slider').value),
    pricingModifier:parseInt(document.getElementById('default-price-slider').value),
    rarity: ['common', 'uncommon', 'rare', 'unique'].filter((r, i) =>
      document.querySelectorAll('#screen-settings .checkbox-group input[type="checkbox"]')[i]?.checked
    ),
    includeTags: document.getElementById('default-include-tags-input').value,
    excludeTags: document.getElementById('default-exclude-tags-input').value
  };
  saveToStorage('settings', settings);

  const btn = document.getElementById('save-settings-btn');
  btn.innerHTML = '<i class="ti ti-check"></i> Saved';
  setTimeout(() => {
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Defaults';
  }, 1500);
}

function applySettingsToForm(settings) {
  // Selects
  document.getElementById('settlement-select').value         = settings.settlementSize;
  document.getElementById('economy-select').value            = settings.economy;
  document.getElementById('store-type-select').value         = settings.storeType;
  document.getElementById('stocking-style-select').value     = settings.stockingStyle;
  document.getElementById('default-settlement-select').value = settings.settlementSize;
  document.getElementById('default-economy-select').value    = settings.economy;
  document.getElementById('default-store-type-select').value = settings.storeType;
  document.getElementById('default-stocking-style-select').value = settings.stockingStyle;

  // New merchant gel sliders
  const arcaneSlider = document.getElementById('arcane-slider');
  if (arcaneSlider) {
    arcaneSlider.value = settings.arcaneTilt;
    syncGelSlider('arcane-slider', 'arcane-fill', 'arcane-thumb', null, false);
  }

  const priceSlider = document.getElementById('price-slider');
  if (priceSlider) {
    priceSlider.value = settings.pricingModifier;
    syncGelSlider('price-slider', 'price-fill', 'price-thumb', null, true);
  }

  // Settings gel sliders
  const defaultArcaneSlider = document.getElementById('default-arcane-slider');
  if (defaultArcaneSlider) {
    defaultArcaneSlider.value = settings.arcaneTilt;
    syncGelSlider('default-arcane-slider', 'default-arcane-fill', 'default-arcane-thumb', null, false);
  }

  const defaultPriceSlider = document.getElementById('default-price-slider');
  if (defaultPriceSlider) {
    defaultPriceSlider.value = settings.pricingModifier;
    syncGelSlider('default-price-slider', 'default-price-fill', 'default-price-thumb', null, true);
  }

  // Rarity checkboxes
  const rarities = ['common', 'uncommon', 'rare', 'unique'];
  document.querySelectorAll('#screen-merchant-new .checkbox-group input[type="checkbox"]')
    .forEach((cb, i) => { cb.checked = settings.rarity.includes(rarities[i]); });
  document.querySelectorAll('#screen-settings .checkbox-group input[type="checkbox"]')
    .forEach((cb, i) => { cb.checked = settings.rarity.includes(rarities[i]); });

  // Tag filters
  document.getElementById('include-tags-input').value         = settings.includeTags || '';
  document.getElementById('exclude-tags-input').value         = settings.excludeTags || '';
  document.getElementById('default-include-tags-input').value = settings.includeTags || '';
  document.getElementById('default-exclude-tags-input').value = settings.excludeTags || '';

  // Ancestry (may need to wait for dropdown to populate)
  const applyAncestry = () => {
    document.getElementById('ancestry-select').value = settings.ancestry || 'any';
    const defaultAncestrySelect = document.getElementById('default-ancestry-select');
    if (defaultAncestrySelect) defaultAncestrySelect.value = settings.ancestry || 'any';
  };

  if (state.ancestries.length > 0) applyAncestry();
  else setTimeout(applyAncestry, 500);
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
  if (state.merchants.length === 0) generateSampleMerchants();
  else renderMerchantsList();
}

function saveMerchants() {
  saveToStorage('merchants', state.merchants);
}

function renderMerchantsList() {
  const container = document.getElementById('merchants-list');
  const count     = document.getElementById('merchants-count');
  count.textContent = `${state.merchants.length} merchant${state.merchants.length !== 1 ? 's' : ''} saved`;

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
    <div class="list-header grid-merchants">
      <span class="col-name">Name</span>
      <span class="col-detail">Ancestry</span>
      <span class="col-detail">Type</span>
      <span class="col-detail">Settlement</span>
      <span class="col-detail">Economy</span>
      <span class="col-detail">Level</span>
      <span class="col-rarity">Rarity</span>
      <span class="col-action"></span>
    </div>
    ${state.merchants.map(merchant => {
      const s = merchant.generatorSettings;
      const maxLevel        = SETTLEMENT_LEVEL[s.settlementSize] || '—';
      const ancestryDisplay = s.ancestry && s.ancestry !== 'any' ? capitalise(s.ancestry) : '—';
      const storeDisplay    = capitalise(s.storeType.replace(/-/g, ' '));
      const settlementDisplay = capitalise(s.settlementSize);
      const economyDisplay  = capitalise(s.economy.replace(/-/g, ' '));
      const rarityBadges    = s.rarity.length === 4
        ? '<span class="badge badge-common">All</span>'
        : s.rarity.map(r => `<span class="badge badge-${r}">${capitalise(r)}</span>`).join('');

      return `
        <div class="list-row grid-merchants" onclick="openMerchant('${merchant.id}')">
          <span class="col-name row-title">${merchant.name || '<span class="muted">Unnamed Merchant</span>'}</span>
          <span class="col-detail row-meta">${ancestryDisplay}</span>
          <span class="col-detail row-meta">${storeDisplay}</span>
          <span class="col-detail row-meta">${settlementDisplay}</span>
          <span class="col-detail row-meta">${economyDisplay}</span>
          <span class="col-detail row-meta">1–${maxLevel}</span>
          <span class="col-rarity">${rarityBadges}</span>
          <span class="col-action"><button class="btn-delete" onclick="deleteMerchant(event, '${merchant.id}')">
            <i class="ti ti-trash"></i>
          </button></span>
        </div>`;
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
  const count     = document.getElementById('custom-count');
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
    <div class="list-header grid-custom-items">
      <span class="col-item-name">Name</span>
      <span class="col-detail">Type</span>
      <span class="col-level">Level</span>
      <span class="col-bulk">Bulk</span>
      <span class="col-price">Price</span>
      <span class="col-rarity">Rarity</span>
      <span class="col-action"></span>
    </div>
    ${state.userItems.map(item => `
      <div class="item-wrapper">
        <div class="list-row grid-custom-items" onclick="toggleDescription(this)">
          <span class="col-item-name row-title">
            ${item.name}
            ${item.sourceId ? '<i class="ti ti-tool" style="font-size: 12px; color: #5B7F95; margin-left: 4px;" title="Modified from existing item"></i>' : ''}
          </span>
          <span class="col-detail row-meta">${capitalise(item.type) || '—'}</span>
          <span class="col-level row-meta">${item.level ?? '—'}</span>
          <span class="col-bulk row-meta">${formatBulk(item.bulk)}</span>
          <span class="col-price row-meta">${typeof item.price === 'string' ? item.price : formatPrice(item.price)}</span>
          <span class="col-rarity"><span class="badge ${badgeClass(item.rarity)}">${capitalise(item.rarity) || '—'}</span></span>
          <span class="col-action"><button class="btn-delete" onclick="event.stopPropagation(); deleteUserItem(event, '${item.id}')">
            <i class="ti ti-trash"></i>
          </button></span>
        </div>
        ${renderDescriptionPanel(item)}
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
    id:       currentEditItem?.id || generateId(),
    sourceId: currentEditItem?.sourceId || null,
    name,
    type:     document.getElementById('item-type-select').value,
    category: document.getElementById('item-category-select').value,
    level:    parseInt(document.getElementById('item-level-input').value) || 0,
    rarity:   document.getElementById('item-rarity-select').value.toLowerCase(),
    price:    document.getElementById('item-price-input').value.trim() || null,
    bulk:     document.getElementById('item-bulk-input').value.trim() || null,
    traits,
    source:   document.getElementById('item-source-input').value.trim(),
    description: document.getElementById('item-description-input').value.trim()
  };

  const existingIndex = state.userItems.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) state.userItems[existingIndex] = item;
  else state.userItems.push(item);

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
  document.getElementById('traits-wrapper').querySelectorAll('.tag').forEach(t => t.remove());
  currentEditItem = null;
}

function editUserItem(id) {
  const item = state.userItems.find(i => i.id === id);
  if (!item) return;
  openItemForm(item);
}

// ─── Import / Export ──────────────────────────────────────

function exportData(type) {
  const data     = type === 'merchants' ? state.merchants : state.userItems;
  const filename = type === 'merchants' ? 'merchants.json' : 'user-items.json';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(type) {
  const input  = document.createElement('input');
  input.type   = 'file';
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
  if (!confirm('This will permanently delete all your merchants, custom items, and saved settings. This cannot be undone. Are you sure?')) return;
  state.merchants = [];
  state.userItems = [];
  saveMerchants();
  saveUserItems();
  localStorage.removeItem('settings');
  applySettingsToForm(DEFAULT_SETTINGS);
  renderMerchantsList();
  renderUserItemsList();
  alert('All data has been reset.');
}

// ─── Filter Helpers ───────────────────────────────────────

function setSearchFilter(btn, group) {
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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

// ─── Version Check ────────────────────────────────────────

async function checkForUpdates() {
  try {
    const localResponse = await fetch('data/version.json');
    const localData     = await localResponse.json();
    const localVersion  = localData.version;

    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = `v${localVersion}`;

    const remoteResponse = await fetch(
      'https://raw.githubusercontent.com/codeguy1134/gomerchantgo/main/data/version.json',
      { cache: 'no-store' }
    );
    if (!remoteResponse.ok) return;
    const remoteData = await remoteResponse.json();

    if (remoteData.version !== localVersion) {
      document.getElementById('update-notice').style.display = 'block';
    }
  } catch (err) {
    // Silently fail
  }
}

// ─── Update Items Database ────────────────────────────────

async function updateItemDatabase() {
  const btn = document.querySelector('.settings-row .btn-primary');
  btn.innerHTML = '<i class="ti ti-loader"></i> Updating…';
  btn.disabled  = true;

  try {
    const [itemsRes, firearmsRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/codeguy1134/gomerchantgo/main/data/items.json',    { cache: 'no-store' }),
      fetch('https://raw.githubusercontent.com/codeguy1134/gomerchantgo/main/data/firearms.json', { cache: 'no-store' })
    ]);

    if (!itemsRes.ok)    throw new Error('Failed to fetch items.json');
    if (!firearmsRes.ok) throw new Error('Failed to fetch firearms.json');

    const items         = await itemsRes.json();
    const firearmNames  = await firearmsRes.json();
    const nameSet       = new Set(firearmNames.map(n => n.toLowerCase()));

    items.forEach(item => {
      if (nameSet.has(item.name?.toLowerCase())) {
        if (!item.traits) item.traits = [];
        if (!item.traits.includes('firearm')) item.traits.push('firearm');
      }
    });

    state.items = items;
    console.log(`Updated to ${items.length} items, ${firearmNames.length} firearms patched`);

    btn.innerHTML = '<i class="ti ti-check"></i> Up to date';
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-download"></i> Update';
      btn.disabled  = false;
    }, 2000);

  } catch (err) {
    console.error('Update failed:', err);
    btn.innerHTML = '<i class="ti ti-x"></i> Failed';
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-download"></i> Update';
      btn.disabled  = false;
    }, 2000);
  }
}

// ─── Start ────────────────────────────────────────────────

init();
