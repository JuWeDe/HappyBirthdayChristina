/* ============================================================
   НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
   ============================================================ */
const screens = document.querySelectorAll('.screen');

function goToScreen(num){
  screens.forEach(s => {
    const isTarget = s.dataset.screen === String(num);
    if (isTarget){
      s.classList.remove('screen--exit');
      s.classList.add('screen--active');
      // Если перешли на экран подарков, инициализируем скетч-карты
      if(num === 4) {
         setTimeout(initScratchCards, 300);
      }
    } else if (s.classList.contains('screen--active')) {
      s.classList.add('screen--exit');
      s.classList.remove('screen--active');
    }
  });
}

document.getElementById('btn-to-quest').addEventListener('click', () => {
  goToScreen(2);
  initAudio(); // Активируем контекст аудио при первом клике пользователя
});

document.getElementById('btn-to-interactive').addEventListener('click', () => {
  goToScreen(35);
});

/* ============================================================
   IPOD АУДИОПЛЕЕР ЛОГИКА
   ============================================================ */
const audio = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const trackStatus = document.querySelector('.ipod-track-status');
const iconPlay = musicToggle.querySelector('.icon-play');
const iconPause = musicToggle.querySelector('.icon-pause');

function initAudio() {
  // На iOS воспроизведение возможно только после действия пользователя
  if (audio.paused) {
    // Просто подготавливаем, не запуская насильно, если не нужно
  }
}

musicToggle.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().then(() => {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      trackStatus.textContent = 'Сейчас играет ⚡';
    }).catch(err => console.log("Ошибка аудио:", err));
  } else {
    audio.pause();
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    trackStatus.textContent = 'Музыка на паузе';
  }
});

/* ============================================================
   ПАСХАЛКА: ШТАМП
   ============================================================ */
const EASTER_EGG_MESSAGES = [
  'секрет: это поздравление я переписывал раз пять 🙈',
  'да, я специально спрятал это здесь',
];
let eggIndex = 0;
const toast = document.getElementById('toast');
document.getElementById('stamp').addEventListener('click', () => {
  toast.textContent = EASTER_EGG_MESSAGES[eggIndex % EASTER_EGG_MESSAGES.length];
  eggIndex++;
  toast.classList.add('toast--show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('toast--show'), 2400);
});

/* ============================================================
   ПРОВЕРКА ОТВЕТА (КАНЬЕ)
   ============================================================ */
const ACCEPTED_HASHES = [
  'd446d9d85660881a05d8c4f44e76e644e84a7ee292cc3d7754e50db0849d9acb', // kanye west
  '71c735fbb387a0d0854eb70acf785da815943740ffcfc74ad466a0f5962ad5c2', // канье
  'aa03508c83ccde892456a3d5d9d46d67160cc6fc60525cecf181ec839febe1ed', // kanye
];

async function sha256Hex(text){
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const optionButtons = document.querySelectorAll('.option-btn');
const hint = document.getElementById('quest-hint');
let answered = false;

optionButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    if (answered) return;

    const normalized = btn.dataset.answer.trim().toLowerCase();
    const hash = await sha256Hex(normalized);

    if (ACCEPTED_HASHES.includes(hash)){
      answered = true;
      btn.classList.add('is-correct');
      optionButtons.forEach(b => { if (b !== btn) b.classList.add('is-disabled'); });
      hint.textContent = 'Верно! Идём дальше…';
      hint.classList.add('ok');
      burstHearts();
      setTimeout(() => goToScreen(3), 800);
    } else {
      btn.classList.remove('is-wrong');
      void btn.offsetWidth;
      btn.classList.add('is-wrong');
      hint.classList.remove('ok');
      hint.textContent = 'Не в этот раз, пробуй ещё 👀';
      setTimeout(() => btn.classList.remove('is-wrong'), 500);
    }
  });
});

/* ============================================================
   ИНТЕРАКТИВНЫЕ КНОПКИ ДА / НЕТ (УБЕГАНИЕ НА IPHONE)
   ============================================================ */
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
let yesScale = 1.0;

function moveNoButton() {
  const container = document.querySelector('.runaway-container');
  const containerRect = container.getBoundingClientRect();
  
  // Рассчитываем случайные координаты внутри контейнера, учитывая размеры кнопки
  const maxX = containerRect.width - btnNo.offsetWidth;
  const maxY = containerRect.height - btnNo.offsetHeight;
  
  const randomX = Math.floor(Math.random() * Math.max(maxX, 50));
  const randomY = Math.floor(Math.random() * Math.max(maxY, 50));
  
  btnNo.style.left = randomX + 'px';
  btnNo.style.top = randomY + 'px';
  
  // Увеличиваем кнопку ДА
  yesScale += 0.25;
  btnYes.style.transform = `scale(${yesScale})`;
}

// На смартфонах реагируем на touchend/click мгновенно
btnNo.addEventListener('click', (e) => {
  e.preventDefault();
  moveNoButton();
});
btnNo.addEventListener('touchend', (e) => {
  e.preventDefault();
  moveNoButton();
});

btnYes.addEventListener('click', () => {
  playBoxOpening(() => goToScreen(4));
});

/* ============================================================
   ЛОГИКА ГИРОСКОПА (iOS DeviceOrientation)
   ============================================================ */
const gyroContainer = document.getElementById('gyro-container');
const authGyroBtn = document.getElementById('btn-gyro-auth');

authGyroBtn.addEventListener('click', () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          authGyroBtn.style.display = 'none';
        }
      })
      .catch(console.error);
  } else {
    // Для устройств, где разрешение не требуется по дефолту
    window.addEventListener('deviceorientation', handleOrientation);
    authGyroBtn.style.display = 'none';
  }
});

function handleOrientation(event) {
  // Наклон влево/вправо (gamma) и вперед/назад (beta)
  const tiltX = Math.min(Math.max(event.gamma, -30), 30) / 3; // Ограничиваем угол наклона
  const tiltY = Math.min(Math.max(event.beta, -30), 30) / 3;

  const cards = gyroContainer.querySelectorAll('.polaroid');
  cards.forEach((card, index) => {
    const depthModifier = (index + 1) * 0.4;
    card.style.transform = `rotate(${(index % 2 === 0 ? -3 : 3) + tiltX}deg) translate3d(${tiltX * depthModifier}px, ${tiltY * depthModifier}px, 0px)`;
  });
}

/* ============================================================
   СКЕТЧ-КАРТЫ (SCRATCH CARDS LOGIC)
   ============================================================ */
function initScratchCards() {
  const containers = document.querySelectorAll('.scratch-container');
  
  containers.forEach(container => {
    const canvas = container.querySelector('.scratch-canvas');
    if (!canvas || canvas.dataset.initialized === 'true') return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Рисуем стильный защитный слой (розовато-серебристый градиент)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2b2531');
    gradient.addColorStop(0.5, '#e6879a');
    gradient.addColorStop(1, '#1a1620');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Текст-подсказка сверху слоя
    ctx.font = 'bold 12px Unbounded, sans-serif';
    ctx.fillStyle = '#f3ead8';
    ctx.textAlign = 'center';
    ctx.fillText('СОТРИ МЕНЯ', canvas.width / 2, canvas.height / 2);
    
    let isDrawing = false;
    
    function scratch(e) {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      // Рассчитываем координаты тача или клика с учетом скролла
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2); // Радиус кисти стирания
      ctx.fill();
    }
    
    // События мыши
    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);
    
    // События тач-скрина (iPhone)
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); });
    canvas.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); scratch(e); }, { passive: false });
    
    canvas.dataset.initialized = 'true';
  });
}

/* ============================================================
   АНИМАЦИЯ ОТКРЫВАЮЩЕЙСЯ КОРОБКИ
   ============================================================ */
const boxOverlay = document.getElementById('box-overlay');
function playBoxOpening(onDone){
  boxOverlay.classList.add('box-overlay--play');
  setTimeout(() => {
    onDone();
    setTimeout(() => boxOverlay.classList.remove('box-overlay--play'), 400);
  }, 1100);
}

/* ============================================================
   ФОНОВЫЕ ЧАСТИЦЫ
   ============================================================ */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let W, H;

function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const PARTICLE_COUNT = window.innerWidth < 480 ? 14 : 24;

function makeParticle(){
  return {
    x: Math.random() * W,
    y: Math.random() * H + H,
    vx: 0,
    vy: -(0.25 + Math.random() * 0.5),
    size: 6 + Math.random() * 10,
    drift: (Math.random() - .5) * .6,
    sway: Math.random() * Math.PI * 2,
    opacity: .15 + Math.random() * .3,
    burst: false,
  };
}

function makeBurstParticle(){
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 4;
  return {
    x: W / 2,
    y: H / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 8 + Math.random() * 8,
    drift: 0,
    sway: 0,
    opacity: 1,
    burst: true,
    life: 60 + Math.random() * 20,
  };
}

function burstHearts(){
  for (let i = 0; i < 40; i++) particles.push(makeBurstParticle());
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());

function drawHeart(x, y, size, opacity){
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#e6879a';
  ctx.beginPath();
  const s = size / 16;
  ctx.moveTo(x, y + 4 * s);
  ctx.bezierCurveTo(x, y, x - 8 * s, y - 6 * s, x - 8 * s, y - 1 * s);
  ctx.bezierCurveTo(x - 8 * s, y + 4 * s, x - 3 * s, y + 8 * s, x, y + 12 * s);
  ctx.bezierCurveTo(x + 3 * s, y + 8 * s, x + 8 * s, y + 4 * s, x + 8 * s, y - 1 * s);
  ctx.bezierCurveTo(x + 8 * s, y - 6 * s, x, y, x, y + 4 * s);
  ctx.fill();
  ctx.restore();
}

function animate(){
  ctx.clearRect(0, 0, W, H);
  particles = particles.filter(p => {
    if (p.burst){
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= 1;
      p.opacity = Math.max(0, p.life / 80);
      drawHeart(p.x, p.y, p.size, p.opacity);
      return p.life > 0;
    } else {
      p.y += p.vy;
      p.sway += 0.02;
      p.x += Math.sin(p.sway) * p.drift;
      if (p.y < -20) Object.assign(p, makeParticle(), { y: H + 20 });
      drawHeart(p.x, p.y, p.size, p.opacity);
      return true;
    }
  });
  requestAnimationFrame(animate);
}
animate();