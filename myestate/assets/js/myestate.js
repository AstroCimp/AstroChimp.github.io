(() => {
  "use strict";

  const STORAGE_KEY = "myestate-save-v2-100-slots";
  const SLOT_COUNT = 100;
  const START_BONUS = 300;

  const colors = ["#49ff88", "#64a9ff", "#ffd166", "#ff6b87"];

  const estateNames = [
    "Greenfield", "Palm Grove", "Riverbank", "Bukit", "Sungai",
    "Central", "Hilltop", "Golden Palm", "Grand Estate", "Royal Plantation",
    "North Ridge", "South Valley", "East Garden", "West Haven", "Emerald Field",
    "Cedar Estate", "Rainforest Lot", "Sunrise Grove", "Sunset Estate", "Highland Palm",
    "Lowland Field", "Silver Creek", "Evergreen Lot", "Harvest Point", "Mill District"
  ];

  function createBoard() {
    const board = [];

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotNumber = i + 1;

      if (i === 0) {
        board.push({
          name: "START",
          type: "start",
          info: `Pass START to receive RM${START_BONUS}.`
        });
        continue;
      }

      if (i % 20 === 0) {
        board.push({
          name: "Mega Harvest",
          type: "bonus",
          amount: 250 + i,
          info: `Exceptional yield. Collect RM${250 + i}.`
        });
        continue;
      }

      if (i % 15 === 0) {
        board.push({
          name: "Flood Damage",
          type: "tax",
          amount: 120 + Math.floor(i * 1.5),
          info: `Flood damage. Pay RM${120 + Math.floor(i * 1.5)}.`
        });
        continue;
      }

      if (i % 12 === 0) {
        board.push({
          name: "Market Rally",
          type: "bonus",
          amount: 100 + Math.floor(i * 1.25),
          info: `Palm oil prices rise. Collect RM${100 + Math.floor(i * 1.25)}.`
        });
        continue;
      }

      if (i % 10 === 0) {
        board.push({
          name: "Equipment Repair",
          type: "tax",
          amount: 90 + i,
          info: `Machinery breakdown. Pay RM${90 + i}.`
        });
        continue;
      }

      if (i % 7 === 0) {
        board.push({
          name: "Harvest Bonus",
          type: "bonus",
          amount: 70 + i,
          info: `Good harvest. Collect RM${70 + i}.`
        });
        continue;
      }

      const tier = Math.floor(i / 10);
      const price = 90 + tier * 40 + (i % 10) * 10;
      const rent = Math.max(15, Math.round(price * 0.18));
      const baseName = estateNames[(i - 1) % estateNames.length];

      board.push({
        name: `${baseName} ${slotNumber}`,
        type: "property",
        price,
        rent
      });
    }

    return board;
  }

  const tiles = createBoard();

  let state = {
    players: [],
    currentPlayer: 0,
    rolled: false,
    pendingPurchase: false,
    started: false
  };

  const el = (id) => document.getElementById(id);

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
        money: 3000,
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

    tiles.forEach((tile) => delete tile.owner);

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
        <div class="myestate-tile-index">SLOT ${String(i + 1).padStart(3, "0")}</div>
        <div class="myestate-tile-name">${tile.name}</div>
        ${
          tile.type === "property"
            ? `<div class="myestate-tile-price">RM${tile.price}<br>Rent RM${tile.rent}</div>`
            : ""
        }
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
          ${player.properties.length} properties · Slot ${player.position + 1}/100
        </div>
      `;

      panel.appendChild(row);
    });
  }

  function renderCurrentTile() {
    const player = state.players[state.currentPlayer];
    const tile = tiles[player.position];

    el("myestateBoardProgress").textContent = `Slot ${player.position + 1} / 100`;
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

    addLog(`${player.name} rolled ${d1} + ${d2} and moved ${total} slots.`);

    state.rolled = true;
    resolveTile(player);
    renderAll();

    const currentToken = el(`myestateTokens-${player.position}`);
    if (currentToken) {
      currentToken.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
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
    ) {
      return;
    }

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

    const alive = state.players.filter((player) => !player.bankrupt);

    if (alive.length <= 1) {
      const winner = alive[0];
      addLog(`${winner.name} wins MyEstate!`);
      showToast(`${winner.name} wins MyEstate!`);
      rollBtn.disabled = true;
      endTurnBtn.classList.add("myestate-hidden");
      return;
    }

    do {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    } while (state.players[state.currentPlayer].bankrupt);

    el("myestateDie1").textContent = "–";
    el("myestateDie2").textContent = "–";

    addLog(`${state.players[state.currentPlayer].name}'s turn.`);
    renderAll();
  }

  function checkBankruptcy(player) {
    if (player.money >= 0) return;

    player.bankrupt = true;

    player.properties.forEach((index) => {
      delete tiles[index].owner;
    });

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
        owners: tiles.map((tile) =>
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

      addLog("100-slot saved game loaded.");
      renderAll();
    } catch (error) {
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
