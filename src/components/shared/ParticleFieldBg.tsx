import { useEffect, useRef } from "react";

/**
 * Soft floating-particle constellation background for the Chat page.
 * - Particles drift and twinkle with random opacity cycles
 * - Nearby particles connect with faint lines (constellation effect)
 * - A few larger "star" particles with brighter halos
 * - Pointer-events:none; honours prefers-reduced-motion
 */
export function ParticleFieldBg({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      W = canvas.width = rect.width;
      H = canvas.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // palette
    const COLORS = [
      "168,85,247",   // purple-500
      "129,140,248",  // indigo-400
      "96,165,250",   // blue-400
      "232,121,249",  // fuchsia-400
    ];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      alpha: number;
      alphaV: number;
      color: string;
      isStar: boolean;
    };

    const COUNT = 70;
    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      const isStar = i < 8;
      return {
        x: Math.random() * (W || 800),
        y: Math.random() * (H || 600),
        vx: (Math.random() - 0.5) * (isStar ? 0.18 : 0.28),
        vy: (Math.random() - 0.5) * (isStar ? 0.18 : 0.28),
        r: isStar ? 2.5 + Math.random() * 2 : 0.8 + Math.random() * 1.6,
        alpha: Math.random(),
        alphaV: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        isStar,
      };
    });

    const LINK_DIST = 120;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += W;
          if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H;
          if (p.y > H) p.y -= H;

          p.alpha += p.alphaV;
          if (p.alpha > 1 || p.alpha < 0.05) p.alphaV *= -1;
          p.alpha = Math.max(0.05, Math.min(1, p.alpha));
        }
      }

      // constellation lines
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d > LINK_DIST) continue;
          const alpha = (1 - d / LINK_DIST) * 0.18 * Math.min(particles[i].alpha, particles[j].alpha);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(129,140,248,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // particles
      for (const p of particles) {
        if (p.isStar) {
          // star halo
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          grd.addColorStop(0, `rgba(${p.color},${p.alpha * 0.7})`);
          grd.addColorStop(1, `rgba(${p.color},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
