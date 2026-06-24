#!/usr/bin/env node
/*
 * Generate the Open Graph / Twitter share card (assets/og-card.png, 1200x630)
 * from the site's own name + tagline (read from i18n.json) and profile photo,
 * by rendering an HTML template in headless Chrome and screenshotting it — no
 * image libraries, reuses the Chrome already needed for the smoke test.
 *
 *   node tools/build-og.mjs
 *
 * Re-run after changing your name/tagline/photo, then commit assets/og-card.png.
 * Needs: Google Chrome + python3 (same as test/smoke.mjs).
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 8795;
const CDP = process.env.CDP_PORT || 9357;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TEMPLATE = join(ROOT, '.og-template.html');
const OUT = join(ROOT, 'assets/og-card.png');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const i18n = JSON.parse(readFileSync(join(ROOT, 'i18n.json'), 'utf8')).en;
const name = i18n['hero.name'] || 'Zongmin Zhang';
const line1 = i18n['hero.identity.line1'] || '';
const line2 = i18n['hero.identity.line2'] || '';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    display: flex; align-items: center; gap: 64px; padding: 90px;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background:
      radial-gradient(circle at 12% 18%, rgba(0,102,204,0.10) 0%, transparent 46%),
      radial-gradient(circle at 88% 86%, rgba(255,120,80,0.10) 0%, transparent 46%),
      linear-gradient(135deg, #ffffff 0%, #f3f5f8 55%, #e9edf3 100%);
    color: #1c1c1e;
  }
  .text { flex: 1; min-width: 0; }
  .name { font-size: 78px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.05; }
  .role { margin-top: 26px; font-size: 36px; font-weight: 600; color: #3a3a3c; line-height: 1.35; }
  .role span { display: block; }
  .url { margin-top: 40px; font-size: 27px; font-weight: 600; color: #0066cc; }
  .photo {
    width: 330px; height: 330px; flex: none; border-radius: 50%;
    object-fit: cover; border: 8px solid #fff;
    box-shadow: 0 24px 60px -18px rgba(0,102,204,0.4);
  }
</style></head><body>
  <div class="text">
    <div class="name">${esc(name)}</div>
    <div class="role"><span>${esc(line1)}</span><span>${esc(line2)}</span></div>
    <div class="url">nagatobigseven.github.io</div>
  </div>
  <img class="photo" src="assets/profile.webp" alt="">
</body></html>`;

writeFileSync(TEMPLATE, html);

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1',
  '--hide-scrollbars', `--remote-debugging-port=${CDP}`,
  '--user-data-dir=/tmp/og-build-profile', '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
function cleanup() { try { unlinkSync(TEMPLATE); } catch {} try { srv.kill(); } catch {} try { chrome.kill(); } catch {} }

try {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${CDP}/json/version`); if (r.ok) break; } catch {} await sleep(500); }
  const tab = await (await fetch(`http://localhost:${CDP}/json/new`, { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });

  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:${PORT}/.og-template.html` });
  await sleep(2500);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('Wrote assets/og-card.png (1200x630) for: ' + name);
} finally {
  cleanup();
}
process.exit(0);
