ZERO DAY HEIST 🎲

A cyberpunk math board game for the browser — 2–4 players, hot-seat, Grades 9–11.



The year is 2077. A rogue AI called AXIOM sealed humanity's knowledge inside the
Zero Day Vault, encrypted with pure mathematics. You are a Cipher Runner:
race your rivals around AXIOM's defense circuit, crack its Cipher Gates, and be the
first to break into the vault.

How to run

No build step, no server, no dependencies. Just open:

zero-day-heist/index.html

in any modern browser (double-click it, or drag it onto a browser window).

How the math drives the game







Mechanic



The math





Movement



Every roll of two dice gives three route choices: a + b, |a − b|, or a × b mod 12 — planning your landing tile is itself mental math.





Data Nodes ◆



Pick a category (Algebra, Quadratics, Functions, Geo & Trig, Exponents, Probability) and a risk tier (1–3). Harder problems pay more Data Shards.





Firewalls ⚠



Rapid mental-math checks on a short timer.





Cipher Gates ⬟



Block your path until you pay 3 shards and solve a Tier-2 problem in that gate's category → Key Fragment.





The Vault 🔓



With enough fragments, entering the vault triggers 3 escalating locks (Tier 1 → 2 → 3) that must be cracked back-to-back to win.

All problems are procedurally generated with exact answers — no two games repeat.
Answers accept integers, decimals, and fractions (5/12).

Files

index.html        page shell: landing, setup, game, rules screens
css/style.css     neon circuit theme
js/mathgen.js     procedural problem generators (6 categories × 3 tiers) + answer checker
js/board.js       36-tile ring board definition + SVG renderer
js/cards.js       8 Exploit Chip power cards
js/game.js        turn state machine: movement, gates, economy, vault endgame
js/ui.js          HUD, dice, modals, challenge runner with timer
js/sound.js       WebAudio synth sound effects (mutable)
js/main.js        screen wiring & setup form



Options





Players: 2–4 (pass & play)



Timer: Relaxed (none) / Standard (90 s) / Speedrun (45 s)



Game length: 2, 3, or 4 Key Fragments needed (~20 / 35 / 50 minutes)

Full rules live in the in-game HOW TO PLAY screen.
