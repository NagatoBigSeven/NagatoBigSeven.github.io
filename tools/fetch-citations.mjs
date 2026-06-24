#!/usr/bin/env node
/*
 * Fetch citation counts for the publications (by arXiv id) from the Semantic
 * Scholar API and write them to data/citations.json. Run server-side (CI cron /
 * locally) — never from the browser, so visitors don't hit CORS or the API rate
 * limit. The page reads the resulting static JSON.
 *
 *   node tools/fetch-citations.mjs
 *   S2_API_KEY=xxxx node tools/fetch-citations.mjs   # higher rate limit
 *
 * Resilient by design: on 429/network errors it retries with backoff and, if it
 * still can't fetch a paper, keeps the previously stored count. Papers not yet
 * indexed by Semantic Scholar (e.g. brand-new preprints) are simply omitted, so
 * no badge shows until they appear.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data/citations.json');
const API = 'https://api.semanticscholar.org/graph/v1/paper/arXiv:';
const KEY = process.env.S2_API_KEY || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const require = createRequire(import.meta.url);
global.window = {};
require(join(ROOT, 'data/content.js'));
const PUBLICATIONS = global.window.PUBLICATIONS || [];

function arxivId(p) {
  const href = (p.links && p.links[0] && p.links[0].href) || '';
  const m = href.match(/arxiv\.org\/abs\/([^?#/]+)/i);
  return m ? m[1] : '';
}

let prev = {};
try { prev = JSON.parse(readFileSync(OUT, 'utf8')); } catch { /* none yet */ }
const out = { ...prev };

async function fetchCount(id) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch(API + encodeURIComponent(id) + '?fields=citationCount',
        { headers: KEY ? { 'x-api-key': KEY } : {} });
      if (r.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      if (r.status === 404) return null;          // not indexed yet
      if (!r.ok) { await sleep(1500 * (attempt + 1)); continue; }
      const j = await r.json();
      return typeof j.citationCount === 'number' ? j.citationCount : null;
    } catch { await sleep(1500 * (attempt + 1)); }
  }
  return undefined; // give up — keep any previous value
}

let updated = 0, skipped = 0;
for (const p of PUBLICATIONS) {
  const id = arxivId(p);
  if (!id) continue;
  const c = await fetchCount(id);
  if (c === null) { delete out[id]; skipped++; console.log(`  · ${id}: not indexed`); }
  else if (c === undefined) { console.log(`  ! ${id}: fetch failed, keeping ${out[id] ?? '—'}`); }
  else { out[id] = c; updated++; console.log(`  ✓ ${id}: ${c}`); }
  await sleep(1200); // be polite to the API
}

const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Wrote data/citations.json (${updated} fetched, ${skipped} not indexed, ${Object.keys(sorted).length} total).`);
if (updated === 0 && !KEY) {
  console.log('Hint: nothing fetched — Semantic Scholar heavily rate-limits anonymous use. ' +
    'Add an S2_API_KEY repo secret for reliable weekly refreshes: ' +
    'https://www.semanticscholar.org/product/api');
}
