// Lightweight canvas micro-burst confetti / spark particle system (Zero external dependencies)
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
  shape: 'rect' | 'circle';
}

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // electric blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
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
    p.vy += 0.28; // gravity
    p.vx *= 0.96; // drag
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

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * dpr, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(
        (-p.size / 2) * dpr,
        (-p.size / 2) * dpr,
        p.size * dpr,
        p.size * 1.4 * dpr
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

export function triggerConfettiBurst(x?: number, y?: number, count = 28) {
  const c = ensureCanvas();
  if (!c) return;

  const originX = x !== undefined ? x : window.innerWidth / 2;
  const originY = y !== undefined ? y : window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * (Math.random() * 360)) / 180;
    const speed = 2.5 + Math.random() * 6.5;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5, // upward arc bias
      size: 3 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.02,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }

  if (!animId) {
    animId = requestAnimationFrame(loop);
  }
}
