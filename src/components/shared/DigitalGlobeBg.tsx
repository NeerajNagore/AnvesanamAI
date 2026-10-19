import { useEffect, useRef } from "react";

/**
 * Animated digital globe background for the Web Research page.
 * - Wireframe sphere with latitude + longitude arcs
 * - Globe slowly rotates on the Y axis
 * - Orbiting data-point dots with glow trails
 * - Search-beam sweep effect
 * - Pointer-events:none; honours prefers-reduced-motion
 */
export function DigitalGlobeBg({ className = "" }: { className?: string }) {
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

    // ── globe params ───────────────────────────────────────────────────────────
    const LAT_LINES  = 8;
    const LON_LINES  = 12;
    const TEAL   = "20,184,166";   // teal-500
    const CYAN   = "34,211,238";   // cyan-400
    const INDIGO = "99,102,241";   // indigo-500

    // project a (lon, lat) on the globe surface to canvas xy
    // lon in [0,2π], lat in [-π/2, π/2], yaw in [0,2π]
    const project = (lon: number, lat: number, yaw: number, cx: number, cy: number, R: number) => {
      const adjustedLon = lon - yaw;
      const x3 = Math.cos(lat) * Math.sin(adjustedLon);
      const y3 = Math.sin(lat);
      const z3 = Math.cos(lat) * Math.cos(adjustedLon);
      return { x: cx + x3 * R, y: cy - y3 * R, z: z3 }; // z > 0 = front face
    };

    // ── orbiting data points ──────────────────────────────────────────────────
    type DataPoint = { lon: number; lat: number; speed: number; color: string; trail: Array<{ x: number; y: number }> };
    const DATA_POINTS: DataPoint[] = Array.from({ length: 8 }, () => ({
      lon: Math.random() * Math.PI * 2,
      lat: (Math.random() - 0.5) * Math.PI * 0.9,
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003),
      color: [TEAL, CYAN, INDIGO][Math.floor(Math.random() * 3)],
      trail: [],
    }));

    let yaw = 0;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      if (!reduced) yaw += 0.003;

      // globe center — right side of canvas, vertically centered
      const R    = Math.min(W, H) * 0.38;
      const cx   = W * 0.72;
      const cy   = H * 0.5;

      // ── latitude arcs ───────────────────────────────────────────────────────
      for (let li = 0; li <= LAT_LINES; li++) {
        const lat = -Math.PI / 2 + (Math.PI / LAT_LINES) * li;
        ctx.beginPath();
        let first = true;
        for (let t = 0; t <= 120; t++) {
          const lon = (Math.PI * 2 / 120) * t;
          const p = project(lon, lat, yaw, cx, cy, R);
          const alpha = p.z > 0 ? 0.25 : 0.06;
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
          // draw segment-by-segment to vary alpha with z depth
          if (t % 10 === 9) {
            ctx.strokeStyle = `rgba(${TEAL},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            first = false;
          }
        }
        ctx.strokeStyle = `rgba(${TEAL},0.15)`;
        ctx.stroke();
      }

      // ── longitude arcs ──────────────────────────────────────────────────────
      for (let li = 0; li < LON_LINES; li++) {
        const lon = (Math.PI * 2 / LON_LINES) * li;
        ctx.beginPath();
        let first = true;
        for (let t = 0; t <= 80; t++) {
          const lat = -Math.PI / 2 + (Math.PI / 80) * t;
          const p = project(lon, lat, yaw, cx, cy, R);
          const alpha = p.z > 0 ? 0.25 : 0.06;
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
          if (t % 10 === 9) {
            ctx.strokeStyle = `rgba(${TEAL},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = `rgba(${TEAL},0.15)`;
        ctx.stroke();
      }

      // ── equator highlight ───────────────────────────────────────────────────
      ctx.beginPath();
      for (let t = 0; t <= 180; t++) {
        const lon = (Math.PI * 2 / 180) * t;
        const p   = project(lon, 0, yaw, cx, cy, R);
        if (t === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(${CYAN},0.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── globe glow rim ──────────────────────────────────────────────────────
      const rimGrd = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.15);
      rimGrd.addColorStop(0, `rgba(${TEAL},0)`);
      rimGrd.addColorStop(0.6, `rgba(${TEAL},0.06)`);
      rimGrd.addColorStop(1, `rgba(${TEAL},0.18)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = rimGrd;
      ctx.fill();

      // ── data points ─────────────────────────────────────────────────────────
      for (const dp of DATA_POINTS) {
        if (!reduced) dp.lon = (dp.lon + dp.speed + Math.PI * 2) % (Math.PI * 2);

        const p = project(dp.lon, dp.lat, yaw, cx, cy, R);
        if (p.z < 0) continue; // behind globe — skip

        // trail
        dp.trail.push({ x: p.x, y: p.y });
        if (dp.trail.length > 18) dp.trail.shift();
        for (let ti = 1; ti < dp.trail.length; ti++) {
          const a = (ti / dp.trail.length) * 0.5;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${dp.color},${a})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(dp.trail[ti - 1].x, dp.trail[ti - 1].y);
          ctx.lineTo(dp.trail[ti].x, dp.trail[ti].y);
          ctx.stroke();
        }

        // glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
        grd.addColorStop(0, `rgba(${dp.color},0.9)`);
        grd.addColorStop(1, `rgba(${dp.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dp.color},1)`;
        ctx.fill();
      }

      // ── scan beam ───────────────────────────────────────────────────────────
      if (!reduced) {
        const beamAngle = yaw * 1.4;
        const bx = cx + Math.cos(beamAngle) * R;
        const by = cy + Math.sin(beamAngle) * R * 0.6;
        const beamGrd = ctx.createLinearGradient(cx, cy, bx, by);
        beamGrd.addColorStop(0, `rgba(${CYAN},0.12)`);
        beamGrd.addColorStop(1, `rgba(${CYAN},0)`);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, beamAngle - 0.18, beamAngle + 0.18);
        ctx.closePath();
        ctx.fillStyle = beamGrd;
        ctx.fill();
      }

      // ── floating data-stream lines (left side) ──────────────────────────────
      const t = Date.now() / 1000;
      for (let i = 0; i < 5; i++) {
        const lx = W * 0.04 + i * W * 0.07;
        const speed = 0.6 + i * 0.2;
        const offset = ((t * speed + i * 1.7) % 1) * H;
        const len = 30 + i * 20;
        const alpha = 0.12 + i * 0.03;
        const grad = ctx.createLinearGradient(lx, offset, lx, offset + len);
        grad.addColorStop(0, `rgba(${INDIGO},0)`);
        grad.addColorStop(0.5, `rgba(${INDIGO},${alpha})`);
        grad.addColorStop(1, `rgba(${INDIGO},0)`);
        ctx.beginPath();
        ctx.strokeStyle = grad as unknown as string;
        ctx.lineWidth = 1.2;
        ctx.moveTo(lx, offset);
        ctx.lineTo(lx, offset + len);
        ctx.stroke();
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
