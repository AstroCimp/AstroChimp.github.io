(() => {
  "use strict";

  const STORAGE_KEY = "myestate-save-v3-100-extended";
  const SLOT_COUNT = 100;
  const START_BONUS = 300;
  const STARTING_MONEY = 3000;

  const colors = ["#49ff88", "#64a9ff", "#ffd166", "#ff6b87"];

  // Original slots 0-23 retained exactly from the first MyEstate version.
  const tiles = [
    { name: "START", type: "start", info: "Pass START to receive RM300." },
    { name: "Greenfield Lot", type: "property", price: 100, rent: 20 },
    { name: "Harvest Bonus", type: "bonus", amount: 80, info: "A strong harvest earns you RM80." },
    { name: "Palm Grove", type: "property", price: 120, rent: 24 },
    { name: "Road Tax", type: "tax", amount: 70, info: "Pay RM70 in road and transport costs." },
    { name: "Riverbank Estate", type: "property", price: 140, rent: 28 },

    { name: "Fertilizer Depot", type: "property", price: 160, rent: 32 },
    { name: "Equipment Repair", type: "tax", amount: 90, info: "Machinery breakdown. Pay RM90." },
    { name: "Bukit Estate", type: "property", price: 180, rent: 36 },
    { name: "Market Rally", type: "bonus", amount: 100, info: "Palm oil prices rise. Collect RM100." },
    { name: "Mill Access", type: "property", price: 200, rent: 40 },

    { name: "Sungai Block", type: "property", price: 220, rent: 44 },
    { name: "Rain Delay", type: "tax", amount: 60, info: "Operations delayed. Pay RM60." },
    { name: "Central Estate", type: "property", price: 240, rent: 48 },
    { name: "Govt Grant", type: "bonus", amount: 120, info: "Smallholder support grant. Collect RM120." },
    { name: "Hilltop Estate", type: "property", price: 260, rent: 52 },

    { name: "Warehouse", type: "property", price: 280, rent: 56 },
    { name: "Flood Damage", type: "tax", amount: 120, info: "Flood damage. Pay RM120." },
    { name: "Golden Palm Estate", type: "property", price: 300, rent: 60 },
    { name: "Export Bonus", type: "bonus", amount: 150, info: "Export demand increases. Collect RM150." },

    { name: "Grand Estate", type: "property", price: 340, rent: 68 },
    { name: "Land Assessment", type: "tax", amount: 100, info: "Annual assessment. Pay RM100." },
    { name: "Royal Plantation", type: "property", price: 380, rent: 76 },
    { name: "Mega Harvest", type: "bonus", amount: 180, info: "Exceptional yield. Collect RM180." }
  ];

  const propertyNames = [
    "Cedar Estate", "North Ridge", "South Valley", "East Garden", "West Haven",
    "Emerald Field", "Sunrise Grove", "Sunset Estate", "Highland Palm", "Lowland Field",
    "Silver Creek", "Evergreen Lot", "Harvest Point", "Mill District", "Palm Valley",
    "Green Ridge", "River Plains", "Bukit Heights", "Sungai Estate", "Central Fields",
    "Golden Valley", "Royal Grove", "Grand Plantation", "Hillcrest Estate", "Lakeview Palm",
    "Forest Edge", "Southern Grove", "Northern Fields", "Eastern Estate", "Western Plantation"
  ];

  // Extend the original 24 slots to slot 99.
  for (let i = 24; i < SLOT_COUNT; i++) {
    if (i % 20 === 0) {
      const amount = 220 + Math.floor(i * 1.5);
      tiles.push({
        name: "Mega Harvest",
        type: "bonus",
        amount,
        info: `Exceptional yield. Collect RM${amount}.`
      });
    } else if (i % 17 === 0) {
      const amount = 150 + i;
      tiles.push({
        name: "Storm Damage",
        type: "tax",
        amount,
        info: `Severe weather damage. Pay RM${amount}.`
      });
    } else if (i % 13 === 0) {
      const amount = 120 + i;
      tiles.push({
        name: "Market Rally",
        type: "bonus",
        amount,
        info: `Strong market demand. Collect RM${amount}.`
      });
    } else if (i % 11 === 0) {
      const amount = 100 + i;
      tiles.push({
        name: "Equipment Repair",
        type: "tax",
        amount,
        info: `Equipment maintenance. Pay RM${amount}.`
      });
    } else if (i % 7 === 0) {
      const amount = 90 + i;
      tiles.push({
        name: "Harvest Bonus",
        type: "bonus",
        amount,
        info: `Good harvest. Collect RM${amount}.`
      });
    } else {
      const tier = Math.floor((i - 24) / 10);
      const price = 400 + tier * 60 + (i % 10) * 15;
      const rent = Math.round(price * 0.20);
      const name = propertyNames[(i - 24) % propertyNames.length];

      tiles.push({
        name,
        type: "property",
        price,
        rent
      });
    }
  }

  let state = {
    players: [],
    currentPlayer: 0,
    rolled: false,
    pendingPurchase: false,
    started: false
  };

  const el = id => document.getElementById(id);

  const setupPanel = el("myestateSetupPanel");
  const gamePanel = el("myestateGamePanel");
  const playerCount = el("myestatePlayerCount");
  const playerNames = el("myestatePlayerNames");
  const startBtn = el("myestateStartBtn");
  const loadBtn = el("myestateLoadBtn");
  const rollBtn = el("myestateRollBtn");
  const buyBtn = el("myestateBuyBtn");
  const endTurnBtn = el("myestateEndTurnBtn");
  const saveBtn = el("myestateSaveBtn");
  const resetBtn = el("myestateResetBtn");

  function init() {
    renderNameFields();
    renderBoard();

    loadBtn.classList.toggle(
      "myestate-hidden",
      !localStorage.getItem(STORAGE_KEY)
    );

    playerCount.addEventListener("change", renderNameFields);
    startBtn.addEventListener("click", startGame);
    loadBtn.addEventListener("click", loadGame);
    rollBtn.addEventListener("click", rollDice);
    buyBtn.addEventListener("click", buyCurrentProperty);
    endTurnBtn.addEventListener("click", endTurn);
    saveBtn.addEventListener("click", saveGame);
    resetBtn.addEventListener("click", resetGame);
  }

  function renderNameFields() {
    const count = Number(playerCount.value);
    playerNames.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 16;
      input.placeholder = `Player ${i + 1} name`;
      input.value = `Player ${i + 1}`;
      playerNames.appendChild(input);
    }
  }

  function startGame() {
    const inputs = [...playerNames.querySelectorAll("input")];

    state = {
      players: inputs.map((input, i) => ({
        id: i,
        name: input.value.trim() || `Player ${i + 1}`,
        money: STARTING_MONEY,
        position: 0,
        properties: [],
        color: colors[i],
        bankrupt: false
      })),
      currentPlayer: 0,
      rolled: false,
      pendingPurchase: false,
      started: true
    };

    tiles.forEach(tile => delete tile.owner);
    setupPanel.classList.add("myestate-hidden");
    gamePanel.classList.remove("myestate-hidden");

    addLog(`${state.players[0].name} begins the 100-slot game.`);
    renderAll();
  }

  function renderBoard() {
    const board = el("myestateBoard");
    board.innerHTML = "";

    tiles.forEach((tile, i) => {
      const cell = document.createElement("div");
      cell.className = `myestate-tile myestate-${tile.type}`;

      cell.innerHTML = `
        <div class="myestate-tile-index">${i}</div>
        <div class="myestate-tile-name">${tile.name}</div>
        ${tile.type === "property"
          ? `<div class="myestate-tile-price">RM${tile.price} · Rent RM${tile.rent}</div>`
          : ""}
        <div class="myestate-tokens" id="myestateTokens-${i}"></div>
      `;

      if (tile.owner !== undefined) {
        const dot = document.createElement("div");
        dot.className = "myestate-owner-dot";
        dot.style.background = state.players[tile.owner]?.color || "#fff";
        cell.appendChild(dot);
      }

      board.appendChild(cell);
    });

    if (state.started) {
      state.players.forEach((player, i) => {
        const target = el(`myestateTokens-${player.position}`);
        if (!target || player.bankrupt) return;

        const token = document.createElement("div");
        token.className = "myestate-token";
        token.style.background = player.color;
        token.textContent = i + 1;
        token.title = player.name;
        target.appendChild(token);
      });
    }
  }

  function renderPlayers() {
    const panel = el("myestatePlayersPanel");
    panel.innerHTML = "";

    state.players.forEach((player, i) => {
      const row = document.createElement("div");
      row.className =
        "myestate-player-row" +
        (i === state.currentPlayer ? " myestate-active" : "");

      row.innerHTML = `
        <div class="myestate-player-head">
          <span>
            <span class="myestate-player-swatch" style="background:${player.color}"></span>
            ${player.name}
          </span>
          <span>RM${player.money}</span>
        </div>
        <div class="myestate-player-meta">
          ${player.properties.length} properties · Slot ${player.position}/99
        </div>
      `;

      panel.appendChild(row);
    });
  }

  function renderCurrentTile() {
    const player = state.players[state.currentPlayer];
    const tile = tiles[player.position];

    el("myestateBoardProgress").textContent =
      `${player.position} / 99`;

    el("myestateTileName").textContent = tile.name;

    if (tile.type === "property") {
      if (tile.owner === undefined) {
        el("myestateTileInfo").textContent =
          `Unowned property. Price RM${tile.price}. Rent RM${tile.rent}.`;
      } else {
        const owner = state.players[tile.owner];
        el("myestateTileInfo").textContent =
          `Owned by ${owner.name}. Rent RM${tile.rent}.`;
      }
    } else {
      el("myestateTileInfo").textContent = tile.info || "";
    }
  }

  function renderControls() {
    const player = state.players[state.currentPlayer];
    const tile = tiles[player.position];

    el("myestateCurrentPlayerName").textContent = player.name;
    rollBtn.disabled = state.rolled;

    const canBuy =
      state.pendingPurchase &&
      tile.type === "property" &&
      tile.owner === undefined &&
      player.money >= tile.price;

    buyBtn.classList.toggle("myestate-hidden", !canBuy);
    endTurnBtn.classList.toggle("myestate-hidden", !state.rolled);
  }

  function renderAll() {
    renderBoard();
    renderPlayers();
    renderCurrentTile();
    renderControls();
  }

  function rollDice() {
    if (state.rolled) return;

    const player = state.players[state.currentPlayer];
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    el("myestateDie1").textContent = d1;
    el("myestateDie2").textContent = d2;

    const oldPosition = player.position;
    player.position = (player.position + total) % SLOT_COUNT;

    if (player.position < oldPosition) {
      player.money += START_BONUS;
      addLog(`${player.name} passed START and collected RM${START_BONUS}.`);
    }

    addLog(`${player.name} rolled ${d1} + ${d2} and moved ${total} spaces.`);
    state.rolled = true;
    resolveTile(player);
    renderAll();

    const tileElement = el(`myestateTokens-${player.position}`);
    if (tileElement) {
      tileElement.parentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }

  function resolveTile(player) {
    const tile = tiles[player.position];
    state.pendingPurchase = false;

    if (tile.type === "property") {
      if (tile.owner === undefined) {
        if (player.money >= tile.price) {
          state.pendingPurchase = true;
          addLog(`${tile.name} is available for RM${tile.price}.`);
        } else {
          addLog(`${player.name} cannot afford ${tile.name}.`);
        }
        return;
      }

      if (tile.owner !== player.id) {
        const owner = state.players[tile.owner];
        player.money -= tile.rent;
        owner.money += tile.rent;
        addLog(`${player.name} paid RM${tile.rent} rent to ${owner.name}.`);
        checkBankruptcy(player);
      }
      return;
    }

    if (tile.type === "bonus") {
      player.money += tile.amount;
      addLog(`${player.name} received RM${tile.amount} from ${tile.name}.`);
    }

    if (tile.type === "tax") {
      player.money -= tile.amount;
      addLog(`${player.name} paid RM${tile.amount} for ${tile.name}.`);
      checkBankruptcy(player);
    }

    if (tile.type === "start") {
      addLog(`${player.name} landed on START.`);
    }
  }

  function buyCurrentProperty() {
    const player = state.players[state.currentPlayer];
    const tile = tiles[player.position];

    if (
      !state.pendingPurchase ||
      tile.type !== "property" ||
      tile.owner !== undefined ||
      player.money < tile.price
    ) return;

    player.money -= tile.price;
    tile.owner = player.id;
    player.properties.push(player.position);
    state.pendingPurchase = false;

    addLog(`${player.name} bought ${tile.name} for RM${tile.price}.`);
    renderAll();
  }

  function endTurn() {
    if (!state.rolled) return;

    state.pendingPurchase = false;
    state.rolled = false;

    const alive = state.players.filter(player => !player.bankrupt);

    if (alive.length <= 1) {
      const winner = alive[0];
      addLog(`${winner.name} wins MyEstate!`);
      showToast(`${winner.name} wins MyEstate!`);
      rollBtn.disabled = true;
      endTurnBtn.classList.add("myestate-hidden");
      return;
    }

    do {
      state.currentPlayer =
        (state.currentPlayer + 1) % state.players.length;
    } while (state.players[state.currentPlayer].bankrupt);

    el("myestateDie1").textContent = "–";
    el("myestateDie2").textContent = "–";

    addLog(`${state.players[state.currentPlayer].name}'s turn.`);
    renderAll();
  }

  function checkBankruptcy(player) {
    if (player.money >= 0) return;

    player.bankrupt = true;
    player.properties.forEach(index => delete tiles[index].owner);
    player.properties = [];
    addLog(`${player.name} is bankrupt and eliminated.`);
  }

  function addLog(message) {
    const log = el("myestateGameLog");
    const item = document.createElement("div");
    item.className = "myestate-log-item";
    item.textContent = message;
    log.prepend(item);
  }

  function saveGame() {
    if (!state.started) {
      showToast("Start a game first.");
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state,
        owners: tiles.map(tile =>
          tile.owner === undefined ? null : tile.owner
        )
      })
    );

    showToast("Game saved.");
  }

  function loadGame() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      state = saved.state;

      tiles.forEach((tile, i) => {
        if (saved.owners[i] === null || saved.owners[i] === undefined) {
          delete tile.owner;
        } else {
          tile.owner = saved.owners[i];
        }
      });

      setupPanel.classList.add("myestate-hidden");
      gamePanel.classList.remove("myestate-hidden");

      addLog("Saved game loaded.");
      renderAll();
    } catch {
      showToast("Saved game could not be loaded.");
    }
  }

  function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function showToast(text) {
    const toast = el("myestateToast");
    toast.textContent = text;
    toast.classList.add("myestate-show");

    window.setTimeout(() => {
      toast.classList.remove("myestate-show");
    }, 1800);
  }

  init();
})();
