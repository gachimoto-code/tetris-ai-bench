(() => {
  const DIFFS = {
    easy: { rows: 9, cols: 9, mines: 10, cell: 36 },
    medium: { rows: 16, cols: 16, mines: 40, cell: 28 },
    hard: { rows: 16, cols: 30, mines: 99, cell: 24 },
  };

  const boardEl = document.getElementById("board");
  const mineCountEl = document.getElementById("mineCount");
  const timerEl = document.getElementById("timer");
  const resetBtn = document.getElementById("resetBtn");
  const faceIcon = document.getElementById("faceIcon");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayBtn = document.getElementById("overlayBtn");
  const diffButtons = [...document.querySelectorAll(".diff")];

  let config = DIFFS.easy;
  let grid = [];
  let started = false;
  let ended = false;
  let flags = 0;
  let opened = 0;
  let seconds = 0;
  let timerId = null;
  let longPressTimer = null;
  let ignoreNextClick = false;

  function pad3(n) {
    return String(Math.max(0, Math.min(999, n))).padStart(3, "0");
  }

  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
          out.push([nr, nc]);
        }
      }
    }
    return out;
  }

  function createEmptyGrid() {
    grid = Array.from({ length: config.rows }, (_, r) =>
      Array.from({ length: config.cols }, (_, c) => ({
        r,
        c,
        mine: false,
        open: false,
        flagged: false,
        count: 0,
      }))
    );
  }

  function placeMines(safeR, safeC) {
    const banned = new Set([`${safeR},${safeC}`]);
    for (const [nr, nc] of neighbors(safeR, safeC)) {
      banned.add(`${nr},${nc}`);
    }

    let placed = 0;
    while (placed < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      const key = `${r},${c}`;
      if (banned.has(key) || grid[r][c].mine) continue;
      grid[r][c].mine = true;
      placed++;
    }

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (grid[r][c].mine) continue;
        grid[r][c].count = neighbors(r, c).filter(([nr, nc]) => grid[nr][nc].mine).length;
      }
    }
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      seconds += 1;
      timerEl.textContent = pad3(seconds);
    }, 1000);
  }

  function setFace(mode) {
    resetBtn.classList.remove("is-win", "is-lose");
    if (mode === "win") {
      faceIcon.textContent = "★";
      resetBtn.classList.add("is-win");
    } else if (mode === "lose") {
      faceIcon.textContent = "×";
      resetBtn.classList.add("is-lose");
    } else {
      faceIcon.textContent = "◇";
    }
  }

  function updateMineMeter() {
    mineCountEl.textContent = pad3(config.mines - flags);
  }

  function showOverlay(title) {
    overlayTitle.textContent = title;
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${config.cols}, var(--cell-size))`;
    boardEl.style.setProperty("--cell-size", `${config.cell}px`);
    boardEl.innerHTML = "";

    const frag = document.createDocumentFragment();
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        btn.setAttribute("role", "gridcell");
        btn.setAttribute("aria-label", `${r + 1}行 ${c + 1}列`);
        frag.appendChild(btn);
      }
    }
    boardEl.appendChild(frag);
  }

  function paintCell(cell) {
    const btn = boardEl.querySelector(`[data-r="${cell.r}"][data-c="${cell.c}"]`);
    if (!btn) return;

    btn.className = "cell";
    btn.disabled = false;
    btn.textContent = "";

    if (cell.flagged && !cell.open) {
      btn.classList.add("is-flagged");
      btn.textContent = "⚑";
      return;
    }

    if (!cell.open) return;

    btn.classList.add("is-open");
    btn.disabled = true;

    if (cell.mine) {
      btn.classList.add("is-mine");
      if (cell.blast) btn.classList.add("is-blast");
      btn.textContent = "●";
      return;
    }

    if (cell.count > 0) {
      btn.classList.add(`n${cell.count}`);
      btn.textContent = String(cell.count);
    }
  }

  function revealAllMines(blast) {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.mine) {
          cell.open = true;
          if (blast && cell.r === blast.r && cell.c === blast.c) {
            cell.blast = true;
          }
          paintCell(cell);
        } else if (cell.flagged) {
          paintCell(cell);
        }
      }
    }
  }

  function floodOpen(r, c) {
    const stack = [[r, c]];
    const seen = new Set();

    while (stack.length) {
      const [cr, cc] = stack.pop();
      const key = `${cr},${cc}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const cell = grid[cr][cc];
      if (cell.open || cell.flagged || cell.mine) continue;

      cell.open = true;
      opened += 1;
      paintCell(cell);

      if (cell.count === 0) {
        for (const [nr, nc] of neighbors(cr, cc)) {
          stack.push([nr, nc]);
        }
      }
    }
  }

  function checkWin() {
    const totalSafe = config.rows * config.cols - config.mines;
    if (opened < totalSafe) return;

    ended = true;
    stopTimer();
    setFace("win");

    for (const row of grid) {
      for (const cell of row) {
        if (cell.mine && !cell.flagged) {
          cell.flagged = true;
          flags += 1;
          paintCell(cell);
        }
      }
    }
    updateMineMeter();
    showOverlay("クリア！");
  }

  function lose(cell) {
    ended = true;
    stopTimer();
    setFace("lose");
    cell.blast = true;
    revealAllMines(cell);
    showOverlay("ゲームオーバー");
  }

  function openCell(r, c) {
    if (ended) return;
    const cell = grid[r][c];
    if (cell.open || cell.flagged) return;

    if (!started) {
      started = true;
      placeMines(r, c);
      startTimer();
    }

    if (cell.mine) {
      cell.open = true;
      paintCell(cell);
      lose(cell);
      return;
    }

    floodOpen(r, c);
    checkWin();
  }

  function toggleFlag(r, c) {
    if (ended) return;
    const cell = grid[r][c];
    if (cell.open) return;

    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    updateMineMeter();
    paintCell(cell);
  }

  function resetGame() {
    stopTimer();
    started = false;
    ended = false;
    flags = 0;
    opened = 0;
    seconds = 0;
    timerEl.textContent = "000";
    setFace("play");
    hideOverlay();
    createEmptyGrid();
    renderBoard();
    updateMineMeter();
  }

  function setDifficulty(name) {
    config = DIFFS[name];
    diffButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.diff === name);
    });
    resetGame();
  }

  boardEl.addEventListener("click", (e) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      e.preventDefault();
      return;
    }
    const btn = e.target.closest(".cell");
    if (!btn || ended) return;
    openCell(Number(btn.dataset.r), Number(btn.dataset.c));
  });

  boardEl.addEventListener("contextmenu", (e) => {
    const btn = e.target.closest(".cell");
    if (!btn) return;
    e.preventDefault();
    toggleFlag(Number(btn.dataset.r), Number(btn.dataset.c));
  });

  boardEl.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".cell");
    if (!btn || e.pointerType !== "touch") return;
    const r = Number(btn.dataset.r);
    const c = Number(btn.dataset.c);
    longPressTimer = setTimeout(() => {
      toggleFlag(r, c);
      longPressTimer = "fired";
      ignoreNextClick = true;
    }, 420);
  });

  boardEl.addEventListener("pointerup", (e) => {
    const btn = e.target.closest(".cell");
    if (!btn || e.pointerType !== "touch") return;
    if (longPressTimer === "fired") {
      e.preventDefault();
      longPressTimer = null;
      return;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  boardEl.addEventListener("pointerleave", () => {
    if (longPressTimer && longPressTimer !== "fired") {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  boardEl.addEventListener("pointercancel", () => {
    if (longPressTimer && longPressTimer !== "fired") {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  resetBtn.addEventListener("click", resetGame);
  overlayBtn.addEventListener("click", resetGame);

  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDifficulty(btn.dataset.diff));
  });

  setDifficulty("easy");
})();
