#!/usr/bin/env node
/*
 * Smoke / regression test for the academic homepage.
 *
 * Launches a local static server + headless Chrome (CDP), then exercises the
 * key interactive features and guards the specific bugs we have fixed:
 *   - the Live2D mascot loads and does NOT tear / lose its WebGL context on
 *     mouse interaction (the loadlive2d 3rd-arg "X" bug),
 *   - terminal, theme, language, and the effects (lite/full) toggle work,
 *   - the mascot is hidden on mobile widths.
 *
 * Usage:  node test/smoke.mjs
 * Needs:  Google Chrome and python3 on PATH.
 * Env:    CHROME=/path/to/chrome  PORT=8799  CDP_PORT=9334
 * Exit:   0 = all pass, 1 = any failure (suitable for CI / pre-push hook).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 8799;
const CDP = process.env.CDP_PORT || 9334;
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = process.env.CHROME_PROFILE ||
  mkdtempSync(join(tmpdir(), 'homepage-smoke-profile-'));
const REMOVE_PROFILE = !process.env.CHROME_PROFILE;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (detail ? '  [' + detail + ']' : '')); }
}

// ---------- static regression guards (no browser needed) ----------
console.log('Static regression guards:');
const waifu = readFileSync(join(ROOT, 'assets/kanban/waifu-tips.js'), 'utf8');
check("loadlive2d('live2d', modelUrl) — no 3rd arg, so look-at X stays 0.5",
  /loadlive2d\('live2d',\s*modelUrl\)\s*;/.test(waifu));
check('loadlive2d is never passed a function as 3rd arg (the X-bug)',
  !/loadlive2d\([^)]*,\s*function/.test(waifu));

// ---------- launch server + chrome ----------
const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--window-size=1440,900',
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });
let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try { srv.kill(); } catch {}
  try { chrome.kill(); } catch {}
  if (REMOVE_PROFILE) {
    try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

// ---------- CDP plumbing ----------
let ws, id = 0; const pend = new Map(); const exceptions = [];
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const q = async (e) => (await send('Runtime.evaluate', { returnByValue: true, expression: e })).result?.value;
async function connect() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${CDP}/json/version`); if (r.ok) break; } catch {} await sleep(500); }
  const tab = await (await fetch(`http://localhost:${CDP}/json/new`, { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
}

try {
  await connect();
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await sleep(6000);

  console.log('\nRuntime checks (desktop, full mode):');
  check('no uncaught JS exceptions on load', exceptions.length === 0, exceptions.slice(0, 2).join(' | '));
  check('Live2D runtime loaded', (await q('typeof window.loadlive2d')) === 'function' && (await q('typeof window.Live2D')) === 'function');
  check('mascot canvas is visible', (await q("getComputedStyle(document.getElementById('live2d')).display")) === 'block');
  check('core mascot functions present', (await q("['initModel','loadModel','loadOtherModel','loadRandModel','toggleTerminal','showHitokoto','showScienceQuote'].every(n=>typeof window[n]==='function')")) === true);

  // The headline regression: interacting must not corrupt the model / lose the GL context.
  await q("window.__ctxLost=false; document.getElementById('live2d').addEventListener('webglcontextlost',function(){window.__ctxLost=true;},true);");
  const rect = JSON.parse(await q("JSON.stringify((function(){var r=document.getElementById('live2d').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})())"));
  for (let i = 0; i < 40; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(Math.random() * 1440), y: Math.round(Math.random() * 900) });
  const cx = Math.round(rect.x + rect.w / 2), cy = Math.round(rect.y + rect.h / 2);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  await sleep(800);
  check('mouse interaction keeps the WebGL context + canvas (X-arg regression)',
    (await q('window.__ctxLost===false')) === true && (await q("getComputedStyle(document.getElementById('live2d')).display")) === 'block');

  console.log('\nFeature checks:');
  check('terminal opens and a command runs', (await q("(function(){try{toggleTerminal(true);handleTerminalCommand('help');return true;}catch(e){return false;}})()")) === true);
  check('theme toggle switches data-theme', (await q("(function(){var b=document.getElementById('theme-toggle');var a=document.documentElement.getAttribute('data-theme');b.click();var c=document.documentElement.getAttribute('data-theme');b.click();return a!==c;})()")) === true);
  check('floating action tooltips describe target states', (await q("(function(){try{var theme=document.getElementById('theme-toggle');var lang=document.getElementById('lang-toggle');var term=document.getElementById('terminal-toggle');var effects=document.getElementById('effects-toggle');var expectedTheme=document.documentElement.getAttribute('data-theme')==='dark'?'Switch to light mode':'Switch to dark mode';var expectedEffects=document.documentElement.classList.contains('effects-lite')?'Enable full visual effects':'Enable performance mode';var base=theme.title===expectedTheme&&theme.getAttribute('aria-label')===expectedTheme&&lang.title==='Switch to Chinese'&&effects.title===expectedEffects;toggleTerminal(true);var open=term.title==='Close console terminal'&&term.getAttribute('aria-expanded')==='true';toggleTerminal(false);var closed=term.title==='Open console terminal'&&term.getAttribute('aria-expanded')==='false';return base&&open&&closed;}catch(e){return false;}})()")) === true);
  check('language toggle switches content', (await q("(function(){var b=document.getElementById('lang-toggle');var n=document.querySelector('[data-i18n=\\\"nav.name\\\"]');var a=n.textContent;b.click();var c=n.textContent;return a!==c;})()")) === true);
  check('language toggle localizes action tooltips', (await q("(function(){var theme=document.getElementById('theme-toggle');var lang=document.getElementById('lang-toggle');var effects=document.getElementById('effects-toggle');var expectedTheme=document.documentElement.getAttribute('data-theme')==='dark'?'切换到浅色模式':'切换到深色模式';var expectedEffects=document.documentElement.classList.contains('effects-lite')?'开启完整视觉效果':'开启性能模式';return document.documentElement.getAttribute('lang')==='zh'&&theme.title===expectedTheme&&lang.title==='切换到英文'&&effects.title===expectedEffects;})()")) === true);

  console.log('\nData-driven content (publications + news from data/content.js):');
  check('publications rendered into #pub-list', (await q("document.querySelectorAll('#pub-list .publication-card').length")) === 3);
  check('each publication has an expandable BibTeX disclosure', (await q("(function(){var ds=document.querySelectorAll('#pub-list details.bibtex');return ds.length===3 && [].every.call(ds,function(d){var p=d.querySelector('.bibtex-text');return !!p && p.textContent.trim().indexOf('@')===0 && !!d.querySelector('.bibtex-copy');});})()")) === true);
  check('news rendered (all 7 items, 3 behind show-more)', (await q("document.querySelectorAll('#news-list .news-item').length===7 && document.querySelectorAll('#news-list .news-hidden').length===3")) === true);
  check('topic filter shows only matching papers', (await q("(function(){var b=document.querySelector('#pub-filters [data-filter=\\\"digitalTwin\\\"]');if(!b)return -1;b.click();var vis=[].filter.call(document.querySelectorAll('#pub-list .publication-card'),function(c){return c.style.display!=='none';}).length;var all=document.querySelector('#pub-filters [data-filter=\\\"all\\\"]');if(all)all.click();return vis;})()")) === 1);
  check('BibTeX disclosure opens and copy runs without throwing', (await q("(function(){var d=document.querySelector('#pub-list details.bibtex');if(!d)return false;try{d.open=true;var b=d.querySelector('.bibtex-copy');if(!b)return false;b.click();return d.open===true;}catch(e){return false;}})()")) === true);
  check('Download-all-BibTeX button works', (await q("(function(){var b=document.getElementById('download-all-bib');if(!b)return false;try{b.click();return true;}catch(e){return false;}})()")) === true);
  check('publication ScholarlyArticle JSON-LD injected', (await q("(function(){var s=document.getElementById('pubs-jsonld');if(!s)return false;try{var a=JSON.parse(s.textContent);return a.length===3 && a[0]['@type']==='ScholarlyArticle';}catch(e){return false;}})()")) === true);
  check('citations load from data/citations.json (0-count papers show no badge)', (await q("document.querySelectorAll('#pub-list .cite-badge').length===0")) === true);
  check('language switch re-renders publications (venue follows language)', (await q("(function(){var t=document.getElementById('lang-toggle');var m=function(){var e=document.querySelector('#pub-list .muted');return e?e.textContent:'';};var zh=function(s){return /[\\u4e00-\\u9fff]/.test(s);};var s1=m();t.click();var s2=m();t.click();return zh(s1)!==zh(s2);})()")) === true);

  console.log('\nData-driven CV sections (from data/content.js):');
  check('education + research timelines rendered', (await q("document.querySelectorAll('#edu-timeline .timeline-item').length===3 && document.querySelectorAll('#research-timeline .timeline-item').length===3")) === true);
  check('honors chips rendered (6 + 4 + 2)', (await q("document.querySelectorAll('#scholarships-list .award-chip').length===6 && document.querySelectorAll('#deans-list .award-chip').length===4 && document.querySelectorAll('#awards-list .award-chip').length===2")) === true);
  check('activities lists rendered (3/2/6/5)', (await q("document.querySelectorAll('#leadership-list li').length===3 && document.querySelectorAll('#teaching-list li').length===2 && document.querySelectorAll('#techstack-list li').length===6 && document.querySelectorAll('#languages-list li').length===5")) === true);
  check('projects + collaborators rendered', (await q("document.querySelectorAll('#project-grid .project-card').length===4 && document.querySelectorAll('#collab-grid .collab-card').length===7")) === true);
  check('projects link to GitHub repositories, not arXiv', (await q("(function(){var links=[].map.call(document.querySelectorAll('#project-grid .project-card .mini-link'),function(a){return a.href;});return links.length===4 && links.every(function(h){return /^https:\\/\\/github\\.com\\//.test(h);}) && !links.some(function(h){return /arxiv\\.org/.test(h);});})()")) === true);
  check('collaborator without a photo renders initials fallback', (await q("(function(){var cards=[].slice.call(document.querySelectorAll('#collab-grid .collab-card'));var r=cards.find(function(c){return /Ryo Kuroki/.test(c.textContent);});var a=r&&r.querySelector('.collab-avatar-fallback');return !!a && a.textContent.trim()==='RK';})()")) === true);
  check('CV re-renders on language switch (education follows language)', (await q("(function(){var t=document.getElementById('lang-toggle');var m=function(){var e=document.querySelector('#edu-timeline .timeline-title');return e?e.textContent:'';};var zh=function(s){return /[\\u4e00-\\u9fff]/.test(s);};var s1=m();t.click();var s2=m();t.click();return zh(s1)!==zh(s2);})()")) === true);

  console.log('\nEffects (lite/full) toggle:');
  await q("localStorage.setItem('effects-mode','lite')"); await send('Page.reload'); await sleep(5000);
  check('lite mode hides the particle background', (await q("getComputedStyle(document.getElementById('bg-canvas')).display")) === 'none');
  check('lite mode strips all frosted-glass blur', (await q("[...document.querySelectorAll('*')].filter(function(el){return getComputedStyle(el).backdropFilter!=='none';}).length")) === 0);
  check('lite mode still loads the mascot', (await q("getComputedStyle(document.getElementById('live2d')).display")) === 'block');
  await q("localStorage.setItem('effects-mode','full')"); await send('Page.reload'); await sleep(4000);
  check('full mode restores the particle background', (await q("getComputedStyle(document.getElementById('bg-canvas')).display")) === 'block');

  console.log('\nAccessibility (axe-clean invariants):');
  check('decorative mascot + bg canvas are aria-hidden', (await q("document.getElementById('waifu').getAttribute('aria-hidden')==='true' && document.getElementById('bg-canvas').getAttribute('aria-hidden')==='true'")) === true);
  check('icon toggle buttons have accessible names', (await q("['theme-toggle','lang-toggle','terminal-toggle','effects-toggle','back-to-top'].every(function(id){var b=document.getElementById(id);return !b||((b.getAttribute('aria-label')||'').trim().length>0);})")) === true);
  check('music player is a labelled landmark', (await q("(function(){var m=document.getElementById('music-card');return m.getAttribute('role')==='complementary' && (m.getAttribute('aria-label')||'').length>0;})()")) === true);
  check('music progress track/fill are aligned and visible in light + dark themes', (await q("(function(){var bar=document.querySelector('.music-progress-bar');var fill=document.getElementById('music-progress');if(!bar||!fill)return false;var originalTheme=document.documentElement.getAttribute('data-theme')||'light';var originalWidth=fill.style.width;fill.style.width='46%';function ok(theme){document.documentElement.setAttribute('data-theme',theme);var br=bar.getBoundingClientRect();var fr=fill.getBoundingClientRect();var track=getComputedStyle(bar,'::before');var trackBg=track.backgroundColor||'';var fillBg=getComputedStyle(fill).backgroundColor||'';var centerOk=Math.abs((fr.top+fr.height/2)-(br.top+br.height/2))<1;return centerOk&&Math.round(fr.height)===6&&Math.round(parseFloat(track.height))===6&&!/rgba\\(0, 0, 0, 0\\)|transparent/.test(trackBg)&&!/rgba\\(0, 0, 0, 0\\)|transparent/.test(fillBg);}var result=ok('light')&&ok('dark');document.documentElement.setAttribute('data-theme',originalTheme);fill.style.width=originalWidth;return result;})()")) === true);
  check('one <main> landmark + html lang set', (await q("document.querySelectorAll('main').length===1 && !!document.documentElement.getAttribute('lang')")) === true);
  check('skip-to-content link targets <main>', (await q("(function(){var s=document.querySelector('a.skip-link');var m=document.getElementById('main-content');return !!s && !!m && s.getAttribute('href')==='#main-content';})()")) === true);

  console.log('\nPrint (CV) stylesheet:');
  await send('Emulation.setEmulatedMedia', { media: 'print' }); await sleep(400);
  check('print hides mascot + UI chrome', (await q("['bg-canvas','waifu','theme-toggle','lang-toggle','terminal-toggle','effects-toggle','music-card'].every(function(id){var e=document.getElementById(id);return !e||getComputedStyle(e).display==='none';})")) === true);
  check('print flattens cards (no shadow/blur)', (await q("(function(){var c=document.querySelector('.card');if(!c)return false;var s=getComputedStyle(c);return s.boxShadow==='none' && (s.backdropFilter==='none'||s.webkitBackdropFilter==='none');})()")) === true);
  check('print reveals collapsed news', (await q("(function(){var n=document.querySelector('#news-list .news-hidden');return !n||getComputedStyle(n).display!=='none';})()")) === true);
  await send('Emulation.setEmulatedMedia', { media: '' });

  console.log('\nResponsive:');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.reload'); await sleep(4000);
  check('mascot is hidden at mobile width', (await q("(function(){var w=document.getElementById('waifu');return !w||getComputedStyle(w).display==='none';})()")) === true);

  // Exercise the REAL citation path (main.js fetches data/citations.json) by
  // stubbing fetch for that one URL — no test-only hook in production code.
  console.log('\nCitation badge (mocked citations.json fetch):');
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "(function(){var of=window.fetch;window.fetch=function(u){try{if(typeof u==='string'&&u.indexOf('data/citations.json')!==-1){return Promise.resolve(new Response(JSON.stringify({'2606.19152':123}),{status:200,headers:{'Content-Type':'application/json'}}));}}catch(e){}return of.apply(this,arguments);};})();" });
  await send('Page.reload'); await sleep(4500);
  check('"Cited by" badge renders from fetched citation counts', (await q("(function(){var b=document.querySelector('#pub-list .publication-card .cite-badge');return !!b && /123/.test(b.textContent);})()")) === true);
} catch (e) {
  fail++; console.error('\nTest harness error:', e.message);
} finally {
  console.log(`\n${fail === 0 ? '✅ ALL PASS' : '❌ FAILURES'} — ${pass} passed, ${fail} failed`);
  cleanup();
  process.exit(fail === 0 ? 0 : 1);
}
