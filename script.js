(() => {
  "use strict";

  /* ---------------- STATE ---------------- */
  const state = {
    mode: null,           // '2p' | 'ai'
    p1: { name: "Oyuncu 1", mark: "X" },
    p2: { name: "Oyuncu 2", mark: "O" },
    starter: null,        // 1 | 2  -> index of who makes first move
    board: Array(9).fill(null),
    current: null,        // 1 | 2
    gameOver: false,
    gameId: 0,            // bumped on every startGame(); invalidates stale timers
  };

  const AI_PLAYER = 2; // p2 is always the AI in 'ai' mode

  /* ---------------- DOM HELPERS ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    home: $("#screen-home"),
    names: $("#screen-names"),
    dice: $("#screen-dice"),
    game: $("#screen-game"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  /* ---------------- HOME ---------------- */
  $("#mode-2p").addEventListener("click", () => {
    state.mode = "2p";
    $("#field-p2").hidden = false;
    $("#input-p1").placeholder = "1. oyuncunun ismi";
    $("#input-p2").placeholder = "2. oyuncunun ismi";
    $("label[for='input-p1']").textContent = "1. Oyuncu (X)";
    $("label[for='input-p2']").textContent = "2. Oyuncu (O)";
    $("#input-p1").value = "";
    $("#input-p2").value = "";
    showScreen("names");
    setTimeout(() => $("#input-p1").focus(), 300);
  });

  $("#mode-ai").addEventListener("click", () => {
    state.mode = "ai";
    $("#field-p2").hidden = true;
    $("#input-p1").placeholder = "İsmini gir";
    $("label[for='input-p1']").textContent = "Senin İsmin (X)";
    $("#input-p1").value = "";
    showScreen("names");
    setTimeout(() => $("#input-p1").focus(), 300);
  });

  $("#back-from-names").addEventListener("click", () => showScreen("home"));

  /* ---------------- NAME FORM ---------------- */
  $("#names-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const n1 = $("#input-p1").value.trim() || (state.mode === "ai" ? "Oyuncu" : "Oyuncu 1");
    state.p1.name = n1;

    if (state.mode === "2p") {
      const n2 = $("#input-p2").value.trim() || "Oyuncu 2";
      state.p2.name = n2;
    } else {
      state.p2.name = "GDG AI";
    }

    setupDiceScreen();
    showScreen("dice");
  });

  /* ---------------- DICE MINI-GAME ---------------- */
  let diceRolling = false;
  let diceDone = false;

  function setupDiceScreen() {
    $("#dice-name-1").textContent = state.p1.name;
    $("#dice-name-2").textContent = state.p2.name;
    $("#dice-result-1").textContent = "";
    $("#dice-result-2").textContent = "";
    $("#dice-result-1").classList.remove("win");
    $("#dice-result-2").classList.remove("win");
    $("#die-1").querySelector(".die-face").removeAttribute("data-v");
    $("#die-2").querySelector(".die-face").removeAttribute("data-v");
    $("#dice-winner-banner").hidden = true;
    $("#btn-start-game").hidden = true;
    $("#btn-roll").hidden = false;
    $("#btn-roll").disabled = false;
    $("#btn-roll").textContent = "Zar At";
    $("#dice-sub").textContent =
      state.mode === "ai"
        ? "En yüksek zarı atan ilk hamleyi yapar"
        : "Sırayla zar atın, en yüksek sayı başlar";
    diceRolling = false;
    diceDone = false;
  }

  function rollSingleDie(dieEl, faceEl, finalValue, duration) {
    return new Promise((resolve) => {
      dieEl.classList.add("rolling");
      const interval = setInterval(() => {
        const r = 1 + Math.floor(Math.random() * 6);
        faceEl.setAttribute("data-v", r);
      }, 80);
      setTimeout(() => {
        clearInterval(interval);
        faceEl.setAttribute("data-v", finalValue);
        dieEl.classList.remove("rolling");
        resolve();
      }, duration);
    });
  }

  $("#btn-roll").addEventListener("click", async () => {
    if (diceRolling || diceDone) return;
    diceRolling = true;
    $("#btn-roll").disabled = true;
    $("#dice-result-1").textContent = "";
    $("#dice-result-2").textContent = "";
    $("#dice-result-1").classList.remove("win");
    $("#dice-result-2").classList.remove("win");
    $("#dice-winner-banner").hidden = true;

    let v1, v2;
    do {
      v1 = 1 + Math.floor(Math.random() * 6);
      v2 = 1 + Math.floor(Math.random() * 6);
    } while (v1 === v2);

    await Promise.all([
      rollSingleDie($("#die-1"), $("#die-1 .die-face"), v1, 900),
      rollSingleDie($("#die-2"), $("#die-2 .die-face"), v2, 1100),
    ]);

    $("#dice-result-1").textContent = v1;
    $("#dice-result-2").textContent = v2;

    const winnerIdx = v1 > v2 ? 1 : 2;
    const winnerName = winnerIdx === 1 ? state.p1.name : state.p2.name;
    (winnerIdx === 1 ? $("#dice-result-1") : $("#dice-result-2")).classList.add("win");

    state.starter = winnerIdx;

    $("#dice-winner-banner").textContent = `🎲 ${winnerName} başlıyor!`;
    $("#dice-winner-banner").hidden = false;
    $("#btn-roll").hidden = true;
    $("#btn-start-game").hidden = false;

    diceRolling = false;
    diceDone = true;
  });

  $("#btn-start-game").addEventListener("click", () => {
    startGame();
    showScreen("game");
  });

  /* ---------------- GAME ---------------- */
  const boardEl = $("#board");
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function markSvg(mark) {
    if (mark === "X") {
      return `<svg viewBox="0 0 200 100"><g stroke-linecap="round" fill="none">
        <path d="M70 20 L30 50" stroke="#EA4335" stroke-width="16"/>
        <path d="M30 50 L70 80" stroke="#4285F4" stroke-width="16"/>
        <path d="M130 20 L170 50" stroke="#34A853" stroke-width="16"/>
        <path d="M170 50 L130 80" stroke="#FBBC05" stroke-width="16"/>
      </g></svg>`;
    }
    return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.3" stroke="#EA4335" stroke-width="3" fill="none"/></svg>`;
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.idx = i;
      cell.addEventListener("click", () => onCellClick(i));
      boardEl.appendChild(cell);
    }
  }
  buildBoard();

  function startGame() {
    state.gameId += 1; // invalidate any pending timers from a previous game
    const myGameId = state.gameId;

    state.board = Array(9).fill(null);
    state.current = state.starter;
    state.gameOver = false;
    buildBoard();
    $("#chip-name-1").textContent = state.p1.name;
    $("#chip-name-2").textContent = state.p2.name;
    updateTurnUI();

    // If AI starts, let it move
    if (state.mode === "ai" && state.current === AI_PLAYER) {
      setTimeout(() => {
        if (state.gameId !== myGameId) return; // a new game started meanwhile
        aiMove(myGameId);
      }, 650);
    }
  }

  function updateTurnUI() {
    const isP1 = state.current === 1;
    $("#chip-1").classList.toggle("active-turn", isP1);
    $("#chip-2").classList.toggle("active-turn", !isP1);
    const name = isP1 ? state.p1.name : state.p2.name;
    $("#turn-status").textContent = `${name} oynuyor`;
  }

  function onCellClick(idx) {
    if (state.gameOver) return;
    if (state.board[idx]) return;
    if (state.mode === "ai" && state.current === AI_PLAYER) return; // block human clicking during AI turn
    makeMove(idx);
  }

  function makeMove(idx) {
    const myGameId = state.gameId;
    const mark = state.current === 1 ? "X" : "O";
    state.board[idx] = mark;
    const cellEl = boardEl.children[idx];
    cellEl.classList.add("filled");
    cellEl.innerHTML = markSvg(mark);

    const win = checkWin();
    if (win) {
      state.gameOver = true;
      drawWinLine(win.line);
      const winnerName = state.current === 1 ? state.p1.name : state.p2.name;
      setTimeout(() => {
        if (state.gameId !== myGameId) return;
        showWinOverlay(winnerName);
      }, 500);
      return;
    }

    if (state.board.every((c) => c !== null)) {
      state.gameOver = true;
      setTimeout(() => {
        if (state.gameId !== myGameId) return;
        showWinOverlay(null);
      }, 400);
      return;
    }

    state.current = state.current === 1 ? 2 : 1;
    updateTurnUI();

    if (state.mode === "ai" && state.current === AI_PLAYER && !state.gameOver) {
      setTimeout(() => {
        if (state.gameId !== myGameId) return;
        aiMove(myGameId);
      }, 550);
    }
  }

  function checkWin() {
    const b = state.board;
    for (const line of WIN_LINES) {
      const [a, b1, c] = line;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return { mark: b[a], line };
      }
    }
    return null;
  }

  function drawWinLine(line) {
    const [a, , c] = line;
    const cellA = boardEl.children[a];
    const cellC = boardEl.children[c];
    const boardRect = boardEl.getBoundingClientRect();
    const rA = cellA.getBoundingClientRect();
    const rC = cellC.getBoundingClientRect();

    const x1 = rA.left + rA.width / 2 - boardRect.left;
    const y1 = rA.top + rA.height / 2 - boardRect.top;
    const x2 = rC.left + rC.width / 2 - boardRect.left;
    const y2 = rC.top + rC.height / 2 - boardRect.top;

    const dx = x2 - x1, dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy) + 20;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const thickness = 6;

    // Position the (unrotated) bar centered on the midpoint of the two cell
    // centers, then rotate around its own center. Rotating around the center
    // keeps the bar symmetric along the true line direction for ANY angle
    // (horizontal, vertical or diagonal) — translating the start point first
    // and rotating afterwards (the previous approach) shifts non-horizontal
    // lines sideways, which was the bug.
    const lineEl = document.createElement("div");
    lineEl.className = "win-line";
    lineEl.style.width = `${length}px`;
    lineEl.style.height = `${thickness}px`;
    lineEl.style.left = `${midX - length / 2}px`;
    lineEl.style.top = `${midY - thickness / 2}px`;
    // The rotation MUST be passed through a CSS custom property that the
    // lineGrow keyframes themselves reference (see style.css) — a CSS
    // animation's transform overrides a plain inline transform, so setting
    // `transform: rotate(...)` here directly would get silently discarded.
    lineEl.style.setProperty("--line-angle", `${angle}deg`);
    boardEl.appendChild(lineEl);

    line.forEach((i) => boardEl.children[i].classList.add("win-cell"));
  }

  /* ---------------- AI (basic heuristic) ---------------- */
  function aiMove(myGameId) {
    // Defensive guards: only ever act on the game that scheduled this move,
    // only while it's actually still the AI's turn, and only in AI mode.
    if (myGameId !== undefined && state.gameId !== myGameId) return;
    if (state.gameOver) return;
    if (state.mode !== "ai" || state.current !== AI_PLAYER) return;

    const b = state.board;
    const me = "O";
    const opp = "X";

    // 1. Win if possible
    let move = findWinningMove(b, me);
    // 2. Block opponent
    if (move == null) move = findWinningMove(b, opp);
    // 3. Take center
    if (move == null && !b[4]) move = 4;
    // 4. Take a random empty corner
    if (move == null) {
      const corners = [0, 2, 6, 8].filter((i) => !b[i]);
      if (corners.length) move = corners[Math.floor(Math.random() * corners.length)];
    }
    // 5. Take any empty edge
    if (move == null) {
      const edges = [1, 3, 5, 7].filter((i) => !b[i]);
      if (edges.length) move = edges[Math.floor(Math.random() * edges.length)];
    }
    // 6. Fallback: any empty cell
    if (move == null) {
      const empties = b.map((v, i) => (v ? null : i)).filter((v) => v !== null);
      if (empties.length) move = empties[Math.floor(Math.random() * empties.length)];
    }

    if (move != null) makeMove(move);
  }

  function findWinningMove(b, mark) {
    for (const line of WIN_LINES) {
      const vals = line.map((i) => b[i]);
      const countMark = vals.filter((v) => v === mark).length;
      const countEmpty = vals.filter((v) => v === null).length;
      if (countMark === 2 && countEmpty === 1) {
        const emptyIdx = line[vals.indexOf(null)];
        return emptyIdx;
      }
    }
    return null;
  }

  /* ---------------- WIN OVERLAY ---------------- */
  const winOverlay = $("#win-overlay");
  const confettiField = $("#confetti-field");
  const COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

  function spawnConfetti() {
    confettiField.innerHTML = "";
    const count = 70;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dur = 2.2 + Math.random() * 1.8;
      const delay = Math.random() * 0.6;
      piece.style.animationDuration = dur + "s";
      piece.style.animationDelay = delay + "s";
      piece.style.width = 6 + Math.random() * 6 + "px";
      piece.style.height = 10 + Math.random() * 8 + "px";
      confettiField.appendChild(piece);
    }
  }

  function showWinOverlay(winnerName) {
    if (winnerName) {
      $("#win-label").textContent = "Kazanan";
      $("#win-name").textContent = `🎉 ${winnerName}`;
      spawnConfetti();
    } else {
      $("#win-label").textContent = "Berabere!";
      $("#win-name").textContent = "Kimse Kazanamadı";
      confettiField.innerHTML = "";
    }
    winOverlay.hidden = false;
  }

  function hideWinOverlay() {
    winOverlay.hidden = true;
    confettiField.innerHTML = "";
  }

  $("#btn-play-again").addEventListener("click", () => {
    hideWinOverlay();
    setupDiceScreen();
    showScreen("dice");
  });

  $("#btn-win-home").addEventListener("click", () => {
    hideWinOverlay();
    showScreen("home");
  });

  /* ---------------- GAME SCREEN ACTIONS ---------------- */
  $("#btn-restart").addEventListener("click", () => {
    setupDiceScreen();
    showScreen("dice");
  });

  $("#btn-home").addEventListener("click", () => {
    showScreen("home");
  });

  /* ---------------- INIT ---------------- */
  showScreen("home");
})();
