# Smoke / regression test

A self-contained test that launches a local server + headless Chrome and
verifies the site's interactive features still work — so a single-line bug
(like the Live2D `loadlive2d` X-argument crash) can't silently slip back in.

## Run

```sh
node test/smoke.mjs      # interactive-feature regression test (needs Chrome)
node test/links.mjs      # local asset integrity (no browser, no network)
node test/links.mjs --external   # also probe external links (report)
```

Requirements: **Google Chrome** and **python3** on PATH (smoke only). Exit code
is `0` if everything passes, `1` on any failure (so it can gate a commit/push or
CI).

## Git hook

A versioned pre-push hook in [`hooks/pre-push`](../hooks/pre-push) runs the link
check + smoke test before every push. Enable it once per clone:

```sh
git config core.hooksPath hooks
```

Bypass a single push with `git push --no-verify`. The hook skips the browser
test gracefully if Chrome/node are missing.

## Link / asset integrity (`links.mjs`)

- **Strict (default):** every local file referenced by `src=` / `href=` / CSS
  `url(...)` in `index.html`, `404.html`, and `index.css` must exist on disk —
  catches dangling references to renamed/removed assets. No network.
- **`--external`:** also HEAD/GETs external URLs; fails only on genuinely dead
  links (404/410). Bot-blocked social sites (403/429/999) are tolerated. Used by
  the weekly `links` workflow, not on PRs (to avoid false failures).

Override defaults via env vars if needed:

```sh
CHROME="/path/to/chrome" PORT=8799 CDP_PORT=9334 node test/smoke.mjs
```

## What it covers

- **Static guards:** `loadlive2d('live2d', modelUrl)` is called with no 3rd
  argument (the 3rd arg is the look-at factor `X`, not a callback — passing a
  function made it `NaN` and tore the mascot apart on hover).
- **Live2D mascot:** loads, is visible, and **does not lose its WebGL context
  or tear when the mouse interacts** with it.
- **Features:** terminal opens + runs a command; theme toggle; language toggle.
- **Data-driven content:** publications, news, and the whole CV (education,
  research, honors, activities, projects, collaborators) render from
  `data/content.js`; every paper has an expandable BibTeX disclosure
  (`<details>`, view + copy) plus a "Download all BibTeX"; the topic filter
  narrows the list; per-paper `ScholarlyArticle` JSON-LD is injected; switching
  language re-renders everything.
- **Generated `feed.xml`:** `node tools/build-feed.mjs` regenerates the Atom
  feed from `data/content.js`; `--check` (run in CI + the pre-push hook) fails
  if it has drifted.
- **Citation counts:** `node tools/fetch-citations.mjs` (run weekly by the
  `citations` workflow) writes `data/citations.json` from Semantic Scholar; the
  page shows a "Cited by N" badge when a count exists. Anonymous Semantic Scholar
  access is heavily rate-limited — for reliable refreshes add a repo secret
  `S2_API_KEY` (free key: <https://www.semanticscholar.org/product/api>). Without
  it the job still runs, degrades gracefully (keeps prior values), and prints a
  hint.
- **Share card:** `node tools/build-og.mjs` renders `assets/og-card.png`
  (1200×630 OG/Twitter image) from your name + tagline + photo via headless
  Chrome; re-run after changing those and commit the PNG.
- **Lighthouse budgets:** the `lighthouse` workflow asserts score floors from
  `.lighthouserc.json` (a11y/best-practices/SEO ≥ 0.9 hard, performance soft)
  on a schedule — not on PRs, so CDN/network noise never blocks dev.
- **Effects toggle:** lite mode hides the particle background + cursor trail and
  strips frosted-glass blur while keeping the mascot; full mode restores it.
- **Accessibility:** decorative mascot/canvas are `aria-hidden`, icon buttons
  have accessible names, the music player is a labelled landmark, there's a
  single `<main>` with `lang` set, and a skip-to-content link targets it (the
  invariants that keep axe-core clean).
- **Citation badges:** a "Cited by N" badge renders on a publication when
  `data/citations.json` has a positive count for its arXiv id.
- **Print (CV) stylesheet:** under print media the mascot + UI chrome are
  hidden, cards are flattened (no shadow/blur), and collapsed news is revealed.
- **Responsive:** the mascot is hidden at mobile widths.
