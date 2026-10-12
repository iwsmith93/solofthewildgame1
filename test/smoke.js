/*
 * Headless logic smoke test.
 *
 * Stubs the canvas/DOM/browser APIs, loads the game's <script> into this
 * process, then drives the game through its core paths and asserts behaviour.
 * No browser required — fast and CI-friendly. Exits non-zero on any failure.
 */
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'index.html');

/* ---- minimal DOM / Canvas / browser stubs ---- */
const noop = () => {};
function makeCtx() {
  return new Proxy({}, { get(_, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient')
      return () => ({ addColorStop: noop });
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(800 * 480 * 4) });
    return noop;
  }});
}
const elements = {};
const el = () => ({ classList: { toggle: noop, add: noop, remove: noop }, style: {},
  onclick: null, textContent: '', innerHTML: '', addEventListener: noop, removeEventListener: noop });

global.addEventListener = noop;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = noop;
global.window = {};                 // no AudioContext -> Sound module disables itself gracefully
global.document = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = el();
    if (id === 'game') elements[id].getContext = () => makeCtx();
    return elements[id];
  },
};

/* ---- load the game's <script> into this scope and expose internals ---- */
const html = fs.readFileSync(HTML, 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = blocks.find(b => b.includes('"use strict"')) || blocks.sort((a,b)=>b.length-a.length)[0];
code += '\n;Object.assign(globalThis,{game,update,draw,updatePowerups,updateEnemies,updatePlayer,loadLevel,setState,keys,P,DT,LEVEL_DEFS});';
eval(code);

/* ---- tiny assert helper ---- */
let passed = 0;
function ok(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  passed++;
  console.log('  ok -', msg);
}

try {
  /* start */
  elements['startBtn'].onclick();
  ok(game.state === 'playing', 'game starts into the playing state');
  ok(game.level && game.level.enemies.length > 0, 'level 1 builds with enemies');
  ok(game.level.collectibles.length > 0, 'level 1 has collectibles');
  ok(game.lives === 3, 'starts with 3 lives');

  /* run + jump for 600 fixed steps, render every frame to exercise draw() */
  keys.right = true; keys.run = true;
  const startX = game.player.x;
  for (let i = 0; i < 600; i++) {
    if (i % 40 === 0) { game.jumpQueued = P.JUMP_BUFFER; keys.jump = true; }
    if (i % 40 === 8) { keys.jump = false; }
    update(DT);
    draw();
    if (game.state !== 'playing') break;
  }
  ok(game.player.x > startX + 200, 'player builds momentum and moves right');
  ok(!game.player.dead, 'player survives a normal run');
  keys.right = keys.run = keys.jump = false;

  /* granola power-up grows Sol */
  game.powerups.push({ x: game.player.x, y: game.player.y, w: 24, h: 24, vx: 0, vy: 0, dir: 1, emerging: 0, onGround: true });
  updatePowerups(DT);
  ok(game.player.big === true, 'collecting a granola bar grows Sol');

  /* stomping an enemy scores points and removes it */
  const enemy = game.level.enemies.find((en) => en.alive);
  ok(!!enemy, 'a live enemy exists to stomp');
  const scoreBefore = game.score;
  game.player.x = enemy.x;
  game.player.y = enemy.y - game.player.h + 2;
  game.player.vy = 200;
  game.player.invuln = 0;
  updateEnemies(DT);
  ok(game.score > scoreBefore, 'stomping an enemy scores points');

  /* touching the totem clears the level */
  const gcol = game.level.grid[11].indexOf('G');
  game.player.x = gcol * 32; game.player.y = 11 * 32; game.player.invuln = 99; game.player.dead = false;
  updatePlayer(DT);
  ok(game.state === 'clear', 'reaching the totem clears the level');

  /* level 2 builds */
  loadLevel(1, true);
  ok(game.level.enemies.length > 0 && game.level.collectibles.length > 0, 'level 2 builds with content');

  /* totem on the final level triggers the win screen */
  const gcol2 = game.level.grid[11].indexOf('G');
  game.player.x = gcol2 * 32; game.player.y = 11 * 32; game.player.invuln = 99; game.player.dead = false;
  updatePlayer(DT);
  ok(game.state === 'win', 'totem on the final level triggers a win');

  /* falling into a river kills the player, then respawns with a lost life */
  setState('playing'); game.lives = 2; game.player.dead = false;
  game.player.y = game.level.pixH + 200;
  updatePlayer(DT);
  ok(game.player.dead, 'falling past the bottom kills the player');
  for (let i = 0; i < 120; i++) update(DT);
  ok(game.state === 'playing' && game.lives === 1, 'respawns with a life lost');

  console.log(`\nSMOKE: ${passed} checks passed`);
  process.exit(0);
} catch (err) {
  console.error('\n' + (err && err.stack ? err.stack : err));
  process.exit(1);
}
