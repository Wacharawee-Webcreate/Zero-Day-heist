/* ============================================================
   ZERO DAY HEIST — UI layer
   Screens, HUD, dice, modals, and the challenge runner.
   ============================================================ */

window.UI = (() => {

  const $ = (id) => document.getElementById(id);
  let challengeTimer = null;

  // ---------------- screens ----------------
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
    window.scrollTo(0, 0);
  }

  // ---------------- HUD ----------------
  function setTurnBanner(p) {
    const b = $('turn-banner');
    b.innerHTML = `<span class="banner-icon" style="background:${p.color}">${p.icon}</span> ${esc(p.name)}'s turn`;
    b.style.borderColor = p.color;
  }

  // ①②③ heist plan strip for the current player (in the Control Deck)
  function renderMissionStrip(S) {
    const el = $('mission-strip');
    if (!el) return;
    const p = S.players[S.current];
    const need = S.settings.fragsNeeded;
    const got = Game.fragCount(p);
    const ready = got >= need;
    const steps = [
      { label: `1. Collect keys <b>${got}/${need}</b>`, state: ready ? 'done' : 'current' },
      { label: `2. Reach the vault ▶`, state: ready ? 'current' : 'todo' },
      { label: `3. Crack 3 locks`, state: 'todo' }
    ];
    el.innerHTML = `<div class="ms-title">${p.icon} ${esc(p.name)}'s heist plan</div>` +
      steps.map(s => `<span class="ms-step ${s.state}">${s.label}</span>`).join('<span class="ms-arrow">▸</span>');
  }

  function updateHUD(S) {
    renderMissionStrip(S);
    // players panel
    const wrap = $('players-panel');
    wrap.innerHTML = '';
    S.players.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'player-card' + (i === S.current ? ' active' : '');
      div.style.setProperty('--pc', p.color);
      const need = S.settings.fragsNeeded;
      const ready = Game.fragCount(p) >= need;
      // one slot per gate, showing that gate's math symbol, gold once earned
      const frags = Object.entries(Board.GATES).map(([g, gate]) =>
        `<span class="frag ${p.fragments[g] ? 'got' : ''}" title="${gate.name}${p.fragments[g] ? ' — UNLOCKED' : ''}">
          ⬟<i>${MathGen.CATEGORIES[gate.cat].icon}</i></span>`).join('');
      div.innerHTML = `
        <div class="pc-top">
          <span class="pc-avatar" style="background:${p.color}">${p.icon}</span>
          <span class="pc-name">${esc(p.name)}</span>
          ${p.doubleNext ? '<span class="pc-flag" title="Double Down active">✕2</span>' : ''}
        </div>
        <div class="pc-row">◈ ${p.shards} shards · 🂠 ${p.hand.length} chips</div>
        <div class="pc-row frags">${frags}
          <span class="vault-chip ${ready ? 'ready' : ''}" title="${ready ? 'Vault ready — reach ▶ to crack it!' : `Needs ${need} keys to enter the vault`}">
            ${ready ? '▶ VAULT READY' : `🔐 ${Game.fragCount(p)}/${need}`}
          </span>
        </div>`;
      wrap.appendChild(div);
    });

    // hand of current player
    const hand = $('hand-panel');
    hand.innerHTML = '';
    const p = S.players[S.current];
    if (p.hand.length === 0) {
      hand.innerHTML = '<div class="hand-empty">No Exploit Chips — land on ✦ Power Surge tiles to draw.</div>';
    } else {
      p.hand.forEach((card, i) => {
        const b = document.createElement('button');
        const playable = Game.cardPlayable(card);
        b.className = 'chip-card' + (playable ? ' playable' : '');
        b.innerHTML = `<span class="chip-icon">${card.icon}</span><span class="chip-name">${card.name}</span>`;
        b.title = `${card.desc}\nPlayable ${Cards.PHASE_LABEL[card.phase]}.`;
        b.onclick = () => Game.playCard(i);
        hand.appendChild(b);
      });
    }
  }

  // ---------------- log ----------------
  function log(msg, kind = 'sys') {
    const ul = $('log-feed');
    const li = document.createElement('li');
    li.className = `log-${kind}`;
    li.innerHTML = esc(msg);
    ul.prepend(li);
    while (ul.children.length > 40) ul.removeChild(ul.lastChild);
  }

  // ---------------- dice ----------------
  const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  function showRollButton() {
    $('dice-area').innerHTML = `
      <div class="dice-row"><span class="die idle">?</span><span class="die idle">?</span></div>
      <button id="roll-btn" class="btn-primary big">🎲 Roll the dice</button>`;
    $('roll-btn').onclick = () => Game.roll();
    $('move-options').innerHTML = '';
  }

  function animateDice(dice, done) {
    const area = $('dice-area');
    area.innerHTML = `<div class="dice-row">
      <span class="die rolling" id="die-a">?</span>
      <span class="die rolling" id="die-b">?</span></div>`;
    let n = 0;
    const iv = setInterval(() => {
      $('die-a').textContent = 1 + Math.floor(Math.random() * 6);
      $('die-b').textContent = 1 + Math.floor(Math.random() * 6);
      if (++n >= 8) {
        clearInterval(iv);
        $('die-a').textContent = dice[0];
        $('die-b').textContent = dice[1];
        $('die-a').className = 'die';
        $('die-b').className = 'die';
        setTimeout(done, 250);
      }
    }, 70);
  }

  function showMoveOptions(opts, bonus) {
    const wrap = $('move-options');
    wrap.innerHTML = `<div class="mo-label">Choose your route${bonus ? ` <b>(+${bonus} Overclock)</b>` : ''}:</div>`;
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'btn-move';
      b.innerHTML = `<span class="mo-key">${o.key}</span><span class="mo-expr">${o.expr}${bonus ? ` + ${bonus}` : ''}</span><span class="mo-val">${o.val}</span>`;
      b.onclick = () => Game.chooseMove(o.val);
      wrap.appendChild(b);
    });
  }

  function hideMoveOptions() {
    $('move-options').innerHTML = '';
    $('dice-area').querySelectorAll('button').forEach(b => b.remove());
  }

  function animateAlongPath(player, stops, S, done) {
    let i = 0;
    const step = () => {
      if (i >= stops.length) { setTimeout(done, 120); return; }
      player.pos = stops[i++];
      Sound.play('move');
      Board.drawTokens(S.players, S.current);
      setTimeout(step, 270);
    };
    step();
  }

  // ---------------- modal machinery ----------------
  function openModal(html, dismissable = false) {
    const ov = $('modal-overlay');
    ov.classList.add('open');
    $('modal-box').innerHTML = html;
    ov.onclick = dismissable ? (e) => { if (e.target === ov) closeModal(); } : null;
  }
  function closeModal() {
    $('modal-overlay').classList.remove('open');
    $('modal-box').innerHTML = '';
    stopTimer();
  }

  function confirm(title, body, yesLabel, noLabel, cb) {
    openModal(`
      <h3 class="m-title">${title}</h3>
      <p class="m-body">${body}</p>
      <div class="m-actions">
        <button class="btn-primary" id="m-yes">${yesLabel}</button>
        <button class="btn-ghost" id="m-no">${noLabel}</button>
      </div>`);
    $('m-yes').onclick = () => { closeModal(); cb(true); };
    $('m-no').onclick = () => { closeModal(); cb(false); };
  }

  // ---------------- node picker ----------------
  function openNodePicker(p, onPick, onSkip) {
    const cats = Object.entries(MathGen.CATEGORIES).map(([id, c]) =>
      `<button class="cat-btn" data-cat="${id}" style="--cc:${c.color}">
        <span class="cat-icon">${c.icon}</span>${c.name}</button>`).join('');
    openModal(`
      <h3 class="m-title">◆ Data node</h3>
      <p class="m-body">${esc(p.name)}, choose a data stream to decrypt:</p>
      <div class="cat-grid">${cats}</div>
      <p class="m-body">…then pick your risk level:</p>
      <div class="tier-row">
        <button class="tier-btn" data-tier="1">Tier 1<br><small>+2 ◈</small></button>
        <button class="tier-btn" data-tier="2">Tier 2<br><small>+3 ◈</small></button>
        <button class="tier-btn" data-tier="3">Tier 3<br><small>+5 ◈</small></button>
      </div>
      <div class="m-actions">
        <button class="btn-primary" id="node-go" disabled>Decrypt</button>
        <button class="btn-ghost" id="node-skip">Skip (no reward)</button>
      </div>`);
    let cat = null, tier = null;
    document.querySelectorAll('.cat-btn').forEach(b => b.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); cat = b.dataset.cat; ready();
    });
    document.querySelectorAll('.tier-btn').forEach(b => b.onclick = () => {
      document.querySelectorAll('.tier-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); tier = Number(b.dataset.tier); ready();
    });
    function ready() { $('node-go').disabled = !(cat && tier); }
    $('node-go').onclick = () => { closeModal(); onPick(cat, tier); };
    $('node-skip').onclick = () => { closeModal(); onSkip(); };
  }

  // ---------------- firewall gate ----------------
  function openFirewallGate(p, hasBreaker, cb) {
    openModal(`
      <h3 class="m-title warn">⚠ Firewall detected</h3>
      <p class="m-body">${esc(p.name)}, AXIOM's defenses lock onto you. Answer fast or get pushed back 3 tiles.</p>
      <div class="m-actions">
        ${hasBreaker ? '<button class="btn-primary" id="fw-break">🛡 Play Firewall Breaker</button>' : ''}
        <button class="${hasBreaker ? 'btn-ghost' : 'btn-primary'}" id="fw-face">Face the check</button>
      </div>`);
    if (hasBreaker) $('fw-break').onclick = () => { closeModal(); cb(true); };
    $('fw-face').onclick = () => { closeModal(); cb(false); };
  }

  // ---------------- gate offer ----------------
  function openGateOffer(p, gate, cost, cb) {
    const c = MathGen.CATEGORIES[gate.cat];
    const afford = p.shards >= cost;
    openModal(`
      <h3 class="m-title gate">⬟ ${gate.name}</h3>
      <p class="m-body">A cipher gate blocks the circuit. Category: <b style="color:${c.color}">${c.icon} ${c.name}</b> (Tier 2).<br>
      Pay <b>${cost} ◈</b> to attempt it. Crack it and the key fragment is yours; fail and the shards are burned.</p>
      <p class="m-body">${esc(p.name)} has <b>${p.shards} ◈</b>.</p>
      <div class="m-actions">
        <button class="btn-primary" id="gate-try" ${afford ? '' : 'disabled'}>Attempt it (−${cost} ◈)</button>
        <button class="btn-ghost" id="gate-no">Hold position</button>
      </div>
      ${afford ? '' : '<p class="m-body dim">Not enough shards — earn some at ◆ Data Nodes and come back around.</p>'}`);
    $('gate-try').onclick = () => { closeModal(); cb(true); };
    $('gate-no').onclick = () => { closeModal(); cb(false); };
  }

  // ---------------- opponent picker ----------------
  function pickOpponent(S, title, cb) {
    const opts = S.players.map((p, i) => ({ p, i }))
      .filter(o => o.i !== S.current);
    openModal(`
      <h3 class="m-title">${title}</h3>
      <div class="opp-list">
        ${opts.map(o => `<button class="btn-move opp" data-i="${o.i}">
          <span class="pc-avatar" style="background:${o.p.color}">${o.p.icon}</span>
          ${esc(o.p.name)} <small>· tile ${o.p.pos} · ${o.p.shards} ◈</small></button>`).join('')}
      </div>
      <div class="m-actions"><button class="btn-ghost" id="opp-cancel">Cancel</button></div>`);
    document.querySelectorAll('.opp').forEach(b =>
      b.onclick = () => { closeModal(); cb(Number(b.dataset.i)); });
    $('opp-cancel').onclick = () => { closeModal(); cb(null); };
  }

  // ---------------- toasts ----------------
  function toast(html, ms = 2600) {
    const d = document.createElement('div');
    d.className = 'card-flash';
    d.innerHTML = html;
    document.body.appendChild(d);
    setTimeout(() => d.classList.add('show'), 20);
    setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, ms);
  }

  function flashCard(card) {
    toast(`<span class="chip-icon">${card.icon}</span><b>${card.name}</b><small>${card.desc}</small>`, 2200);
  }

  // ---------------- challenge runner ----------------
  function runChallenge({ title, sub, prob, seconds, player, onDone, quick, vault, lockInfo }) {
    const cat = prob.category === 'firewall'
      ? { name: 'Mental Math', icon: '⚡', color: '#ff5d5d' }
      : MathGen.CATEGORIES[prob.category];
    const hasHint = player.hand.some(c => c.id === 'hint');
    const hasTime = player.hand.some(c => c.id === 'timedila');

    // vault locks get a visual progress row: cracked / current / still locked
    const lockDots = lockInfo ? `<div class="lock-dots">${
      Array.from({ length: lockInfo.total }, (_, i) => {
        const n = i + 1;
        const cls = n < lockInfo.num ? 'cracked' : n === lockInfo.num ? 'now' : 'later';
        return `<span class="lock ${cls}">${n < lockInfo.num ? '🔓' : '🔒'}<small>Lock ${n}</small></span>`;
      }).join('<span class="lock-wire"></span>')
    }</div>` : '';

    openModal(`
      <div class="ch-head ${vault ? 'vault' : ''}">
        <h3 class="m-title">${title}</h3>
        <div class="ch-sub">${sub}</div>
        ${lockDots}
      </div>
      ${seconds ? `<div class="timer-track"><div class="timer-bar" id="timer-bar"></div><span class="timer-num" id="timer-num"></span></div>` : ''}
      <div class="ch-card" style="--cc:${cat.color}">
        <div class="ch-cat"><span>${cat.icon}</span> ${cat.name} · Tier ${prob.tier}</div>
        <div class="ch-q">${prob.q}</div>
        <div class="ch-hint" id="ch-hint"></div>
      </div>
      <div class="ch-answer">
        <input id="ch-input" type="text" autocomplete="off" spellcheck="false"
               placeholder="answer (e.g. 4, -2.5, 5/12)">
        <button class="btn-primary" id="ch-submit">Submit</button>
      </div>
      <div class="m-actions ch-tools">
        ${hasHint ? '<button class="btn-ghost" id="ch-usehint">💡 Hint Chip</button>' : ''}
        ${hasTime && seconds ? '<button class="btn-ghost" id="ch-usetime">⏳ Time Dilation (+60s)</button>' : ''}
        <button class="btn-ghost dim" id="ch-giveup">Give up</button>
      </div>
      <div class="ch-feedback" id="ch-feedback"></div>`);

    const input = $('ch-input');
    input.focus();
    let finished = false;

    // timer
    let remaining = seconds;
    if (seconds) {
      updateTimerUI(remaining, seconds);
      challengeTimer = setInterval(() => {
        remaining--;
        updateTimerUI(remaining, seconds);
        if (remaining <= 5 && remaining > 0) Sound.play('tick');
        if (remaining <= 0) finish(false, true);
      }, 1000);
    }

    function updateTimerUI(rem, total) {
      const bar = $('timer-bar'), num = $('timer-num');
      if (!bar) return;
      bar.style.width = `${Math.max(0, (rem / total) * 100)}%`;
      bar.classList.toggle('low', rem <= 10);
      num.textContent = `${rem}s`;
    }

    function finish(correct, timedOut = false) {
      if (finished) return;
      finished = true;
      stopTimer();
      const fb = $('ch-feedback');
      if (correct) {
        Sound.play('correct');
        fb.className = 'ch-feedback ok';
        fb.innerHTML = `✔ Correct — ${prob.sol}`;
      } else {
        Sound.play('wrong');
        fb.className = 'ch-feedback no';
        fb.innerHTML = `${timedOut ? "⏰ Time's up" : '✘ Not quite'} — ${prob.sol}`;
      }
      $('ch-submit').disabled = true;
      input.disabled = true;
      setTimeout(() => { closeModal(); onDone(correct); }, correct ? 1400 : 2400);
    }

    $('ch-submit').onclick = () => {
      if (input.value.trim() === '') { input.focus(); return; }
      finish(MathGen.check(input.value, prob.a));
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') $('ch-submit').click(); };
    $('ch-giveup').onclick = () => finish(false);

    const hintBtn = $('ch-usehint');
    if (hintBtn) hintBtn.onclick = () => {
      if (Game.useChallengeCard('hint')) {
        $('ch-hint').innerHTML = `💡 ${prob.hint}`;
        $('ch-hint').classList.add('show');
        hintBtn.remove();
        Sound.play('card');
      }
    };
    const timeBtn = $('ch-usetime');
    if (timeBtn) timeBtn.onclick = () => {
      if (Game.useChallengeCard('timedila')) {
        remaining += 60;
        seconds = Math.max(seconds, remaining);
        updateTimerUI(remaining, seconds);
        timeBtn.remove();
        Sound.play('card');
      }
    };
  }

  function stopTimer() {
    if (challengeTimer) { clearInterval(challengeTimer); challengeTimer = null; }
  }

  // ---------------- win screen ----------------
  function showWin(winner, S) {
    const rows = S.players.map(p => {
      const acc = p.stats.attempted ? Math.round(100 * p.stats.correct / p.stats.attempted) : 0;
      return `<tr class="${p === winner ? 'winrow' : ''}">
        <td><span class="pc-avatar" style="background:${p.color}">${p.icon}</span> ${esc(p.name)}</td>
        <td>${Game.fragCount(p)}</td><td>${p.shards} ◈</td>
        <td>${p.stats.correct}/${p.stats.attempted}</td><td>${acc}%</td></tr>`;
    }).join('');
    openModal(`
      <div class="win-burst">★</div>
      <h2 class="m-title win">Vault cracked!</h2>
      <p class="m-body big-body"><b style="color:${winner.color}">${esc(winner.name)}</b> broke AXIOM's encryption and liberated the world's knowledge. Heist complete.</p>
      <table class="win-table">
        <tr><th>Runner</th><th>⬟ Keys</th><th>Shards</th><th>Solved</th><th>Accuracy</th></tr>
        ${rows}
      </table>
      <div class="m-actions">
        <button class="btn-primary" id="win-again">Play again</button>
        <button class="btn-ghost" id="win-menu">Main menu</button>
      </div>`);
    $('win-again').onclick = () => { closeModal(); showScreen('setup'); };
    $('win-menu').onclick = () => { closeModal(); showScreen('landing'); };
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return {
    showScreen, setTurnBanner, updateHUD, log,
    showRollButton, animateDice, showMoveOptions, hideMoveOptions, animateAlongPath,
    openNodePicker, openFirewallGate, openGateOffer, pickOpponent,
    flashCard, toast, runChallenge, confirm, showWin, closeModal
  };
})();
