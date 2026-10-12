# Sol of the Wild

A complete, playable 2D side-scrolling platformer in a **single self-contained HTML file**
(`index.html`) — vanilla JavaScript + HTML5 Canvas, no libraries, no build step.

**Play it:** open `index.html` in any browser (double-click it, or drag it into a tab).

## Features
- Super Mario Bros–style physics: momentum, variable jump height, coyote time, jump buffer
- **Sol** (the hero) and **Rocky** the raccoon companion, plus **wild hog** and **mosquito**
  enemies — all rendered from pixel-art sprite sheets (with a vector fallback)
- Two hand-designed levels with a Colorado wilderness theme, a goal totem, acorns, a granola
  power-up, lives, score, and a countdown timer
- WebAudio sound effects + music (mute with **M**)
- Keyboard **and** on-screen touch controls (mobile)

## Controls
- **Move:** ←/→ or A/D · **Run:** hold Shift or Z · **Jump:** Space / ↑ / X · **Pause:** P · **Mute:** M
- On touch devices, on-screen buttons appear below the game.

## Development
Everything is in `index.html`. Physics constants to tune live in the `const P = { … }` block
near the top of the `<script>`.

```bash
npm install   # first time (downloads a headless Chromium for the render test)
npm test      # syntax check + headless logic smoke test + browser render test
```

CI (`.github/workflows/ci.yml`) runs the test suite on every push and pull request.
