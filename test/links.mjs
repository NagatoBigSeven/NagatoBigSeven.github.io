#!/usr/bin/env node
/*
 * Link / asset integrity check.
 *
 *  - STRICT (always): every LOCAL file referenced from index.html, 404.html,
 *    index.css, and the data-driven content model must exist on disk. Referenced
 *    images/PDFs also get a cheap magic-byte check, so a saved CAPTCHA/HTML page
 *    cannot masquerade as a collaborator .jpg.
 *  - EXTERNAL (only with --external): HEAD/GET each external URL and report
 *    dead ones. Off by default because social sites bot-block (403/999) and
 *    would create false failures; meant for the scheduled links workflow.
 *
 * Usage:  node test/links.mjs            # strict local check (CI/pre-push gate)
 *         node test/links.mjs --external # also probe external URLs (report)
 * Exit:   0 = all local assets exist (and, with --external, no dead links).
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const wantExternal = process.argv.includes('--external');

const HTML_FILES = ['index.html', '404.html'];
const CSS_FILES = ['index.css'];

const local = new Map();   // resolved path -> Set(source files)
const external = new Map(); // url -> Set(source files)

function addRef(ref, fromFile) {
  if (!ref) return;
  ref = ref.trim().replace(/^['"]|['"]$/g, '');
  if (!ref || ref.startsWith('#') || ref.startsWith('data:') ||
      ref.startsWith('mailto:') || ref.startsWith('tel:') ||
      ref.startsWith('javascript:')) return;
  if (/^https?:\/\//i.test(ref) || ref.startsWith('//')) {
    const u = ref.startsWith('//') ? 'https:' + ref : ref;
    (external.get(u) || external.set(u, new Set()).get(u)).add(fromFile);
    return;
  }
  // local: drop query/hash, resolve relative to repo root
  const clean = ref.split('?')[0].split('#')[0];
  if (!clean) return;
  const p = normalize(join(ROOT, clean));
  (local.get(p) || local.set(p, new Set()).get(p)).add(fromFile + '  →  ' + ref);
}

for (const f of HTML_FILES) {
  if (!existsSync(join(ROOT, f))) continue;
  let html = readFileSync(join(ROOT, f), 'utf8');
  // preconnect/dns-prefetch are connection hints, not fetchable resources —
  // their bare-origin href legitimately 404s, so drop those tags before scanning.
  html = html.replace(/<link\b[^>]*\brel\s*=\s*["'](?:preconnect|dns-prefetch)["'][^>]*>/gi, '');
  let m;
  const attr = /\b(?:src|href)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  while ((m = attr.exec(html))) addRef(m[2] ?? m[3], f);
  const cssUrl = /url\(\s*('([^']*)'|"([^"]*)"|([^)]*))\s*\)/gi;
  while ((m = cssUrl.exec(html))) addRef(m[2] ?? m[3] ?? m[4], f);
}
for (const f of CSS_FILES) {
  if (!existsSync(join(ROOT, f))) continue;
  const css = readFileSync(join(ROOT, f), 'utf8');
  let m;
  const cssUrl = /url\(\s*('([^']*)'|"([^"]*)"|([^)]*))\s*\)/gi;
  while ((m = cssUrl.exec(css))) addRef(m[2] ?? m[3] ?? m[4], f);
}

function walkDataRefs(value, fromFile) {
  if (typeof value === 'string') {
    if (/^(https?:|\/\/)/i.test(value)) {
      addRef(value, fromFile);
    }
    if (/^(assets|data|feed\.xml|sitemap\.xml|robots\.txt)\//.test(value) ||
        /^(assets|data|feed\.xml|sitemap\.xml|robots\.txt)(?:[?#]|$)/.test(value)) {
      addRef(value, fromFile);
    }
    let match;
    const embeddedAttr = /\b(?:src|href)\s*=\s*("([^"]*)"|'([^']*)')/gi;
    while ((match = embeddedAttr.exec(value))) addRef(match[2] ?? match[3], fromFile);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkDataRefs(item, fromFile));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => walkDataRefs(item, fromFile));
  }
}

const require = createRequire(import.meta.url);
global.window = {};
require(join(ROOT, 'data/content.js'));
[
  'TAGS', 'PUBLICATIONS', 'NEWS', 'SCHOOLS', 'EDUCATION', 'RESEARCH',
  'HONORS', 'ACTIVITIES', 'PROJECTS', 'COLLABORATORS'
].forEach((key) => walkDataRefs(global.window[key], `data/content.js:${key}`));

function expectedAssetKind(p) {
  const ext = extname(p).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'JPEG';
  if (ext === '.png') return 'PNG';
  if (ext === '.webp') return 'WebP';
  if (ext === '.svg') return 'SVG';
  if (ext === '.pdf') return 'PDF';
  return '';
}

function hasExpectedMagic(p, kind) {
  const buf = readFileSync(p);
  if (kind === 'JPEG') return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (kind === 'PNG') return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (kind === 'WebP') return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  if (kind === 'SVG') return buf.subarray(0, 512).toString('utf8').trimStart().startsWith('<svg');
  if (kind === 'PDF') return buf.subarray(0, 5).toString('ascii') === '%PDF-';
  return true;
}

let fail = 0;
console.log(`Local asset integrity (${local.size} unique references):`);
const missing = [];
for (const [p, froms] of local) {
  if (!existsSync(p)) { missing.push([p, froms]); }
}
if (missing.length === 0) {
  console.log(`  ✅ all ${local.size} local assets exist`);
} else {
  for (const [p, froms] of missing) {
    fail++;
    console.log('  ❌ MISSING: ' + p.replace(ROOT + '/', ''));
    for (const fr of froms) console.log('       from ' + fr);
  }
}

const invalidTypes = [];
for (const [p, froms] of local) {
  if (!existsSync(p)) continue;
  const kind = expectedAssetKind(p);
  if (kind && !hasExpectedMagic(p, kind)) invalidTypes.push([p, kind, froms]);
}
if (invalidTypes.length === 0) {
  console.log('  ✅ referenced image/PDF assets have the expected file signatures');
} else {
  for (const [p, kind, froms] of invalidTypes) {
    fail++;
    console.log(`  ❌ INVALID ${kind}: ` + p.replace(ROOT + '/', ''));
    for (const fr of froms) console.log('       from ' + fr);
  }
}

if (wantExternal) {
  console.log(`\nExternal links (${external.size}) — report only unless clearly dead:`);
  for (const [u, froms] of external) {
    let code = 0, err = '';
    try {
      const ctrl = AbortSignal.timeout(12000);
      let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctrl });
      if (r.status === 405 || r.status === 501) r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000) });
      code = r.status;
    } catch (e) { err = e.name === 'TimeoutError' ? 'timeout' : (e.message || 'error'); }
    // 2xx/3xx fine. 401/403/405/429/999/503 = bot-blocked or rate-limited, not dead.
    const tolerated = [401, 403, 405, 429, 503, 999];
    if (code >= 200 && code < 400) console.log(`  ✅ ${code}  ${u}`);
    else if (tolerated.includes(code)) console.log(`  ⚠️  ${code}  ${u} (bot-blocked/rate-limited — ignored)`);
    else if (err) console.log(`  ⚠️  ${err}  ${u} (network — ignored)`);
    else { fail++; console.log(`  ❌ ${code}  ${u}`); for (const fr of froms) console.log('       from ' + fr); }
  }
}

console.log(`\n${fail === 0 ? '✅ OK' : '❌ ' + fail + ' problem(s)'}`);
process.exit(fail === 0 ? 0 : 1);
