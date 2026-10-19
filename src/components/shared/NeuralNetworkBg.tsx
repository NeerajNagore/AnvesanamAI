import { useEffect, useRef } from "react";

/**
 * Animated neural-network canvas background for the Dashboard hero.
 * - Nodes pulse and drift slowly
 * - Edges glow when nearby nodes connect
 * - Signal pulses travel along edges
 * - Fully pointer-events:none; honours prefers-reduced-motion
 */
export function NeuralNetworkBg({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── sizing ────────────────────────────────────────────────────────────────
    let W = 0,
      H = 0;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      W = canvas.width = rect.width;
      H = canvas.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // ── palette ───────────────────────────────────────────────────────────────
    const COLORS = ["139,92,246", "99,102,241", "59,130,246"];

    // ── nodes ─────────────────────────────────────────────────────────────────
    const NODE_COUNT = 44;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; phase: number; color: string };
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00014,
      vy: (Math.random() - 0.5) * 0.00014,
      r: 2 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    // ── signals ───────────────────────────────────────────────────────────────
    type Signal = { from: number; to: number; t: number; speed: number; color: string };
    const signals: Signal[] = [];
    const CONNECT_FRAC = 0.30;

    const spawnSignal = () => {
      const i = Math.floor(Math.random() * NODE_COUNT);
      const j = Math.floor(Math.random() * NODE_COUNT);
      if (i === j) return;
      const dx = (nodes[i].x - nodes[j].x) * W;
      const dy = (nodes[i].y - nodes[j].y) * H;
      if (Math.hypot(dx, dy) < CONNECT_FRAC * Math.min(W, H)) {
        signals.push({
          from: i,
          to: j,
          t: 0,
          speed: 0.004 + Math.random() * 0.006,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    // ── render loop ───────────────────────────────────────────────────────────
    let raf = 0;
    let frame = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      frame++;
      ctx.clearRect(0, 0, W, H);

      const D = CONNECT_FRAC * Math.min(W, H);

      if (!reduced && frame % 38 === 0) spawnSignal();

      // edges
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W;
          const dy = (nodes[i].y - nodes[j].y) * H;
          const d = Math.hypot(dx, dy);
          if (d > D) continue;
          const alpha = (1 - d / D) * 0.2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
          ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
          ctx.stroke();
        }
      }

      // signal pulses
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.t += sig.speed;
        if (sig.t >= 1) { signals.splice(s, 1); continue; }

        const nx = (nodes[sig.from].x + (nodes[sig.to].x - nodes[sig.from].x) * sig.t) * W;
        const ny = (nodes[sig.from].y + (nodes[sig.to].y - nodes[sig.from].y) * sig.t) * H;
        const alpha = Math.sin(sig.t * Math.PI) * 0.9;

        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 16);
        grd.addColorStop(0, `rgba(${sig.color},${alpha})`);
        grd.addColorStop(1, `rgba(${sig.color},0)`);
        ctx.beginPath();
        ctx.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sig.color},${alpha})`;
        ctx.fill();
      }

      // nodes
      for (const n of nodes) {
        if (!reduced) {
          n.x = (n.x + n.vx + 1) % 1;
          n.y = (n.y + n.vy + 1) % 1;
          n.phase += 0.016;
        }
        const pulse = 0.5 + 0.5 * Math.sin(n.phase);
        const glowR = n.r * (3 + pulse * 3);

        const grd = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, glowR);
        grd.addColorStop(0, `rgba(${n.color},${0.45 + pulse * 0.35})`);
        grd.addColorStop(1, `rgba(${n.color},0)`);
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color},${0.75 + pulse * 0.25})`;
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
