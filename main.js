const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreboardEl = document.getElementById('scoreboard');
const toggleBtn = document.getElementById('toggle');
const resetBtn = document.getElementById('reset');

const COURT = { width: canvas.width, height: canvas.height, padding: 26 };
const TARGET_SCORE = 7;

const assets = {
  ball: createImage('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'),
  left: createImage('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'), // Pikachu
  right: createImage('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png'), // Charizard
};

const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

const paddleSize = { width: 60, height: 120 };
const paddles = {
  left: { x: COURT.padding, y: COURT.height / 2 - paddleSize.height / 2, speed: 340 },
  right: {
    x: COURT.width - COURT.padding - paddleSize.width,
    y: COURT.height / 2 - paddleSize.height / 2,
    speed: 340,
  },
};

const ball = {
  x: COURT.width / 2,
  y: COURT.height / 2,
  dx: 0,
  dy: 0,
  speed: 260,
  size: 24,
};

let playing = false;
let lastTime = 0;
const score = { left: 0, right: 0 };

function createImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function serveBall() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI / 2; // Slightly up or down
  const speed = 280 + Math.random() * 40;
  ball.dx = Math.cos(angle) * speed * direction;
  ball.dy = Math.sin(angle) * speed;
  ball.x = COURT.width / 2;
  ball.y = COURT.height / 2;
}

function updateScoreboard() {
  scoreboardEl.textContent = `${score.left} ❖ ${score.right}`;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function resetGame(fullReset = false) {
  ball.speed = 260;
  serveBall();
  playing = !fullReset;
  if (fullReset) {
    score.left = 0;
    score.right = 0;
    setStatus('Scores cleared. Press Start to play!');
    toggleBtn.textContent = 'Start';
  }
  updateScoreboard();
}

function handleInput(delta) {
  if (keys.w) paddles.left.y -= paddles.left.speed * delta;
  if (keys.s) paddles.left.y += paddles.left.speed * delta;
  if (keys.ArrowUp) paddles.right.y -= paddles.right.speed * delta;
  if (keys.ArrowDown) paddles.right.y += paddles.right.speed * delta;

  paddles.left.y = clamp(paddles.left.y, COURT.padding, COURT.height - paddleSize.height - COURT.padding);
  paddles.right.y = clamp(
    paddles.right.y,
    COURT.padding,
    COURT.height - paddleSize.height - COURT.padding
  );
}

function updateBall(delta) {
  ball.x += ball.dx * delta;
  ball.y += ball.dy * delta;

  if (ball.y <= COURT.padding || ball.y + ball.size >= COURT.height - COURT.padding) {
    ball.dy *= -1;
    ball.y = clamp(ball.y, COURT.padding + 1, COURT.height - ball.size - COURT.padding - 1);
  }

  const collisionZone = (paddle) => ({
    x: paddle.x,
    y: paddle.y,
    width: paddleSize.width,
    height: paddleSize.height,
  });

  if (intersects(ball, collisionZone(paddles.left)) && ball.dx < 0) {
    bounceFromPaddle(paddles.left);
  }

  if (intersects(ball, collisionZone(paddles.right)) && ball.dx > 0) {
    bounceFromPaddle(paddles.right);
  }

  if (ball.x + ball.size < 0) {
    score.right += 1;
    pointOver('Charizard scores!');
  } else if (ball.x > COURT.width) {
    score.left += 1;
    pointOver('Pikachu scores!');
  }
}

function bounceFromPaddle(paddle) {
  const hitPos = (ball.y + ball.size / 2) - (paddle.y + paddleSize.height / 2);
  const normalized = hitPos / (paddleSize.height / 2);
  const angle = normalized * 0.8; // Stronger angles near edges
  const speedBoost = 12;

  const speed = Math.hypot(ball.dx, ball.dy) + speedBoost;
  const direction = ball.dx > 0 ? -1 : 1;
  ball.dx = Math.cos(angle) * speed * direction;
  ball.dy = Math.sin(angle) * speed;
}

function pointOver(message) {
  updateScoreboard();
  if (score.left >= TARGET_SCORE || score.right >= TARGET_SCORE) {
    playing = false;
    toggleBtn.textContent = 'Start';
    setStatus(`${message} Victory! Press Start for a rematch.`);
  } else {
    setStatus(`${message} Rally again!`);
    serveBall();
  }
}

function intersects(circle, rect) {
  const distX = Math.abs(circle.x + circle.size / 2 - (rect.x + rect.width / 2));
  const distY = Math.abs(circle.y + circle.size / 2 - (rect.y + rect.height / 2));

  if (distX > rect.width / 2 + circle.size / 2) return false;
  if (distY > rect.height / 2 + circle.size / 2) return false;
  return true;
}

function drawCourt() {
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(COURT.width / 2 - 2, COURT.padding, 4, COURT.height - COURT.padding * 2);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(COURT.padding, COURT.padding, COURT.width - COURT.padding * 2, COURT.height - COURT.padding * 2);
}

function drawPaddle(paddle, sprite) {
  ctx.save();
  ctx.shadowColor = '#f04a5d';
  ctx.shadowBlur = 16;
  ctx.drawImage(sprite, paddle.x, paddle.y, paddleSize.width, paddleSize.height);
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.shadowColor = '#fddc5c';
  ctx.shadowBlur = 12;
  ctx.drawImage(assets.ball, ball.x, ball.y, ball.size, ball.size);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, COURT.width, COURT.height);
  drawCourt();
  drawPaddle(paddles.left, assets.left);
  drawPaddle(paddles.right, assets.right);
  drawBall();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (playing) {
    handleInput(delta);
    updateBall(delta);
  }
  render();
  requestAnimationFrame(loop);
}

function allAssetsLoaded() {
  const entries = Object.entries(assets);
  return Promise.all(
    entries.map(([key, img]) => new Promise((resolve, reject) => {
      if (img.complete) return resolve(key);
      img.onload = () => resolve(key);
      img.onerror = reject;
    }))
  );
}

function setupControls() {
  window.addEventListener('keydown', (event) => {
    if (event.key in keys) keys[event.key] = true;
  });

  window.addEventListener('keyup', (event) => {
    if (event.key in keys) keys[event.key] = false;
  });

  toggleBtn.addEventListener('click', () => {
    playing = !playing;
    toggleBtn.textContent = playing ? 'Pause' : 'Start';
    if (playing && ball.dx === 0 && ball.dy === 0) {
      serveBall();
    }
    setStatus(playing ? 'Battle on! Keep the Poké Ball moving.' : 'Game paused.');
  });

  resetBtn.addEventListener('click', () => {
    resetGame(true);
  });
}

allAssetsLoaded()
  .then(() => {
    setupControls();
    resetGame(true);
    requestAnimationFrame(loop);
  })
  .catch(() => {
    setStatus('Failed to load sprites. Check your connection and refresh.');
  });
