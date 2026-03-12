(function () {
  const targetTimestamp = new Date("2027-02-05T16:00:00Z").getTime(); // 北京时间 2027-02-06 00:00:00

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const accessibleEl = document.getElementById("countdown-accessible");
  const countdownCard = document.getElementById("countdown-card");

  let hasEnded = false;
  let countdownTimer = null;

  function pad(num, size) {
    const s = String(num);
    return s.length >= size ? s : "0".repeat(size - s.length) + s;
  }

  function updateCountdown() {
    const now = Date.now();
    let diff = targetTimestamp - now;

    if (diff < 0) {
      diff = 0;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (daysEl) daysEl.textContent = pad(days, 3);
    if (hoursEl) hoursEl.textContent = pad(hours, 2);
    if (minutesEl) minutesEl.textContent = pad(minutes, 2);
    if (secondsEl) secondsEl.textContent = pad(seconds, 2);

    if (accessibleEl) {
      accessibleEl.textContent =
        "距离 2027 年春节还有 " +
        days +
        " 天 " +
        hours +
        " 小时 " +
        minutes +
        " 分钟 " +
        seconds +
        " 秒。";
    }

    if (!hasEnded && diff === 0) {
      hasEnded = true;
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      triggerCelebration();
    }
  }

  countdownTimer = window.setInterval(updateCountdown, 1000);
  updateCountdown();

  // ==================== Canvas 烟花粒子系统 ====================

  const canvas = document.getElementById("fireworksCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

  if (!canvas || !ctx) {
    return;
  }

  let width = window.innerWidth || 1280;
  let height = window.innerHeight || 720;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  function resize() {
    width = window.innerWidth || document.documentElement.clientWidth || 1280;
    height = window.innerHeight || document.documentElement.clientHeight || 720;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);

  const isMobile = width < 768;

  const motionMedia = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let prefersReducedMotion = motionMedia ? motionMedia.matches : false;

  if (motionMedia && motionMedia.addEventListener) {
    motionMedia.addEventListener("change", (event) => {
      prefersReducedMotion = event.matches;
    });
  }

  const particles = [];
  let lastSpawnTime = 0;
  let lastFrameTime = 0;
  let isCelebrating = false;

  function createBurst(intense) {
    const baseCount = isMobile ? 16 : 28;
    const count = intense ? baseCount * 2 : baseCount;
    const x = width * (0.1 + Math.random() * 0.8);
    const y = height * (0.15 + Math.random() * 0.45);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = (intense ? 3 : 2) + Math.random() * 1.5;
      const hueBase = intense ? 45 : 15; // 更偏金色
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1200 + Math.random() * 600,
        age: 0,
        size: intense ? 2.2 + Math.random() * 1 : 1.6 + Math.random() * 0.8,
        hue: hueBase + Math.random() * 20,
      });
    }
  }

  function updateAndDrawParticles(delta) {
    ctx.clearRect(0, 0, width, height);

    const gravity = 0.04;
    const friction = 0.995;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += delta;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }

      p.vx *= friction;
      p.vy = p.vy * friction + gravity;
      p.x += p.vx;
      p.y += p.vy;

      const lifeRatio = 1 - p.age / p.life;
      const alpha = Math.max(0, Math.min(1, lifeRatio));

      const gradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.size * 4
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
      gradient.addColorStop(0.2, `hsla(${p.hue}, 100%, 65%, ${0.95 * alpha})`);
      gradient.addColorStop(0.8, `hsla(${p.hue}, 96%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(timestamp) {
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      return; // 尊重系统减少动效设置
    }

    if (!lastFrameTime) {
      lastFrameTime = timestamp;
      lastSpawnTime = timestamp;
    }

    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    const baseInterval = isMobile ? 1200 : 800;
    const interval = isCelebrating ? baseInterval * 0.45 : baseInterval;

    if (timestamp - lastSpawnTime > interval) {
      createBurst(isCelebrating && Math.random() < 0.7);
      lastSpawnTime = timestamp;
    }

    updateAndDrawParticles(delta);
    window.requestAnimationFrame(loop);
  }

  window.requestAnimationFrame(loop);

  // ==================== 倒计时结束后的祝福与高强度烟花 ====================

  function triggerCelebration() {
    isCelebrating = true;
    if (countdownCard) {
      countdownCard.classList.add("celebrating");
    }
    spawnBlessings();
  }

  function spawnBlessings() {
    if (prefersReducedMotion) return;

    const layer = document.getElementById("blessing-layer");
    if (!layer) return;

    const messages = [
      "新春快乐",
      "丁未年大吉",
      "阖家幸福",
      "心想事成",
      "万事顺意",
      "前程似锦",
    ];

    let created = 0;
    const maxCount = messages.length * 2;

    const timer = window.setInterval(() => {
      if (created >= maxCount) {
        window.clearInterval(timer);
        return;
      }
      created += 1;

      const el = document.createElement("div");
      el.className = "blessing-bullet";
      el.textContent = messages[created % messages.length];

      const top = 10 + Math.random() * 70;
      el.style.top = `${top}%`;
      el.style.left = "-20%";

      const duration = 10 + Math.random() * 6;
      const delay = Math.random() * 2;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;

      layer.appendChild(el);

      el.addEventListener("animationend", () => {
        el.remove();
      });
    }, 550);
  }
})();
