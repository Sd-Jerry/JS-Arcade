// --- DOM Elements ---
const wheel = document.querySelector(".wheel");
const spinBtn = document.querySelector(".spinBtn");
const arrow = document.querySelector(".arrow");
const toast = document.getElementById("toast");
const prizeText = document.getElementById("prizeText");
const spinAgain = document.getElementById("spinAgain");
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas.getContext("2d");
const spinCounterDisplay = document.getElementById("spinCounter");
const cycleStepCounterDisplay = document.getElementById("cycleStepCounter");

// --- State Variables ---
let value = 0;
let isSpinning = false;
let confettiFrame;
let particles = [];
let cycleStep = 0;
let globalSpinCount = 0;

// --- Corrected landing angles for 8 segments ---
// Each segment is 45° apart, so centers are every 45° starting at 22.5°.
// These values make the wheel stop exactly centered on the correct section.
const ALLOWED_LANDING_INFO = {
  "₹200": { segmentIndex: 0, landingAngle: 22.5 },
  "₹300": { segmentIndex: 1, landingAngle: 67.5 },
  "₹400": { segmentIndex: 2, landingAngle: 112.5 },
  "Try Again": { segmentIndex: 7, landingAngle: 337.5 },
};

// --- Prize Pattern Logic ---
function getGuaranteedPrize() {
  let prizeName;
  globalSpinCount++;

  const random = Math.random();
  const chance_400 = 0.05; // 5% chance for ₹400
  const chance_try_again = 0.10; // 10% chance for Try Again

  if (random < chance_400) {
    prizeName = "₹400"; // Rare ₹400 win
    cycleStep = 0;
  } else if (random < (chance_400 + chance_try_again)) {
    prizeName = "Try Again";
    cycleStep = 0;
  } else {
    // Forced pattern: 7x ₹200 + 1x ₹300
    if (cycleStep < 7) {
      prizeName = "₹200";
      cycleStep++;
    } else if (cycleStep === 7) {
      prizeName = "₹300";
      cycleStep = 0;
    } else {
      prizeName = "₹200";
      cycleStep = 1;
    }
  }

  spinCounterDisplay.textContent = globalSpinCount;
  cycleStepCounterDisplay.textContent = prizeName;

  return prizeName;
}

// --- Calculate the final rotation ---
function calculateStopDegree(prizeName) {
  const prizeInfo = ALLOWED_LANDING_INFO[prizeName];

  if (!prizeInfo) {
    console.error("Prize not found:", prizeName);
    return 3600 + ALLOWED_LANDING_INFO["₹200"].landingAngle - (value % 360);
  }

  const targetLandingAngle = prizeInfo.landingAngle;
  const fullSpins = 8 * 360; // 8 full rotations
  const currentRotation = value % 360;

  let requiredRotation = fullSpins + targetLandingAngle - currentRotation;

  // Small optional offset for realism (±2°)
  const randomOffset = (Math.random() * 4) - 2; // Keep it small
  requiredRotation += randomOffset;

  return requiredRotation;
}

// --- Spin Button Handler ---
spinBtn.onclick = function () {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  const guaranteedPrize = getGuaranteedPrize();
  const requiredRotation = calculateStopDegree(guaranteedPrize);

  value += requiredRotation;
  wheel.style.transform = `rotate(${value}deg)`;

  // Wait for spin animation to finish
  setTimeout(() => {
    arrow.classList.add("bounce");

    setTimeout(() => {
      arrow.classList.remove("bounce");
      showPrize(guaranteedPrize);
      launchConfetti();
      isSpinning = false;
      spinBtn.disabled = false;
    }, 500);
  }, 5000);
};

// --- Show Result Popup ---
function showPrize(prize) {
  prizeText.textContent =
    prize === "Try Again"
      ? "Oops! Try Again 😅"
      : `🎉 You Won ${prize} Cashback! 🎊`;
  toast.classList.add("show");
  document.getElementById("overlay").classList.add("show");
}

// --- Spin Again Handler ---
spinAgain.onclick = () => {
  toast.classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
  stopConfetti();
};

// --- Confetti Animation ---
function launchConfetti() {
  particles = [];
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 120,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let p of particles) {
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    }
    update();
    confettiFrame = requestAnimationFrame(draw);
  }

  function update() {
    for (let p of particles) {
      p.y += Math.cos(p.d) + 2 + p.r / 2;
      p.x += Math.sin(p.d);
      if (p.y > confettiCanvas.height) {
        p.x = Math.random() * confettiCanvas.width;
        p.y = -10;
      }
    }
  }

  draw();
  setTimeout(stopConfetti, 3000);
}

function stopConfetti() {
  if (confettiFrame) {
    cancelAnimationFrame(confettiFrame);
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiFrame = null;
  }
}
