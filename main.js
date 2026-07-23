/* ============================================================
   ZERO DAY HEIST — bootstrap: landing / setup / rules wiring
   ============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const DEFAULT_NAMES = ['Cipher', 'Vector', 'Nova', 'Pixel'];
  const COLORS = ['#3ec5ff', '#ff5d8f', '#8dff5c', '#ffb347'];
  const RUNNER_ICONS = ['🦊', '🤖', '👾', '🐉', '🦉', '🥷', '👽', '🐍', '⚡', '🎧', '🔮', '🛰️'];
  let chosenIcons = [];

  function buildNameInputs(count) {
    const wrap = $('name-inputs');
    wrap.innerHTML = '';
    chosenIcons = RUNNER_ICONS.slice(0, count);
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'name-row';
      row.innerHTML = `
        <div class="name-line">
          <span class="setup-avatar" style="background:${COLORS[i]}" id="avatar-${i}">${chosenIcons[i]}</span>
          <input type="text" class="name-input" maxlength="14" value="${DEFAULT_NAMES[i]}" placeholder="Runner ${i + 1}">
        </div>
        <div class="icon-strip" data-player="${i}"></div>`;
      wrap.appendChild(row);
    }
    renderIconStrips(count);
  }

  function renderIconStrips(count) {
    for (let i = 0; i < count; i++) {
      const strip = document.querySelector(`.icon-strip[data-player="${i}"]`);
      strip.innerHTML = '';
      RUNNER_ICONS.forEach(icon => {
        const takenBy = chosenIcons.findIndex((c, j) => c === icon && j !== i);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'icon-btn'
          + (chosenIcons[i] === icon ? ' sel' : '')
          + (takenBy >= 0 ? ' taken' : '');
        b.textContent = icon;
        b.title = takenBy >= 0 ? `Taken by ${DEFAULT_NAMES[takenBy]}` : 'Choose this runner';
        b.style.setProperty('--pc', COLORS[i]);
        b.onclick = () => {
          if (takenBy >= 0) return;
          chosenIcons[i] = icon;
          $(`avatar-${i}`).textContent = icon;
          renderIconStrips(count);
        };
        strip.appendChild(b);
      });
    }
  }

  function selectedValue(groupSel) {
    const b = document.querySelector(`${groupSel} .seg-btn.sel`);
    return b ? b.dataset.val : null;
  }

  function wireSegGroup(groupSel, onChange) {
    document.querySelectorAll(`${groupSel} .seg-btn`).forEach(b => {
      b.onclick = () => {
        document.querySelectorAll(`${groupSel} .seg-btn`).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        if (onChange) onChange(b.dataset.val);
      };
    });
  }

  function init() {
    // landing
    $('btn-new-heist').onclick = () => UI.showScreen('setup');
    $('btn-rules').onclick = () => UI.showScreen('rules');
    $('rules-back').onclick = () => UI.showScreen('landing');
    $('setup-back').onclick = () => UI.showScreen('landing');
    $('rules-from-game').onclick = () => UI.showScreen('rules');

    // when rules opened mid-game, back should return to game
    $('rules-back').onclick = () => {
      UI.showScreen(Game.state && !Game.state.over && $('screen-game').dataset.started ? 'game' : 'landing');
    };

    // setup controls
    wireSegGroup('#seg-players', (v) => buildNameInputs(Number(v)));
    wireSegGroup('#seg-timer');
    wireSegGroup('#seg-frags');
    buildNameInputs(2);

    $('btn-launch').onclick = () => {
      const count = Number(selectedValue('#seg-players'));
      const names = [...document.querySelectorAll('.name-input')]
        .slice(0, count)
        .map((inp, i) => inp.value.trim() || DEFAULT_NAMES[i]);
      const settings = {
        names,
        icons: chosenIcons.slice(0, count),
        timerMode: selectedValue('#seg-timer'),
        fragsNeeded: Number(selectedValue('#seg-frags'))
      };
      $('screen-game').dataset.started = '1';
      $('log-feed').innerHTML = '';
      Game.newGame(settings);
    };

    // mute toggle
    const mute = $('btn-mute');
    const syncMute = () => mute.textContent = Sound.muted ? '🔇' : '🔊';
    mute.onclick = () => { Sound.toggleMute(); syncMute(); };
    syncMute();

    // quit to menu
    $('btn-quit').onclick = () => {
      UI.confirm('ABORT HEIST?', 'Current progress will be lost.', 'ABORT', 'Keep playing', (yes) => {
        if (yes) { delete $('screen-game').dataset.started; UI.showScreen('landing'); }
      });
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
