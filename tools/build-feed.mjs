#!/usr/bin/env node
/*
 * Generate feed.xml (Atom) from the publications in data/content.js, so the RSS
 * feed can never drift from the site content.
 *
 *   node tools/build-feed.mjs          # write feed.xml
 *   node tools/build-feed.mjs --check  # exit 1 if feed.xml is out of date
 *
 * The --check mode is run in CI / the pre-push hook so a stale feed is caught.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://nagatobigseven.github.io/';
const FEED_PATH = join(ROOT, 'feed.xml');

const require = createRequire(import.meta.url);
global.window = {};
require(join(ROOT, 'data/content.js'));
const PUBLICATIONS = global.window.PUBLICATIONS || [];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Newest first by date (falls back to year).
const pubs = PUBLICATIONS.slice().sort((a, b) =>
  String(b.date || b.year).localeCompare(String(a.date || a.year)));

const updated = (pubs[0] && (pubs[0].date || pubs[0].year + '-01-01')) || '2026-01-01';

const entries = pubs.map((p) => {
  const href = (p.links && p.links[0] && p.links[0].href) || SITE;
  const date = p.date || (p.year + '-01-01');
  const summary = [p.highlight && p.highlight.en, p.venue && p.venue.en]
    .filter(Boolean).join(' ');
  return [
    '  <entry>',
    '    <title>' + esc(p.title.en) + '</title>',
    '    <link href="' + esc(href) + '" rel="alternate" type="text/html"/>',
    '    <id>' + esc(href) + '</id>',
    '    <published>' + date + 'T00:00:00Z</published>',
    '    <updated>' + date + 'T00:00:00Z</updated>',
    '    <summary>' + esc(summary) + '</summary>',
    '    <category term="publication"/>',
    '  </entry>',
  ].join('\n');
}).join('\n\n');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<feed xmlns="http://www.w3.org/2005/Atom">',
  '  <title>Zongmin Zhang — Publications &amp; News</title>',
  '  <subtitle>Academic updates from Zongmin Zhang, HKUST CS undergraduate and AI for Science researcher.</subtitle>',
  '  <link href="' + SITE + '" rel="alternate" type="text/html"/>',
  '  <link href="' + SITE + 'feed.xml" rel="self" type="application/atom+xml"/>',
  '  <id>' + SITE + '</id>',
  '  <updated>' + updated + 'T00:00:00Z</updated>',
  '  <author>',
  '    <name>Zongmin Zhang</name>',
  '    <uri>' + SITE + '</uri>',
  '  </author>',
  '',
  entries,
  '</feed>',
  '',
].join('\n');

const check = process.argv.includes('--check');
const current = (() => { try { return readFileSync(FEED_PATH, 'utf8'); } catch { return null; } })();

if (check) {
  if (current === xml) { console.log('feed.xml is up to date ✅'); process.exit(0); }
  console.error('❌ feed.xml is out of date — run: node tools/build-feed.mjs');
  process.exit(1);
}
writeFileSync(FEED_PATH, xml);
console.log('Wrote feed.xml (' + pubs.length + ' entries).');
