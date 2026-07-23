/* ============================================================
   ZERO DAY HEIST — Math Problem Engine
   Procedurally generates Grade 9–11 problems with exact answers.
   Every problem returns: { q (html), a (number), hint, sol }
   ============================================================ */

window.MathGen = (() => {

  // ---------- helpers ----------
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[ri(0, arr.length - 1)];
  const riNZ = (a, b) => { let n = 0; while (n === 0) n = ri(a, b); return n; };
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

  function fracStr(n, d) {
    const g = gcd(n, d) || 1;
    n /= g; d /= g;
    if (d < 0) { d = -d; n = -n; }
    return d === 1 ? `${n}` : `${n}/${d}`;
  }

  // Format "+ 5" / "− 5" for building expressions like  3x − 5
  const op = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);
  // Format a signed leading number: −5 or 5
  const sg = (n) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);
  const sup = (b, e) => `${b}<sup>${e}</sup>`;

  // format quadratic  x² + bx + c  nicely (skips zero terms, hides coefficient 1)
  function quadStr(a, b, c) {
    let s = (a === 1 ? '' : a === -1 ? '−' : sg(a)) + 'x²';
    if (b !== 0) {
      const coef = Math.abs(b) === 1 ? '' : Math.abs(b);
      s += ` ${b < 0 ? '−' : '+'} ${coef}x`;
    }
    if (c !== 0) s += ` ${op(c)}`;
    return s;
  }

  // ============================================================
  // CATEGORY GENERATORS  — gens[category][tier] = [fn, fn, ...]
  // ============================================================
  const gens = {

    // ---------------- ALGEBRA ----------------
    algebra: {
      1: [
        () => { // ax + b = c
          const a = ri(2, 9), x = riNZ(-9, 9), b = riNZ(-12, 12), c = a * x + b;
          return {
            q: `Solve for x:<br><b>${a}x ${op(b)} = ${c}</b>`,
            a: x,
            hint: `Move ${op(b).replace(' ', '')} to the other side first, then divide by ${a}.`,
            sol: `x = ${x}`
          };
        },
        () => { // x/a + b = c
          const a = ri(2, 6), m = riNZ(-8, 8), b = riNZ(-9, 9), x = a * m, c = m + b;
          return {
            q: `Solve for x:<br><b>x / ${a} ${op(b)} = ${c}</b>`,
            a: x,
            hint: `Subtract ${b} from both sides, then multiply by ${a}.`,
            sol: `x = ${x}`
          };
        },
        () => { // a(x + b) = c
          const a = ri(2, 7), x = riNZ(-8, 8), b = riNZ(-6, 6), c = a * (x + b);
          return {
            q: `Solve for x:<br><b>${a}(x ${op(b)}) = ${c}</b>`,
            a: x,
            hint: `Divide both sides by ${a} first — it's faster than expanding.`,
            sol: `x = ${x}`
          };
        }
      ],
      2: [
        () => { // 2x2 system
          const x = riNZ(-4, 5), y = riNZ(-4, 5);
          const a1 = ri(1, 4), b1 = ri(1, 4), a2 = ri(1, 4), b2 = ri(1, 4);
          const c1 = a1 * x + b1 * y, c2 = a2 * x - b2 * y;
          const want = pick(['x', 'y']);
          const co = (n) => (n === 1 ? '' : n); // hide coefficient 1
          return {
            q: `Solve the system:<br><b>${co(a1)}x + ${co(b1)}y = ${c1}<br>${co(a2)}x − ${co(b2)}y = ${c2}</b><br>What is ${want}?`,
            a: want === 'x' ? x : y,
            hint: `Multiply the equations so the y-coefficients match, then add them to eliminate y.`,
            sol: `x = ${x}, y = ${y}`
          };
        },
        () => { // greatest integer satisfying inequality
          const a = ri(2, 7), m = ri(-5, 8), b = riNZ(-9, 9), c = a * m + b;
          return {
            q: `What is the <b>greatest integer</b> x that satisfies:<br><b>${a}x ${op(b)} ≤ ${c}</b>`,
            a: m,
            hint: `Solve it like an equation: x ≤ ${m}. Which integer is largest?`,
            sol: `x ≤ ${m}, so the answer is ${m}`
          };
        },
        () => { // proportion
          const a = ri(2, 9), c = ri(2, 9), k = ri(2, 8);
          const x = a * k, b = c * k;
          return {
            q: `Solve the proportion for x:<br><b>x / ${a} = ${b} / ${c}</b>`,
            a: x,
            hint: `Cross-multiply: ${c}·x = ${a}·${b}.`,
            sol: `x = ${x}`
          };
        }
      ],
      3: [
        () => { // consecutive even integers
          const n = ri(-10, 20) * 2, s = n + (n + 2) + (n + 4);
          return {
            q: `Three <b>consecutive even integers</b> add up to <b>${s}</b>.<br>What is the largest of the three?`,
            a: n + 4,
            hint: `Call them n, n+2, n+4. Then 3n + 6 = ${s}.`,
            sol: `${n}, ${n + 2}, ${n + 4} → largest is ${n + 4}`
          };
        },
        () => { // reverse percent
          const p = pick([10, 20, 25, 50]), P = ri(2, 12) * 20;
          const V = P * (100 + p) / 100;
          return {
            q: `A price was increased by <b>${p}%</b> and is now <b>$${V}</b>.<br>What was the original price (in $)?`,
            a: P,
            hint: `New price = original × ${(100 + p) / 100}. Divide, don't subtract ${p}%!`,
            sol: `$${V} ÷ ${(100 + p) / 100} = $${P}`
          };
        },
        () => { // ticket word problem
          const A = ri(8, 14), S = ri(4, 7);
          const na = ri(3, 9), ns = ri(3, 9);
          const T = na + ns, R = na * A + ns * S;
          return {
            q: `A show sold <b>${T} tickets</b> for a total of <b>$${R}</b>.<br>Adult tickets cost $${A}, student tickets cost $${S}.<br>How many <b>adult</b> tickets were sold?`,
            a: na,
            hint: `Let a = adult tickets. Then students = ${T} − a, and ${A}a + ${S}(${T} − a) = ${R}.`,
            sol: `${na} adult and ${ns} student tickets`
          };
        }
      ]
    },

    // ---------------- QUADRATICS ----------------
    quadratic: {
      1: [
        () => { // larger root of factorable monic quadratic
          let p = riNZ(-8, 8), q = riNZ(-8, 8);
          if (p === q) q = p + ri(1, 3);
          const B = -(p + q), C = p * q;
          return {
            q: `Solve and enter the <b>larger root</b>:<br><b>${quadStr(1, B, C)} = 0</b>`,
            a: Math.max(p, q),
            hint: `Find two numbers that multiply to ${C} and add to ${-B}... wait — that add to ${-B}? Careful with signs: they must add to ${-B}.`,
            sol: `(x ${op(-p)})(x ${op(-q)}) = 0 → x = ${p} or x = ${q}`
          };
        },
        () => { // x² = k
          const x = ri(2, 15), k = x * x;
          return {
            q: `If <b>x² = ${k}</b> and x &gt; 0, what is x?`,
            a: x,
            hint: `What number times itself gives ${k}?`,
            sol: `x = √${k} = ${x}`
          };
        },
        () => { // evaluate quadratic
          const b = riNZ(-6, 6), c = riNZ(-9, 9), k = riNZ(-5, 5);
          const val = k * k + b * k + c;
          return {
            q: `If <b>f(x) = ${quadStr(1, b, c)}</b>, find <b>f(${sg(k)})</b>.`,
            a: val,
            hint: `Substitute x = ${k}. Watch the sign when squaring!`,
            sol: `f(${k}) = ${k * k} ${op(b * k)} ${op(c)} = ${val}`
          };
        }
      ],
      2: [
        () => { // axis of symmetry / vertex x
          const a = ri(1, 3), xv = riNZ(-5, 5), b = -2 * a * xv, c = riNZ(-9, 9);
          return {
            q: `Find the <b>x-coordinate of the vertex</b> of:<br><b>y = ${quadStr(a, b, c)}</b>`,
            a: xv,
            hint: `The vertex is on the axis of symmetry: x = −b / (2a).`,
            sol: `x = −(${b}) / (2·${a}) = ${xv}`
          };
        },
        () => { // minimum value (complete the square)
          const h = riNZ(-5, 5), b = -2 * h, kmin = ri(-9, 9), c = kmin + h * h;
          return {
            q: `What is the <b>minimum value</b> of:<br><b>y = ${quadStr(1, b, c)}</b>`,
            a: kmin,
            hint: `Complete the square: y = (x ${op(-h)})² ${op(kmin)}.`,
            sol: `y = (x ${op(-h)})² ${op(kmin)} → minimum is ${kmin}`
          };
        },
        () => { // Vieta: sum of roots
          let p = riNZ(-7, 7), q = riNZ(-7, 7);
          const B = -(p + q), C = p * q;
          return {
            q: `Without solving, find the <b>sum of the roots</b> of:<br><b>${quadStr(1, B, C)} = 0</b>`,
            a: p + q,
            hint: `For x² + bx + c = 0, the roots always add up to −b (Vieta's formulas).`,
            sol: `Sum = −(${B}) = ${p + q}`
          };
        }
      ],
      3: [
        () => { // discriminant value
          const a = ri(1, 3), b = riNZ(-9, 9), c = riNZ(-9, 9);
          const D = b * b - 4 * a * c;
          return {
            q: `Compute the <b>discriminant</b> of:<br><b>${quadStr(a, b, c)} = 0</b>`,
            a: D,
            hint: `Discriminant: D = b² − 4ac, with a = ${a}, b = ${b}, c = ${c}.`,
            sol: `D = (${b})² − 4(${a})(${c}) = ${D}`
          };
        },
        () => { // number of real solutions
          const mode = pick([0, 1, 2]);
          let a = 1, b, c;
          if (mode === 1) { const k = riNZ(-6, 6); b = 2 * k; c = k * k; }
          else if (mode === 2) { b = riNZ(-6, 6); c = -ri(1, 9); }  // D = b²+4·|c| > 0
          else { b = riNZ(-4, 4); c = ri(1, 4) + Math.ceil(b * b / 4); } // D < 0
          const D = b * b - 4 * a * c;
          const count = D > 0 ? 2 : D === 0 ? 1 : 0;
          return {
            q: `How many <b>distinct real solutions</b> does this equation have?<br><b>${quadStr(a, b, c)} = 0</b><br>(enter 0, 1, or 2)`,
            a: count,
            hint: `Check the discriminant D = b² − 4ac. Positive → 2, zero → 1, negative → 0.`,
            sol: `D = ${D} → ${count} real solution${count === 1 ? '' : 's'}`
          };
        },
        () => { // non-monic factorable, larger root
          let r1 = riNZ(-6, 6), r2 = riNZ(-6, 6);
          if (r1 === r2) r2 = r1 + ri(1, 3);
          const A = 2, B = -2 * (r1 + r2), C = 2 * r1 * r2;
          return {
            q: `Solve and enter the <b>larger root</b>:<br><b>${quadStr(A, B, C)} = 0</b>`,
            a: Math.max(r1, r2),
            hint: `Every coefficient is even — divide the whole equation by 2 first.`,
            sol: `Divide by 2: ${quadStr(1, B / 2, C / 2)} = 0 → x = ${r1} or ${r2}`
          };
        }
      ]
    },

    // ---------------- FUNCTIONS ----------------
    functions: {
      1: [
        () => {
          const a = riNZ(-6, 6), b = riNZ(-9, 9), k = riNZ(-6, 6);
          return {
            q: `If <b>f(x) = ${a === 1 ? '' : a === -1 ? '−' : sg(a)}x ${op(b)}</b>, find <b>f(${sg(k)})</b>.`,
            a: a * k + b,
            hint: `Substitute x = ${k} and follow the order of operations.`,
            sol: `f(${k}) = ${a}·(${k}) ${op(b)} = ${a * k + b}`
          };
        },
        () => {
          const c = ri(1, 12), k = riNZ(-5, 5);
          return {
            q: `If <b>f(x) = x² − ${c}</b>, find <b>f(${sg(k)})</b>.`,
            a: k * k - c,
            hint: `(${k})² first, then subtract ${c}. Squaring kills the minus sign.`,
            sol: `f(${k}) = ${k * k} − ${c} = ${k * k - c}`
          };
        }
      ],
      2: [
        () => { // slope between two points
          const x1 = ri(-6, 6); let x2 = ri(-6, 6);
          while (x2 === x1) x2 = ri(-6, 6);
          const m = riNZ(-4, 4), y1 = ri(-6, 6), y2 = y1 + m * (x2 - x1);
          return {
            q: `Find the <b>slope</b> of the line through <b>(${x1}, ${y1})</b> and <b>(${x2}, ${y2})</b>.`,
            a: m,
            hint: `slope = (y₂ − y₁) / (x₂ − x₁) — rise over run.`,
            sol: `m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${m}`
          };
        },
        () => { // y-intercept from slope + point
          const m = riNZ(-4, 4), x1 = riNZ(-5, 5), b = ri(-8, 8), y1 = m * x1 + b;
          return {
            q: `A line has slope <b>${sg(m)}</b> and passes through <b>(${x1}, ${y1})</b>.<br>What is its <b>y-intercept</b>?`,
            a: b,
            hint: `y = mx + b → plug in the point: ${y1} = ${m}·(${x1}) + b.`,
            sol: `b = ${y1} − (${m * x1}) = ${b}`
          };
        },
        () => { // solve f(x) = c
          const a = riNZ(2, 6), b = riNZ(-9, 9), x = riNZ(-7, 7), c = a * x + b;
          return {
            q: `If <b>f(x) = ${a}x ${op(b)}</b>, solve <b>f(x) = ${c}</b>.`,
            a: x,
            hint: `Set ${a}x ${op(b)} = ${c} and solve for x.`,
            sol: `x = ${x}`
          };
        }
      ],
      3: [
        () => { // composite
          const a = riNZ(2, 4), b = riNZ(-5, 5), k = riNZ(-3, 3);
          const order = pick(['fg', 'gf']);
          const val = order === 'fg' ? a * (k * k) + b : Math.pow(a * k + b, 2);
          return {
            q: `Let <b>f(x) = ${a}x ${op(b)}</b> and <b>g(x) = x²</b>.<br>Find <b>${order === 'fg' ? 'f(g(' : 'g(f('}${sg(k)}))</b>.`,
            a: val,
            hint: order === 'fg'
              ? `Inside first: g(${k}) = ${k * k}. Then apply f.`
              : `Inside first: f(${k}) = ${a * k + b}. Then square it.`,
            sol: order === 'fg'
              ? `g(${k}) = ${k * k}, then f(${k * k}) = ${val}`
              : `f(${k}) = ${a * k + b}, then (${a * k + b})² = ${val}`
          };
        },
        () => { // inverse function value
          const a = riNZ(2, 5), b = riNZ(-8, 8), k = riNZ(-6, 6), c = a * k + b;
          return {
            q: `If <b>f(x) = ${a}x ${op(b)}</b>, find <b>f<sup>−1</sup>(${sg(c)})</b>.`,
            a: k,
            hint: `f⁻¹(${c}) asks: which x makes f(x) = ${c}?`,
            sol: `${a}x ${op(b)} = ${c} → x = ${k}`
          };
        },
        () => { // transformation of x²
          const h = riNZ(-4, 4), kk = riNZ(-6, 6), m = riNZ(-3, 5);
          const val = (m - h) * (m - h) + kk;
          return {
            q: `The graph of <b>y = x²</b> is shifted <b>${Math.abs(h)} ${h > 0 ? 'right' : 'left'}</b> and <b>${Math.abs(kk)} ${kk >= 0 ? 'up' : 'down'}</b>, giving g(x).<br>Find <b>g(${sg(m)})</b>.`,
            a: val,
            hint: `g(x) = (x − ${sg(h)})² ${op(kk)}.`,
            sol: `g(${m}) = (${m} − ${sg(h)})² ${op(kk)} = ${val}`
          };
        }
      ]
    },

    // ---------------- GEOMETRY & TRIG ----------------
    geometry: {
      1: [
        () => { // hypotenuse
          const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]]);
          return {
            q: `A right triangle has legs <b>${t[0]}</b> and <b>${t[1]}</b>.<br>Find the <b>hypotenuse</b>.`,
            a: t[2],
            hint: `Pythagoras: a² + b² = c².`,
            sol: `√(${t[0]}² + ${t[1]}²) = √${t[2] * t[2]} = ${t[2]}`
          };
        },
        () => { // missing leg
          const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
          return {
            q: `A right triangle has hypotenuse <b>${t[2]}</b> and one leg <b>${t[0]}</b>.<br>Find the <b>other leg</b>.`,
            a: t[1],
            hint: `Rearrange Pythagoras: b² = c² − a².`,
            sol: `√(${t[2]}² − ${t[0]}²) = ${t[1]}`
          };
        },
        () => { // triangle area
          const b = ri(2, 12) * 2, h = ri(3, 12);
          return {
            q: `A triangle has base <b>${b}</b> and height <b>${h}</b>.<br>Find its <b>area</b>.`,
            a: b * h / 2,
            hint: `Area = ½ × base × height.`,
            sol: `½ · ${b} · ${h} = ${b * h / 2}`
          };
        }
      ],
      2: [
        () => { // interior angle of regular polygon
          const n = pick([5, 6, 8, 9, 10, 12]);
          const ang = (n - 2) * 180 / n;
          return {
            q: `Find <b>one interior angle</b> of a regular <b>${n}-sided</b> polygon (in degrees).`,
            a: ang,
            hint: `Total interior angles = (n − 2) × 180°, shared equally among ${n} corners.`,
            sol: `(${n} − 2)·180 / ${n} = ${ang}°`
          };
        },
        () => { // trapezoid area
          const b1 = ri(3, 12), b2 = b1 + ri(2, 8), h = ri(2, 5) * 2;
          return {
            q: `A trapezoid has parallel sides <b>${b1}</b> and <b>${b2}</b>, and height <b>${h}</b>.<br>Find its <b>area</b>.`,
            a: (b1 + b2) * h / 2,
            hint: `Area = ½ (b₁ + b₂) × h.`,
            sol: `½ (${b1} + ${b2}) · ${h} = ${(b1 + b2) * h / 2}`
          };
        },
        () => { // trig ratio in right triangle
          const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
          const which = pick(['sin', 'cos', 'tan']);
          const [oppo, adj, hyp] = t;
          const val = which === 'sin' ? oppo / hyp : which === 'cos' ? adj / hyp : oppo / adj;
          const fs = which === 'sin' ? fracStr(oppo, hyp) : which === 'cos' ? fracStr(adj, hyp) : fracStr(oppo, adj);
          return {
            q: `In a right triangle, the side <b>opposite</b> angle θ is <b>${oppo}</b>, the side <b>adjacent</b> is <b>${adj}</b>, and the hypotenuse is <b>${hyp}</b>.<br>Find <b>${which} θ</b> (fraction or decimal).`,
            a: val,
            hint: `SOH-CAH-TOA: sin = opp/hyp, cos = adj/hyp, tan = opp/adj.`,
            sol: `${which} θ = ${fs}`
          };
        }
      ],
      3: [
        () => { // distance formula
          const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
          const x1 = ri(-6, 6), y1 = ri(-6, 6);
          const x2 = x1 + pick([1, -1]) * t[0], y2 = y1 + pick([1, -1]) * t[1];
          return {
            q: `Find the <b>distance</b> between <b>(${x1}, ${y1})</b> and <b>(${x2}, ${y2})</b>.`,
            a: t[2],
            hint: `d = √((x₂−x₁)² + (y₂−y₁)²).`,
            sol: `√(${t[0]}² + ${t[1]}²) = ${t[2]}`
          };
        },
        () => { // circle area coefficient
          const r = ri(3, 12);
          return {
            q: `A circle has radius <b>${r}</b>. Its area is <b>kπ</b>.<br>What is <b>k</b>?`,
            a: r * r,
            hint: `Area = πr².`,
            sol: `π·${r}² = ${r * r}π → k = ${r * r}`
          };
        },
        () => { // cylinder volume coefficient
          const r = ri(2, 6), h = ri(3, 10);
          return {
            q: `A cylinder has radius <b>${r}</b> and height <b>${h}</b>. Its volume is <b>kπ</b>.<br>What is <b>k</b>?`,
            a: r * r * h,
            hint: `Volume = πr²h.`,
            sol: `${r}² · ${h} = ${r * r * h} → k = ${r * r * h}`
          };
        },
        () => { // sum of interior angles
          const n = ri(5, 12);
          return {
            q: `What is the <b>sum of the interior angles</b> of a <b>${n}-sided</b> polygon (in degrees)?`,
            a: (n - 2) * 180,
            hint: `Split it into (n − 2) triangles from one vertex.`,
            sol: `(${n} − 2) × 180° = ${(n - 2) * 180}°`
          };
        }
      ]
    },

    // ---------------- EXPONENTS & LOGS ----------------
    exponents: {
      1: [
        () => { // evaluate power
          const base = pick([2, 3, 4, 5]);
          const e = base === 2 ? ri(4, 8) : base === 3 ? ri(2, 4) : ri(2, 3);
          return {
            q: `Evaluate: <b>${sup(base, e)}</b>`,
            a: Math.pow(base, e),
            hint: `Multiply ${base} by itself ${e} times.`,
            sol: `${sup(base, e)} = ${Math.pow(base, e)}`
          };
        },
        () => { // product rule
          const a = ri(2, 9), b = ri(2, 9);
          return {
            q: `Simplify: <b>${sup('x', a)} · ${sup('x', b)} = ${sup('x', '?')}</b><br>Enter the exponent.`,
            a: a + b,
            hint: `Same base multiplied → add the exponents.`,
            sol: `x^${a} · x^${b} = x^${a + b}`
          };
        },
        () => { // quotient rule
          const b = ri(2, 6), a = b + ri(2, 8);
          return {
            q: `Simplify: <b>${sup('x', a)} / ${sup('x', b)} = ${sup('x', '?')}</b><br>Enter the exponent.`,
            a: a - b,
            hint: `Same base divided → subtract the exponents.`,
            sol: `x^${a} / x^${b} = x^${a - b}`
          };
        }
      ],
      2: [
        () => { // power of a power
          const a = ri(2, 5), b = ri(2, 5);
          return {
            q: `Simplify: <b>(${sup('x', a)})<sup>${b}</sup> = ${sup('x', '?')}</b><br>Enter the exponent.`,
            a: a * b,
            hint: `Power of a power → multiply the exponents.`,
            sol: `(x^${a})^${b} = x^${a * b}`
          };
        },
        () => { // negative exponent
          const n = ri(2, 5);
          const d = Math.pow(2, n);
          return {
            q: `Evaluate: <b>2<sup>−${n}</sup></b> (fraction or decimal)`,
            a: 1 / d,
            hint: `A negative exponent means "1 over": 2⁻ⁿ = 1/2ⁿ.`,
            sol: `2^−${n} = 1/${d}`
          };
        },
        () => { // mixed product/quotient
          const a = ri(2, 6), b = ri(2, 6), c = ri(1, Math.min(a + b - 1, 6));
          return {
            q: `Simplify: <b>${sup('3', a)} · ${sup('3', b)} / ${sup('3', c)} = ${sup('3', '?')}</b><br>Enter the exponent.`,
            a: a + b - c,
            hint: `Add exponents when multiplying, subtract when dividing.`,
            sol: `${a} + ${b} − ${c} = ${a + b - c}`
          };
        },
        () => { // zero exponent trick
          const a = ri(3, 9), e = ri(2, 3);
          return {
            q: `Evaluate: <b>${sup(a, 0)} + ${sup(2, e)}</b>`,
            a: 1 + Math.pow(2, e),
            hint: `Anything (nonzero) to the power 0 is 1.`,
            sol: `1 + ${Math.pow(2, e)} = ${1 + Math.pow(2, e)}`
          };
        }
      ],
      3: [
        () => { // exponential equation
          const base = pick([2, 3, 5]);
          const x = base === 2 ? ri(3, 8) : base === 3 ? ri(2, 5) : ri(2, 4);
          const N = Math.pow(base, x);
          return {
            q: `Solve for x: <b>${sup(base, 'x')} = ${N}</b>`,
            a: x,
            hint: `Keep multiplying by ${base}: how many steps to reach ${N}?`,
            sol: `${base}^${x} = ${N} → x = ${x}`
          };
        },
        () => { // logarithm
          const base = pick([2, 3, 4, 5]);
          const x = base === 2 ? ri(3, 7) : ri(2, 4);
          const N = Math.pow(base, x);
          return {
            q: `Evaluate: <b>log<sub>${base}</sub> ${N}</b>`,
            a: x,
            hint: `log asks: "${base} to what power gives ${N}?"`,
            sol: `${base}^${x} = ${N}, so log = ${x}`
          };
        },
        () => { // scientific notation
          let a = ri(2, 4), b = ri(2, 3);
          while (a * b >= 10) { a = ri(2, 4); b = ri(2, 3); }
          const m = ri(2, 6), n = ri(2, 6);
          return {
            q: `<b>(${a} × 10<sup>${m}</sup>) · (${b} × 10<sup>${n}</sup>) = ${a * b} × 10<sup>k</sup></b><br>What is k?`,
            a: m + n,
            hint: `Multiply the front numbers; add the powers of 10.`,
            sol: `k = ${m} + ${n} = ${m + n}`
          };
        }
      ]
    },

    // ---------------- PROBABILITY & STATS ----------------
    probability: {
      1: [
        () => { // single die
          const k = ri(2, 5);
          return {
            q: `You roll one fair six-sided die.<br>What is <b>P(rolling ${k} or higher)</b>? (fraction or decimal)`,
            a: (7 - k) / 6,
            hint: `Count the faces that are ≥ ${k}, out of 6.`,
            sol: `${7 - k} faces out of 6 → ${fracStr(7 - k, 6)}`
          };
        },
        () => { // marbles
          const r = ri(2, 6), b = ri(2, 6), g = ri(2, 6), t = r + b + g;
          return {
            q: `A bag holds <b>${r} red</b>, <b>${b} blue</b> and <b>${g} green</b> marbles.<br>What is <b>P(drawing red)</b>? (fraction or decimal)`,
            a: r / t,
            hint: `Favourable outcomes over total: ${r} out of ${t}.`,
            sol: `${fracStr(r, t)}`
          };
        },
        () => { // spinner
          const n = pick([4, 5, 6, 8, 10]);
          return {
            q: `A spinner has <b>${n} equal</b> sections, exactly one marked ★.<br>What is <b>P(landing on ★)</b>? (fraction or decimal)`,
            a: 1 / n,
            hint: `One winning section out of ${n} equal ones.`,
            sol: `1/${n}`
          };
        }
      ],
      2: [
        () => { // two-dice sum
          const s = ri(3, 11);
          const count = 6 - Math.abs(s - 7);
          return {
            q: `You roll <b>two</b> fair dice.<br>What is <b>P(the sum is exactly ${s})</b>? (fraction or decimal)`,
            a: count / 36,
            hint: `There are 36 equally likely pairs. Count the pairs that sum to ${s}.`,
            sol: `${count} pairs out of 36 → ${fracStr(count, 36)}`
          };
        },
        () => { // mean
          const mean = ri(4, 15);
          const d = [riNZ(-3, 3), riNZ(-3, 3), riNZ(-3, 3), riNZ(-3, 3)];
          const vals = [mean + d[0], mean + d[1], mean + d[2], mean + d[3], mean - d[0] - d[1] - d[2] - d[3]];
          return {
            q: `Find the <b>mean</b> of: <b>${vals.join(', ')}</b>`,
            a: mean,
            hint: `Add all five values, divide by 5.`,
            sol: `Sum = ${vals.reduce((x, y) => x + y, 0)}, ÷5 = ${mean}`
          };
        },
        () => { // median
          const vals = [];
          while (vals.length < 5) { const v = ri(1, 30); if (!vals.includes(v)) vals.push(v); }
          const sorted = [...vals].sort((a, b) => a - b);
          return {
            q: `Find the <b>median</b> of: <b>${vals.join(', ')}</b>`,
            a: sorted[2],
            hint: `Sort them first, then take the middle value.`,
            sol: `Sorted: ${sorted.join(', ')} → median ${sorted[2]}`
          };
        },
        () => { // complement
          const r = ri(2, 5), o = ri(3, 7), t = r + o;
          return {
            q: `A bag holds <b>${r} red</b> and <b>${o} other</b> marbles.<br>What is <b>P(NOT drawing red)</b>? (fraction or decimal)`,
            a: o / t,
            hint: `P(not red) = 1 − P(red).`,
            sol: `${fracStr(o, t)}`
          };
        }
      ],
      3: [
        () => { // combinations C(n,2)
          const n = ri(5, 10);
          return {
            q: `A team of <b>2</b> players is chosen from <b>${n}</b> students.<br>How many <b>different teams</b> are possible?`,
            a: n * (n - 1) / 2,
            hint: `C(n, 2) = n(n−1)/2 — order doesn't matter.`,
            sol: `${n}·${n - 1}/2 = ${n * (n - 1) / 2}`
          };
        },
        () => { // at least one head
          const n = ri(2, 4);
          const denom = Math.pow(2, n);
          return {
            q: `You flip a fair coin <b>${n} times</b>.<br>What is <b>P(at least one head)</b>? (fraction or decimal)`,
            a: (denom - 1) / denom,
            hint: `Use the complement: 1 − P(all tails) = 1 − 1/${denom}.`,
            sol: `1 − 1/${denom} = ${fracStr(denom - 1, denom)}`
          };
        },
        () => { // independent events
          return {
            q: `You roll a die <b>and</b> flip a coin.<br>What is <b>P(rolling a 6 AND getting heads)</b>? (fraction or decimal)`,
            a: 1 / 12,
            hint: `Independent events → multiply: (1/6) × (1/2).`,
            sol: `1/6 × 1/2 = 1/12`
          };
        },
        () => { // without replacement
          const r = ri(3, 5), t = r + ri(2, 4);
          const p = (r * (r - 1)) / (t * (t - 1));
          return {
            q: `A bag holds <b>${r} red</b> marbles out of <b>${t}</b> total.<br>You draw two <b>without replacement</b>.<br>What is <b>P(both red)</b>? (fraction or decimal)`,
            a: p,
            hint: `First draw: ${r}/${t}. Second draw: ${r - 1}/${t - 1}. Multiply.`,
            sol: `${fracStr(r, t)} × ${fracStr(r - 1, t - 1)} = ${fracStr(r * (r - 1), t * (t - 1))}`
          };
        }
      ]
    }
  };

  // ---------------- FIREWALL (quick mental math) ----------------
  const firewallGens = [
    () => {
      const a = ri(2, 12), b = ri(2, 9), c = ri(2, 9);
      return { q: `Quick! <b>${a} + ${b} × ${c} = ?</b>`, a: a + b * c, hint: `Multiplication before addition.`, sol: `${a} + ${b * c} = ${a + b * c}` };
    },
    () => {
      const p = pick([10, 20, 25, 50, 15]), n = ri(2, 12) * 20;
      return { q: `Quick! <b>${p}% of ${n} = ?</b>`, a: p * n / 100, hint: `${p}% = ${p / 100}.`, sol: `${p * n / 100}` };
    },
    () => {
      const x = ri(5, 20);
      return { q: `Quick! <b>√${x * x} = ?</b>`, a: x, hint: `Which number squared gives ${x * x}?`, sol: `${x}` };
    },
    () => {
      const a = ri(3, 15), b = ri(3, 15), c = ri(2, 6);
      return { q: `Quick! <b>−${a} + ${b} − (−${c}) = ?</b>`, a: -a + b + c, hint: `Subtracting a negative = adding.`, sol: `${-a + b + c}` };
    },
    () => {
      const a = ri(4, 15);
      return { q: `Quick! <b>${a}² = ?</b>`, a: a * a, hint: `${a} × ${a}.`, sol: `${a * a}` };
    },
    () => {
      const a = ri(2, 9), b = ri(2, 9);
      return { q: `Quick! <b>(${a} + ${b})² − ${a * a} = ?</b>`, a: (a + b) * (a + b) - a * a, hint: `Brackets first!`, sol: `${(a + b) * (a + b)} − ${a * a} = ${(a + b) * (a + b) - a * a}` };
    }
  ];

  // ---------------- public API ----------------
  const CATEGORIES = {
    algebra:     { name: 'Algebra',       icon: '𝑥', color: '#3ec5ff' },
    quadratic:   { name: 'Quadratics',    icon: '∿', color: '#ff5d8f' },
    functions:   { name: 'Functions',     icon: 'ƒ', color: '#b78bff' },
    geometry:    { name: 'Geo & Trig',    icon: '△', color: '#ffc857' },
    exponents:   { name: 'Exponents',     icon: 'xⁿ', color: '#4ef0c0' },
    probability: { name: 'Probability',   icon: '⚄', color: '#ff9d5c' }
  };

  function generate(category, tier) {
    const pool = gens[category][tier];
    const p = pick(pool)();
    p.category = category;
    p.tier = tier;
    return p;
  }

  function firewall() {
    const p = pick(firewallGens)();
    p.category = 'firewall';
    p.tier = 1;
    return p;
  }

  // Parse "3", "-2.5", "5/12", "−4" etc.
  function parseAnswer(s) {
    s = String(s).trim().replace(/,/g, '').replace(/−/g, '-');
    const fm = s.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
    if (fm) {
      const d = Number(fm[2]);
      if (d !== 0) return Number(fm[1]) / d;
      return null;
    }
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  }

  function check(input, ans) {
    const v = parseAnswer(input);
    if (v === null) return false;
    const tol = Number.isInteger(ans) ? 1e-9 : 0.0125;
    return Math.abs(v - ans) <= tol;
  }

  return { CATEGORIES, generate, firewall, check, parseAnswer };
})();
