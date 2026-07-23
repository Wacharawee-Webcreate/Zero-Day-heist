/* ============================================================
   ZERO DAY HEIST — Board definition + SVG renderer
   36 tiles in a ring. Tile 0 = Vault Entrance (START).
   Gates at 8, 17, 26, 35 — each locked per player.
   ============================================================ */

window.Board = (() => {

  const N = 36;

  // tile types: start | node | firewall | surge | gate
  const LAYOUT = [];
  LAYOUT[0] = { type: 'start' };
  const GATES = {
    8:  { cat: 'algebra',     name: 'Gate α — Algebra' },
    17: { cat: 'geometry',    name: 'Gate β — Geo & Trig' },
    26: { cat: 'functions',   name: 'Gate γ — Functions' },
    35: { cat: 'probability', name: 'Gate δ — Probability' }
  };
  const FIREWALLS = [3, 7, 12, 16, 20, 24, 28, 32];
  const SURGES = [5, 10, 15, 21, 25, 30, 34];

  for (let i = 1; i < N; i++) {
    if (GATES[i]) LAYOUT[i] = { type: 'gate', gate: GATES[i] };
    else if (FIREWALLS.includes(i)) LAYOUT[i] = { type: 'firewall' };
    else if (SURGES.includes(i)) LAYOUT[i] = { type: 'surge' };
    else LAYOUT[i] = { type: 'node' };
  }

  const TILE_INFO = {
    start:    { glyph: '▶', label: 'Vault Entrance', cls: 'tile-start' },
    node:     { glyph: '◆', label: 'Data Node — solve a challenge for shards', cls: 'tile-node' },
    firewall: { glyph: '⚠', label: 'Firewall — quick problem or get pushed back', cls: 'tile-firewall' },
    surge:    { glyph: '✦', label: 'Power Surge — draw an Exploit Chip', cls: 'tile-surge' },
    gate:     { glyph: '⬟', label: 'Cipher Gate — pay 3 shards, solve to earn a Key Fragment', cls: 'tile-gate' }
  };

  // ---------- geometry ----------
  const SIZE = 900, CX = 450, CY = 450, R = 375;

  function tileCenter(i) {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang), ang };
  }

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // regular polygon points string (n sides, radius r, rotated so a point faces up)
  function polyPoints(cx, cy, r, n, rot = -Math.PI / 2) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  // each tile type keeps its own housing shape so the board reads at a glance
  function shapeFor(type, cx, cy, r, cls, parent) {
    switch (type) {
      case 'gate':     return el('polygon', { points: polyPoints(cx, cy, r, 5), class: cls }, parent);
      case 'firewall': return el('polygon', { points: polyPoints(cx, cy, r, 4, Math.PI / 4 - Math.PI / 2), class: cls }, parent); // diamond
      case 'surge':    return el('polygon', { points: polyPoints(cx, cy, r, 6), class: cls }, parent);
      default:         return el('circle', { cx, cy, r, class: cls }, parent);
    }
  }

  const HOUSING_R = { gate: 33, firewall: 31, surge: 30, start: 31, node: 27 };

  // a keyhole, engraved into the lock face
  function keyhole(cx, cy, parent) {
    const g = el('g', { class: 'keyhole' }, parent);
    el('circle', { cx, cy: cy - 4, r: 4.4, fill: '#151920' }, g);
    el('polygon', {
      points: `${cx - 1.4},${cy - 1} ${cx + 1.4},${cy - 1} ${cx + 3.4},${cy + 9} ${cx - 3.4},${cy + 9}`,
      fill: '#151920'
    }, g);
    return g;
  }

  let svg, tokenLayer, tileEls = [];

  function render(container) {
    container.innerHTML = '';
    tileEls = [];
    svg = el('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'board-svg' });
    container.appendChild(svg);

    // defs: glow filter + brushed-metal gradients for the vault door
    const defs = el('defs', {}, svg);
    const filt = el('filter', { id: 'glow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: 6, result: 'blur' }, filt);
    const merge = el('feMerge', {}, filt);
    el('feMergeNode', { in: 'blur' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    const grad = (id, stops, cx = '38%', cy = '30%') => {
      const g = el('radialGradient', { id, cx, cy, r: '85%' }, defs);
      stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
    };
    grad('gFrame', [['0%', '#8d97a8'], ['45%', '#565f6e'], ['80%', '#39404c'], ['100%', '#272d37']]);
    grad('gDoor',  [['0%', '#77818f'], ['50%', '#4a525f'], ['100%', '#313742']]);
    grad('gHub',   [['0%', '#aeb8c6'], ['60%', '#5f6876'], ['100%', '#3a414d']]);
    grad('gBolt',  [['0%', '#c3ccd8'], ['55%', '#79828f'], ['100%', '#454c58']], '32%', '28%');

    // solid steel band the locks are mounted on
    el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: '#262b34', 'stroke-width': 94 }, svg);
    el('circle', { cx: CX, cy: CY, r: R - 47, fill: 'none', stroke: '#14171e', 'stroke-width': 2.5 }, svg);
    el('circle', { cx: CX, cy: CY, r: R + 47, fill: 'none', stroke: '#14171e', 'stroke-width': 2.5 }, svg);

    // locking bars: steel bolts radiating from the vault door to the band
    for (let i = 0; i < N; i += 3) {
      const a = ((i + 1.5) / N) * Math.PI * 2 - Math.PI / 2;
      const x1 = CX + 168 * Math.cos(a), y1 = CY + 168 * Math.sin(a);
      const x2 = CX + (R - 44) * Math.cos(a), y2 = CY + (R - 44) * Math.sin(a);
      el('line', { x1, y1, x2, y2, stroke: '#14171e', 'stroke-width': 15, 'stroke-linecap': 'round' }, svg);
      el('line', { x1, y1, x2, y2, stroke: '#3c434f', 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
      el('circle', { cx: x2, cy: y2, r: 5.5, fill: '#79828f', stroke: '#14171e', 'stroke-width': 1.5 }, svg);
    }

    // vault core — a bank-vault door: steel frame, riveted ring, spoke wheel, name plate
    const core = el('g', { class: 'vault-core' }, svg);

    // outer frame + rivets
    el('circle', { cx: CX, cy: CY, r: 170, fill: 'url(#gFrame)', stroke: '#151920', 'stroke-width': 5 }, core);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      const bx = CX + 152 * Math.cos(a), by = CY + 152 * Math.sin(a);
      el('circle', { cx: bx, cy: by, r: 7, fill: 'url(#gBolt)', stroke: '#171b22', 'stroke-width': 1.5 }, core);
    }

    // the door itself, with machined grooves
    el('circle', { cx: CX, cy: CY, r: 132, fill: 'url(#gDoor)', stroke: '#1d222b', 'stroke-width': 4 }, core);
    el('circle', { cx: CX, cy: CY, r: 114, fill: 'none', stroke: '#00000038', 'stroke-width': 3 }, core);
    el('circle', { cx: CX, cy: CY, r: 110, fill: 'none', stroke: '#ffffff10', 'stroke-width': 1.5 }, core);

    // current player's progress, stamped above the wheel
    const t4 = el('text', { x: CX, y: CY - 84, class: 'core-status', 'text-anchor': 'middle', id: 'core-status' }, core);
    t4.textContent = '';

    // locking wheel: three spokes with end-knobs, rim, hub
    [0, 60, 120].forEach(deg => {
      const a = (deg * Math.PI) / 180;
      const x1 = CX - 62 * Math.cos(a), y1 = CY - 62 * Math.sin(a);
      const x2 = CX + 62 * Math.cos(a), y2 = CY + 62 * Math.sin(a);
      el('line', { x1, y1, x2, y2, stroke: '#151920', 'stroke-width': 13, 'stroke-linecap': 'round' }, core);
      el('line', { x1, y1, x2, y2, stroke: '#8d97a8', 'stroke-width': 8, 'stroke-linecap': 'round' }, core);
      [[x1, y1], [x2, y2]].forEach(([kx, ky]) =>
        el('circle', { cx: kx, cy: ky, r: 6.5, fill: 'url(#gBolt)', stroke: '#151920', 'stroke-width': 1.5 }, core));
    });
    el('circle', { cx: CX, cy: CY, r: 64, fill: 'none', stroke: '#151920', 'stroke-width': 15 }, core);
    el('circle', { cx: CX, cy: CY, r: 64, fill: 'none', stroke: '#79828f', 'stroke-width': 9 }, core);
    el('circle', { cx: CX, cy: CY, r: 20, fill: 'url(#gHub)', stroke: '#151920', 'stroke-width': 3 }, core);
    el('circle', { cx: CX, cy: CY, r: 7, fill: '#2b313c', stroke: '#151920', 'stroke-width': 2 }, core);

    // engraved name plate, screwed onto the door
    el('rect', { x: CX - 78, y: CY + 68, width: 156, height: 32, rx: 5, fill: '#232830', stroke: '#12151b', 'stroke-width': 2 }, core);
    el('rect', { x: CX - 76, y: CY + 70, width: 152, height: 2, rx: 1, fill: '#ffffff14' }, core);
    [[CX - 68, CY + 84], [CX + 68, CY + 84]].forEach(([sx, sy]) =>
      el('circle', { cx: sx, cy: sy, r: 3, fill: 'url(#gBolt)', stroke: '#12151b' }, core));
    const t1 = el('text', { x: CX, y: CY + 89, class: 'vplate-title', 'text-anchor': 'middle' }, core);
    t1.textContent = 'ZERO DAY VAULT';
    const t3 = el('text', { x: CX, y: CY + 117, class: 'core-need', 'text-anchor': 'middle', id: 'core-need' }, core);
    t3.textContent = '';

    // tiles: each one is a lock cylinder bolted onto the band
    for (let i = 0; i < N; i++) {
      const c = tileCenter(i);
      const type = LAYOUT[i].type;
      const info = TILE_INFO[type];
      const g = el('g', { class: `tile ${info.cls}`, 'data-idx': i }, svg);
      const title = el('title', {}, g);
      title.textContent = `#${i} · ${type === 'gate' ? LAYOUT[i].gate.name : info.label}`;

      const hr = HOUSING_R[type];
      shapeFor(type, c.x, c.y, hr, 'tile-house', g);          // steel housing
      shapeFor(type, c.x, c.y, hr * 0.72, 'tile-face', g);    // coloured lock face

      if (type === 'start') {
        // the vault entrance is the one open door in the ring
        const glyph = el('text', { x: c.x, y: c.y + 1, class: 'tile-glyph', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
        glyph.textContent = '▶';
      } else {
        keyhole(c.x, c.y - 2, g);
      }
      if (type === 'gate') {
        const catIcon = window.MathGen.CATEGORIES[LAYOUT[i].gate.cat].icon;
        const cat = el('text', { x: c.x, y: c.y + 47, class: 'gate-cat', 'text-anchor': 'middle' }, g);
        cat.textContent = catIcon;
      }
      tileEls[i] = g;
    }

    tokenLayer = el('g', { class: 'token-layer' }, svg);
  }

  const TOKEN_OFFSETS = [[-14, -14], [14, -14], [-14, 14], [14, 14]];

  function drawTokens(players, currentIdx) {
    if (!tokenLayer) return;
    tokenLayer.innerHTML = '';
    players.forEach((p, pi) => {
      const c = tileCenter(p.pos);
      const [ox, oy] = TOKEN_OFFSETS[pi];
      const g = el('g', { class: 'token' + (pi === currentIdx ? ' token-active' : '') }, tokenLayer);
      el('circle', { cx: c.x + ox, cy: c.y + oy, r: 13, fill: p.color, class: 'token-dot' }, g);
      const ic = el('text', {
        x: c.x + ox, y: c.y + oy + 1, class: 'token-icon',
        'text-anchor': 'middle', 'dominant-baseline': 'central'
      }, g);
      ic.textContent = p.icon || '●';
      const t = el('title', {}, g);
      t.textContent = p.name;
    });
  }

  function setCoreNeed(text) {
    const t = document.getElementById('core-need');
    if (t) t.textContent = text;
  }

  // second line in the vault core: the current player's progress toward it
  function setCoreStatus(text, ready) {
    const t = document.getElementById('core-status');
    if (t) {
      t.textContent = text;
      t.classList.toggle('ready', !!ready);
    }
  }

  // pulse the Vault Entrance when the current player has enough keys
  function markVaultReady(on) {
    if (tileEls[0]) tileEls[0].classList.toggle('tile-vault-ready', !!on);
  }

  function highlightTile(i, on) {
    if (tileEls[i]) tileEls[i].classList.toggle('tile-hot', !!on);
  }

  function clearHighlights() {
    tileEls.forEach(t => t && t.classList.remove('tile-hot'));
  }

  return {
    N, LAYOUT, GATES,
    tile: (i) => LAYOUT[i],
    isGate: (i) => LAYOUT[i].type === 'gate',
    render, drawTokens, setCoreNeed, setCoreStatus, markVaultReady, highlightTile, clearHighlights
  };
})();
