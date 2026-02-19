const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- 定数 ---
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 24;

const BRICK_COLORS = ["#e94560", "#f5a623", "#f8e71c", "#7ed321", "#4a90e2"];

// --- ゲーム状態 ---
let paddle, balls, bricks, score, lives, gameState;

function createBall() {
  return {
    x: canvas.width / 2,
    y: canvas.height - 50,
    dx: 3,
    dy: -3,
    radius: BALL_RADIUS,
  };
}

function init() {
  paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 6,
  };

  balls = [createBall()];

  bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    bricks[row] = [];
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks[row][col] = { alive: true };
    }
  }

  score = 0;
  lives = 3;
  gameState = "playing"; // "playing" | "clear" | "gameover"
}

// --- 入力 ---
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if ((e.key === "Enter" || e.key === " ") && gameState !== "playing") init();
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = mouseX - paddle.width / 2;
  clampPaddle();
});

function clampPaddle() {
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width)
    paddle.x = canvas.width - paddle.width;
}

// --- 更新 ---
function update() {
  if (gameState !== "playing") return;

  // パドル移動
  if (keys["ArrowLeft"]) paddle.x -= paddle.speed;
  if (keys["ArrowRight"]) paddle.x += paddle.speed;
  clampPaddle();

  // ボール処理
  const survivedBalls = [];
  let shouldDouble = false;

  for (const ball of balls) {
    // ボール移動
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 壁との衝突（左右・上）
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width)
      ball.dx *= -1;
    if (ball.y - ball.radius < 0) ball.dy *= -1;

    // 下に落ちた → このボールを除去
    if (ball.y + ball.radius > canvas.height) continue;

    // パドルとの衝突
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      const hitPos = (ball.x - paddle.x) / paddle.width; // 0.0 〜 1.0
      const angle = (hitPos - 0.5) * Math.PI * 0.75;
      const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -Math.abs(speed * Math.cos(angle));
    }

    // ブロックとの衝突
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const brick = bricks[row][col];
        if (!brick.alive) continue;

        const bx = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING);
        const by = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);

        if (
          ball.x + ball.radius > bx &&
          ball.x - ball.radius < bx + BRICK_WIDTH &&
          ball.y + ball.radius > by &&
          ball.y - ball.radius < by + BRICK_HEIGHT
        ) {
          brick.alive = false;
          ball.dy *= -1;
          score += 10;

          // 青いブロックを崩したらボールを倍増
          if (BRICK_COLORS[row % BRICK_COLORS.length] === "#4a90e2") {
            shouldDouble = true;
          }
        }
      }
    }

    survivedBalls.push(ball);
  }

  // 全ボールが落ちた
  if (survivedBalls.length === 0) {
    lives--;
    if (lives <= 0) {
      gameState = "gameover";
    } else {
      balls = [createBall()];
    }
    return;
  }

  // 青いブロック破壊時にボール倍増
  if (shouldDouble) {
    const copies = survivedBalls.map((b) => ({ ...b, dx: -b.dx }));
    balls = [...survivedBalls, ...copies];
  } else {
    balls = survivedBalls;
  }

  // クリア判定
  let allClear = true;
  outer: for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (bricks[row][col].alive) { allClear = false; break outer; }
    }
  }

  if (allClear) gameState = "clear";
}

// --- 描画 ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ブロック
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (!bricks[row][col].alive) continue;
      const bx = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING);
      const by = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);
      ctx.fillStyle = BRICK_COLORS[row % BRICK_COLORS.length];
      ctx.beginPath();
      ctx.roundRect(bx, by, BRICK_WIDTH, BRICK_HEIGHT, 3);
      ctx.fill();
    }
  }

  // パドル
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
  ctx.fill();

  // ボール
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#fff";
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // スコア・ライフ
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`スコア: ${score}`, 10, 20);
  ctx.fillText(`残機: ${"♥".repeat(lives)}`, canvas.width - 100, 20);

  // ゲームオーバー / クリア
  if (gameState !== "playing") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = gameState === "clear" ? "#7ed321" : "#e94560";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      gameState === "clear" ? "CLEAR!" : "GAME OVER",
      canvas.width / 2,
      canvas.height / 2 - 20
    );

    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText(
      `スコア: ${score}  /  Enter か Space でリスタート`,
      canvas.width / 2,
      canvas.height / 2 + 20
    );
    ctx.textAlign = "left";
  }
}

// --- ゲームループ ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

init();
loop();
