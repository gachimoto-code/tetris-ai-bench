(() => {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;
  const PREVIEW = 3;

  const COLORS = {
    I: "#5ec8ff",
    O: "#ffc14a",
    T: "#b794ff",
    S: "#7dffb3",
    Z: "#ff6b4a",
    J: "#5a8cff",
    L: "#ff9a4a",
    G: "rgba(232, 245, 239, 0.18)",
  };

  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };

  const KICKS = {
    JLSTZ: {
      "0>1": [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ],
      "1>0": [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ],
      "1>2": [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ],
      "2>1": [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ],
      "2>3": [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ],
      "3>2": [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ],
      "3>0": [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ],
      "0>3": [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ],
    },
    I: {
      "0>1": [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
      "1>0": [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
      "1>2": [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
      "2>1": [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
      "2>3": [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
      "3>2": [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
      "3>0": [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
      "0>3": [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
    },
  };

  const SCORE_TABLE = [0, 100, 300, 500, 800];

  const boardCanvas = document.getElementById("board");
  const holdCanvas = document.getElementById("hold");
  const nextCanvas = document.getElementById("next");
  const boardCtx = boardCanvas.getContext("2d");
  const holdCtx = holdCanvas.getContext("2d");
  const nextCtx = nextCanvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const startBtn = document.getElementById("start-btn");

  let grid = createGrid();
  let bag = [];
  let queue = [];
  let current = null;
  let hold = null;
  let canHold = true;
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = 1000;
  let dropAccumulator = 0;
  let lastTime = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let flashRows = [];
  let flashTimer = 0;
  let lockFlash = null;

  function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function refillBag() {
    bag = shuffle(["I", "O", "T", "S", "Z", "J", "L"]);
  }

  function nextType() {
    if (bag.length === 0) refillBag();
    return bag.pop();
  }

  function fillQueue() {
    while (queue.length < PREVIEW) queue.push(nextType());
  }

  function cloneMatrix(m) {
    return m.map((row) => row.slice());
  }

  function rotateMatrix(matrix, dir) {
    const n = matrix.length;
    const rotated = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (dir > 0) rotated[x][n - 1 - y] = matrix[y][x];
        else rotated[n - 1 - x][y] = matrix[y][x];
      }
    }
    return rotated;
  }

  function spawnPiece(type = queue.shift()) {
    fillQueue();
    const shape = cloneMatrix(SHAPES[type]);
    const size = shape.length;
    const piece = {
      type,
      matrix: shape,
      x: Math.floor((COLS - size) / 2),
      y: type === "I" ? -1 : 0,
      rotation: 0,
    };
    if (collides(piece, piece.x, piece.y, piece.matrix)) {
      endGame();
      return null;
    }
    canHold = true;
    return piece;
  }

  function collides(piece, x, y, matrix) {
    for (let py = 0; py < matrix.length; py++) {
      for (let px = 0; px < matrix[py].length; px++) {
        if (!matrix[py][px]) continue;
        const gx = x + px;
        const gy = y + py;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && grid[gy][gx]) return true;
      }
    }
    return false;
  }

  function mergePiece() {
    const { matrix, x, y, type } = current;
    for (let py = 0; py < matrix.length; py++) {
      for (let px = 0; px < matrix[py].length; px++) {
        if (!matrix[py][px]) continue;
        const gy = y + py;
        const gx = x + px;
        if (gy >= 0) grid[gy][gx] = type;
      }
    }
    lockFlash = { x, y, matrix: cloneMatrix(matrix), life: 0.18 };
  }

  function clearLines() {
    const full = [];
    for (let y = 0; y < ROWS; y++) {
      if (grid[y].every((cell) => cell)) full.push(y);
    }
    if (full.length === 0) return 0;

    flashRows = full;
    flashTimer = 0.22;
    return full.length;
  }

  function applyClearedLines(count) {
    const remaining = grid.filter((row) => !row.every((cell) => cell));
    while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null));
    grid = remaining;

    lines += count;
    score += SCORE_TABLE[count] * level;
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      dropInterval = Math.max(100, 1000 - (level - 1) * 85);
    }
    updateHUD();
  }

  function ghostY() {
    let y = current.y;
    while (!collides(current, current.x, y + 1, current.matrix)) y++;
    return y;
  }

  function softDrop() {
    if (!current || flashTimer > 0) return;
    if (!collides(current, current.x, current.y + 1, current.matrix)) {
      current.y++;
      score += 1;
      updateHUD();
      dropAccumulator = 0;
    } else {
      lockAndContinue();
    }
  }

  function hardDrop() {
    if (!current || flashTimer > 0) return;
    const gy = ghostY();
    const dropped = gy - current.y;
    current.y = gy;
    score += dropped * 2;
    updateHUD();
    lockAndContinue();
  }

  function move(dx) {
    if (!current || flashTimer > 0) return;
    if (!collides(current, current.x + dx, current.y, current.matrix)) {
      current.x += dx;
    }
  }

  function rotate(dir) {
    if (!current || flashTimer > 0 || current.type === "O") return;

    const from = current.rotation;
    const to = (from + dir + 4) % 4;
    const rotated = rotateMatrix(current.matrix, dir);
    const table = current.type === "I" ? KICKS.I : KICKS.JLSTZ;
    const key = `${from}>${to}`;
    const tests = table[key] || [[0, 0]];

    for (const [kx, ky] of tests) {
      const nx = current.x + kx;
      const ny = current.y - ky;
      if (!collides(current, nx, ny, rotated)) {
        current.matrix = rotated;
        current.x = nx;
        current.y = ny;
        current.rotation = to;
        return;
      }
    }
  }

  function holdPiece() {
    if (!current || !canHold || flashTimer > 0) return;
    const type = current.type;
    if (hold) {
      current = spawnPiece(hold);
      hold = type;
    } else {
      hold = type;
      current = spawnPiece();
    }
    canHold = false;
    drawSidePanels();
  }

  function lockAndContinue() {
    mergePiece();
    const cleared = clearLines();
    if (cleared === 0) {
      current = spawnPiece();
      drawSidePanels();
    } else {
      current = null;
      pendingClear = cleared;
    }
  }

  let pendingClear = 0;

  function updateHUD() {
    scoreEl.textContent = score.toLocaleString("ja-JP");
    linesEl.textContent = String(lines);
    levelEl.textContent = String(level);
  }

  function drawCell(ctx, x, y, color, size, alpha = 1) {
    const pad = Math.max(1, size * 0.08);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size * 0.28);

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(
      x * size + pad,
      y * size + size - pad - size * 0.18,
      size - pad * 2,
      size * 0.18
    );
    ctx.globalAlpha = 1;
  }

  function drawBoard() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

    boardCtx.fillStyle = "#0a100e";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    boardCtx.strokeStyle = "rgba(126, 255, 179, 0.06)";
    boardCtx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      boardCtx.beginPath();
      boardCtx.moveTo(x * BLOCK + 0.5, 0);
      boardCtx.lineTo(x * BLOCK + 0.5, ROWS * BLOCK);
      boardCtx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, y * BLOCK + 0.5);
      boardCtx.lineTo(COLS * BLOCK, y * BLOCK + 0.5);
      boardCtx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = grid[y][x];
        if (cell) drawCell(boardCtx, x, y, COLORS[cell], BLOCK);
      }
    }

    if (flashTimer > 0) {
      const pulse = 0.45 + Math.sin((1 - flashTimer / 0.22) * Math.PI) * 0.45;
      for (const y of flashRows) {
        boardCtx.fillStyle = `rgba(200, 245, 66, ${pulse})`;
        boardCtx.fillRect(0, y * BLOCK, COLS * BLOCK, BLOCK);
      }
    }

    if (current) {
      const gy = ghostY();
      for (let py = 0; py < current.matrix.length; py++) {
        for (let px = 0; px < current.matrix[py].length; px++) {
          if (!current.matrix[py][px]) continue;
          const y = gy + py;
          if (y < 0) continue;
          drawCell(boardCtx, current.x + px, y, COLORS.G, BLOCK, 1);
        }
      }

      for (let py = 0; py < current.matrix.length; py++) {
        for (let px = 0; px < current.matrix[py].length; px++) {
          if (!current.matrix[py][px]) continue;
          const y = current.y + py;
          if (y < 0) continue;
          drawCell(boardCtx, current.x + px, y, COLORS[current.type], BLOCK);
        }
      }
    }

    if (lockFlash) {
      const a = Math.max(0, lockFlash.life / 0.18);
      boardCtx.fillStyle = `rgba(232, 245, 239, ${a * 0.55})`;
      for (let py = 0; py < lockFlash.matrix.length; py++) {
        for (let px = 0; px < lockFlash.matrix[py].length; px++) {
          if (!lockFlash.matrix[py][px]) continue;
          const y = lockFlash.y + py;
          if (y < 0) continue;
          boardCtx.fillRect(
            (lockFlash.x + px) * BLOCK,
            y * BLOCK,
            BLOCK,
            BLOCK
          );
        }
      }
    }
  }

  function drawMini(ctx, canvas, types, cellSize) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const list = Array.isArray(types) ? types : [types];

    list.forEach((type, index) => {
      if (!type) return;
      const matrix = SHAPES[type];
      const size = matrix.length;
      const offsetY = index * (canvas.height / (Array.isArray(types) ? PREVIEW : 1));
      const box = Array.isArray(types) ? canvas.height / PREVIEW : canvas.height;
      const offsetX = (canvas.width - size * cellSize) / 2;
      const top = offsetY + (box - size * cellSize) / 2;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!matrix[y][x]) continue;
          drawCellAt(ctx, offsetX + x * cellSize, top + y * cellSize, COLORS[type], cellSize);
        }
      }
    });
  }

  function drawCellAt(ctx, px, py, color, size) {
    const pad = Math.max(1, size * 0.1);
    ctx.fillStyle = color;
    ctx.fillRect(px + pad, py + pad, size - pad * 2, size - pad * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(px + pad, py + pad, size - pad * 2, size * 0.28);
  }

  function drawSidePanels() {
    drawMini(holdCtx, holdCanvas, hold, 20);
    drawMini(nextCtx, nextCanvas, queue, 20);
  }

  function showOverlay(title, msg, buttonText) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    startBtn.textContent = buttonText;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    grid = createGrid();
    bag = [];
    queue = [];
    hold = null;
    canHold = true;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropAccumulator = 0;
    flashRows = [];
    flashTimer = 0;
    lockFlash = null;
    pendingClear = 0;
    gameOver = false;
    paused = false;
    running = true;
    fillQueue();
    current = spawnPiece();
    updateHUD();
    drawSidePanels();
    hideOverlay();
    lastTime = performance.now();
  }

  function endGame() {
    running = false;
    gameOver = true;
    current = null;
    showOverlay("GAME OVER", `スコア ${score.toLocaleString("ja-JP")}`, "RETRY");
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    if (paused) {
      showOverlay("PAUSED", "P で再開", "RESUME");
    } else {
      hideOverlay();
      lastTime = performance.now();
    }
  }

  function update(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
    lastTime = time;

    if (running && !paused) {
      if (lockFlash) {
        lockFlash.life -= dt;
        if (lockFlash.life <= 0) lockFlash = null;
      }

      if (flashTimer > 0) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          flashTimer = 0;
          applyClearedLines(pendingClear);
          pendingClear = 0;
          flashRows = [];
          current = spawnPiece();
          drawSidePanels();
        }
      } else if (current) {
        dropAccumulator += dt * 1000;
        while (dropAccumulator >= dropInterval) {
          dropAccumulator -= dropInterval;
          if (!collides(current, current.x, current.y + 1, current.matrix)) {
            current.y++;
          } else {
            lockAndContinue();
            break;
          }
        }
      }
    }

    drawBoard();
    requestAnimationFrame(update);
  }

  const repeat = {
    left: null,
    right: null,
    soft: null,
  };

  function startRepeat(key, action) {
    action();
    clearTimeout(repeat[key]);
    clearInterval(repeat[key]);
    repeat[key] = setTimeout(() => {
      repeat[key] = setInterval(action, 40);
    }, 160);
  }

  function stopRepeat(key) {
    clearTimeout(repeat[key]);
    clearInterval(repeat[key]);
    repeat[key] = null;
  }

  function handleAction(action) {
    if (gameOver || (!running && action !== "start")) {
      if (action === "start" || action === "hard") startGame();
      return;
    }
    if (paused && action !== "pause" && action !== "start") return;

    switch (action) {
      case "left":
        move(-1);
        break;
      case "right":
        move(1);
        break;
      case "rotate":
        rotate(1);
        break;
      case "rotate-ccw":
        rotate(-1);
        break;
      case "soft":
        softDrop();
        break;
      case "hard":
        hardDrop();
        break;
      case "hold":
        holdPiece();
        break;
      case "pause":
        togglePause();
        break;
      case "start":
        if (paused) togglePause();
        else if (!running) startGame();
        break;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.repeat) {
      if (["ArrowDown"].includes(e.key)) softDrop();
      return;
    }

    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "rotate",
      ArrowDown: "soft",
      " ": "hard",
      Spacebar: "hard",
      x: "rotate",
      X: "rotate",
      z: "rotate-ccw",
      Z: "rotate-ccw",
      c: "hold",
      C: "hold",
      Shift: "hold",
      p: "pause",
      P: "pause",
      Enter: "start",
    };

    const action = map[e.key];
    if (!action) return;
    e.preventDefault();

    if (action === "left") startRepeat("left", () => move(-1));
    else if (action === "right") startRepeat("right", () => move(1));
    else if (action === "soft") startRepeat("soft", softDrop);
    else handleAction(action);
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") stopRepeat("left");
    if (e.key === "ArrowRight") stopRepeat("right");
    if (e.key === "ArrowDown") stopRepeat("soft");
  });

  startBtn.addEventListener("click", () => {
    if (paused) togglePause();
    else startGame();
  });

  document.querySelectorAll(".touch-controls [data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    const press = (e) => {
      e.preventDefault();
      if (action === "left") startRepeat("left", () => move(-1));
      else if (action === "right") startRepeat("right", () => move(1));
      else if (action === "soft") startRepeat("soft", softDrop);
      else handleAction(action);
    };
    const release = (e) => {
      e.preventDefault();
      if (action === "left") stopRepeat("left");
      if (action === "right") stopRepeat("right");
      if (action === "soft") stopRepeat("soft");
    };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
  });

  updateHUD();
  drawSidePanels();
  drawBoard();
  requestAnimationFrame(update);
})();
