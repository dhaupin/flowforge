# labs/TASKS.md - the rolling work log

One file, appended per landing/session, newest last, with receipts (files,
gates, SHAs). The house law this file serves: **the log is the memory** -
the next agent should never guess what happened. Conventions live in
[../AGENTS.md](../AGENTS.md); versioned product changes also get a
[CHANGELOG.md](../CHANGELOG.md) entry in the same commit.

## Open asks (carry forward until landed)

- _none yet - the 0.9.0 scaffold cut is the first entry below._

---

### 2026-10-25 - rig unpacked to main (onboarding issue #2, with issue #1 convention pulls)

- The archived rig extraction landed: verified the parked seed archive
  byte-for-byte first (`sha256 horcrux/flowforge.tar.gz` =
  `51577a971225419c277051a3570763e2bc6b0bea2c6ad02b3839293b916e093a`,
  matching the receipt in the onboarding issue), then unpacked it and moved
  `flowforge/*` to the repo root (the rig is written as a root tree:
  MANIFEST paths are root-relative, `web/` + `docs/` + `scripts/` sit at
  top). `horcrux/` stays as the parked archive; `LICENSE` kept. The rig's
  own README replaced the 11-byte stub.
- Issue #1 convention pulls folded in: direct Creadev.org backlink bullet
  added to the root README's map section (the workshop -> creadev.org);
  second ask already satisfied by the rig - `docs/discussions/index.md`
  ships the file-IS-the-post release-post boilerplate. Edited that index
  to point the exemplar link at crashtest's conventions index +
  announcing-v1.0.0 per the amended convention (the prestruct link was the
  older shape issue #1 says to skip). File-body edits only; receipt
  discipline: no MANIFEST rows rewired, changes logged here.
- Gates run on the unpacked rig: `npm run check` PASS (all five gate
  scripts compile), `npm run lint:docs` PASS (frontmatter 2 pages, links
  2 files, style 2 files, fiction 26 files/4 signatures, Jekyll filters).
  `npm install --prefix web && prestruct build`: **1/1 pages rendered,
  exit 0** (this genericized cut ships one route - N/N is the healthy
  signal; the source repo's 6/6 bullet is crashtest-specific).
- Observed, not bent: one dev-mode JSX warning from the extracted
  react-router UMD build ("Invalid value for prop `className` on <a>")
  during prerender. Engine files are byte-exact copies (MANIFEST web/;
  copy once, never edit), so nothing was touched for it - logged for the
  next bump review instead.- Unpack audit dot (same session, still 2026-10-25): the docs-deploy freestruct step discovers its config from repo root (`docs/freestruct.config.yml`, legacy `ssr-config.yml`) and the crashtest cut shipped NEITHER - the layer would have been dropped - so added `docs/freestruct.config.yml` (placeholder identity mirroring `docs/_config.yml`). While wiring it, checked the pinned freestruct substitution table (seo.js @ dfb30aa498): `{{siteAuthor}}` in `_freestruct/inject-brand.html` was never a supported placeholder and would have shipped literally into the JSON-LD; the author block now rides the supported `{{siteName}}`/`{{siteUrl}}` (Organization). Both receipts landed as new rows in [../MANIFEST.md](../MANIFEST.md).
- First docs-deploy run on main red-lit at pagefind: `_site` had ZERO .html files. Root cause: both sample pages carried `.md`-suffixed permalinks (`permalink: index.md` / `discussions/index.md`) - Jekyll preserves the permalink extension verbatim in output, so the site emitted `_site/index.md` / `_site/discussions/index.md` (HTML inside .md filenames). It exited 0 and looked healthy locally; only the hard-failing pagefind caught it. Fixed to the gate-shaped permalinks (`/` for the docs home, `discussions/` for the release-posts index). FICTION CLASS logged (first catch, so no new gate per house law - second catch mints one): "a permalink that exits every gate but ends in .md renders zero html; only the search-index step refuses".
- Second docs-deploy run: GREEN (build + deploy, run 40161588398). Site live at https://docs.creadev.org/flowforge/ (HTTP 200 + HTTPS 200; Pages API reports no repo-level CNAME, the docs.* domain resolves family-side). With the real deploy home now observable from the deployment URL, swapped the `/project` + `your-site.example.com` placeholders for the computed truth: `docs/_config.yml` (url `https://docs.creadev.org`, baseurl `/flowforge`), `scripts/check-docs-links.cjs` `SITE_PREFIX` = `/flowforge` (the mirror DEPLOY.md asks for), and `docs/freestruct.config.yml` `site.url` (freestruct canonical/OG truth). `web/ssr.config.js` stays placeholder - that surface belongs to the web host, whose URL lands when the CF-Pages deploy names it.
- Open asks (carry forward until landed): wire the estate per issue #2 step 3 - docs-deploy.yml the real Pages lane, the web host per
  DEPLOY.md (CF-Pages shape), and the OIDC release template when there is
  an artifact to release.

---

### 2026-10-24 - 0.9.0 scaffold cut (the shell extracted from crashtest @ 905aa91)

- The rig was extracted, not written from memory: every file is either a
  byte-exact copy or a small genericization of a deployed, verified surface
  - the per-file receipts live in [../MANIFEST.md](../MANIFEST.md)
  (extraction SHA: dhaupin/crashtest@905aa91, which itself carried the
  theme-port + highlight work verified same-day: suite green, web prerender
  6/6 pages, docs deploy live).
- What landed: `web/` landing shell (light/dark switch, tokens-only palette,
  one nav vocabulary, islands engine), `docs/` Jekyll rig (pagefind search,
  shared Rouge token colors, freestruct SEO layer), five `scripts/` gates,
  two workflows (docs deploy with the hardened pagefind scrape + PINNED
  freestruct; npm OIDC release template), plus this log,
  [../CHANGELOG.md](../CHANGELOG.md) 0.9.0, the
  [../packs/README.md](../packs/README.md) contract, and the three
  crosslinked core docs ([../README.md](../README.md) /
  [../AGENTS.md](../AGENTS.md) / [../DEPLOY.md](../DEPLOY.md)).
- Verification receipts (run on the extracted rig, not the source): all five
  docs gates PASS against the generic `docs/` (1 sample page), fresh
  `npm install` + `prestruct build` prerendered the shell clean (1/1
  pages, zero JSX warnings), `web/public/icon.svg` and `docs/icon.svg`
  verified byte-equal (the two-surface brand contract).
- Deliberately left for adopters (documented, not shipped): PNG icon slots +
  `og-image.png` (referenced in `site.webmanifest`), the docs sidebar data
  (`docs/_data/nav.yml` - one group/`items` shape, see the sample page),
  and any pack content (`packs/public/` stays empty in the shell).
- First release path (manual, per [../DEPLOY.md](../DEPLOY.md)): bump check
  -> `v0.9.0` tag -> OIDC publish -> GitHub release from the tag with the
  changelog entry as its body.
