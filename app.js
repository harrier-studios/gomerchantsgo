// ─── App State ────────────────────────────────────────────

const state = {
  items: [],
  merchants: [],
  userItems: []
};


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

// ─── Data Loading ─────────────────────────────────────────

async function init() {
  await loadItems();
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

// ─── Navigation ───────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  showScreen('screen-home');
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

function setSearchFilter(btn, group) {
  const row = btn.parentElement;
  row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateLevelRange(slider, displayId) {
  const min = parseInt(document.getElementById('level-min').value);
  const max = parseInt(document.getElementById('level-max').value);
  document.getElementById('level-min-val').textContent = min;
  document.getElementById('level-max-val').textContent = max;
}

function filterItems() {
  // Placeholder — will be wired up when items.json is loaded
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
  count.textContent = `${state.userItems.length} items`;

  if (state.userItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-database"></i>
        <p>No custom items yet</p>
        <span>Create a homebrew item or copy and modify an existing one</span>
      </div>`;
    return;
  }

  // List rows will go here once we have real user items to show
}

// ─── Start the app ────────────────────────────────────────

init();