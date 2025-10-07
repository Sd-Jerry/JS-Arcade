/* -------------------------
   CONFIG: prizes + colors
   ------------------------- */
const prizes = [
  "₹50 Cashback",
  "₹100 Cashback",
  "Try Again",
  "₹25 Cashback",
  "₹10 Cashback",
  "Free Wash",
  "₹75 Cashback",
  "10% Off"
];

const colors = [
  "#ff7043","#ff8a65","#ffcc80","#ffb74d",
  "#ff8a00","#ff5722","#ffab91","#ff6f00"
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
   Build wheel (conic-gradient + radial labels)
   ------------------------- */
function buildWheel() {
  const n = prizes.length;
  const degPer = 360 / n;
  // build gradient string starting from top
  let parts = [];
  let start = 0;
  for (let i = 0; i < n; i++){
    const end = start + degPer;
    parts.push(`${colors[i % colors.length]} ${start}deg ${end}deg`);
    start = end;
  }
  const gradient = `conic-gradient(from -90deg, ${parts.join(', ')})`;
  wheel.style.background = gradient;

  // remove old labels
  document.querySelectorAll('.label').forEach(el => el.remove());

  // create radial labels
  const radius = Math.min(wheel.clientWidth, wheel.clientHeight) / 2;
  const labelRadius = radius - 80; // distance from center
  for (let i = 0; i < n; i++){
    const centerAngle = i * degPer + degPer / 2; // degrees clockwise from top
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = prizes[i];
    // position using CSS transform: rotate(centerAngle) translateY(-labelRadius) rotate(-centerAngle)
    // Note: using translateY(-labelRadius) because transform rotates clockwise
    label.style.transform = `rotate(${centerAngle}deg) translateY(-${labelRadius}px) rotate(${-centerAngle}deg)`;
    // small styling to ensure visibility for long text
    label.style.fontSize = '15px';
    label.style.padding = '2px 6px';
    label.style.borderRadius = '8px';
    label.style.background = 'rgba(0,0,0,0.06)';
    label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
    label.style.color = '#fff';
    label.style.left = '50%';
    label.style.top = '50%';
    wheel.appendChild(label);
  }
}

 // Add sparkles
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
function resizeCanvas(){
  if(!ctx) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnConfetti(){
  if(!ctx) return;
  confettiPieces = [];
  const count = 100;
  for (let i = 0; i < count; i++){
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 4,
      speed: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      color: `hsl(${Math.random()*360}, 90%, 60%)`,
      rotSpeed: (Math.random() - 0.5) * 6
    });
  }
  requestAnimationFrame(renderConfetti);
  // clear after ~4s
  setTimeout(()=> confettiPieces = [], 4200);
}

function renderConfetti(){
  if(!ctx) return;
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach(p=>{
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI/180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
    p.y += p.speed;
    p.rot += p.rotSpeed;
    if (p.y > confettiCanvas.height + 30) p.y = -10;
  });
  if (confettiPieces.length) requestAnimationFrame(renderConfetti);
}

/* -------------------------
   Spin logic (robust)
   ------------------------- */
let currentRotation = 0; // internal rotation in degrees (keeps small values)
let isSpinning = false;

function spinOnce(){
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  message.textContent = "Spinning...";

  const n = prizes.length;
  const degPer = 360 / n;

  // choose random index
  const chosen = Math.floor(Math.random() * n);

  // number of full rotations (visual)
  const spinRounds = Math.floor(Math.random() * 3) + 5; // 5..7

  // center angle of that segment measured clockwise from top (because gradient 'from -90deg')
  const targetCenter = chosen * degPer + degPer / 2; // 0..360

  // compute a forward delta so finalRotation > currentRotation and minimal extra rotation beyond full rounds
  const currentNorm = currentRotation % 360;
  const deltaToTarget = ((targetCenter - currentNorm) + 360) % 360; // 0..359
  const totalExtra = spinRounds * 360 + deltaToTarget; // ensures forward spin

  const finalRotation = currentRotation + totalExtra;
  const duration = 4.6; // seconds
  wheel.style.transition = `transform ${duration}s cubic-bezier(0.25,0.1,0.25,1)`;
  wheel.style.transform = `rotate(${finalRotation}deg)`;

  // play spin sound
  if(spinSound){
    try{ spinSound.currentTime = 0; spinSound.play(); }catch(e){}
  }

  // when animation finishes:
  setTimeout(()=>{
    // stop sound and play win sound
    if(winSound){
      try{ winSound.currentTime = 0; winSound.play(); }catch(e){}
    }

    // compute normalized rotation and update currentRotation to a small value
    const normalized = finalRotation % 360;

    // Ensure we snap to normalized WITHOUT visual jump: set transition none then set to normalized,
    // but because normalized === finalRotation % 360 the visible state won't visually change.
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${normalized}deg)`;
    // force reflow to ensure transition reset takes effect
    void wheel.offsetWidth;

    currentRotation = normalized;
    isSpinning = false;
    spinBtn.disabled = false;

    // Determine reward and show popup or message
    const rewardIndex = chosen;
    const reward = prizes[rewardIndex];

    if (reward.toLowerCase().includes("try again")){
      message.textContent = "😅 Try Again Next Time!";
      // no popup or confetti
    } else {
      message.textContent = `🎉 You won: ${reward}!`;
      popupBody.textContent = reward.toLowerCase().includes('cashback') ? `You won ${reward}!` : `You won ${reward}!`;
      popup.classList.add('show');
      spawnConfetti();
    }
  }, Math.round(duration * 1000) + 60);
}

/* -------------------------
   event wiring
   ------------------------- */
buildWheel();
spinBtn.addEventListener('click', spinOnce);
spinAgainBtn.addEventListener('click', ()=> { popup.classList.remove('show'); message.textContent = 'Good luck — spin again!'; });

/* preload small audio to avoid first-play delay on some browsers */
try { spinSound.load(); winSound.load(); } catch(e){}