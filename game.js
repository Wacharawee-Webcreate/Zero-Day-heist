/* ============================================================
   ZERO DAY HEIST — Game engine (state machine + turn logic)
   Phases: turnStart → moveChoice → moving → tile → (next turn)
   ============================================================ */

window.Game = (() => {

  const COLORS = ['#3ec5ff', '#ff5d8f', '#8dff5c', '#ffb347'];
  const HAND_LIMIT = 3;
  const GATE_COST = 3;
  const NODE_REWARD = { 1: 2, 2: 3, 3: 5 };
  const TIMERS = {
    relaxed:  { challenge: 0,   firewall: 0,  vault: 0 },
    standard: { challenge: 90,  firewall: 30, vault: 120 },
    speedrun: { challenge: 45,  firewall: 20, vault: 75 }
  };

  let S = null; // state

  function newGame(settings) {
    S = {
      settings,
      players: settings.names.map((name, i) => ({
        name, color: COLORS[i],
        icon: (settings.icons && settings.icons[i]) || '🤖',
        pos: 0, shards: 3,
        fragments: {},          // gateTileIdx -> true
        hand: [],
        doubleNext: false,
        stats: { attempted: 0, correct: 0 },
      })),
      current: 0,
      phase: 'turnStart',
      dice: null,
      moveBonus: 0,
      turnCount: 0,
      over: false
    };
    UI.showScreen('game');
    Board.render(document.getElementById('board-wrap'));
    Board.setCoreNeed(`${settings.fragsNeeded} keys to enter`);
    UI.log(`Heist started — first to crack ${settings.fragsNeeded} gates and the vault wins.`, 'sys');
    refresh();
    startTurn();
  }

  const cur = () => S.players[S.current];
  const fragCount = (p) => Object.keys(p.fragments).length;
  const timers = () => TIMERS[S.settings.timerMode];

  function refresh() {
    Board.drawTokens(S.players, S.current);
    UI.updateHUD(S);
  }

  // ---------------- turn flow ----------------

  function startTurn() {
    if (S.over) return;
    S.phase = 'turnStart';
    S.dice = null;
    S.moveBonus = 0;
    S.turnCount++;
    Board.clearHighlights();
    updateVaultStatus();
    refresh();
    UI.setTurnBanner(cur());
    UI.showRollButton();
    UI.log(`▸ ${cur().name}'s turn.`, 'turn');
    Sound.play('click');
  }

  // keep the vault core + entrance tile reflecting the current player's progress
  function updateVaultStatus() {
    const p = cur();
    const need = S.settings.fragsNeeded;
    const got = fragCount(p);
    const ready = got >= need;
    Board.markVaultReady(ready);
    Board.setCoreStatus(
      ready ? `${p.icon} ${p.name} — go to ▶!`
            : `${p.icon} ${p.name} — ${got}/${need} keys`,
      ready
    );
  }

  function roll() {
    if (S.phase !== 'turnStart') return;
    S.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    S.phase = 'moveChoice';
    Sound.play('roll');
    UI.animateDice(S.dice, () => {
      if (S.dice[0] === S.dice[1]) {
        UI.log(`${cur().name} rolled doubles (${S.dice[0]}·${S.dice[1]}) — bonus Exploit Chip!`, 'good');
        giveCard(cur(), true);
      }
      showMoveOptions();
    });
    refresh();
  }

  function reroll() {
    S.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    Sound.play('roll');
    UI.animateDice(S.dice, () => {
      if (S.dice[0] === S.dice[1]) {
        UI.log(`Doubles on the reroll — bonus Exploit Chip!`, 'good');
        giveCard(cur(), true);
      }
      showMoveOptions();
    });
  }

  function moveOptions() {
    const [a, b] = S.dice;
    const raw = [
      { key: 'SUM',  expr: `${a} + ${b}`,            val: a + b },
      { key: 'GAP',  expr: `|${a} − ${b}|`,          val: Math.abs(a - b) },
      { key: 'FLUX', expr: `${a} × ${b} mod 12`,     val: ((a * b) % 12) || 12 }
    ];
    const seen = new Set();
    return raw.filter(o => {
      const v = o.val + S.moveBonus;
      if (v <= 0 || seen.has(v)) return false;
      seen.add(v);
      return true;
    }).map(o => ({ ...o, val: o.val + S.moveBonus }));
  }

  function showMoveOptions() {
    const opts = moveOptions();
    // preview landing tiles
    Board.clearHighlights();
    opts.forEach(o => {
      const path = plotPath(cur(), o.val);
      Board.highlightTile(path.stops[path.stops.length - 1], true);
    });
    UI.showMoveOptions(opts, S.moveBonus);
    refresh();
  }

  // Where does a move of `steps` actually end? (locked gates & vault entry stop you)
  function plotPath(p, steps) {
    const need = S.settings.fragsNeeded;
    const stops = [];
    let vault = false, lapBonus = 0;
    for (let k = 1; k <= steps; k++) {
      const t = (p.pos + k) % Board.N;
      stops.push(t);
      if (t === 0) {
        if (fragCount(p) >= need) { vault = true; break; }
        lapBonus++;
      } else if (Board.isGate(t) && !p.fragments[t]) {
        break; // locked gate: forced stop (landing or crossing)
      }
    }
    return { stops, vault, lapBonus };
  }

  function chooseMove(steps) {
    if (S.phase !== 'moveChoice') return;
    S.phase = 'moving';
    Board.clearHighlights();
    UI.hideMoveOptions();
    const p = cur();
    const path = plotPath(p, steps);
    UI.animateAlongPath(p, path.stops, S, () => {
      p.pos = path.stops[path.stops.length - 1];
      if (path.lapBonus > 0) {
        p.shards += path.lapBonus;
        UI.log(`${p.name} passed the Vault Entrance: +${path.lapBonus} shard.`, 'good');
      }
      refresh();
      // let the landing sink in before any popup: pulse the tile, short pause
      const dest = path.vault ? 0 : p.pos;
      Board.highlightTile(dest, true);
      setTimeout(() => {
        Board.clearHighlights();
        if (path.vault) { p.pos = 0; refresh(); enterVault(p); }
        else resolveTile(p);
      }, 750);
    });
  }

  // ---------------- tile resolution ----------------

  function resolveTile(p) {
    S.phase = 'tile';
    const tile = Board.tile(p.pos);
    switch (tile.type) {
      case 'start':
        p.shards += 2;
        UI.log(`${p.name} docked at the Vault Entrance: +2 shards (supply cache).`, 'good');
        refresh();
        endTurn();
        break;
      case 'node':
        UI.openNodePicker(p, (cat, tier) => runNodeChallenge(p, cat, tier), () => endTurn());
        break;
      case 'firewall':
        runFirewall(p);
        break;
      case 'surge':
        giveCard(p, false);
        endTurn();
        break;
      case 'gate':
        offerGate(p, p.pos, tile.gate);
        break;
    }
  }

  function runNodeChallenge(p, cat, tier) {
    const prob = MathGen.generate(cat, tier);
    const reward = NODE_REWARD[tier] * (p.doubleNext ? 2 : 1);
    UI.runChallenge({
      title: `◆ Data node — ${MathGen.CATEGORIES[cat].name} · Tier ${tier}`,
      sub: `Reward: ${reward} shard${reward > 1 ? 's' : ''}${p.doubleNext ? ' (Double Down active)' : ''}`,
      prob, seconds: timers().challenge, player: p,
      onDone: (correct) => {
        p.stats.attempted++;
        if (correct) {
          p.stats.correct++;
          p.shards += reward;
          if (p.doubleNext) { p.doubleNext = false; }
          UI.log(`${p.name} cracked the node: +${reward} shards.`, 'good');
        } else {
          if (p.doubleNext) p.doubleNext = false;
          UI.log(`${p.name} failed the node challenge. No shards.`, 'bad');
        }
        refresh();
        endTurn();
      }
    });
  }

  function runFirewall(p) {
    const hasBreaker = p.hand.some(c => c.id === 'breaker');
    UI.openFirewallGate(p, hasBreaker, (useBreaker) => {
      if (useBreaker) {
        discard(p, 'breaker');
        UI.log(`${p.name} played Firewall Breaker — bypassed!`, 'good');
        refresh();
        endTurn();
        return;
      }
      const prob = MathGen.firewall();
      UI.runChallenge({
        title: '⚠ Firewall — intrusion check',
        sub: 'Pass: +1 shard · Fail: pushed back 3 tiles',
        prob, seconds: timers().firewall, player: p, quick: true,
        onDone: (correct) => {
          p.stats.attempted++;
          if (correct) {
            p.stats.correct++;
            p.shards += 1;
            UI.log(`${p.name} slipped through the firewall: +1 shard.`, 'good');
          } else {
            UI.log(`${p.name} tripped the firewall — pushed back 3 tiles.`, 'bad');
            const back = [1, 2, 3].map(k => (p.pos - k + Board.N) % Board.N);
            UI.animateAlongPath(p, back, S, () => { refresh(); endTurn(); });
            return;
          }
          refresh();
          endTurn();
        }
      });
    });
  }

  function offerGate(p, tileIdx, gate) {
    if (p.fragments[tileIdx]) { endTurn(); return; } // already unlocked, just resting here
    UI.openGateOffer(p, gate, GATE_COST, (attempt) => {
      if (!attempt) {
        UI.log(`${p.name} holds position at ${gate.name}.`, 'sys');
        endTurn();
        return;
      }
      p.shards -= GATE_COST;
      refresh();
      const prob = MathGen.generate(gate.cat, 2);
      UI.runChallenge({
        title: `⬟ Cipher gate — ${gate.name}`,
        sub: `Solve it to claim a key fragment`,
        prob, seconds: timers().challenge, player: p,
        onDone: (correct) => {
          p.stats.attempted++;
          if (correct) {
            p.stats.correct++;
            p.fragments[tileIdx] = true;
            Sound.play('fragment');
            UI.log(`⬟ ${p.name} UNLOCKED ${gate.name} — key fragment ${fragCount(p)}/${S.settings.fragsNeeded}!`, 'big');
            if (fragCount(p) >= S.settings.fragsNeeded) {
              updateVaultStatus();
              UI.toast(`🔓 <b>All keys collected!</b><small>${p.icon} ${p.name}: reach the ▶ vault entrance to start cracking the locks.</small>`);
              UI.log(`★ ${p.name} has all the keys — the vault entrance is glowing. Go!`, 'big');
            }
          } else {
            UI.log(`${p.name} failed the gate cipher. ${GATE_COST} shards burned.`, 'bad');
          }
          refresh();
          endTurn();
        }
      });
    });
  }

  // ---------------- vault endgame ----------------

  function enterVault(p) {
    UI.log(`⚡ ${p.name} enters the Zero Day Vault — 3 locks stand between them and victory.`, 'big');
    Sound.play('vault');
    const cats = shuffle(Object.keys(MathGen.CATEGORIES)).slice(0, 3);
    runVaultLock(p, cats, 1);
  }

  function runVaultLock(p, cats, lockNum) {
    const prob = MathGen.generate(cats[lockNum - 1], lockNum); // tier = lock number
    UI.runChallenge({
      title: `Vault lock ${lockNum} of 3 — ${MathGen.CATEGORIES[cats[lockNum - 1]].name}`,
      sub: lockNum < 3 ? 'Crack all three locks in a row to win' : 'Final lock — solve this and the vault is yours',
      lockInfo: { num: lockNum, total: 3 },
      prob, seconds: timers().vault, player: p, vault: true,
      onDone: (correct) => {
        p.stats.attempted++;
        if (correct) {
          p.stats.correct++;
          Sound.play('fragment');
          if (lockNum === 3) { win(p); return; }
          UI.log(`Lock ${lockNum} cracked. ${3 - lockNum} to go...`, 'good');
          runVaultLock(p, cats, lockNum + 1);
        } else {
          // brute force retry?
          if (p.shards >= 4) {
            UI.confirm(
              `Lock ${lockNum} rejected your key`,
              `Brute-force a retry for 4 shards? (You have ${p.shards}.) Decline and you're ejected from the vault.`,
              'Brute-force retry (−4 ◈)', 'Take the ejection',
              (retry) => {
                if (retry) {
                  p.shards -= 4;
                  refresh();
                  UI.log(`${p.name} brute-forces lock ${lockNum} (−4 shards)...`, 'sys');
                  runVaultLock(p, cats, lockNum); // fresh problem, same lock
                } else ejectFromVault(p);
              });
          } else ejectFromVault(p);
        }
      }
    });
  }

  function ejectFromVault(p) {
    p.shards = Math.max(0, p.shards - 2);
    Sound.play('wrong');
    UI.log(`⚠ AXIOM ejects ${p.name} from the vault (−2 shards). Loop around and try again.`, 'bad');
    const back = [1, 2, 3, 4, 5, 6].map(k => (0 - k + Board.N) % Board.N); // thrown back down the approach
    UI.animateAlongPath(p, back, S, () => { refresh(); endTurn(); });
  }

  function win(p) {
    S.over = true;
    Sound.play('win');
    UI.log(`★ ${p.name} cracked the Zero Day Vault — heist complete! ★`, 'big');
    UI.showWin(p, S);
  }

  // ---------------- cards ----------------

  function giveCard(p, bonus) {
    if (p.hand.length >= HAND_LIMIT) {
      UI.log(`${p.name}'s chip slots are full (max ${HAND_LIMIT}).`, 'sys');
      return;
    }
    const card = Cards.draw();
    p.hand.push(card);
    Sound.play('card');
    UI.log(`${p.name} ${bonus ? 'earned' : 'drew'} an Exploit Chip: ${card.icon} ${card.name}.`, 'good');
    UI.flashCard(card);
    refresh();
  }

  function discard(p, id) {
    const i = p.hand.findIndex(c => c.id === id);
    if (i >= 0) p.hand.splice(i, 1);
  }

  // Is a card playable in the current phase? (only current player's own hand)
  function cardPlayable(card) {
    if (S.over) return false;
    if (card.phase === 'turnStart') return S.phase === 'turnStart';
    if (card.phase === 'moveChoice') return S.phase === 'moveChoice';
    // 'firewall' and 'challenge' cards are offered contextually by UI
    return false;
  }

  function playCard(index) {
    const p = cur();
    const card = p.hand[index];
    if (!card || !cardPlayable(card)) {
      UI.log(`⏸ ${card ? card.name + ' is playable ' + Cards.PHASE_LABEL[card.phase] + '.' : ''}`, 'sys');
      Sound.play('wrong');
      return;
    }
    switch (card.id) {
      case 'reroll':
        p.hand.splice(index, 1);
        UI.log(`${p.name} plays ⟲ Reroll Protocol.`, 'sys');
        refresh();
        reroll();
        break;
      case 'overclock':
        p.hand.splice(index, 1);
        S.moveBonus += 3;
        UI.log(`${p.name} plays ⏩ Overclock: +3 to every move option.`, 'sys');
        refresh();
        showMoveOptions();
        break;
      case 'glitch':
        UI.pickOpponent(S, 'Glitch Bomb: choose a runner to knock back 4 tiles', (oppIdx) => {
          if (oppIdx === null) return;
          p.hand.splice(index, 1);
          const o = S.players[oppIdx];
          Sound.play('glitch');
          UI.log(`💥 ${p.name} glitch-bombs ${o.name} back 4 tiles!`, 'bad');
          const back = [1, 2, 3, 4].map(k => (o.pos - k + Board.N) % Board.N);
          UI.animateAlongPath(o, back, S, () => refresh());
        });
        break;
      case 'siphon':
        UI.pickOpponent(S, 'Data Siphon: choose a runner to steal 2 shards from', (oppIdx) => {
          if (oppIdx === null) return;
          p.hand.splice(index, 1);
          const o = S.players[oppIdx];
          const take = Math.min(2, o.shards);
          o.shards -= take; p.shards += take;
          Sound.play('glitch');
          UI.log(`🧲 ${p.name} siphons ${take} shard${take === 1 ? '' : 's'} from ${o.name}.`, 'bad');
          refresh();
        });
        break;
      case 'doubledown':
        p.hand.splice(index, 1);
        p.doubleNext = true;
        UI.log(`${p.name} plays ✕2 Double Down: next node win pays double.`, 'sys');
        refresh();
        break;
      default:
        UI.log(`${card.name} is playable ${Cards.PHASE_LABEL[card.phase]}.`, 'sys');
    }
  }

  // Contextual card use from inside a challenge (hint / time dilation)
  function useChallengeCard(id) {
    const p = cur();
    const i = p.hand.findIndex(c => c.id === id);
    if (i < 0) return false;
    p.hand.splice(i, 1);
    refresh();
    return true;
  }

  function endTurn() {
    if (S.over) return;
    S.phase = 'turnEnd';
    setTimeout(() => {
      S.current = (S.current + 1) % S.players.length;
      startTurn();
    }, 650);
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return {
    newGame, roll, chooseMove, playCard, useChallengeCard, cardPlayable,
    get state() { return S; },
    cur, fragCount
  };
})();
