/* ═══ Parametric Point-Cloud Hero Animation ═══
 *
 * Renders a 3D parametric surface (torus knot / twisted ribbon)
 * as a flowing point cloud with wireframe connections.
 * Inspired by the topological sculpture in "imagen oficial para animar.PNG".
 *
 * Features:
 *  - ~800 particles (desktop) / ~280 (mobile)
 *  - Connecting mesh lines between nearby points
 *  - Blue accent nodes (8) matching --cl-blue: #3478F6
 *  - Vertical construction axis with square markers
 *  - Slow majestic 3D rotation
 *  - Cursor parallax tilt (desktop only)
 *  - prefers-reduced-motion: static single frame
 *  - GPU-friendly: pixel-ratio aware, throttled resize
 */

const parametric = (() => {

  /* ─── Constants ─────────────────────────────────────────── */
  const BLUE           = '#3478F6';
  const BLUE_RGBA      = 'rgba(52,120,246,';
  const MESH_COLOR     = 'rgba(16,24,32,';
  const AXIS_COLOR     = 'rgba(52,120,246,0.35)';
  const BG_CLEAR       = 'rgba(245,244,240,0)'; // transparent clear

  const CONNECT_DIST   = 85;   // px — max distance to draw a line
  const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
  const ROT_X          = 0.0028;  // rad/frame
  const ROT_Y          = 0.0042;  // rad/frame
  const PARALLAX_FACTOR = 0.022;
  const PARALLAX_MAX   = 0.28;    // radians

  /* ─── State ──────────────────────────────────────────────── */
  let canvas, ctx, raf, W, H, cx, cy, scale;
  let points = [];
  let accentIndices = [];
  let rotX = 0.32, rotY = 0.18;
  let targetRotX = 0.32, targetRotY = 0.18;
  let isMobile = false;
  let reducedMotion = false;
  let mouseX = 0, mouseY = 0;
  let resizeTimer = null;
  let running = false;

  /* ─── Parametric Surface: Torus Knot (p=2, q=3) ─────────── */
  function torusKnot(t, p, q, R, r) {
    const phi = t * p;
    const theta = t * q;
    const rCos = R + r * Math.cos(phi);
    return {
      x: rCos * Math.cos(theta),
      y: rCos * Math.sin(theta),
      z: r * Math.sin(phi),
    };
  }

  /* ─── Secondary surface: twisted ribbon / figure-8 ──────── */
  function twistedRibbon(u, v) {
    // Möbius-like strip merged with torus
    const R = 1.0, r = 0.42, twist = 2.5;
    const theta = u * Math.PI * 2;
    const phi   = v * Math.PI * 2;
    const x = (R + r * Math.cos(phi + twist * theta)) * Math.cos(theta);
    const y = (R + r * Math.cos(phi + twist * theta)) * Math.sin(theta);
    const z =       r * Math.sin(phi + twist * theta);
    return { x, y, z };
  }

  /* ─── Generate point cloud ───────────────────────────────── */
  function generatePoints() {
    points = [];
    const count = isMobile ? 280 : 820;
    const knotCount   = Math.floor(count * 0.38);
    const ribbonCount = count - knotCount;

    // Torus knot points
    for (let i = 0; i < knotCount; i++) {
      const t = (i / knotCount) * Math.PI * 2;
      const pt = torusKnot(t, 2, 3, 1.0, 0.38);
      points.push({
        ox: pt.x, oy: pt.y, oz: pt.z,
        size: Math.random() * 1.2 + 0.5,
        baseAlpha: Math.random() * 0.45 + 0.3,
        accent: false,
      });
    }

    // Twisted ribbon points
    for (let i = 0; i < ribbonCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const pt = twistedRibbon(u, v);
      points.push({
        ox: pt.x, oy: pt.y, oz: pt.z,
        size: Math.random() * 0.9 + 0.35,
        baseAlpha: Math.random() * 0.3 + 0.15,
        accent: false,
      });
    }

    // Pick 8 accent nodes at evenly spaced torus knot positions
    accentIndices = [];
    for (let k = 0; k < 8; k++) {
      const idx = Math.floor((k / 8) * knotCount);
      points[idx].accent = true;
      points[idx].size = 3.8;
      accentIndices.push(idx);
    }
  }

  /* ─── Project 3D → 2D ───────────────────────────────────── */
  function project(ox, oy, oz) {
    // Rotate around X axis
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y1 = oy * cosX - oz * sinX;
    const z1 = oy * sinX + oz * cosX;
    // Rotate around Y axis
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x2 = ox * cosY + z1 * sinY;
    const z2 = -ox * sinY + z1 * cosY;
    // Perspective projection
    const fov = scale * 0.92;
    const depth = 2.8;
    const w = depth / (depth - z2 * 0.3);
    return {
      x: cx + x2 * fov * w,
      y: cy + y1 * fov * w,
      z: z2,
      w,
    };
  }

  /* ─── Draw frame ─────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Project all points
    const projected = points.map(p => {
      const proj = project(p.ox, p.oy, p.oz);
      return { ...proj, size: p.size, baseAlpha: p.baseAlpha, accent: p.accent };
    });

    // Sort by depth (back to front)
    projected.sort((a, b) => a.z - b.z);

    // ── Draw connections ──────────────────────────────────────
    const maxLines = isMobile ? 180 : 480;
    let lineCount = 0;
    const len = projected.length;

    for (let i = 0; i < len && lineCount < maxLines; i++) {
      const a = projected[i];
      for (let j = i + 1; j < len && lineCount < maxLines; j++) {
        const b = projected[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < CONNECT_DIST_SQ) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / CONNECT_DIST) * 0.14;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = MESH_COLOR + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          lineCount++;
        }
      }
    }

    // ── Draw vertical construction axis ──────────────────────
    const axisX = cx;
    ctx.beginPath();
    ctx.moveTo(axisX, cy - scale * 1.1);
    ctx.lineTo(axisX, cy + scale * 1.1);
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Axis tick markers (small squares)
    const tickPositions = [-0.9, -0.45, 0, 0.45, 0.9];
    tickPositions.forEach(t => {
      const ty = cy + t * scale;
      ctx.fillStyle = BLUE_RGBA + '0.5)';
      ctx.fillRect(axisX - 3, ty - 3, 6, 6);
    });

    // ── Draw particles ────────────────────────────────────────
    projected.forEach(p => {
      const depthAlpha = Math.max(0, Math.min(1, (p.z + 1.2) / 2.4));

      if (p.accent) {
        // Blue accent node with glow
        const glowR = p.size * 4;
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grd.addColorStop(0, BLUE_RGBA + (depthAlpha * 0.7) + ')');
        grd.addColorStop(1, BLUE_RGBA + '0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = BLUE;
        ctx.fill();
      } else {
        const alpha = p.baseAlpha * depthAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.w, 0, Math.PI * 2);
        ctx.fillStyle = MESH_COLOR + alpha + ')';
        ctx.fill();
      }
    });

    // ── Labels (IDEAS / TECNOLOGÍA / RESULTADOS) ──────────────
    const labelX = W - (isMobile ? 60 : 80);
    const labelY = H * 0.22;
    const labels = ['IDEAS', 'TECNOLOGÍA', 'RESULTADOS'];
    ctx.font = `500 ${isMobile ? 7 : 8.5}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '0.12em';
    ctx.textAlign = 'right';
    labels.forEach((lbl, i) => {
      ctx.fillStyle = 'rgba(16,24,32,' + (0.22 - i * 0.04) + ')';
      ctx.fillText(lbl, labelX, labelY + i * 16);
    });

    // ── Slide counter ─────────────────────────────────────────
    ctx.font = `600 ${isMobile ? 9 : 11}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(16,24,32,0.25)';
    ctx.fillText('01 — 04', W - 20, H - 20);
  }

  /* ─── Animation loop ─────────────────────────────────────── */
  function tick() {
    if (!reducedMotion) {
      rotX += ROT_X;
      rotY += ROT_Y;

      // Lerp toward cursor target
      rotX += (targetRotX - rotX) * 0.04;
      rotY += (targetRotY - rotY) * 0.04;
    }

    draw();

    if (!reducedMotion) {
      raf = requestAnimationFrame(tick);
    }
  }

  /* ─── Resize handler ─────────────────────────────────────── */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width  || window.innerWidth * 0.5;
    H = rect.height || 500;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = W / 2;
    cy = H / 2;
    scale = Math.min(W, H) * 0.36;
    isMobile = W < 768;
    generatePoints();

    if (reducedMotion) draw();
  }

  /* ─── Mouse parallax ─────────────────────────────────────── */
  function onMouseMove(e) {
    if (isMobile || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
    const ny = (e.clientY - rect.top)  / rect.height - 0.5;
    targetRotX = 0.32 + Math.max(-PARALLAX_MAX, Math.min(PARALLAX_MAX, ny * PARALLAX_FACTOR * Math.PI));
    targetRotY = 0.18 + Math.max(-PARALLAX_MAX, Math.min(PARALLAX_MAX, nx * PARALLAX_FACTOR * Math.PI));
  }

  /* ─── Init ───────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById('parametric-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d', { alpha: true });
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resize();

    if (!reducedMotion) {
      raf = requestAnimationFrame(tick);
      running = true;
    } else {
      draw(); // single static frame
    }

    // Mouse parallax
    document.addEventListener('mousemove', onMouseMove, { passive: true });

    // Responsive resize (debounced)
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        resize();
        if (!reducedMotion) raf = requestAnimationFrame(tick);
      }, 200);
    });

    // Pause when hidden (battery/perf)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
      } else if (!reducedMotion) {
        raf = requestAnimationFrame(tick);
      }
    });
  }

  return { init };
})();
