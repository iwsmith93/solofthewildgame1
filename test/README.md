# Tests

Automated checks for `index.html`. The game is a single self-contained
file, so the tests load it directly — there is no build step.

## Run everything

```bash
npm install   # first time only (downloads a headless Chromium for Puppeteer)
npm test
```

## Individual checks

| Command | What it does | Needs a browser? |
|---|---|---|
| `npm run test:syntax` | Extracts the `<script>` and parses it — catches syntax errors. | No |
| `npm run test:smoke`  | Stubs the canvas/DOM, runs the game through movement, jumping, power-up growth, enemy stomps, both levels, totem→clear/win, and river-death→respawn, asserting each. | No |
| `npm run test:render` | Launches real headless Chrome, plays a short scripted sequence, saves screenshots to `test/screenshots/`, and fails on any JS error or a blank canvas. | Yes (Puppeteer) |

## Manual testing (the real "game feel" check)

Open `index.html` in any browser and play both levels. The automated
tests verify the logic runs and renders without errors, but only hands-on play
can judge the physics feel and audio mix. Physics constants to tune live in the
`const P = { … }` block near the top of the script; sound effects live in the
`Sound` module's `sfx` map.

## CI

`.github/workflows/ci.yml` runs all three checks on every push and pull request.
Screenshots are not committed (`test/screenshots/` is gitignored).
