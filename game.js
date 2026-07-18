(() => {
  "use strict";

  const canvas = document.querySelector("#game-canvas");
  const ctx = canvas.getContext("2d");
  const questionPanel = document.querySelector(".question-panel");
  const questionText = document.querySelector("#question-text");
  const statusText = document.querySelector("#status-text");
  const questionCountdown = document.querySelector("#question-countdown");
  const countdownRing = document.querySelector("#countdown-ring");
  const countdownValue = document.querySelector("#countdown-value");
  const scoreEl = document.querySelector("#score");
  const comboEl = document.querySelector("#combo");
  const bestScoreEl = document.querySelector("#best-score");
  const pauseOverlay = document.querySelector("#pause-overlay");
  const restartButton = document.querySelector("#restart-button");
  const instructionsButton = document.querySelector("#instructions-button");
  const settingsButton = document.querySelector("#settings-button");
  const settingsDialog = document.querySelector("#settings-dialog");
  const closeSettings = document.querySelector("#close-settings");
  const instructionsDialog = document.querySelector("#instructions-dialog");
  const closeInstructions = document.querySelector("#close-instructions");
  const settingsForm = document.querySelector("#settings-form");
  const minFactorInput = document.querySelector("#min-factor");
  const maxFactorInput = document.querySelector("#max-factor");
  const distractorCountInput = document.querySelector("#distractor-count");
  const feedbackInput = document.querySelector("#feedback-duration");
  const reducedMotionInput = document.querySelector("#reduced-motion");

  const TILE = 24;
  const COLS = 28;
  const ROWS = 30;
  const DIRECTIONS = {
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 },
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 }
  };
  const OPPOSITE = { left: "right", right: "left", up: "down", down: "up" };
  const STORAGE_KEY = "times-table-pacman-settings";

  const settings = loadSettings();
  const ghostHouse = { left: 10, right: 17, top: 12, bottom: 18 };
  let maze = createMaze();
  const spawn = { x: 13.5, y: 23.5 };
  const ghostHome = { x: 13.5, y: 15.5 };
  const scatterCorners = [{ x: 2, y: 2 }, { x: 25, y: 2 }, { x: 2, y: 27 }, { x: 25, y: 27 }];
  const powerPelletSpots = [{ x: 2, y: 3 }, { x: 25, y: 3 }, { x: 2, y: 27 }, { x: 25, y: 27 }];
  let openTiles = getOpenTiles();

  const game = {
    score: 0,
    combo: 0,
    best: Number(localStorage.getItem("times-table-pacman-best") || 0),
    paused: false,
    started: false,
    feedback: null,
    question: null,
    targets: [],
    powerPellets: powerPelletSpots.map((spot) => ({ ...spot, kind: "pellet", active: true })),
    frightenedUntil: 0,
    hitStarted: 0,
    respawnAt: 0,
    mode: "scatter",
    modeElapsed: 0,
    elapsed: 0,
    lastFrame: performance.now(),
    touchStart: null
  };

  const GHOST_EXIT_TARGET = { x: 13.5, y: 21.5 };
  const GHOST_RELEASE_INTERVAL = 1.6;

  const player = makePlayer();
  let modalPauseBeforeOpen = null;
  const ghosts = [
    makeGhost("Blinky", "#f34c5e", 13.5, 14.5, "left", 0),
    makeGhost("Pinky", "#ff9ed1", 13.5, 15.5, "up", 1.8),
    makeGhost("Inky", "#43d8e8", 12.5, 15.5, "up", 3.6),
    makeGhost("Clyde", "#ffad4d", 14.5, 15.5, "down", 5.4)
  ];

  function defaultSettings() {
    return { minFactor: 2, maxFactor: 12, distractorCount: 8, feedbackDuration: 2, reducedMotion: false };
  }

  function loadSettings() {
    const defaults = defaultSettings();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return { ...defaults, ...(saved || {}) };
    } catch (_) {
      return defaults;
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function createMaze(randomSource = Math.random, attempt = 0) {
    // A compact 14×15 blueprint is expanded into 2×2 open blocks. This keeps
    // every regular corridor two cells wide while preserving a classic maze silhouette.
    const baseBlueprint = [
      "##############",
      "#............#",
      "#.###.##.###.#",
      "#.#........#.#",
      "#.#.##..##.#.#",
      "#.#.#....#.#.#",
      "#...#.#...#..#",
      "##.#.......###",
      "#...#.#...#..#",
      "#.#.#....#.#.#",
      "#.#.##..##.#.#",
      "#.#........#.#",
      "#.###.##.###.#",
      "#............#",
      "##############"
    ];
    const bridgeCandidates = [];
    for (let y = 1; y < baseBlueprint.length - 1; y++) for (let x = 1; x < baseBlueprint[y].length - 1; x++) {
      if (baseBlueprint[y][x] !== "#") continue;
      const horizontalBridge = baseBlueprint[y][x - 1] === "." && baseBlueprint[y][x + 1] === ".";
      const verticalBridge = baseBlueprint[y - 1][x] === "." && baseBlueprint[y + 1][x] === ".";
      if (horizontalBridge || verticalBridge) bridgeCandidates.push([x, y]);
    }
    bridgeCandidates.sort(() => randomSource() - .5);
    bridgeCandidates.slice(0, randomInt(1, Math.min(3, bridgeCandidates.length), randomSource)).forEach(([x, y]) => {
      baseBlueprint[y] = `${baseBlueprint[y].slice(0, x)}.${baseBlueprint[y].slice(x + 1)}`;
    });
    const flipX = randomSource() < .5;
    const flipY = randomSource() < .5;
    const blueprint = baseBlueprint.map((_, y) => {
      const sourceRow = baseBlueprint[flipY ? baseBlueprint.length - 1 - y : y];
      return flipX ? sourceRow.split("").reverse().join("") : sourceRow;
    });
    // Close the few tempting-looking branch pockets so every lane belongs to a loop.
    [[11, 5], [11, 7], [4, 6], [11, 9]].forEach(([x, y]) => {
      blueprint[y] = `${blueprint[y].slice(0, x)}.${blueprint[y].slice(x + 1)}`;
    });
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("#"));
    blueprint.forEach((row, blueprintY) => {
      for (let blueprintX = 0; blueprintX < row.length; blueprintX++) {
        if (row[blueprintX] !== ".") continue;
        for (let y = blueprintY * 2; y < blueprintY * 2 + 2 && y < ROWS; y++) {
          for (let x = blueprintX * 2; x < blueprintX * 2 + 2 && x < COLS; x++) grid[y][x] = ".";
        }
      }
    });
    // The classic side tunnel is two cells high and connects into the middle lanes.
    for (const y of [14, 15]) {
      for (let x = 0; x < 6; x++) grid[y][x] = ".";
      for (let x = 22; x < COLS; x++) grid[y][x] = ".";
    }
    // Reserve a central rectangular ghost house with a two-cell gate.
    const { left: penLeft, right: penRight, top: penTop, bottom: penBottom } = ghostHouse;
    // Keep a complete open-tile buffer around the house so the rectangle never
    // visually touches a neighboring wall, including at its corners.
    for (let y = penTop - 1; y <= penBottom + 1; y++) {
      for (let x = penLeft - 1; x <= penRight + 1; x++) grid[y][x] = ".";
    }
    for (let y = penTop; y <= penBottom; y++) for (let x = penLeft; x <= penRight; x++) grid[y][x] = ".";
    for (let x = penLeft; x <= penRight; x++) {
      grid[penTop][x] = "#";
      grid[penBottom][x] = "#";
    }
    for (let y = penTop; y <= penBottom; y++) {
      grid[y][penLeft] = "#";
      grid[y][penRight] = "#";
    }
    grid[penBottom][13] = ".";
    grid[penBottom][14] = ".";
    // The top/bottom toroidal route uses the two middle columns and detours
    // around the ghost house while its central rectangle stays reserved.
    for (let y = 0; y < penTop; y++) {
      grid[y][13] = ".";
      grid[y][14] = ".";
    }
    for (let y = penBottom + 1; y < ROWS; y++) {
      grid[y][13] = ".";
      grid[y][14] = ".";
    }
    for (let y = penTop; y <= penBottom; y++) {
      grid[y][8] = ".";
      grid[y][9] = ".";
    }
    for (let x = 8; x <= 14; x++) {
      grid[penTop - 1][x] = ".";
      grid[penBottom + 1][x] = ".";
    }
    // Keep separate wall sections from touching at diagonal corners.
    [[18, 11], [19, 11], [20, 17]].forEach(([x, y]) => { grid[y][x] = "."; });
    grid[14][0] = "."; grid[15][0] = ".";
    grid[14][COLS - 1] = "."; grid[15][COLS - 1] = ".";
    grid[0].fill("#");
    grid[ROWS - 1].fill("#");
    // Match the two-cell top border: the last two rows are the bottom wall,
    // while the row above remains part of the playable maze.
    grid[ROWS - 3] = [...grid[ROWS - 4]];
    grid[ROWS - 2].fill("#");
    grid[ROWS - 1].fill("#");
    grid[0][13] = "."; grid[0][14] = ".";
    grid[1][13] = "."; grid[1][14] = ".";
    grid[ROWS - 2][13] = "."; grid[ROWS - 2][14] = ".";
    grid[ROWS - 1][13] = "."; grid[ROWS - 1][14] = ".";
    if (isMazeSolvable(grid) && isGhostHouseClear(grid) && isWallCornerClear(grid)) return grid;
    // Never let a rare run of invalid random layouts freeze the whole game.
    // The fixed fallback seed produces a known valid layout from this blueprint.
    if (attempt >= 80) return createMaze(() => .7, 0);
    return createMaze(randomSource, attempt + 1);
  }

  function isGhostHouseClear(grid) {
    const { left, right, top, bottom } = ghostHouse;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const isHousePerimeter = x === left || x === right || y === top || y === bottom;
      if (!isHousePerimeter || grid[y][x] !== "#") continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
            !(nx >= left && nx <= right && ny >= top && ny <= bottom) && grid[ny][nx] === "#") return false;
      }
    }
    return true;
  }

  function isWallCornerClear(grid) {
    for (let y = 0; y < ROWS - 1; y++) for (let x = 0; x < COLS - 1; x++) {
      const topLeft = grid[y][x] === "#";
      const topRight = grid[y][x + 1] === "#";
      const bottomLeft = grid[y + 1][x] === "#";
      const bottomRight = grid[y + 1][x + 1] === "#";
      const diagonalTouch = (topLeft && bottomRight && !topRight && !bottomLeft) ||
        (topRight && bottomLeft && !topLeft && !bottomRight);
      if (diagonalTouch) return false;
    }
    return true;
  }

  function isMazeSolvable(grid) {
    const open = (x, y) => grid[(y + ROWS) % ROWS][(x + COLS) % COLS] !== "#";
    if (!open(13, 23)) return false;
    const seen = new Set(["13,23"]);
    const queue = [[13, 23]];
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = (x + dx + COLS) % COLS;
        const ny = (y + dy + ROWS) % ROWS;
        const key = `${nx},${ny}`;
        if (open(nx, ny) && !seen.has(key)) { seen.add(key); queue.push([nx, ny]); }
      }
    }
    let openCount = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (open(x, y)) {
      openCount++;
      const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => open(x + dx, y + dy)).length;
      if (neighbors === 1) return false;
    }
    return seen.size === openCount;
  }

  function getOpenTiles() {
    const tiles = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] !== "#") tiles.push({ x, y });
    return tiles.filter((tile) => {
      const inGhostHouse = tile.x >= ghostHouse.left && tile.x <= ghostHouse.right && tile.y >= ghostHouse.top && tile.y <= ghostHouse.bottom;
      return !inGhostHouse && Math.hypot(tile.x + .5 - spawn.x, tile.y + .5 - spawn.y) > 4 && Math.hypot(tile.x + .5 - ghostHome.x, tile.y + .5 - ghostHome.y) > 2;
    });
  }

  function makePlayer() {
    return { x: spawn.x, y: spawn.y, dir: "left", nextDir: "left", speed: 5.2, mouth: 0 };
  }

  function makeGhost(name, color, x, y, dir, delay) {
    return { name, color, x, y, homeX: x, homeY: y, dir, speed: 3.75, delay, state: "scatter", eaten: false, phase: delay, destination: null, releasing: true };
  }

  function isOpen(x, y) {
    const wrappedX = (x + COLS) % COLS;
    const wrappedY = (y + ROWS) % ROWS;
    return maze[wrappedY][wrappedX] !== "#";
  }

  function tileCenter(entity) {
    return Math.abs(entity.x - (Math.floor(entity.x) + .5)) < .08 && Math.abs(entity.y - (Math.floor(entity.y) + .5)) < .08;
  }

  function centerTile(entity) {
    return { x: Math.floor(entity.x), y: Math.floor(entity.y) };
  }

  function canMove(entity, direction) {
    const d = DIRECTIONS[direction];
    const tile = centerTile(entity);
    return isOpen(tile.x + d.x, tile.y + d.y);
  }

  function getQuestion() {
    const min = Math.max(1, Math.min(20, Math.round(Number(settings.minFactor))));
    const max = Math.max(min, Math.min(20, Math.round(Number(settings.maxFactor))));
    const a = randomInt(min, max);
    const b = randomInt(min, max);
    const missingProduct = Math.random() < .5;
    return missingProduct ? { a, b, answer: a * b, text: `${a} × ${b} = ?`, type: "product" } : { a, b, answer: b, text: `${a} × ? = ${a * b}`, type: "factor" };
  }

  function makeTargets(question) {
    const values = new Set([question.answer]);
    const candidates = [];
    if (question.type === "factor") {
      for (let offset = -3; offset <= 3; offset++) if (question.answer + offset > 0 && question.answer + offset !== question.answer) candidates.push(question.answer + offset);
      for (let n = 1; n <= 20; n++) candidates.push(n);
    } else {
      for (let offset = -3; offset <= 3; offset++) if (question.answer + offset > 0 && question.answer + offset !== question.answer) candidates.push(question.answer + offset);
      const min = Math.min(question.a, question.b);
      const max = Math.max(question.a, question.b);
      candidates.push(min * max, min * (max + 1), Math.max(1, (min - 1) * max));
    }
    candidates.sort(() => Math.random() - .5);
    const targetCount = clamp(Math.round(Number(settings.distractorCount) || 8) + 1, 2, 9);
    for (const value of candidates) if (values.size < targetCount) values.add(value);
    const positions = chooseSpreadPositions(values.size);
    return [...values].map((value, index) => ({ ...positions[index], value, correct: value === question.answer, state: "normal" }));
  }

  function chooseSpreadPositions(count) {
    const candidates = openTiles.filter((tile) => !powerPelletSpots.some((pellet) => pellet.x === tile.x && pellet.y === tile.y));
    const bucketColumns = 3;
    const bucketRows = 4;
    const buckets = Array.from({ length: bucketColumns * bucketRows }, () => []);
    candidates.forEach((tile) => {
      const column = Math.min(bucketColumns - 1, Math.floor(tile.x / COLS * bucketColumns));
      const row = Math.min(bucketRows - 1, Math.floor(tile.y / ROWS * bucketRows));
      buckets[row * bucketColumns + column].push(tile);
    });
    const usableBuckets = buckets.filter((bucket) => bucket.length).sort(() => Math.random() - .5);
    const positions = [];
    for (let index = 0; index < count; index++) {
      const bucket = usableBuckets[index % usableBuckets.length] || candidates;
      const isSafe = (tile) => positions.every((chosen) => chosen.x !== tile.x && chosen.y !== tile.y && Math.hypot(tile.x - chosen.x, tile.y - chosen.y) >= 4);
      const spaced = bucket.filter(isSafe);
      const fallback = candidates.filter(isSafe);
      const pool = spaced.length ? spaced : fallback.length ? fallback : bucket;
      positions.push(pool[randomInt(0, pool.length - 1)]);
    }
    return positions;
  }

  function nextQuestion() {
    regenerateMaze();
    game.question = getQuestion();
    game.targets = makeTargets(game.question);
    questionText.textContent = game.question.text;
    questionText.className = "question";
    game.feedback = null;
    questionCountdown.hidden = true;
    questionPanel.classList.remove("with-countdown");
    updateUI();
  }

  function regenerateMaze() {
    const previousSignature = mazeSignature(maze);
    let nextMaze;
    do {
      nextMaze = createMaze();
    } while (mazeSignature(nextMaze) === previousSignature);
    maze = nextMaze;
    openTiles = getOpenTiles();
    Object.assign(player, makePlayer());
    ghosts.forEach((ghost) => Object.assign(ghost, makeGhost(ghost.name, ghost.color, ghost.homeX, ghost.homeY, "left", ghost.delay)));
    game.powerPellets.forEach((pellet) => { pellet.active = true; });
  }

  function mazeSignature(grid) { return grid.map((row) => row.join("")).join("|"); }

  function randomInt(min, max, randomSource = Math.random) { return Math.floor(randomSource() * (max - min + 1)) + min; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function completedEquation(question, answer) {
    return question.type === "product"
      ? `${question.a} × ${question.b} = ${answer}`
      : `${question.a} × ${answer} = ${question.a * answer}`;
  }

  function setDirection(direction) {
    if (!DIRECTIONS[direction]) return;
    player.nextDir = direction;
    if (game.paused) togglePause(false);
    game.started = true;
  }

  function updatePlayer(dt) {
    if (game.respawnAt > game.elapsed) return;
    if (game.respawnAt && game.elapsed >= game.respawnAt) respawnPlayer();
    if (tileCenter(player)) {
      player.x = Math.floor(player.x) + .5;
      player.y = Math.floor(player.y) + .5;
      if (canMove(player, player.nextDir)) player.dir = player.nextDir;
      if (!canMove(player, player.dir)) return checkPlayerTargets();
    }
    const d = DIRECTIONS[player.dir];
    player.x += d.x * player.speed * dt;
    player.y += d.y * player.speed * dt;
    if (player.x < 0) player.x = COLS;
    if (player.x > COLS) player.x = 0;
    if (player.y < 0) player.y = ROWS;
    if (player.y > ROWS) player.y = 0;
    player.mouth += dt * 12;
    checkPlayerTargets();
  }

  function checkPlayerTargets() {
    if (game.feedback) return;
    const target = game.targets.find((item) => item.state === "normal" && distance(player, { x: item.x + .5, y: item.y + .5 }) < .45);
    if (target) { evaluateTarget(target); return; }
    const pellet = game.powerPellets.find((item) => item.active && distance(player, { x: item.x + .5, y: item.y + .5 }) < .45);
    if (pellet) evaluatePowerPellet(pellet);
  }

  function evaluateTarget(target) {
    if (target.correct) {
      target.state = "correct";
      game.score += 100 + game.combo * 25;
      game.combo += 1;
      questionText.textContent = completedEquation(game.question, target.value);
      questionText.className = "question answer-good";
      game.feedback = { type: "good", until: game.elapsed + settings.feedbackDuration, question: game.question };
      statusText.textContent = "Correct!";
    } else {
      target.state = "wrong";
      game.score = Math.max(0, game.score - 25);
      game.combo = 0;
      questionText.textContent = completedEquation(game.question, target.value);
      questionText.className = "question answer-bad";
      game.feedback = { type: "bad", until: game.elapsed + settings.feedbackDuration, question: game.question };
      statusText.textContent = "Try the next one.";
      window.setTimeout(() => {
        if (game.feedback?.question !== game.question || game.feedback.type !== "bad") return;
        questionText.textContent = completedEquation(game.question, game.question.answer);
        questionText.className = "question answer-reveal";
      }, Math.min(1000, settings.feedbackDuration * 500));
    }
    game.best = Math.max(game.best, game.score);
    localStorage.setItem("times-table-pacman-best", String(game.best));
    updateUI();
    window.setTimeout(nextQuestion, settings.feedbackDuration * 1000);
  }

  function evaluatePowerPellet(pellet) {
    pellet.active = false;
    game.frightenedUntil = game.elapsed + 7;
    game.score += 50;
    statusText.textContent = "Power pellet! Ghosts are frightened for 7 seconds.";
    updateUI();
    window.setTimeout(() => { pellet.active = true; }, 7000);
  }

  function updateGhosts(dt) {
    const frightened = game.elapsed < game.frightenedUntil;
    if (!frightened) {
      game.modeElapsed += dt;
      const cycle = game.modeElapsed % 54;
      game.mode = cycle < 7 || (cycle >= 27 && cycle < 34) ? "scatter" : "chase";
    }
    ghosts.forEach((ghost, index) => {
      if (ghost.phase > 0) { ghost.phase -= dt; return; }
      ghost.state = ghost.eaten ? "eyes" : ghost.releasing ? "exit" : frightened ? "frightened" : game.mode;
      const speed = ghost.state === "frightened" ? 2.1 : ghost.state === "eyes" ? 6 : ghost.speed;
      if (!ghost.destination) {
        ghost.x = Math.floor(ghost.x) + .5;
        ghost.y = Math.floor(ghost.y) + .5;
        const options = ["left", "right", "up", "down"].filter((dir) => canMove(ghost, dir) && dir !== OPPOSITE[ghost.dir]);
        if (options.length === 0 && canMove(ghost, OPPOSITE[ghost.dir])) options.push(OPPOSITE[ghost.dir]);
        if (options.length) {
          const target = ghostTarget(ghost, index);
          ghost.dir = ghost.state === "frightened" ? options[randomInt(0, options.length - 1)] : options.sort((a, b) => distanceToTile(target, nextTile(ghost, a)) - distanceToTile(target, nextTile(ghost, b)))[0];
        }
        const direction = DIRECTIONS[ghost.dir];
        ghost.destination = { x: ghost.x + direction.x, y: ghost.y + direction.y };
      }
      advanceGhost(ghost, speed, dt);
      if (ghost.releasing && ghost.y >= 19.5 && ghost.x >= 12.5 && ghost.x <= 15.5) ghost.releasing = false;
      if (ghost.state === "eyes" && distance(ghost, ghostHome) < .25) { ghost.eaten = false; ghost.releasing = true; ghost.state = "exit"; }
      if (distance(player, ghost) < .55) handleGhostCollision(ghost);
    });
  }

  function advanceGhost(ghost, speed, dt) {
    const d = DIRECTIONS[ghost.dir];
    const destination = ghost.destination;
    const distanceToCenter = Math.abs(d.x ? destination.x - ghost.x : destination.y - ghost.y);
    const step = speed * dt;
    if (step >= distanceToCenter) {
      ghost.x = destination.x;
      ghost.y = destination.y;
      if (ghost.x < 0) ghost.x = COLS - .5;
      if (ghost.x >= COLS) ghost.x = .5;
      if (ghost.y < 0) ghost.y = ROWS - .5;
      if (ghost.y >= ROWS) ghost.y = .5;
      ghost.destination = null;
    } else {
      ghost.x += d.x * step;
      ghost.y += d.y * step;
    }
  }

  function nextTile(entity, dir) { const d = DIRECTIONS[dir]; const tile = centerTile(entity); return { x: tile.x + d.x + .5, y: tile.y + d.y + .5 }; }
  function distanceToTile(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function ghostTarget(ghost, index) {
    if (ghost.state === "eyes") return ghostHome;
    if (ghost.releasing) return GHOST_EXIT_TARGET;
    if (ghost.state === "scatter") return scatterCorners[index];
    if (ghost.name === "Blinky") return { ...player };
    const direction = DIRECTIONS[player.dir];
    if (ghost.name === "Pinky") return { x: player.x + direction.x * 4, y: player.y + direction.y * 4 };
    if (ghost.name === "Inky") {
      const ahead = { x: player.x + direction.x * 2, y: player.y + direction.y * 2 };
      const blinky = ghosts[0];
      return { x: ahead.x + (ahead.x - blinky.x), y: ahead.y + (ahead.y - blinky.y) };
    }
    return distance(ghost, player) > 8 ? { ...player } : scatterCorners[index];
  }

  function handleGhostCollision(ghost) {
    if (ghost.state === "frightened") {
      ghost.eaten = true;
      game.score += 200;
      updateUI();
      return;
    }
    if (ghost.state === "eyes") return;
    if (game.respawnAt > game.elapsed) return;
    game.hitStarted = game.elapsed;
    game.respawnAt = game.elapsed + .8;
    game.combo = 0;
    resetGhostsAfterCapture();
    statusText.textContent = "A ghost caught you — hold on, you are respawning.";
    updateUI();
  }

  function resetGhostsAfterCapture() {
    ghosts.forEach((ghost, index) => {
      const direction = index === 0 ? "left" : index === 3 ? "down" : "up";
      Object.assign(ghost, makeGhost(ghost.name, ghost.color, ghost.homeX, ghost.homeY, direction, index * GHOST_RELEASE_INTERVAL));
    });
  }

  function respawnPlayer() {
    player.x = spawn.x;
    player.y = spawn.y;
    player.dir = "left";
    player.nextDir = "left";
    game.hitStarted = 0;
    game.respawnAt = 0;
    statusText.textContent = "Back in the maze — your combo is reset.";
  }

  function update(dt) {
    if (game.paused) return;
    game.elapsed += dt;
    updatePlayer(dt);
    updateGhosts(dt);
    if (game.feedback && game.elapsed >= game.feedback.until) game.feedback = null;
    updateUI();
  }

  function draw() {
    const scaleX = canvas.width / (COLS * TILE);
    const scaleY = canvas.height / (ROWS * TILE);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
    ctx.fillStyle = "#05050d";
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
    drawMaze();
    drawPowerPellets();
    drawTargets();
    drawPlayer();
    ghosts.forEach(drawGhost);
  }

  function drawMaze() {
    const wallInset = 1;
    ctx.fillStyle = "#161448";
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] === "#") ctx.fillRect(x * TILE + wallInset, y * TILE + wallInset, TILE - wallInset * 2, TILE - wallInset * 2);
    ctx.strokeStyle = "#4b52db"; ctx.lineWidth = 1.5;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] === "#") {
      const px = x * TILE, py = y * TILE;
      if (isOpen(x + 1, y)) { ctx.beginPath(); ctx.moveTo(px + TILE - wallInset, py + wallInset); ctx.lineTo(px + TILE - wallInset, py + TILE - wallInset); ctx.stroke(); }
      if (isOpen(x, y + 1)) { ctx.beginPath(); ctx.moveTo(px + wallInset, py + TILE - wallInset); ctx.lineTo(px + TILE - wallInset, py + TILE - wallInset); ctx.stroke(); }
    }
  }

  function drawTargets() {
    game.targets.forEach((target, index) => {
      const x = (target.x + .5) * TILE;
      const y = (target.y + .5) * TILE;
      const state = target.state;
      const floatOffset = settings.reducedMotion ? 0 : Math.sin(game.elapsed * 2.4 + index * 1.7) * 2.2;
      const tilt = settings.reducedMotion ? 0 : Math.sin(game.elapsed * 1.8 + index) * .045;
      const blinking = game.feedback && state === "normal" && !settings.reducedMotion;
      ctx.save();
      ctx.translate(x, y + floatOffset);
      ctx.rotate(tilt);
      if (blinking) ctx.globalAlpha = .3 + (.7 * (Math.sin(game.elapsed * Math.PI * 1.2) + 1) / 2);
      if (state === "correct") { ctx.shadowBlur = 20; ctx.shadowColor = "#48e49a"; ctx.fillStyle = "#48e49a"; }
      else if (state === "wrong") { ctx.shadowBlur = 20; ctx.shadowColor = "#ff6577"; ctx.fillStyle = "#ff6577"; }
      else if (game.feedback) { ctx.shadowBlur = 12; ctx.shadowColor = "#fff"; ctx.fillStyle = "#fff"; }
    else { ctx.shadowBlur = 12; ctx.shadowColor = "#ffad4d"; ctx.fillStyle = "#ffad4d"; }
      ctx.font = `900 ${target.value >= 100 ? 11 : 15}px system-ui`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(target.value), 0, 0);
      ctx.restore();
    });
  }

  function drawPowerPellets() {
    game.powerPellets.forEach((pellet) => {
      if (!pellet.active) return;
      const x = (pellet.x + .5) * TILE, y = (pellet.y + .5) * TILE;
      ctx.save(); ctx.fillStyle = "#fff"; ctx.shadowBlur = 14; ctx.shadowColor = "#fff";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }

  function drawPlayer() {
    const hitAnimating = game.respawnAt > game.elapsed;
    const hitTime = hitAnimating ? game.elapsed - game.hitStarted : 0;
    const x = (player.x + (hitAnimating ? Math.sin(hitTime * 52) * .12 : 0)) * TILE;
    const y = (player.y + (hitAnimating ? Math.cos(hitTime * 46) * .06 : 0)) * TILE;
    const radius = TILE * .43;
    const mouth = settings.reducedMotion ? .16 : Math.abs(Math.sin(player.mouth)) * .25;
    ctx.save();
    ctx.translate(x, y);
    if (hitAnimating) ctx.rotate(Math.sin(hitTime * 48) * .18);
    ctx.fillStyle = "#ffd84d"; ctx.shadowBlur = 12; ctx.shadowColor = "#ffd84d";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, DIRECTIONS[player.dir].angle + mouth, DIRECTIONS[player.dir].angle - mouth + Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawGhost(ghost) {
    if (ghost.phase > 0) return;
    const x = ghost.x * TILE, y = ghost.y * TILE, r = TILE * .4;
    ctx.save();
    if (ghost.state === "frightened") ctx.fillStyle = game.frightenedUntil - game.elapsed < 2 && !settings.reducedMotion ? (Math.floor(game.elapsed * 8) % 2 ? "#f7f4ff" : "#3158db") : "#3158db";
    else if (ghost.state === "eyes") ctx.fillStyle = "#4b52db";
    else ctx.fillStyle = ghost.color;
    ctx.beginPath(); ctx.arc(x, y - 2, r, Math.PI, 0); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r * .5, y + r * .65); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .5, y + r * .65); ctx.lineTo(x - r, y + r); ctx.closePath(); ctx.fill();
    if (ghost.state !== "eyes") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 5, y - 3, 3.5, 0, Math.PI * 2); ctx.arc(x + 5, y - 3, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#161448"; ctx.beginPath(); ctx.arc(x - 4, y - 3, 1.7, 0, Math.PI * 2); ctx.arc(x + 6, y - 3, 1.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function updateUI() {
    scoreEl.textContent = String(game.score);
    comboEl.textContent = String(game.combo);
    bestScoreEl.textContent = String(game.best);
    pauseOverlay.hidden = !game.paused;
    if (game.feedback) {
      const remaining = Math.max(0, game.feedback.until - game.elapsed);
      const progress = clamp(remaining / settings.feedbackDuration, 0, 1);
      questionCountdown.hidden = false;
      questionPanel.classList.add("with-countdown");
      countdownValue.textContent = String(Math.ceil(remaining));
      countdownRing.style.setProperty("--progress", `${progress * 100}%`);
      questionCountdown.setAttribute("aria-label", `Next question in ${Math.ceil(remaining)} seconds`);
    } else {
      questionCountdown.hidden = true;
      questionPanel.classList.remove("with-countdown");
    }
  }

  function togglePause(force) {
    game.paused = typeof force === "boolean" ? force : !game.paused;
    updateUI();
    statusText.textContent = game.paused ? "Game paused." : "Choose a direction to continue.";
  }

  function startNewSession() {
    game.score = 0; game.combo = 0; game.paused = false; game.started = false; game.frightenedUntil = 0; game.hitStarted = 0; game.respawnAt = 0; game.modeElapsed = 0; game.elapsed = 0; game.powerPellets.forEach((pellet) => pellet.active = true);
    nextQuestion();
    statusText.textContent = "Choose a direction to begin.";
    updateUI();
  }

  function populateSettings() {
    minFactorInput.value = settings.minFactor; maxFactorInput.value = settings.maxFactor; distractorCountInput.value = settings.distractorCount; feedbackInput.value = settings.feedbackDuration; reducedMotionInput.checked = settings.reducedMotion;
  }

  function openSettings(open) {
    settingsButton.setAttribute("aria-expanded", String(open));
    if (open) {
      pauseForModal();
      populateSettings();
      if (typeof settingsDialog.showModal === "function") settingsDialog.showModal();
      else settingsDialog.hidden = false;
      minFactorInput.focus();
    } else if (settingsDialog.open && typeof settingsDialog.close === "function") settingsDialog.close();
    else { settingsDialog.hidden = true; restoreModalPause(); }
  }

  function openInstructions(open) {
    if (open) {
      pauseForModal();
      if (typeof instructionsDialog.showModal === "function") instructionsDialog.showModal();
      else instructionsDialog.hidden = false;
      closeInstructions.focus();
    } else if (instructionsDialog.open && typeof instructionsDialog.close === "function") instructionsDialog.close();
    else { instructionsDialog.hidden = true; restoreModalPause(); }
  }

  function pauseForModal() {
    if (modalPauseBeforeOpen === null) modalPauseBeforeOpen = game.paused;
    game.paused = true;
    updateUI();
    statusText.textContent = "Game paused while this window is open.";
  }

  function restoreModalPause() {
    if (modalPauseBeforeOpen === null) return;
    game.paused = modalPauseBeforeOpen;
    modalPauseBeforeOpen = null;
    updateUI();
    statusText.textContent = game.paused ? "Game paused." : "Choose a direction to continue.";
  }

  function saveForm(event) {
    event.preventDefault();
    const min = clamp(Math.round(Number(minFactorInput.value) || 2), 1, 20);
    const max = clamp(Math.round(Number(maxFactorInput.value) || 12), min, 20);
    settings.minFactor = min; settings.maxFactor = max; settings.distractorCount = clamp(Math.round(Number(distractorCountInput.value) || 8), 1, 8); settings.feedbackDuration = clamp(Number(feedbackInput.value) || 2, 1, 8); settings.reducedMotion = reducedMotionInput.checked;
    saveSettings(); openSettings(false); nextQuestion(); statusText.textContent = "Settings saved.";
  }

  function handleKey(event) {
    const directionKeys = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down" };
    if (directionKeys[event.key]) { event.preventDefault(); setDirection(directionKeys[event.key]); }
    else if (event.key.toLowerCase() === "p") { event.preventDefault(); togglePause(); }
  }

  function handleTouchStart(event) { const touch = event.changedTouches[0]; game.touchStart = { x: touch.clientX, y: touch.clientY }; }
  function handleTouchEnd(event) {
    if (!game.touchStart) return;
    const touch = event.changedTouches[0]; const dx = touch.clientX - game.touchStart.x; const dy = touch.clientY - game.touchStart.y; game.touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
  }

  function loop(now) {
    const dt = Math.min(.05, (now - game.lastFrame) / 1000); game.lastFrame = now;
    update(dt); draw(); requestAnimationFrame(loop);
  }

  document.addEventListener("keydown", handleKey);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
  restartButton.addEventListener("click", startNewSession);
  instructionsButton.addEventListener("click", () => openInstructions(true));
  settingsButton.addEventListener("click", () => openSettings(!settingsDialog.open));
  closeSettings.addEventListener("click", () => openSettings(false));
  closeInstructions.addEventListener("click", () => openInstructions(false));
  settingsDialog.addEventListener("close", () => { settingsButton.setAttribute("aria-expanded", "false"); restoreModalPause(); });
  instructionsDialog.addEventListener("close", restoreModalPause);
  settingsForm.addEventListener("submit", saveForm);

  bestScoreEl.textContent = String(game.best);
  nextQuestion();
  requestAnimationFrame(loop);
})();
