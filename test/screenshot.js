/*
 * Headless render test.
 *
 * Launches real headless Chrome via Puppeteer, loads the game, plays a short
 * scripted sequence, and saves screenshots to test/screenshots/. Fails if any
 * JS/console error fires or if the canvas renders effectively blank.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');
const OUT = path.join(__dirname, 'screenshots');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const errors = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 600 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await page.goto(FILE, { waitUntil: 'networkidle0' });
  await wait(300);
  await page.screenshot({ path: path.join(OUT, '1-start.png') });

  await page.click('#startBtn');
  await wait(300);
  await page.screenshot({ path: path.join(OUT, '2-level-start.png') });

  // run right with periodic jumps to traverse some terrain
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ShiftLeft');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.down('Space'); await wait(140); await page.keyboard.up('Space');
    await wait(500);
  }
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ShiftLeft');
  await page.screenshot({ path: path.join(OUT, '3-gameplay.png') });

  // sanity: the canvas should not be (almost) entirely sky
  const nonSky = await page.evaluate(() => {
    const c = document.getElementById('game');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (!(b > r && b > 150)) n++; // anything that isn't the blue-ish sky
    }
    return n / (d.length / 4);
  });

  await browser.close();

  if (errors.length) {
    console.error('RENDER FAIL — JS errors during play:\n' + errors.join('\n'));
    process.exit(1);
  }
  if (nonSky < 0.05) {
    console.error('RENDER FAIL — canvas looks blank (non-sky fraction ' + nonSky.toFixed(3) + ')');
    process.exit(1);
  }
  console.log('RENDER: ok — no JS errors, non-sky fraction ' + nonSky.toFixed(3) + ' (screenshots in test/screenshots/)');
  process.exit(0);
})().catch((e) => {
  console.error('RENDER FAIL:', e);
  process.exit(1);
});
