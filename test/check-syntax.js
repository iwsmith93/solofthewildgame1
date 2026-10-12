/*
 * Syntax check: extract the game's <script> and parse it (compile-only, no run).
 * Catches typos/syntax errors without needing a browser or DOM.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(HTML, 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = blocks.find(b => b.includes('"use strict"')) || blocks.sort((a,b)=>b.length-a.length)[0];

if (!code) {
  console.error('SYNTAX FAIL: no <script> block found in index.html');
  process.exit(1);
}

try {
  new vm.Script(code, { filename: 'game.js' }); // parses; throws on syntax error
  console.log('SYNTAX: ok');
} catch (e) {
  console.error('SYNTAX FAIL:', e.message);
  process.exit(1);
}
