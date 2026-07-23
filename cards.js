/* ============================================================
   ZERO DAY HEIST — Power Cards (Exploit Chips)
   Drawn on Power Surge tiles. Hand limit: 3.
   Each card declares WHEN it can be played (phase).
   ============================================================ */

window.Cards = (() => {

  const TYPES = [
    {
      id: 'reroll', weight: 3,
      name: 'Reroll Protocol', icon: '⟲',
      phase: 'moveChoice',
      desc: 'Reroll both dice before choosing your move.'
    },
    {
      id: 'overclock', weight: 3,
      name: 'Overclock', icon: '⏩',
      phase: 'moveChoice',
      desc: 'Add +3 steps to whichever move you pick this turn.'
    },
    {
      id: 'breaker', weight: 2,
      name: 'Firewall Breaker', icon: '🛡',
      phase: 'firewall',
      desc: 'Instantly bypass a firewall — no problem, no penalty.'
    },
    {
      id: 'glitch', weight: 2,
      name: 'Glitch Bomb', icon: '💥',
      phase: 'turnStart',
      desc: 'Knock an opponent back 4 tiles.'
    },
    {
      id: 'siphon', weight: 2,
      name: 'Data Siphon', icon: '🧲',
      phase: 'turnStart',
      desc: 'Steal 2 Data Shards from an opponent.'
    },
    {
      id: 'hint', weight: 3,
      name: 'Hint Chip', icon: '💡',
      phase: 'challenge',
      desc: 'Reveal the hint on your current challenge for free.'
    },
    {
      id: 'timedila', weight: 2,
      name: 'Time Dilation', icon: '⏳',
      phase: 'challenge',
      desc: 'Add 60 seconds to your current challenge timer.'
    },
    {
      id: 'doubledown', weight: 2,
      name: 'Double Down', icon: '✕2',
      phase: 'turnStart',
      desc: 'Your next correct Data Node challenge pays double shards.'
    }
  ];

  // weighted draw pile
  const pile = [];
  TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) pile.push(t.id); });

  function draw() {
    const id = pile[Math.floor(Math.random() * pile.length)];
    return TYPES.find(t => t.id === id);
  }

  function byId(id) {
    return TYPES.find(t => t.id === id);
  }

  const PHASE_LABEL = {
    turnStart: 'at the start of your turn (before rolling)',
    moveChoice: 'after rolling, before moving',
    firewall: 'when you hit a firewall',
    challenge: 'while solving a challenge'
  };

  return { TYPES, draw, byId, PHASE_LABEL };
})();
