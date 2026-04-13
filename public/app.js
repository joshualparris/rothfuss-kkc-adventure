const outputElement = document.getElementById('output');
const locationElement = document.getElementById('location');
const timeElement = document.getElementById('time');
const moneyElement = document.getElementById('money');
const rankElement = document.getElementById('rank');
const exitsElement = document.getElementById('exits');
const peopleElement = document.getElementById('people');
const inventoryElement = document.getElementById('inventory');
const historyElement = document.getElementById('history');
const clearHistoryButton = document.getElementById('clear-history-button');
const commandForm = document.getElementById('command-form');
const commandInput = document.getElementById('command-input');

const HISTORY_STORAGE_KEY = 'kkc-adventure-history';
let historyEntries = [];

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory() {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
}

function renderHistory() {
  historyElement.innerHTML = '';
  historyEntries.slice().reverse().forEach((entry) => {
    const container = document.createElement('div');
    container.className = 'history-entry';
    container.innerHTML = `
      <div class="history-tag">${escapeHtml(entry.command)}</div>
      <div class="history-output">${escapeHtml(entry.output)}</div>
    `;
    historyElement.appendChild(container);
  });
}

function addHistoryEntry(command, output) {
  historyEntries.unshift({ command, output });
  if (historyEntries.length > 50) {
    historyEntries = historyEntries.slice(0, 50);
  }
  saveHistory();
  renderHistory();
}

function clearHistory() {
  historyEntries = [];
  saveHistory();
  renderHistory();
}

function renderScene(response) {
  outputElement.textContent = response.output;
  locationElement.textContent = response.location?.name ?? 'Unknown';
  timeElement.textContent = response.state.time_of_day + ', Day ' + response.state.day_number;
  moneyElement.textContent = response.state.money_drabs ? response.state.money_drabs + ' drabs' : 'nothing';
  rankElement.textContent = response.state.academic_rank;
  exitsElement.textContent = response.accessibleExits?.map((exit) => exit.direction).join(', ') || 'none';
  peopleElement.textContent = response.npcs?.map((npc) => npc.name).join(', ') || 'none';

  inventoryElement.innerHTML = '';
  if (response.state.inventory.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Nothing of note';
    inventoryElement.appendChild(item);
  } else {
    response.state.inventory.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
      inventoryElement.appendChild(li);
    });
  }
}

async function init() {
  historyEntries = loadHistory();
  renderHistory();

  const response = await fetch('/api/init');
  const data = await response.json();
  if (data.error) {
    outputElement.textContent = 'Error loading game: ' + data.error;
    return;
  }

  renderScene(data);
  addHistoryEntry('start', data.output);
  commandInput.focus();
}

commandForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) {
    return;
  }

  const response = await fetch('/api/command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command })
  });

  const data = await response.json();
  if (data.error) {
    outputElement.textContent = 'Error: ' + data.error;
    addHistoryEntry(command, 'Error: ' + data.error);
    return;
  }

  renderScene(data);
  addHistoryEntry(command, data.output);
  commandInput.value = '';
  commandInput.focus();
});

clearHistoryButton.addEventListener('click', () => {
  clearHistory();
});

init();
