/* ═══ CL Developer — Hero identity animation ═══
 *
 * Ciclo (≈15.4 s, en loop):
 *   1. Partículas dispersas se reúnen y forman la figura wireframe   (2.6 s)
 *   2. La figura rota 360° completos                                  (5.0 s)
 *   3. Colapsa: los puntos se unen y forman la "CL"; el punto azul
 *      aparece en el centro de la composición                         (2.4 s)
 *   4. El punto azul viaja a su posición junto a la L                 (0.9 s)
 *   5. El logo se sostiene                                            (3.0 s)
 *   6. Se dispersa de nuevo y el ciclo vuelve a empezar               (1.5 s)
 *
 * Canvas 2D, sin dependencias. El logo se dibuja desde los mismos paths SVG
 * que usa el header (única fuente de verdad) y de ellos se extraen los puntos.
 *
 * Rendimiento: animación por tiempo (no por frames), DPR limitado, menos
 * partículas en móvil, se pausa fuera de pantalla / pestaña oculta y
 * respeta prefers-reduced-motion (logo estático).
 */

const parametric = (() => {

  /* ─── Marca ─────────────────────────────────────────────── */
  const INK  = '16,24,32';
  const BLUE = '52,120,246';

  // Logo (viewBox 177 × 126) — mismos paths que el SVG del header
  const LOGO_W = 177, LOGO_H = 126;
  const PATH_C = 'M109 0H54C46 0.6 41.5 4 37.4 7L6.2 38.2C4.3 40.5 1 46.5 0 54V63C0 69 2.5 74.5 7 79.5L31.2 103.6C34 105.8 37 107 40 107H79.5V85H47C32 85 21 73.5 21 59V46C21 31 29 19 42 18H92L109 0Z';
  const PATH_L = 'M91.3 29H110V107H166.8L148 126H91.3Z';
  const DOT = { x: 167.8, y: 89.4, r: 8.6 };
  const CENTER = { x: LOGO_W / 2, y: LOGO_H / 2 };
  const LOGO_UNITS = 2.15;               // ancho del logo en unidades de mundo

  /* ─── Línea de tiempo (segundos) ────────────────────────── */
  const T_GATHER   = 2.6;
  const T_ROTATE   = 5.0;
  const T_COLLAPSE = 2.4;
  const T_DOT      = 0.9;
  const T_HOLD     = 3.0;
  const T_SCATTER  = 1.5;

  const A1 = T_GATHER;                   // fin de la formación
  const A2 = A1 + T_ROTATE;              // fin de la rotación
  const A3 = A2 + T_COLLAPSE;            // logo formado, punto al centro
  const A4 = A3 + T_DOT;                 // punto en su sitio
  const A5 = A4 + T_HOLD;                // fin del sostenido
  const CYCLE = A5 + T_SCATTER;          // 15.4 s

  /* ─── Estado ────────────────────────────────────────────── */
  let canvas, ctx, W, H, cx, cy, fov, dpr = 1;
  let N = 0, NU = 0, NV = 0;
  let isMobile = false, reducedMotion = false;
  let running = false, visible = true, raf = 0;
  let clock = 0, last = 0;
  let resizeTimer = 0;
  let parX = 0, parY = 0, tgtParX = 0, tgtParY = 0;

  let Wx, Wy, Wz;          // posición sobre la figura
  let Sx, Sy, Sz, Sph;     // posición dispersa + fase de deriva
  let Tx, Ty;              // destino en el logo (mundo)
  let size, baseA, role;   // role: 0 = logo, 1 = ambiente, 2 = nodo azul
  let dG, dC, dS;          // retardos por partícula (reunir / colapsar / dispersar)
  let Px, Py, Pa;          // salida proyectada por frame
  let bokeh = [];
  let accent = [];         // índices de nodos azules
  let accentLinks = [];    // pares para la red constelación
  let dotWorld = [0, 0];   // posición final del punto azul en mundo

  let pathC, pathL, spriteBlue, spriteBokeh;

  /* ─── Utilidades ────────────────────────────────────────── */
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const easeIO  = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeSine = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  function rng(seed) {                   // mulberry32 → resultado reproducible
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ─── Figura: banda reglada con una torsión completa ────── */
  function surface(u, v) {
    const A = 0.86, B = 0.66, w = 0.36;
    const cu = Math.cos(u), su = Math.sin(u);
    const ch = Math.cos(u), sh = Math.sin(u);
    return [
      A * cu + w * v * ch * cu,
      B * su + w * v * ch * su,
      w * v * sh,
    ];
  }

  /* ─── Puntos del logo a partir del path vectorial ───────── */
  function sampleLogo(count) {
    const S = 4;                          // resolución de muestreo
    const off = document.createElement('canvas');
    off.width = LOGO_W * S; off.height = LOGO_H * S;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.scale(S, S);
    o.fillStyle = '#000';
    o.fill(pathC); o.fill(pathL);
    const data = o.getImageData(0, 0, off.width, off.height).data;

    let area = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 127) area++;
    area /= S * S;
    const g = Math.sqrt(area / count);    // celda de la malla con jitter
    const rand = rng(7);
    const pts = [];
    for (let y = 0; y < LOGO_H; y += g) {
      for (let x = 0; x < LOGO_W; x += g) {
        const px = x + rand() * g, py = y + rand() * g;
        const ix = Math.floor(px * S), iy = Math.floor(py * S);
        if (ix < off.width && iy < off.height && data[(iy * off.width + ix) * 4 + 3] > 127) {
          pts.push([px, py]);
        }
      }
    }
    return pts;
  }

  /* ─── Construcción de partículas ────────────────────────── */
  function build() {
    const rand = rng(1234);
    NU = isMobile ? 54 : 80;
    NV = isMobile ? 14 : 22;
    N = NU * NV;

    Wx = new Float32Array(N); Wy = new Float32Array(N); Wz = new Float32Array(N);
    Sx = new Float32Array(N); Sy = new Float32Array(N); Sz = new Float32Array(N); Sph = new Float32Array(N);
    Tx = new Float32Array(N); Ty = new Float32Array(N);
    size = new Float32Array(N); baseA = new Float32Array(N); role = new Uint8Array(N);
    dG = new Float32Array(N); dC = new Float32Array(N); dS = new Float32Array(N);
    Px = new Float32Array(N); Py = new Float32Array(N); Pa = new Float32Array(N);

    for (let iu = 0; iu < NU; iu++) {
      for (let iv = 0; iv < NV; iv++) {
        const i = iu * NV + iv;
        const u = (iu / NU) * Math.PI * 2;
        const v = (iv / (NV - 1)) * 2 - 1;
        const p = surface(u, v);
        Wx[i] = p[0]; Wy[i] = p[1]; Wz[i] = p[2];
      }
    }

    // Dispersión: dentro del lienzo, con más densidad cerca del centro
    const hx = W / (2 * fov) * 0.98, hy = H / (2 * fov) * 0.98;
    for (let i = 0; i < N; i++) {
      const a = rand() * Math.PI * 2, r = Math.pow(rand(), 0.6);
      Sx[i] = Math.cos(a) * r * hx * 1.05;
      Sy[i] = Math.sin(a) * r * hy * 1.05;
      Sz[i] = (rand() - 0.5) * 1.4;
      Sph[i] = rand() * Math.PI * 2;
      size[i] = 0.55 + rand() * 1.15;
      baseA[i] = 0.34 + rand() * 0.55;
      dG[i] = rand() * 0.75;
      dC[i] = rand() * 0.5;
      dS[i] = rand() * 0.55;
    }

    // Logo: puntos del path, escala en unidades de mundo
    const ks = LOGO_UNITS / LOGO_W;
    const logoPts = sampleLogo(isMobile ? 520 : 1050);
    const toWorld = p => [(p[0] - CENTER.x) * ks, (p[1] - CENTER.y) * ks];
    dotWorld = toWorld([DOT.x, DOT.y]);

    // Nodos azules: repartidos uniformemente a lo largo de la figura
    const nAcc = isMobile ? 9 : 13;
    accent = [];
    for (let k = 0; k < nAcc; k++) {
      const iu = Math.floor((k / nAcc) * NU);
      const iv = k % 3 === 0 ? NV >> 1 : (k % 3 === 1 ? 2 : NV - 3);
      accent.push(iu * NV + iv);
    }
    const isAccent = new Set(accent);

    // Emparejamiento por ángulo → convergencia en espiral coherente
    const cand = [];
    for (let i = 0; i < N; i++) if (!isAccent.has(i)) cand.push(i);
    cand.sort((a, b) => Math.atan2(Wy[a], Wx[a]) - Math.atan2(Wy[b], Wx[b]));
    const nLogo = Math.min(logoPts.length, cand.length);
    const step = cand.length / nLogo;
    const chosen = [];
    for (let k = 0; k < nLogo; k++) chosen.push(cand[Math.floor(k * step)]);
    const lp = logoPts.map(toWorld).sort((a, b) =>
      Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    role.fill(1);
    chosen.forEach((idx, k) => { role[idx] = 0; Tx[idx] = lp[k][0]; Ty[idx] = lp[k][1]; });

    const dotC = toWorld([CENTER.x, CENTER.y]);
    accent.forEach(idx => {
      role[idx] = 2;
      const a = rand() * Math.PI * 2, r = rand() * 0.035;
      Tx[idx] = dotC[0] + Math.cos(a) * r;
      Ty[idx] = dotC[1] + Math.sin(a) * r;
      size[idx] = 2.6 + rand() * 1.4;
      baseA[idx] = 1;
    });

    // Constelación entre nodos azules (2 vecinos más cercanos en la figura)
    accentLinks = [];
    accent.forEach((a, ia) => {
      accent.map((b, ib) => [ib, (Wx[a] - Wx[b]) ** 2 + (Wy[a] - Wy[b]) ** 2 + (Wz[a] - Wz[b]) ** 2])
        .filter(d => d[0] !== ia).sort((p, q) => p[1] - q[1]).slice(0, 2)
        .forEach(d => accentLinks.push([ia, d[0]]));
    });

    // Bokeh ambiente (esferas desenfocadas, no participan en la figura)
    bokeh = [];
    const nB = isMobile ? 8 : 16;
    for (let k = 0; k < nB; k++) {
      bokeh.push({
        x: (rand() * 2 - 1) * hx, y: (rand() * 2 - 1) * hy,
        r: 4 + rand() * 9, a: 0.10 + rand() * 0.16, ph: rand() * 6.28, sp: 0.12 + rand() * 0.25,
      });
    }
  }

  /* ─── Sprites (precalculados una sola vez) ──────────────── */
  function makeSprite(rgb, px, core) {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    gr.addColorStop(0, `rgba(${rgb},${core})`);
    gr.addColorStop(0.35, `rgba(${rgb},${core * 0.45})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, px, px);
    return c;
  }

  /* ─── Dibujo ────────────────────────────────────────────── */
  function draw(t, T) {
    const gather   = seg(t, 0, A1);
    const rotate   = seg(t, A1, A2);
    const collapse = seg(t, A2, A3);
    const dotMove  = seg(t, A3, A4);
    const scatter  = seg(t, A5, CYCLE);
    const figure   = 1 - easeIO(seg(t, A2, A2 + 1.4));   // peso de cámara/parallax

    ctx.clearRect(0, 0, W, H);

    // Cámara: giro 360° sobre Y + inclinación suave (sólo afecta a la figura)
    const ang  = easeSine(rotate) * Math.PI * 2 + parY * figure;
    const tilt = 0.34 * figure + parX * figure;
    const cY = Math.cos(ang), sY = Math.sin(ang);
    const cX = Math.cos(tilt), sX = Math.sin(tilt);

    // Logo sólido (crossfade desde las partículas) y contorno fantasma
    const fillIn  = easeIO(seg(t, A2 + 1.55, A3 + 0.2));
    const fillOut = easeIO(seg(t, A5, A5 + 0.55));
    const fillA   = fillIn * (1 - fillOut);
    const ghostA  = Math.sin(Math.PI * seg(t, A2 + 0.35, A3 - 0.1)) * 0.6;
    const logoPartVis = 1 - fillIn * 0.97 + fillOut * 0.97;

    // 1) Posición de cada partícula
    for (let i = 0; i < N; i++) {
      const sx = Sx[i] + Math.sin(T * 0.45 + Sph[i]) * 0.05;
      const sy = Sy[i] + Math.cos(T * 0.37 + Sph[i] * 1.7) * 0.05;
      const sz = Sz[i];

      // Posición sobre la figura, con cámara
      const x1 = Wx[i] * cY + Wz[i] * sY;
      const z1 = -Wx[i] * sY + Wz[i] * cY;
      const fx = x1;
      const fy = Wy[i] * cX - z1 * sX;
      const fz = Wy[i] * sX + z1 * cX;

      const r = role[i];
      let ox, oy, oz, alpha = 1;

      if (t < A2) {
        // Reunión (y rotación): dispersión → figura
        const e = easeIO(clamp01((gather - dG[i] / T_GATHER) / (1 - 0.75 / T_GATHER)));
        ox = lerp(sx, fx, e); oy = lerp(sy, fy, e); oz = lerp(sz, fz, e);
        alpha = lerp(0.55, 1, e);
      } else if (t < A3) {
        // Colapso: figura → logo (o de vuelta al ambiente)
        if (r === 1) {
          const e = easeIO(clamp01((collapse - dC[i] / T_COLLAPSE) / 0.7));
          ox = lerp(fx, sx, e); oy = lerp(fy, sy, e); oz = lerp(fz, sz, e);
          alpha = lerp(1, 0.55, e);
        } else {
          const e = easeIO(clamp01((collapse - dC[i] / T_COLLAPSE) / (1 - 0.5 / T_COLLAPSE)));
          const sw = Math.sin(Math.PI * e) * 0.9;        // espiral al converger
          const mx = lerp(fx, Tx[i], e), my = lerp(fy, Ty[i], e);
          const cs = Math.cos(sw), sn = Math.sin(sw);
          ox = mx * cs - my * sn; oy = mx * sn + my * cs;
          oz = lerp(fz, 0, e);
        }
      } else if (t < A5) {
        // Sostenido
        if (r === 1) { ox = sx; oy = sy; oz = sz; alpha = 0.55; }
        else { ox = Tx[i]; oy = Ty[i]; oz = 0; }
      } else {
        // Dispersión final
        if (r === 1) { ox = sx; oy = sy; oz = sz; alpha = 0.55; }
        else {
          const e = easeOut(clamp01((scatter - dS[i] / T_SCATTER) / (1 - 0.55 / T_SCATTER)));
          const fromX = r === 2 ? dotWorld[0] : Tx[i];
          const fromY = r === 2 ? dotWorld[1] : Ty[i];
          ox = lerp(fromX, sx, e); oy = lerp(fromY, sy, e); oz = lerp(0, sz, e);
        }
      }

      const w = 2.8 / (2.8 - oz * 0.3);                   // perspectiva
      Px[i] = cx + ox * fov * w;
      Py[i] = cy + oy * fov * w;
      const depth = clamp01((oz + 1.2) / 2.4);
      Pa[i] = alpha * (0.45 + 0.55 * depth) * baseA[i] * w;
    }

    // 2) Bokeh de fondo
    for (let k = 0; k < bokeh.length; k++) {
      const b = bokeh[k];
      const bx = cx + (b.x + Math.sin(T * b.sp + b.ph) * 0.06) * fov;
      const by = cy + (b.y + Math.cos(T * b.sp * 0.8 + b.ph) * 0.06) * fov;
      const rr = b.r * (0.8 + 0.2 * Math.sin(T * 0.3 + b.ph));
      ctx.globalAlpha = b.a;
      ctx.drawImage(spriteBokeh, bx - rr, by - rr, rr * 2, rr * 2);
    }
    ctx.globalAlpha = 1;

    // 3) Círculo y ejes de construcción (estética de plano técnico)
    const form = easeIO(seg(t, 0.8, A1)) * (1 - easeIO(seg(t, A2, A2 + 1.2)));
    if (form > 0.01) {
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(${INK},${0.10 * form})`;
      ctx.beginPath(); ctx.arc(cx, cy, fov * 1.2, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(${BLUE},${0.38 * form})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - fov * 1.3); ctx.lineTo(cx, cy + fov * 1.3);
      ctx.stroke();
      ctx.fillStyle = `rgba(${BLUE},${0.55 * form})`;
      [-0.95, -0.48, 0, 0.48, 0.95].forEach(k => ctx.fillRect(cx - 3, cy + k * fov - 3, 6, 6));
    }

    // 4) Malla de la figura: líneas regladas + anillos longitudinales
    if (form > 0.02) {
      ctx.beginPath();
      for (let iu = 0; iu < NU; iu++) {
        const b = iu * NV;
        ctx.moveTo(Px[b], Py[b]);
        for (let iv = 1; iv < NV; iv++) ctx.lineTo(Px[b + iv], Py[b + iv]);
      }
      const rings = [0, NV >> 2, NV >> 1, (NV * 3) >> 2, NV - 1];
      for (let q = 0; q < rings.length; q++) {
        const iv = rings[q];
        ctx.moveTo(Px[iv], Py[iv]);
        for (let iu = 1; iu <= NU; iu++) {
          const i = (iu % NU) * NV + iv;
          ctx.lineTo(Px[i], Py[i]);
        }
      }
      ctx.strokeStyle = `rgba(${INK},${0.1 * form})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Constelación entre nodos azules
      ctx.beginPath();
      for (let l = 0; l < accentLinks.length; l++) {
        const a = accent[accentLinks[l][0]], b = accent[accentLinks[l][1]];
        ctx.moveTo(Px[a], Py[a]); ctx.lineTo(Px[b], Py[b]);
      }
      ctx.strokeStyle = `rgba(${BLUE},${0.32 * form})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // 5) Logo: contorno fantasma + relleno sólido
    const k = (LOGO_UNITS * fov) / LOGO_W;
    const lx = cx - CENTER.x * k, ly = cy - CENTER.y * k;
    if (ghostA > 0.01 || fillA > 0.003) {
      ctx.save();
      ctx.translate(lx, ly); ctx.scale(k, k);
      if (ghostA > 0.01) {
        ctx.lineWidth = 1.1 / k;
        ctx.strokeStyle = `rgba(${INK},${ghostA * (1 - fillA)})`;
        ctx.stroke(pathC); ctx.stroke(pathL);
      }
      if (fillA > 0.003) {
        ctx.fillStyle = `rgba(${INK},${fillA})`;
        ctx.fill(pathC); ctx.fill(pathL);
      }
      ctx.restore();
    }

    // 6) Partículas grises, agrupadas por transparencia (4 pasadas)
    const B = 4;
    for (let q = 0; q < B; q++) {
      const lo = q / B, hi = (q + 1) / B;
      ctx.beginPath();
      let any = false;
      for (let i = 0; i < N; i++) {
        if (role[i] === 2) continue;
        const a = Pa[i] * (role[i] === 0 ? logoPartVis : 1);
        const qa = a > 1 ? 1 : a;
        if (qa < lo || (q < B - 1 && qa >= hi)) continue;
        const rr = size[i] * (0.9 + 0.1 * Pa[i]);
        ctx.moveTo(Px[i] + rr, Py[i]);
        ctx.arc(Px[i], Py[i], rr, 0, Math.PI * 2);
        any = true;
      }
      if (any) {
        ctx.fillStyle = `rgba(${INK},${(lo + hi) / 2 * 0.95})`;
        ctx.fill();
      }
    }

    // 7) Nodos azules mientras hay figura / al dispersarse
    if (t < A2 + 1.7 || t >= A5) {
      for (let a = 0; a < accent.length; a++) {
        const i = accent[a];
        const rr = size[i];
        const al = Math.min(1, Pa[i]);
        ctx.globalAlpha = al;
        ctx.drawImage(spriteBlue, Px[i] - rr * 3.2, Py[i] - rr * 3.2, rr * 6.4, rr * 6.4);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(Px[i], Py[i], rr * 0.62, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BLUE},${Math.min(1, al * 1.2)})`;
        ctx.fill();
      }
    }

    // 8) El punto del logo: nace en el centro de la CL y viaja a su sitio
    if (t >= A2 + 1.5 && t < A5 + 0.55) {
      const grow = easeOut(seg(t, A2 + 1.5, A3));
      const fadeOut = 1 - easeIO(seg(t, A5, A5 + 0.45));
      const p = easeIO(dotMove);
      const mx = lerp(CENTER.x, DOT.x, p), my = lerp(CENTER.y, DOT.y, p);
      const rad = lerp(DOT.r * 0.3, DOT.r, easeOut(Math.max(grow * 0.6, p))) * k;
      const px = lx + mx * k, py = ly + my * k;
      const vis = (t >= A3 ? 1 : grow) * fadeOut;
      ctx.globalAlpha = vis * 0.55;
      ctx.drawImage(spriteBlue, px - rad * 2.3, py - rad * 2.3, rad * 4.6, rad * 4.6);
      ctx.globalAlpha = vis;
      ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${BLUE})`; ctx.fill();
      ctx.globalAlpha = 1;
    }

    drawLabels(t);
  }

  /* ─── Rótulos del plano (IDEAS / TECNOLOGÍA / RESULTADOS) ─ */
  function drawLabels(t) {
    const stage = t < A2 ? 0 : (t < A3 ? 1 : (t < A5 ? 2 : 0));
    const lx = W - (isMobile ? 16 : 28);
    const ly = H * (isMobile ? 0.1 : 0.12);
    ctx.save();
    ctx.font = `500 ${isMobile ? 8 : 9.5}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'right';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.14em';
    ['IDEAS', 'TECNOLOG\u00cdA', 'RESULTADOS'].forEach((txt, i) => {
      ctx.fillStyle = i === stage ? `rgba(${BLUE},0.9)` : `rgba(${INK},0.30)`;
      ctx.fillText(txt, lx, ly + i * (isMobile ? 15 : 18));
    });
    const phase = t < A1 ? 1 : (t < A2 ? 2 : (t < A4 ? 3 : (t < A5 ? 4 : 1)));
    ctx.font = `600 ${isMobile ? 9 : 11}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = `rgba(${INK},0.32)`;
    ctx.fillText('0' + phase + ' \u2014 04', W - 20, H - 18);
    ctx.restore();
  }

  /* ─── Bucle ─────────────────────────────────────────────── */
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    parX += (tgtParX - parX) * 0.05;
    parY += (tgtParY - parY) * 0.05;
    draw(clock % CYCLE, clock);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reducedMotion || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ─── Tamaño ────────────────────────────────────────────── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    isMobile = rect.width < 560 || window.innerWidth < 768;
    dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    W = Math.max(280, rect.width);
    H = Math.max(320, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    fov = Math.min(W, H) * 0.36 * 0.92;
    build();
    if (reducedMotion) drawStatic();
  }

  function drawStatic() { draw(A4 + 0.5, 0); }   // logo completo, sin movimiento

  function onMouseMove(e) {
    if (isMobile || reducedMotion) return;
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tgtParY = Math.max(-0.25, Math.min(0.25, nx * 0.35));
    tgtParX = Math.max(-0.2, Math.min(0.2, ny * 0.3));
  }

  /* ─── Init ──────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById('parametric-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: true });
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;

    pathC = new Path2D(PATH_C);
    pathL = new Path2D(PATH_L);
    spriteBlue = makeSprite(BLUE, 64, 0.95);
    spriteBokeh = makeSprite(INK, 64, 0.55);

    resize();
    if (!reducedMotion) start();

    document.addEventListener('mousemove', onMouseMove, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.05 }).observe(canvas);
    }

    // Si el sistema cambia la preferencia de movimiento en vivo
    const onMq = () => {
      reducedMotion = mq.matches;
      if (reducedMotion) { stop(); drawStatic(); } else start();
    };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
  }

  return { init };
})();
