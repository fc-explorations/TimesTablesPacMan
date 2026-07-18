(() => {
  "use strict";

  const canvas = document.querySelector("#game-canvas");
  const ctx = canvas.getContext("2d");
  const questionText = document.querySelector("#question-text");
  const feedbackText = document.querySelector("#feedback-text");
  const statusText = document.querySelector("#status-text");
  const statusPill = document.querySelector("#status-pill");
  const scoreEl = document.querySelector("#score");
  const comboEl = document.querySelector("#combo");
  const bestScoreEl = document.querySelector("#best-score");
  const pauseOverlay = document.querySelector("#pause-overlay");
  const pauseButton = document.querySelector("#pause-button");
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
  const ROWS = 31;
  const DIRECTIONS = {
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 },
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 }
  };
  const OPPOSITE = { left: "right", right: "left", up: "down", down: "up" };
  const STORAGE_KEY = "times-table-pacman-settings";

  const settings = loadSettings();
  const maze = createMaze();
  const spawn = { x: 13.5, y: 23.5 };
  const ghostHome = { x: 13.5, y: 15.5 };
  const scatterCorners = [{ x: 1, y: 1 }, { x: 26, y: 1 }, { x: 1, y: 29 }, { x: 26, y: 29 }];
  const powerPelletSpots = [{ x: 1, y: 3 }, { x: 26, y: 3 }, { x: 1, y: 27 }, { x: 26, y: 27 }];
  const openTiles = getOpenTiles();

  const game = {
    score: 0,
    combo: 0,
    best: Number(localStorage.getItem("times-table-pacman-best") || 0),
    paused: false,
    started: false,
    feedback: null,
    revealAnswer: null,
    question: null,
    targets: [],
    powerPellets: powerPelletSpots.map((spot) => ({ ...spot, kind: "pellet", active: true })),
    frightenedUntil: 0,
    mode: "scatter",
    modeElapsed: 0,
    elapsed: 0,
    lastFrame: performance.now(),
    touchStart: null
  };

  const player = makePlayer();
  const ghosts = [
    makeGhost("Blinky", "#f34c5e", 13.5, 14.5, "left", 0),
    makeGhost("Pinky", "#ff9ed1", 13.5, 15.5, "up", 1.8),
    makeGhost("Inky", "#43d8e8", 12.5, 15.5, "up", 3.6),
    makeGhost("Clyde", "#ffad4d", 14.5, 15.5, "down", 5.4)
  ];

  function defaultSettings() {
    return { minFactor: 2, maxFactor: 12, distractorCount: 4, feedbackDuration: 3, reducedMotion: false };
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

  function createMaze() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("#"));
    const carve = (x, y, width, height) => {
      for (let row = y; row < y + height; row++) for (let col = x; col < x + width; col++) grid[row][col] = ".";
    };
    carve(1, 1, 26, 29);
    const wall = (x, y, width, height) => {
      for (let row = y; row < y + height; row++) for (let col = x; col < x + width; col++) grid[row][col] = "#";
    };
    wall(2, 2, 5, 3); wall(21, 2, 5, 3);
    wall(9, 2, 3, 3); wall(16, 2, 3, 3);
    wall(2, 7, 5, 2); wall(21, 7, 5, 2);
    wall(9, 7, 3, 5); wall(16, 7, 3, 5);
    wall(2, 13, 5, 2); wall(21, 13, 5, 2);
    wall(9, 13, 10, 2);
    wall(2, 18, 5, 2); wall(21, 18, 5, 2);
    wall(9, 18, 3, 5); wall(16, 18, 3, 5);
    wall(2, 25, 5, 2); wall(21, 25, 5, 2);
    wall(9, 26, 3, 3); wall(16, 26, 3, 3);
    carve(12, 13, 4, 5);
    carve(13, 14, 2, 4);
    grid[15][0] = "."; grid[15][27] = ".";
    // A few doors keep the center and side lanes connected while retaining the maze silhouette.
    [[7, 8], [20, 8], [7, 19], [20, 19], [7, 26], [20, 26], [8, 14], [19, 14]].forEach(([x, y]) => { grid[y][x] = "."; });
    return grid;
  }

  function getOpenTiles() {
    const tiles = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] !== "#") tiles.push({ x, y });
    return tiles.filter((tile) => Math.hypot(tile.x + .5 - spawn.x, tile.y + .5 - spawn.y) > 4 && Math.hypot(tile.x + .5 - ghostHome.x, tile.y + .5 - ghostHome.y) > 2);
  }

  function makePlayer() {
    return { x: spawn.x, y: spawn.y, dir: "left", nextDir: "left", speed: 5.2, mouth: 0 };
  }

  function makeGhost(name, color, x, y, dir, delay) {
    return { name, color, x, y, homeX: x, homeY: y, dir, speed: 3.75, delay, state: "scatter", eaten: false, phase: delay, destination: null };
  }

  function isOpen(x, y) {
    if (y < 0 || y >= ROWS) return false;
    const wrappedX = (x + COLS) % COLS;
    return maze[y][wrappedX] !== "#";
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
    const targetCount = clamp(Math.round(Number(settings.distractorCount) || 4) + 1, 2, 9);
    for (const value of candidates) if (values.size < targetCount) values.add(value);
    const positions = openTiles.filter((tile) => !powerPelletSpots.some((pellet) => pellet.x === tile.x && pellet.y === tile.y)).sort(() => Math.random() - .5).slice(0, values.size);
    return [...values].map((value, index) => ({ ...positions[index], value, correct: value === question.answer, state: "normal" }));
  }

  function nextQuestion() {
    game.question = getQuestion();
    game.targets = makeTargets(game.question);
    questionText.textContent = game.question.text;
    feedbackText.textContent = "";
    feedbackText.className = "feedback";
    game.feedback = null;
    game.revealAnswer = null;
    updateUI();
  }

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function setDirection(direction) {
    if (!DIRECTIONS[direction]) return;
    player.nextDir = direction;
    if (game.paused) togglePause(false);
    game.started = true;
  }

  function updatePlayer(dt) {
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
      setFeedback(`Correct! ${target.value} is the answer.`, "good");
    } else {
      target.state = "wrong";
      game.score = Math.max(0, game.score - 25);
      game.combo = 0;
      game.revealAnswer = { value: game.question.answer, until: game.elapsed + settings.feedbackDuration };
      setFeedback(`Not quite: ${target.value} is wrong. The answer is ${game.question.answer}.`, "bad");
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

  function setFeedback(text, type) {
    game.feedback = { text, type, until: game.elapsed + settings.feedbackDuration };
    feedbackText.textContent = text;
    feedbackText.className = `feedback ${type}`;
    statusText.textContent = type === "good" ? "Great work — next question soon." : "Keep going — try the next one.";
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
      ghost.state = ghost.eaten ? "eyes" : frightened ? "frightened" : game.mode;
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
      if (ghost.state === "eyes" && distance(ghost, ghostHome) < .25) { ghost.eaten = false; ghost.state = game.mode; }
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
    player.x = spawn.x; player.y = spawn.y; player.dir = "left"; player.nextDir = "left";
    game.combo = 0;
    statusText.textContent = "A ghost caught you — your combo is reset.";
    updateUI();
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
    drawRevealAnswer();
    drawPlayer();
    ghosts.forEach(drawGhost);
    if (game.frightenedUntil > game.elapsed) drawFrightenedTimer();
  }

  function drawMaze() {
    ctx.fillStyle = "#161448";
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] === "#") ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.strokeStyle = "#4b52db"; ctx.lineWidth = 1.5;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] === "#") {
      const px = x * TILE, py = y * TILE;
      if (isOpen(x + 1, y)) { ctx.beginPath(); ctx.moveTo(px + TILE, py + 2); ctx.lineTo(px + TILE, py + TILE - 2); ctx.stroke(); }
      if (isOpen(x, y + 1)) { ctx.beginPath(); ctx.moveTo(px + 2, py + TILE); ctx.lineTo(px + TILE - 2, py + TILE); ctx.stroke(); }
    }
  }

  function drawTargets() {
    game.targets.forEach((target) => {
      const x = (target.x + .5) * TILE, y = (target.y + .5) * TILE;
      const state = target.state;
      ctx.save();
      if (state === "correct") { ctx.shadowBlur = 20; ctx.shadowColor = "#48e49a"; ctx.fillStyle = "#48e49a"; }
      else if (state === "wrong") { ctx.shadowBlur = 20; ctx.shadowColor = "#ff6577"; ctx.fillStyle = "#ff6577"; }
      else { ctx.fillStyle = "#ffd84d"; }
      ctx.beginPath(); ctx.arc(x, y, TILE * .42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#121225";
      ctx.font = `900 ${target.value >= 100 ? 10 : 13}px system-ui`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(target.value), x, y + .5);
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

  function drawRevealAnswer() {
    if (!game.revealAnswer || game.revealAnswer.until <= game.elapsed) return;
    const x = COLS * TILE / 2;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#fff";
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ANSWER: ${game.revealAnswer.value}`, x, TILE * 15.5);
    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x * TILE, y = player.y * TILE, radius = TILE * .43;
    const mouth = settings.reducedMotion ? .16 : Math.abs(Math.sin(player.mouth)) * .25;
    ctx.save(); ctx.fillStyle = "#ffd84d"; ctx.shadowBlur = 12; ctx.shadowColor = "#ffd84d";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, radius, DIRECTIONS[player.dir].angle + mouth, DIRECTIONS[player.dir].angle - mouth + Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.restore();
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

  function drawFrightenedTimer() {
    const remaining = game.frightenedUntil - game.elapsed;
    ctx.save(); ctx.fillStyle = "#cdd1ff"; ctx.font = "700 10px system-ui"; ctx.textAlign = "center"; ctx.fillText(`POWER ${remaining.toFixed(1)}s`, canvas.width / (canvas.width / (COLS * TILE)) / 2, 12); ctx.restore();
  }

  function updateUI() {
    scoreEl.textContent = String(game.score);
    comboEl.textContent = String(game.combo);
    bestScoreEl.textContent = String(game.best);
    statusPill.textContent = game.paused ? "Paused" : "Playing";
    statusPill.className = `status-pill${game.paused ? " paused" : ""}`;
    pauseButton.textContent = game.paused ? "Resume" : "Pause";
    pauseOverlay.hidden = !game.paused;
  }

  function togglePause(force) {
    game.paused = typeof force === "boolean" ? force : !game.paused;
    updateUI();
    statusText.textContent = game.paused ? "Game paused." : "Choose a direction to continue.";
  }

  function startNewSession() {
    game.score = 0; game.combo = 0; game.paused = false; game.started = false; game.frightenedUntil = 0; game.modeElapsed = 0; game.elapsed = 0; game.powerPellets.forEach((pellet) => pellet.active = true);
    Object.assign(player, makePlayer());
    ghosts.forEach((ghost) => Object.assign(ghost, makeGhost(ghost.name, ghost.color, ghost.homeX, ghost.homeY, "left", ghost.delay)));
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
      populateSettings();
      if (typeof settingsDialog.showModal === "function") settingsDialog.showModal();
      else settingsDialog.hidden = false;
      minFactorInput.focus();
    } else if (settingsDialog.open && typeof settingsDialog.close === "function") settingsDialog.close();
    else settingsDialog.hidden = true;
  }

  function openInstructions(open) {
    if (open) {
      if (typeof instructionsDialog.showModal === "function") instructionsDialog.showModal();
      else instructionsDialog.hidden = false;
      closeInstructions.focus();
    } else if (instructionsDialog.open && typeof instructionsDialog.close === "function") instructionsDialog.close();
    else instructionsDialog.hidden = true;
  }

  function saveForm(event) {
    event.preventDefault();
    const min = clamp(Math.round(Number(minFactorInput.value) || 2), 1, 20);
    const max = clamp(Math.round(Number(maxFactorInput.value) || 12), min, 20);
    settings.minFactor = min; settings.maxFactor = max; settings.distractorCount = clamp(Math.round(Number(distractorCountInput.value) || 4), 1, 8); settings.feedbackDuration = clamp(Number(feedbackInput.value) || 3, 1, 8); settings.reducedMotion = reducedMotionInput.checked;
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
  pauseButton.addEventListener("click", () => togglePause());
  restartButton.addEventListener("click", startNewSession);
  instructionsButton.addEventListener("click", () => openInstructions(true));
  settingsButton.addEventListener("click", () => openSettings(!settingsDialog.open));
  closeSettings.addEventListener("click", () => openSettings(false));
  closeInstructions.addEventListener("click", () => openInstructions(false));
  settingsDialog.addEventListener("close", () => settingsButton.setAttribute("aria-expanded", "false"));
  settingsForm.addEventListener("submit", saveForm);

  bestScoreEl.textContent = String(game.best);
  nextQuestion();
  requestAnimationFrame(loop);
})();
