# AGENTS.md - working conventions for agents on this repo

flowforge is the **shell** the struct family ships new sites from: the landing + docs rig and the CI/release plumbing, with the brand as data. Humans are the primary audience; this file doubles as the agent cheat sheet so nobody re-learns the same lessons from scratch. See the sibling docs: [README.md](./README.md) (product + box contents), [DEPLOY.md](./DEPLOY.md) (deploy + release runbook), [CHANGELOG.md](./CHANGELOG.md) (the release log), [MANIFEST.md](./MANIFEST.md) (per-file receipts), and [labs/TASKS.md](./labs/TASKS.md) (the rolling work log).

## Layout

```text
site.config.js          THE site identity - the ONE file a rebrand edits
lib/                    the TOOL (versioned once, imported by adopters)
  gates/                the check-*.cjs family (frontmatter/links/style/fiction/liquid/theme/birth/census)
  root.cjs / root.mjs   resolve the SITE root (walk up to site.config.js)
  sync.mjs              fans the identity out to the non-JS surfaces
  template.mjs          builds templates/<name>/ from the dogfood tree
  templates.mjs         the template REGISTRY + chain resolver (vant chain shape)
  gate-drift.mjs        does an adopter's vendored scripts/ still match the rig? (consumption check)
  lint-packs.cjs        the packstruct wrapper verb
  ship-from-download.cjs the phone publish lane
templates/coreforge/    the FULL shell `coreforge create` stamps (GENERATED) - CHAINS coreforge-headless
templates/coreforge-headless/  CI ONLY (.github/ battery) (GENERATED)
web/                    the prestruct landing shell (React/Vite, prerendered) - the dogfood
  src/styles.css        the ENTIRE design system - semantic tokens only
  src/site.js           the web bundle's accessor for site.config.js
  src/components/       Nav / Footer / ThemeSwitch / navItems (one nav vocabulary)
  src/pages/            placeholder pages - replace, keep route shape
  ssr.config.js         prestruct's config - an ADAPTER over site.config.js
docs/                   the Jekyll docs rig - the dogfood
  _layouts/default.html header, sidebar, pagefind search, theme tokens
  _data/nav.yml         (yours to add) - sidebar sections come from here
.github/workflows/      docs-deploy.yml (Pages, thin caller) + docs-build.yml (reusable lane) + release.yml (npm OIDC)
labs/TASKS.md           the rolling work log - append entries as you ship
MANIFEST.md             every extracted file -> source SHA + engine pins
packs/README.md         the /packs contract (see below) - packs live in packs/public/<name>/
```

The tool (`lib/`) and the site (`web/` + `docs/` + `site.config.js`) are separate halves. The tool is versioned once and reaches adopters by `npm install`; the site is the dogfood, left in place (PRD 7/9). `templates/<name>/` is generated from the dogfood by `lib/template.mjs` - never hand-edit it; run `npm run template`.

Templates **chain** the way [vant](https://github.com/dhaupin/vant) chains skills (`docs/essential/extensibility.md`): a profile's `TEMPLATE.md` frontmatter carries a `chain:` list, and `lib/templates.mjs` resolves it children-first with the parent winning on a path collision. `coreforge` chains `coreforge-headless`, so the CI battery lives ONCE (in the headless profile) and the full shell inherits it - one copy, no drift between the two shapes. A chain cycle refuses, named.

## House rules (each one paid for in real bugs)

1. **Tokens own the palette.** Every color rides semantic variables (`--paper/--surface/--raised/--ink/--ink-soft/--accent/--moss/--err/...`); the light theme is a second block of the SAME token set; a layout class never hardcodes a hex. Re-brand = edit `site.config.js` (identity, nav, routes) + the token block. Nothing else moves: the JS surfaces import the config, and `npm run sync` regenerates the engine-owned files (`web/ssr.config.js`, `docs/freestruct.config.yml`) and the static surfaces; the brand census gate refuses a literal that lives anywhere else. `site.config.js` is concern-named on purpose - a product-named config would force prestruct/freestruct to depend on flowforge (see labs/prd-flowforge.md 5.1).
2. **Theme is one attribute.** `<html data-theme>` + a no-flash inline bootstrap; both switch icons always render (CSS picks), so prerender and hydration agree byte-for-byte. Icon is the action (sun shows in dark mode - clicking goes light), the shared family convention.
3. **Gates fail at cause.** Every `lib/gates/check-*.cjs` names file:line. When a bug is caught twice, it becomes a gate - add a signature/check the same day, never bend a check to silence it.
4. **Pins never float.** prestruct (npm), freestruct (workflow install), the pagefind scrape, and every GitHub Action (SHA-pinned, the human tag in a comment) are pinned in the workflow files. Bumping a pin moves the [MANIFEST.md](./MANIFEST.md) row in the SAME commit.
5. **Adopt explicitly, extract honestly.** New sites diff this rig and replace only brand data (tokens, nav vocabulary, pages, copy). When this rig takes a fix FROM a family repo, transcribe with receipts - never invent shapes from memory.
6. **Determinism.** Same inputs -> same bytes for anything generated; no wall clock in shipped surfaces.
7. **The log is the memory.** Every agent session appends its receipts to [labs/TASKS.md](./labs/TASKS.md) and versioned changes to [CHANGELOG.md](./CHANGELOG.md) - the next agent should never have to guess what happened.

## The /packs ecosystem (the family contract)

`packs/` is where optional extension packs live: `packs/public/<name>/` (tracked, shipped) and `packs/local/<name>/` (gitignored, private). A pack is a `pack.json` manifest plus its entry module. The manifest grammar is SPEC 1 - [packs/README.md](./packs/README.md) links the spec, the two profile reference implementations (crashtest: `scenario`, poststruct: `check`), and the lint tool (packstruct). Empty in the shell on purpose.

## Common commands

```bash
npm ci && npm test                                       # hermetic install + the node:test spine
npm run check && npm run lint:docs                       # the five gates + the birth-gate lane
npm run lint:packs                                       # packstruct over packs/ (exit 2 names the fix)
npm install --prefix web && npm run build --prefix web   # "N/N pages rendered" is healthy
cd docs && bundle exec jekyll build                      # optional locally; CI proves it (see DEPLOY.md #22)
```

`prepublishOnly` = `npm test && npm run check && npm run lint:docs`, so the publish ladder cannot mint a tarball from a red battery (the gate in `release.yml` additionally refuses 0.x and a tag that disagrees with the packaged version).

## Version protocol (0.9.0 today)

Version surfaces: `package.json` and `web/package.json` - kept EQUAL by a same-commit bump, and held there by the version-truth census leg (`npm test`, issue #28) so a release commit physically cannot move one without the others. A release = bump both + the README Status line + a CHANGELOG entry + tag `vX.Y.Z` + push the tag; the release workflow publishes to npm via Trusted Publishing (OIDC - no publish tokens anywhere) and its gate refuses 0.x and a tag that disagrees with the packaged version (issue #23/#29). The retry ritual lives in [DEPLOY.md](./DEPLOY.md). Pack manifests are OUTSIDE this protocol - their semver is theirs.
