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
check('unregistered English given name is absent from the site',
  !/\x53herry/i.test(waifu + readFileSync(join(ROOT, 'data/content.js'), 'utf8')));

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
  check('music player starts minimized and opens only on request', (await q("(function(){var card=document.getElementById('music-card');var toggle=document.getElementById('music-toggle-btn');if(!card||!toggle)return false;var initiallyMinimized=getComputedStyle(card).display==='none'&&getComputedStyle(toggle).display==='flex';toggle.click();var opened=getComputedStyle(card).display==='flex'&&getComputedStyle(toggle).display==='none';var close=document.getElementById('music-close-btn');if(close)close.click();return initiallyMinimized&&opened;})()")) === true);
  await sleep(4200);
  check('top navigation hides after inactivity', (await q("document.getElementById('top-nav').classList.contains('nav-idle-hidden')")) === true);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 500 }); await sleep(120);
  check('top navigation reappears on activity', (await q("!document.getElementById('top-nav').classList.contains('nav-idle-hidden')")) === true);

  console.log('\nData-driven content (publications + news from data/content.js):');
  check('publications rendered into #pub-list', (await q("document.querySelectorAll('#pub-list .publication-card').length")) === 3);
  check('each publication has an expandable BibTeX disclosure with unambiguous icons', (await q("(function(){var ds=document.querySelectorAll('#pub-list details.bibtex');return ds.length===3 && [].every.call(ds,function(d){var p=d.querySelector('.bibtex-text');var s=d.querySelector('.bibtex-summary');var c=d.querySelector('.bibtex-copy');return !!p && p.textContent.trim().indexOf('@')===0 && !!s.querySelector('.bibtex-toggle-icon') && !s.querySelector('.bibtex-copy-icon') && !!c.querySelector('.bibtex-copy-icon') && !!c.querySelector('.bibtex-copy-label');});})()")) === true);
  check('news rendered (all 10 items, 6 behind show-more)', (await q("document.querySelectorAll('#news-list .news-item').length===10 && document.querySelectorAll('#news-list .news-hidden').length===6")) === true);
  check('topic filter shows only matching papers', (await q("(function(){var b=document.querySelector('#pub-filters [data-filter=\\\"digitalTwin\\\"]');if(!b)return -1;b.click();var vis=[].filter.call(document.querySelectorAll('#pub-list .publication-card'),function(c){return c.style.display!=='none';}).length;var all=document.querySelector('#pub-filters [data-filter=\\\"all\\\"]');if(all)all.click();return vis;})()")) === 1);
  check('BibTeX disclosure opens and copy keeps its icon', (await q("(function(){var d=document.querySelector('#pub-list details.bibtex');if(!d)return false;try{d.open=true;var b=d.querySelector('.bibtex-copy');var icon=b&&b.querySelector('.bibtex-copy-icon');if(!b||!icon)return false;b.click();return d.open===true && b.querySelector('.bibtex-copy-icon')===icon;}catch(e){return false;}})()")) === true);
  check('Download-all-BibTeX button works', (await q("(function(){var b=document.getElementById('download-all-bib');if(!b)return false;try{b.click();return true;}catch(e){return false;}})()")) === true);
  check('publication ScholarlyArticle JSON-LD injected', (await q("(function(){var s=document.getElementById('pubs-jsonld');if(!s)return false;try{var a=JSON.parse(s.textContent);return a.length===3 && a[0]['@type']==='ScholarlyArticle';}catch(e){return false;}})()")) === true);
  check('Google Scholar citations map to the correct paper only', (await q("(function(){var cards=document.querySelectorAll('#pub-list .publication-card');return cards.length===3 && !cards[0].querySelector('.cite-badge') && !cards[1].querySelector('.cite-badge') && /5/.test((cards[2].querySelector('.cite-badge')||{}).textContent||'');})()")) === true);
  check('current peer-review stages encoded bilingually', (await q("(function(){var a=window.PUBLICATIONS.find(function(p){return p.id==='adsmind';});var c=window.PUBLICATIONS.find(function(p){return p.id==='catdt';});return a.venue.en.includes('Passed editorial screening') && a.venue.zh.includes('外部同行评审') && c.venue.en.includes('Major revision requested') && c.venue.zh.includes('大修');})()")) === true);
  check('language switch re-renders publications (venue follows language)', (await q("(function(){var t=document.getElementById('lang-toggle');var m=function(){var e=document.querySelector('#pub-list .muted');return e?e.textContent:'';};var zh=function(s){return /[\\u4e00-\\u9fff]/.test(s);};var s1=m();t.click();var s2=m();t.click();return zh(s1)!==zh(s2);})()")) === true);

  console.log('\nData-driven CV sections (from data/content.js):');
  check('education + research + all three industry timelines rendered', (await q("document.querySelectorAll('#edu-timeline .timeline-item').length===3 && document.querySelectorAll('#research-timeline .timeline-item').length===4 && document.querySelectorAll('#industry-timeline .timeline-item').length===3")) === true);
  check('Sansen internship keeps its Shanghai location bilingually', (await q("(function(){var s=window.INDUSTRY.find(function(x){return x.school==='sansen';});return !!s && s.title.en==='Computer Vision Algorithm Intern, Sansen Well (Shanghai) Robotics Co., Ltd., Shanghai, China.' && s.title.zh==='计算机视觉算法实习生，三森威尔（上海）机器人有限公司，中国上海。';})()")) === true);
  check('QVRI and Lucent experiences are preserved bilingually', (await q("(function(){var i=JSON.stringify(window.INDUSTRY);return i.includes('Qingdao Virtual Reality Institute (QVRI) Co., Ltd.') && i.includes('青岛虚拟现实研究院有限公司') && i.includes('Front-End Development Intern, Lucent Qingdao R&D Center') && i.includes('前端开发实习生，青岛朗讯科技通讯设备有限公司') && i.includes('Aug - Sep 2024') && i.includes('2024年8月-9月') && !/Aug 19|Sep 1|8月19日|9月1日|Development Assistant|前端开发者实习生/.test(i);})()")) === true);
  check('semester-project wording and Prof. Li Chinese name are exact', (await q("(function(){var r=JSON.stringify(window.RESEARCH);return r.includes('Semester Project Student') && r.includes('学期项目学生') && r.includes('李朝鉴教授与程立雪教授') && !r.includes('Chaojian Li 教授');})()")) === true);
  check('FYT is a thesis, never a project or graduation design', (await q("(function(){var r=JSON.stringify(window.RESEARCH);return r.includes('Final Year Thesis (FYT)') && r.includes('本科毕业论文（FYT）') && !/Final Year Project|FYP|毕业设计/.test(r);})()")) === true);
  await q("document.getElementById('industry-timeline').scrollIntoView({block:'center'})"); await sleep(800);
  check('all three industry logos load from the intended assets', (await q("(function(){var imgs=[].slice.call(document.querySelectorAll('#industry-timeline .school-logo'));var srcs=imgs.map(function(x){return x.getAttribute('src');});return imgs.length===3 && srcs.includes('assets/logo-sansen.svg') && srcs.includes('assets/logo-qvri.png') && srcs.includes('assets/logo-lucent.svg') && imgs.every(function(x){return x.complete && x.naturalWidth>0;});})()")) === true);
  check('industry panel spans the row without horizontal overflow', (await q("(function(){var p=document.querySelector('.experience-panel-industry');var g=document.querySelector('#experience .experience-awards-grid');return getComputedStyle(p).gridColumnStart==='1' && p.getBoundingClientRect().width>g.getBoundingClientRect().width*0.9 && p.scrollWidth<=p.clientWidth+1;})()")) === true);
  check('honors render as grouped cards (2/1/3 groups; 5/5/4 compact rows)', (await q("document.querySelectorAll('#scholarships-list .honor-group').length===2 && document.querySelectorAll('#deans-list .honor-group').length===1 && document.querySelectorAll('#awards-list .honor-group').length===3 && document.querySelectorAll('#scholarships-list .honor-item').length===5 && document.querySelectorAll('#deans-list .honor-item').length===5 && document.querySelectorAll('#awards-list .honor-item').length===4 && document.querySelectorAll('#honors .award-chip').length===0")) === true);
  check('Study Abroad amount is on the group heading, and CSE Programming Commons is listed first', (await q("(function(){var h=window.HONORS.scholarships;var s=h.find(function(g){return g.title.en.startsWith('HKUST Study Abroad Funding Support');});var grant=s&&s.items.find(function(x){return x.text.en==='HKUST Study Abroad Grant';});var roa=s&&s.items.find(function(x){return x.text.en.includes('Reaching Out Award (ROA)');});var t=window.ACTIVITIES.teaching;return s.title.en==='HKUST Study Abroad Funding Support (HK$10,000)' && s.title.zh==='香港科技大学海外学习资助（HK$10,000）' && !!grant && !grant.text.en.includes('HK$10,000') && !!roa && !roa.text.en.includes('HK$10,000') && !roa.text.zh.includes('HK$10,000') && t[0].en.includes('CSE Programming Commons') && t[1].en.includes('COMP2011') && t[0].zh.includes('2024年秋季、2026年春季及2026年秋季学期');})()")) === true);
  check('corrected news dates, club description, and sentence punctuation are encoded bilingually', (await q("(function(){var n=window.NEWS;var text=JSON.stringify(n).replace(/&[a-z]+;/gi,'');return n[0].date.en==='Sep 1, 2026' && n[0].date.zh==='2026年9月1日' && n[0].html.en.includes('a student-led academic community under the Department of Chemistry') && n[0].html.zh.includes('香港科技大学人工智能化学社</strong>（化学系下属之由学生领导的学术社区）') && n.some(function(x){return x.date.en==='Feb 1, 2026' && x.date.zh==='2026年2月1日';}) && text.includes('2nd consecutive year. Also received') && !/[;；]/.test(text);})()")) === true);
  check('EPFL semester-project wording is synchronized in news', (await q("(function(){var n=JSON.stringify(window.NEWS);return n.includes('semester project student') && n.includes('学期项目学生') && !n.includes('Started as project student') && !n.includes('担任项目学生');})()")) === true);
  check('Chinese academic years use full hyphenated years rather than AY or slashes', (await q("(function(){var dates=window.NEWS.map(function(x){return x.date.zh;}).concat(window.HONORS.scholarships.flatMap(function(g){return g.items.map(function(x){return x.date.zh;});}));return dates.includes('2026-2027学年') && dates.includes('2025-2026学年') && dates.includes('2024-2025学年') && !dates.some(function(x){return /^AY |\\/.*学年/.test(x);});})()")) === true);
  check('all six certificate-backed awards are grouped and listed bilingually', (await q("(function(){var groups=window.HONORS.awards;var a=JSON.stringify(groups);return groups.length===3 && groups.reduce(function(n,g){return n+g.items.length;},0)===4 && a.includes('Outstanding Volunteer') && a.includes('Data Analysis Professional Skill Certificate') && a.includes('Volunteer · First Prize (University Student Group)') && a.includes('志愿者 · 大学生组一等奖') && a.includes('Social Practice Activity Certificate') && a.includes('第五届全国学生科学素质知识科普活动') && !a.includes('Certificate of Honor for Volunteer Service') && !a.includes('志愿服务荣誉证书');})()")) === true);
  check('repeated honors names render once per group', (await q("(function(){var zh=document.documentElement.lang.indexOf('zh')===0;var t=document.getElementById('honors').textContent;var names=zh?['香港科技大学海外学习资助','第五届全国大学生数据分析科普竞赛系列活动','第五届全国学生科学素质知识科普活动']:['HKUST Study Abroad Funding Support',\"5th National University Students' Data Analysis Popular Science Knowledge Competition Series\",\"5th National Students' Science Literacy Knowledge Popularization Activity\"];return names.every(function(n){return t.split(n).length-1===1;});})()")) === true);
  check('honors cards have no horizontal content overflow', (await q("[].every.call(document.querySelectorAll('#honors .honor-group, #honors .honor-item, #honors .honor-group-title'),function(e){return e.scrollWidth<=e.clientWidth+1;})")) === true);
  check('user-facing CV prose contains no semicolons', (await q("(function(){var s=JSON.stringify({p:window.PUBLICATIONS.map(function(x){return x.venue;}),h:window.HONORS,a:window.ACTIVITIES.leadership});return !/[;；]/.test(s);})()")) === true);
  check('official Chinese role, club, workshop, scholarship, and society names are exact', (await q("(function(){var a=window.ACTIVITIES;var n=JSON.stringify(window.NEWS);var h=JSON.stringify(window.HONORS);var p=a.leadership[4].zh;return document.querySelectorAll('#leadership-list li').length===6 && a.leadership[0].zh==='IOP可信赖审稿人，Machine Learning: Science and Technology。' && a.leadership[1].zh==='审稿人，ICML 2026 AI for Science 研讨会与 NeurIPS 2026 AI for Science 研讨会。' && a.leadership[2].zh==='共同创始人兼副主席，香港科技大学人工智能化学社（化学系下属之由学生领导的学术社区）。' && n.includes('香港科技大学人工智能化学社') && n.includes('香港特别行政区政府卓越表现奖学金') && n.includes('香港特别行政区政府外展体验奖（ROA）') && !n.includes('香港特别行政区政府奖学基金') && h.includes('香港特别行政区政府卓越表现奖学金') && h.includes('香港特别行政区政府外展体验奖（ROA）') && !h.includes('香港特别行政区政府奖学基金') && p.startsWith('学生会员：') && !p.startsWith('专业学会') && p.includes('中国化学会（CCS）（化学方向）') && p.includes('香港电脑学会（HKCS）（计算机方向）') && p.includes('美国化学会（ACS）') && p.includes('英国皇家化学学会（RSC）') && p.includes('电气电子工程师学会（IEEE）') && p.includes('美国计算机学会（ACM）') && p.includes('中国计算机学会（CCF）');})()")) === true);
  check('activities lists rendered (6/2/6/5) with reviewer roles split', (await q("document.querySelectorAll('#leadership-list li').length===6 && document.querySelectorAll('#teaching-list li').length===2 && document.querySelectorAll('#techstack-list li').length===6 && document.querySelectorAll('#languages-list li').length===5 && window.ACTIVITIES.leadership[0].en.startsWith('IOP Trusted Reviewer') && window.ACTIVITIES.leadership[1].en.startsWith('Reviewer, ICML')")) === true);
  check('French level is EPFL-certified, not approximate', (await q("(function(){var f=window.ACTIVITIES.languages[3];return f.en.includes('certified by the EPFL Language Centre') && f.zh.includes('获 EPFL 语言中心认证') && !/approximately|约相当于|语言中心证书/.test(f.en+f.zh);})()")) === true);
  check('projects + collaborators rendered with Yuyang Lou last', (await q("document.querySelectorAll('#project-grid .project-card').length===4 && document.querySelectorAll('#collab-grid .collab-card').length===8 && window.COLLABORATORS[window.COLLABORATORS.length-1].name==='Yuyang Lou'")) === true);
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
  check('music progress track/fill are aligned and visible in light + dark themes', (await q("(function(){var card=document.getElementById('music-card');var toggle=document.getElementById('music-toggle-btn');var close=document.getElementById('music-close-btn');var bar=document.querySelector('.music-progress-bar');var fill=document.getElementById('music-progress');if(!card||!toggle||!bar||!fill)return false;var wasMinimized=getComputedStyle(card).display==='none';if(wasMinimized)toggle.click();var originalTheme=document.documentElement.getAttribute('data-theme')||'light';var originalWidth=fill.style.width;fill.style.width='46%';function ok(theme){document.documentElement.setAttribute('data-theme',theme);var br=bar.getBoundingClientRect();var fr=fill.getBoundingClientRect();var track=getComputedStyle(bar,'::before');var trackBg=track.backgroundColor||'';var fillBg=getComputedStyle(fill).backgroundColor||'';var centerOk=Math.abs((fr.top+fr.height/2)-(br.top+br.height/2))<1;return centerOk&&Math.round(fr.height)===6&&Math.round(parseFloat(track.height))===6&&!/rgba\\(0, 0, 0, 0\\)|transparent/.test(trackBg)&&!/rgba\\(0, 0, 0, 0\\)|transparent/.test(fillBg);}var result=ok('light')&&ok('dark');document.documentElement.setAttribute('data-theme',originalTheme);fill.style.width=originalWidth;if(wasMinimized&&close)close.click();return result;})()")) === true);
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
  check('grouped honors stay within the mobile viewport', (await q("(function(){var h=document.getElementById('honors');return h.scrollWidth<=h.clientWidth+1 && [].every.call(h.querySelectorAll('.honor-group, .honor-item, .honor-group-title'),function(e){return e.scrollWidth<=e.clientWidth+1;});})()")) === true);

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
