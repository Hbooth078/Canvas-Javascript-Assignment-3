const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Load background image
const background = new Image();
background.src = "Tv Wallpaper.jpg";

// Game state
let phase = "waiting";
let lastTimestamp;
let heroX;
let heroY;
let sceneOffset;
let platforms = [];
let sticks = [];
let trees = [];
let score = 0;

// Constants
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;
const perfectAreaSize = 10;
const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;
const heroWidth = 17;
const heroHeight = 30;

// DOM elements
const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Utilities
Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game setup
function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  trees = [];
  for (let i = 0; i < 10; i++) generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generatePlatform() {
  const minGap = 40;
  const maxGap = 200;
  const minWidth = 20;
  const maxWidth = 100;

  const lastPlatform = platforms[platforms.length - 1];
  const x = lastPlatform.x + lastPlatform.w + minGap + Math.random() * (maxGap - minGap);
  const w = minWidth + Math.random() * (maxWidth - minWidth);
  platforms.push({ x, w });
}

function generateTree() {
  const minGap = 30;
  const maxGap = 150;
  const lastTree = trees.last();
  const furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minGap + Math.random() * (maxGap - minGap);
  const colors = ["#6D8821", "#8E44AD", "#9B59B6"]; // purple tones
  const color = colors[Math.floor(Math.random() * colors.length)];
  trees.push({ x, color });
}

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  drawPlatforms();
  drawHero();
  drawSticks();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "black";
    ctx.fillRect(x - sceneOffset, canvasHeight - platformHeight, w, platformHeight);
    if (sticks.last().x < x) {
      ctx.fillStyle = "red";
      ctx.fillRect(x + w / 2 - perfectAreaSize / 2 - sceneOffset, canvasHeight - platformHeight, perfectAreaSize, perfectAreaSize);
    }
  });
}

function drawHero() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.translate(heroX - sceneOffset, canvasHeight - platformHeight - heroHeight);
  ctx.fillRect(-heroWidth / 2, 0, heroWidth, heroHeight);
  ctx.restore();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x - sceneOffset, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();
    ctx.restore();
  });
}

// Animation
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
    return;
  }

  const timePassed = timestamp - lastTimestamp;

  switch (phase) {
    case "stretching":
      sticks.last().length += timePassed / stretchingSpeed;
      break;
    case "turning":
      sticks.last().rotation += timePassed / turningSpeed;
      if (sticks.last().rotation >= 90) {
        sticks.last().rotation = 90;
        phase = "walking";
      }
      break;
    case "walking":
      heroX += timePassed / walkingSpeed;
      const stick = sticks.last();
      const stickEndX = stick.x + stick.length;
      const nextPlatform = platforms[1];
      if (heroX > stickEndX) {
        if (stickEndX >= nextPlatform.x && stickEndX <= nextPlatform.x + nextPlatform.w) {
          phase = "transitioning";
          score++;
          scoreElement.innerText = score;
        } else {
          phase = "falling";
        }
      }
      break;
    case "transitioning":
      sceneOffset += timePassed / transitioningSpeed;
      if (sceneOffset >= platforms[1].x - platforms[0].x) {
        sceneOffset = 0;
        platforms.shift();
        generatePlatform();
        sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
        heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
        phase = "waiting";
      }
      break;
    case "falling":
      heroY += timePassed / fallingSpeed;
      if (heroY > canvasHeight) {
        restartButton.style.display = "block";
      }
      break;
  }

  draw();
  lastTimestamp = timestamp;
  requestAnimationFrame(animate);
}

// Events
window.addEventListener("mousedown", () => {
  if (phase === "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", () => {
  if (phase === "stretching") {
    phase = "turning";
  }
});

restartButton.addEventListener("click", () => {
  resetGame();
  restartButton.style.display = "none";
});

// Start game after background loads
background.onload = () => {
  resetGame();
};
