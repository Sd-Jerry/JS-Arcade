/* -------------------------
   CONFIG: prizes + colors
   ------------------------- */
const prizes = [
  "₹200",
  "₹400",
  "₹600",
  "₹800",
  "₹1000",
  "Try Again",
];

const colors = [
  "#ff7043", "#ff8a65", "#ffcc80", "#ffb74d",
  "#ff8a00", "#ff5722", "#ffab91", "#ff6f00"
];

/* -------------------------
   DOM references
   ------------------------- */
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const message = document.getElementById('message');
const popup = document.getElementById('popup');
const popupBody = document.getElementById('popup-body');
const spinAgainBtn = document.getElementById('spinAgainBtn');
const confettiCanvas = document.getElementById('confetti');
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');
const ctx = confettiCanvas.getContext && confettiCanvas.getContext('2d');

/* -------------------------
   Build wheel (fixed labels)
   ------------------------- */
function buildWheel() {
  const n = prizes.length;
  const degPer = 360 / n;

  // Build conic gradient
  let parts = [];
  let start = 0;
  for (let i = 0; i < n; i++) {
    const end = start + degPer;
    parts.push(`${colors[i % colors.length]} ${start}deg ${end}deg`);
    start = end;
  }
  wheel.style.background = `conic-gradient(from -90deg, ${parts.join(', ')})`;

  // Clear old labels
  wheel.querySelectorAll('.label').forEach(el => el.remove());

  // Calculate correct label placement
  const radius = Math.min(wheel.clientWidth, wheel.clientHeight) / 2;
  const labelRadius = radius * 0.8;

  for (let i = 0; i < n; i++) {
    const centerAngle = i * degPer + degPer / 2;
    const correctedAngle = centerAngle - 90; 
    const rad = correctedAngle * Math.PI / 180;

    const x = radius + labelRadius * Math.cos(rad);
    const y = radius + labelRadius * Math.sin(rad);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = prizes[i];
    const rotationAngle = centerAngle;
    label.style.position = 'absolute';
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
    label.style.fontSize = '15px';
    label.style.fontWeight = '600';
    label.style.color = '#fff';
    label.style.textShadow = '0 2px 6px rgba(0,0,0,0.6)';
    label.style.padding = '4px 8px';
    label.style.borderRadius = '8px';
    label.style.background = 'rgba(0,0,0,0.15)';
    label.style.boxShadow = '0 3px 10px rgba(0,0,0,0.35)';
    label.style.whiteSpace = 'nowrap';
    label.style.pointerEvents = 'none';
    wheel.appendChild(label);
  }
}

/* -------------------------
   Sparkle lights
   ------------------------- */
for (let i = 0; i < 25; i++) {
  const spark = document.createElement("div");
  spark.classList.add("spark");
  spark.style.top = Math.random() * 100 + "%";
  spark.style.left = Math.random() * 100 + "%";
  spark.style.animationDelay = Math.random() * 2 + "s";
  document.body.appendChild(spark);
}

/* -------------------------
   Confetti helpers
   ------------------------- */
let confettiPieces = [];
function resizeCanvas() {
  if (!ctx) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnConfetti() {
  if (!ctx) return;
  confettiPieces = [];
  const count = 100;
  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 4,
      speed: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      color: `hsl(${Math.random() * 360}, 90%, 60%)`,
      rotSpeed: (Math.random() - 0.5) * 6
    });
  }
  requestAnimationFrame(renderConfetti);
  setTimeout(() => confettiPieces = [], 4200);
}

function renderConfetti() {
  if (!ctx) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
    p.y += p.speed;
    p.rot += p.rotSpeed;
    if (p.y > confettiCanvas.height + 30) p.y = -10;
  });
  if (confettiPieces.length) requestAnimationFrame(renderConfetti);
}

/* -------------------------
   Spin logic (fixed)
   ------------------------- */
let currentRotation = 0;
let isSpinning = false;

function spinOnce() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  message.textContent = "Spinning...";

  const n = prizes.length;
  const degPer = 360 / n;

  const spinRounds = Math.floor(Math.random() * 3) + 5;
  const randomOffset = Math.random() * 360;
  const finalRotation = currentRotation + spinRounds * 360 + randomOffset;
  const duration = 4.6;

  wheel.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
  wheel.style.transform = `rotate(${finalRotation}deg)`;

  if (spinSound) {
    try { spinSound.currentTime = 0; spinSound.play(); } catch (e) { }
  }

  setTimeout(() => {
    if (winSound) {
      try { winSound.currentTime = 0; winSound.play(); } catch (e) { }
    }

    const normalized = finalRotation % 360;

    // ✅ FIXED CALCULATION BELOW
    const effectiveAngle = (360 - normalized) % 360;
    const winningIndex = Math.floor(effectiveAngle / degPer);
    const reward = prizes[winningIndex];

    wheel.style.transition = "none";
    wheel.style.transform = `rotate(${normalized}deg)`;
    void wheel.offsetWidth;

    currentRotation = normalized;
    isSpinning = false;
    spinBtn.disabled = false;

    if (reward.toLowerCase().includes("try again")) {
      message.textContent = "😅 Try Again Next Time!";
    } else {
      message.textContent = `🎉 You won: ${reward}!`;
      popupBody.textContent = `Congratulations! You won ${reward}!`;
      popup.classList.add("show");
      spawnConfetti();
    }
  }, Math.round(duration * 1000) + 60);
}

/* -------------------------
   Event wiring
   ------------------------- */
buildWheel();
spinBtn.addEventListener('click', spinOnce);
spinAgainBtn.addEventListener('click', () => {
  popup.classList.remove('show');
  message.textContent = 'Good luck — spin again!';
});
try { spinSound.load(); winSound.load(); } catch (e) { }