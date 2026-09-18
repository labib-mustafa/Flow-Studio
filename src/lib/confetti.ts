// Lightweight canvas micro-spark / haptic particle system (Zero external dependencies)
// Apple-grade subtle micro-sparkle for clean, elegant task completion feedback
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  decay: number;
  shape: 'circle' | 'rect';
}

// Elegant, cohesive emerald, soft champagne gold & white micro-spark palette
const COLORS = [
  '#10b981', // emerald 500
  '#34d399', // emerald 400
  '#6ee7b7', // soft mint
  '#fbbf24', // champagne gold
  '#fef08a', // delicate gold shimmer
  '#ffffff', // crisp white glint
];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const particles: Particle[] = [];
let animId: number | null = null;

function ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof window === 'undefined') return null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'flow-studio-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999999';
    document.body.appendChild(canvas);

    const onResize = () => {
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();
  }

  if (!ctx && canvas) {
    ctx = canvas.getContext('2d');
  }

  return ctx && canvas ? { canvas, ctx } : null;
}

function loop() {
  if (!ctx || !canvas) return;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // very gentle downward float
    p.vx *= 0.92; // rapid, smooth deceleration
    p.vy *= 0.92;
    p.rotation += p.vRot;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x * dpr, p.y * dpr);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    // Shrink gracefully as alpha decays for an elegant twinkling disappearance
    const renderSize = Math.max(0.5, p.size * (0.4 + 0.6 * p.alpha)) * dpr;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(
        -renderSize / 2,
        -renderSize / 2,
        renderSize,
        renderSize
      );
    }

    ctx.restore();
  }

  if (particles.length > 0) {
    animId = requestAnimationFrame(loop);
  } else {
    animId = null;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

/**
 * Trigger subtle, Apple-grade micro-sparkles tightly centered around an element or click coordinate.
 * Clamped to max 8-10 tiny particles within a gentle ~25px bloom.
 */
export function triggerConfettiBurst(x?: number, y?: number, count = 7) {
  const c = ensureCanvas();
  if (!c) return;

  const originX = x !== undefined ? x : window.innerWidth / 2;
  const originY = y !== undefined ? y : window.innerHeight / 2;

  // Cap particle count strictly so bursts remain restrained and elegant
  const effectiveCount = Math.min(count, 8);

  for (let i = 0; i < effectiveCount; i++) {
    const angle = (Math.PI * 2 * i) / effectiveCount + ((Math.random() - 0.5) * 0.5);
    const speed = 1.3 + Math.random() * 2.2;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.6, // subtle upward preference
      size: 2.0 + Math.random() * 1.8,   // tiny, crisp 2-3.8px micro-sparks
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
      alpha: 1,
      decay: 0.045 + Math.random() * 0.025, // quick, crisp ~250-320ms dissipation
      shape: Math.random() > 0.3 ? 'circle' : 'rect',
    });
  }

  if (!animId) {
    animId = requestAnimationFrame(loop);
  }
}

