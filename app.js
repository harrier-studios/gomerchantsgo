// ─── App State ────────────────────────────────────────────

const state = {
  items: [],
  merchants: [],
  userItems: []
};

const navStack = [];

// Adds filtering for columns in Custom Items
let existingSortColumn = 'name';
let existingSortDirection = 'asc';

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

let currentEditItem = null;

// Function below strips UUID references and html tags from item Descriptions.

function cleanDescription(html) {
  if (!html) return '';
  // Remove @UUID references
  let clean = html.replace(/@UUID\[[^\]]*\]/g, '');
  // Convert <p> tags to newlines
  clean = clean.replace(/<\/p>/gi, '\n').replace(/<p>/gi, '');
  // Strip any remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  // Clean up extra whitespace and blank lines
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  return clean;
}

// ─── Data Loading ─────────────────────────────────────────

async function init() {
  await loadItems();
  await loadAncestries();
  loadMerchants();
  loadUserItems();
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
    
    // Build a set of all traits that appear in items.json
    const allTraits = new Set();
    state.items.forEach(item => {
      (item.traits || []).forEach(trait => allTraits.add(trait.toLowerCase()));
    });

    // Only keep ancestries that appear as a trait in items.json
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
  const select = document.getElementById('ancestry-select');
  select.innerHTML = '<option value="any" selected>Any</option>';
  state.ancestries.forEach(ancestry => {
    const option = document.createElement('option');
    option.value = ancestry.toLowerCase();
    option.textContent = ancestry;
    select.appendChild(option);
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
  showScreen('screen-home');
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
  console.log('copyExistingItem called', selectedExistingItem);
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
  console.log('openItemForm called', item);

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

// ---- Helps stop older browsers from firing const 
// every time the slider is moved.

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

  // List rows will go here once we have real merchants to show
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
      </div>
    `).join('')}
  `;
}

// Allows user editing of rows
function editUserItem(id) {
  const item = state.userItems.find(i => i.id === id);
  if (!item) return;
  openItemForm(item);
}

// ─── Save User Item ───────────────────────────────────────

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

  // Update existing or add new
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


// ─── Start the app ────────────────────────────────────────

init();
