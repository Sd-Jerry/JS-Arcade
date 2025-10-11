let wheel = document.querySelector('.wheel');
let spinBtn = document.querySelector('.spinBtn');
let popup = document.getElementById('popup');
let scratchCard = document.getElementById('scratchCard');
let value = Math.ceil(Math.random() * 3600);
let congratsPopup;

// 🎲 Generate Prize with Weighted Probability
function getPrize() {
  const random = Math.random() * 100;
  if (random < 90) return 200; // 90% chance
  if (random < 97) return 300; // 7% chance
  return 400; // 3% chance
}

// --- SPIN BUTTON CLICK ---
spinBtn.onclick = function () {
  spinBtn.style.pointerEvents = "none";
  wheel.style.transition = "transform 9s cubic-bezier(0.25, 1, 0.5, 1)";
  wheel.style.transform = "rotate(" + value + "deg)";
  value += Math.ceil(Math.random() * 3600);

  // Select prize logic
  const prize = getPrize();

  // Show popup after spin ends (9s)
  setTimeout(() => {
    popup.style.display = "flex";
    initScratchCard(prize);
  }, 8500);
};

// --- SCRATCH CARD INITIALIZATION ---
function initScratchCard(prize) {
  // Clean scratch card canvas each time
  const oldCanvas = document.getElementById("scratchCard");
  const newCanvas = oldCanvas.cloneNode(true);
  oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
  scratchCard = newCanvas;

  let ctx = scratchCard.getContext('2d');
  let w = scratchCard.width;
  let h = scratchCard.height;

  // Hidden prize text under layer
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#111";
  ctx.font = "bold 22px Poppins";
  ctx.fillText(`₹${prize} Cashback`, 60, 85);

  // Grey overlay to scratch off
  ctx.fillStyle = "#999";
  ctx.globalCompositeOperation = "source-over";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "destination-out";

  let isDrawing = false;

  const scratch = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = scratchCard.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch completion
    const imageData = ctx.getImageData(0, 0, w, h);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const percent = (cleared / (w * h)) * 100;
    if (percent > 50) showCongratsPopup(prize);
  };

  scratchCard.addEventListener("mousedown", () => (isDrawing = true));
  scratchCard.addEventListener("mouseup", () => (isDrawing = false));
  scratchCard.addEventListener("mousemove", scratch);
  scratchCard.addEventListener("touchstart", () => (isDrawing = true));
  scratchCard.addEventListener("touchend", () => (isDrawing = false));
  scratchCard.addEventListener("touchmove", scratch);
}

// --- SHOW CONGRATS POPUP ---
function showCongratsPopup(prize) {
  popup.style.display = "none";

  if (document.querySelector(".congrats-popup")) {
    document.querySelector(".congrats-popup").remove();
  }

  // Create popup wrapper
  congratsPopup = document.createElement("div");
  congratsPopup.className = "congrats-popup";
  congratsPopup.innerHTML = `
    <canvas id="confettiCanvas"></canvas>
    <div class="congrats-box">
      <h2>🎉 Congratulations!</h2>
      <p>You won ₹${prize} Cashback</p>
      <button id="popupSpinAgain">SPIN AGAIN</button>
      <p class="congrats-para">
      Conditions Apply - This Cashback amount will be deductible / discountable from your total bill amount of SAMRAT TYRE.
    </p>
      </div>
  `;
  document.body.appendChild(congratsPopup);

  // Ensure popup covers full screen on mobile
  congratsPopup.style.width = '100%';
  congratsPopup.style.height = '100%';
  congratsPopup.style.zIndex = 99999;

  startConfetti(); // Trigger confetti animation

  // Handle Spin Again click
  const spinAgainBtn = document.getElementById("popupSpinAgain");
  spinAgainBtn.addEventListener("click", () => {
    stopConfetti();
    congratsPopup.remove();
    spinBtn.style.pointerEvents = "auto";
  });
}

// --- CONFETTI ANIMATION ---
let confettiCtx, confettiParticles = [], confettiAnimationFrame;

function startConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  confettiCtx = canvas.getContext("2d");

  confettiParticles = [];
  const particleCount = window.innerWidth < 600 ? 60 : 120; // fewer on mobile

  for (let i = 0; i < particleCount; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 0.5 + 0.5,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
    });
  }

  // Run confetti for limited duration (e.g. 5 seconds)
  let startTime = Date.now();
  function animateConfetti() {
    drawConfetti();
    updateConfetti();

    if (Date.now() - startTime < 5000) {
      confettiAnimationFrame = requestAnimationFrame(animateConfetti);
    } else {
      stopConfetti();
    }
  }
  animateConfetti();
}

function drawConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas || !confettiCtx) return;
  const ctx = confettiCtx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach((p) => {
    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt, p.y);
    ctx.lineTo(p.x, p.y + p.tilt + p.r);
    ctx.stroke();
  });
}

function updateConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  confettiParticles.forEach((p) => {
    p.y += p.d * 3; // slightly slower
    p.x += Math.sin(p.tilt / 2);
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
  });
}

function stopConfetti() {
  cancelAnimationFrame(confettiAnimationFrame);
  confettiParticles = [];
  const canvas = document.getElementById("confettiCanvas");
  if (canvas && confettiCtx) confettiCtx.clearRect(0, 0, canvas.width, canvas.height);
}

