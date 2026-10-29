# PRD: flowforge (the site shell, as a real tool)

**Status:** draft v0.1 for owner review (2026-10-29)
**Owner:** dhaupin
**Companion:** [monoforge](../README.md) (the fleet factory) - see "Relationship to monoforge" below

---

## 1. One-line pitch

**flowforge is the site shell you pull in and run: one config file, four verbs, two surfaces (landing + docs), zero hand-editing of brand data.** Today the repo is a template you copy and hand-edit; this PRD turns it into a package you install, run, and derive from.

## 2. Why (the evidence, not the idea)

The current repo is a **quick-and-dirty first proto** and it shows in three concrete ways, all measured against the tree as it stands:

- **There is no entry point.** `package.json` has no `bin`, no `main`, no `exports`. `npm i flowforge` unpacks 75 files into `node_modules/` and stops - nothing runs. `npx flowforge` does nothing.
- **The brand is hardcoded across ~18 shipped files in three languages.** `flowforge`/`creadev`/`dhaupin` literals live in `web/ssr.config.js`, `web/src/components/navItems.js`, `web/src/theme.js`, the page copy in `Home.jsx`/`Terms.jsx`/`Privacy.jsx`/`Footer.jsx`/`Nav.jsx`, `web/index.html`, `robots.txt`, `site.webmanifest`, `docs/_config.yml`, `docs/_layouts/default.html`, `docs/_data/nav.yml`, both `package.json`s, and the workflow files. Nothing derives from a single source, so the README's "replace every YOUR... value" is a manual find-and-replace across languages.
- **The tool and its own deployment are the same tree.** This repo IS flowforge.creadev.org. A published artifact would carry the dogfood's identity, sample pages, and its own CI - a template, not a tool.

The house rule that decides the shape: **when a bug is caught twice, it becomes a gate.** Brand drift is the bug; the gate is a brand census (section 8).

## 3. The model: two identities

The root cause is that one string, `flowforge`, means two different things. The whole design falls out of splitting them:

| | Rig identity | Site identity |
|---|---|---|
| What it is | the tool: gates, build orchestration, templates | the adopter's brand |
| Lives in | the npm package (versioned) | one config file in the adopter's repo |
| Changes | on version bumps | per adopter |
| Who owns it | the family | the adopter |

Everything else in this PRD is a consequence: the config is the site identity, the package is the rig, and the example folder is a site identity the rig dogfoods.

## 4. The target UX

```bash
npx flowforge create my-site
cd my-site
npm install
npm run dev        # landing on :5173
npm run docs       # docs on :4000
npm run build      # prerendered dist/
npm run check      # the gates (brand census + docs + theme parity + birth-gate)
git push           # CI deploys
```

Then one file, `site.config.js`, is the only thing an adopter edits for identity. This is the `create-vite` / `create-astro` shape, which is what "pull in and run as expected" means for a site rig.

## 5. The config contract

### 5.1 The name: `site.config.js`, not `flowforge.config.js`

The obvious name (`flowforge.config.js`) is wrong, and the reason is a dependency-direction rule, not taste. This repo already carries **two engine-owned identity files**: prestruct reads `web/ssr.config.js` (identity + routes) and freestruct discovers `docs/freestruct.config.yml` (legacy `ssr-config.yml`). If the single source of truth were `flowforge.config.js`, then for either engine to read it, a *shared engine* would have to depend on *one product* - the dependency points the wrong way. The shell depends on the engines; the engines never depend on the shell.

The family's own convention settles it: config files are named for the **concern**, not the repo - `crashtest.config.js` appears in prestruct, freestruct, crashtest, packstruct, and eyestruct alike. The concern here is the site, so the neutral name is **`site.config.js`**. It reads as *what it configures*, not *who made the tool*, and any engine in the family can read it without importing flowforge.

The end state has **one identity file, three readers**: `site.config.js` is authored once, and flowforge derives `web/ssr.config.js` + `docs/freestruct.config.yml` from it in `sync` (prestruct and freestruct keep reading their own engine-owned files, unchanged). The engines stay product-agnostic and the adopter edits one file. A future option is a published `site.config` schema package the engines import directly, but that is not needed for the identity to be shared.

### 5.2 The shape

One file, authored by the adopter, is the site identity:

```js
// site.config.js - the ONLY file an adopter edits for identity
export default {
  name: 'my-site',
  tagline: 'One repo, two sites, zero styling drift.',
  url: 'https://my-site.example.com',          // landing
  docsUrl: 'https://docs.example.com/my-site', // docs (path-scoped host)
  repo: 'https://github.com/me/my-site',
  author: 'me',
  license: 'MIT',
  theme: { defaultMode: 'dark', defaultScheme: 'iris' },
  nav: [
    { label: 'Home', to: '/', end: true, group: 'site' },
    { label: 'GitHub', href: 'https://github.com/me/my-site', group: 'out' },
  ],
  routes: [ /* path + per-route meta - the current ssr.config.js shape */ ],
  deploy: 'github-pages',   // or 'cloudflare-pages'
}
```

This mirrors the shape monoforge already uses for `factory.json` (name, species/pitch, siteDomain, version), so the two tools speak the same vocabulary: a monoforge `factory.json` can be the seed a `site.config.js` is derived from.

## 6. The CLI: four verbs plus doctor

The full verb set, in the family's plain-verb voice (monoforge: stamp/doctor/lock/cut; prestruct: init/build/audit):

| Verb | What it does |
|---|---|
| `flowforge create [dir]` | Scaffold the shell into `dir` from the config (or an interactive prompt). Never clobbers existing files. The `create-vite` shape. |
| `flowforge sync` | Regenerate the derived surfaces from the config: the two engine-owned files (`web/ssr.config.js`, `docs/freestruct.config.yml`) plus `docs/_config.yml`, `robots.txt`, `site.webmanifest`, and `index.html`'s meta. Refuses on a stale generated file. |
| `flowforge build` | The prerender pipeline: validate config, vite build, inject brand, prerender routes, repair/verify 404. Wraps what `npm run build --prefix web` does today, driven by the config. |
| `flowforge check` | The gates, run against the adopter's tree: brand census, docs frontmatter/links/style/fiction/liquid, theme parity, birth-gate. This is the verb CI calls. |
| `flowforge doctor [dir]` | The truth battery: validate the config, refuse placeholder residue (monoforge's `FORGE-TODO` law), confirm the derived files are current, run `check`. Exit 0 is PASS only when nothing failed. |

`doctor` is the load-bearing half, exactly as in monoforge: **generated green is never shipped.** An unfilled slot or a stale derived file is a failure, not a warning.

## 7. Package layout

```
bin/flowforge.mjs        the CLI (the verbs above)
lib/                     gates + build orchestration, versioned once, imported
  gates/                 the check-*.cjs family (brand census, docs, theme, birth)
  build.mjs              the prerender pipeline
templates/site/          what `create` copies (the current web/ + docs/ + scripts/ shape)
site.config.js      the DOGFOOD site's config (flowforge.creadev.org)
example/                 the dogfood site: a site.config.js + the pages it derives
```

`files` tightens to `bin/`, `lib/`, `templates/` - no dogfood output in the tarball. The gate fixes that flow to adopters ride version bumps; the adopter owns their app code (pages, components) but not the gates. That split is the reason for `lib/` rather than a fresh copy per site: a gate bug fixed once must reach every adopter through `npm update`, not through a re-copy.

## 8. The derivation model (the load-bearing half)

Two kinds of surface, and the split matters:

- **JS surfaces import the config directly** - `site.config.js` is imported by the theme bootstrap and by the surfaces flowforge owns (`navItems.js` and the page metadata). No generation, no drift possible.
- **Non-JS and engine-owned surfaces get generated** by `flowforge sync` - `web/ssr.config.js` and `docs/freestruct.config.yml` (the two files prestruct and freestruct read), plus `docs/_config.yml`, `robots.txt`, `site.webmanifest`, and `index.html`'s meta. A gate then fails when any generated file is stale.

The engine-owned files are generated rather than imported on purpose: prestruct and freestruct keep reading exactly what they read today (`ssr.config.js`, `freestruct.config.yml`), so no engine change is required and no engine depends on flowforge. The adopter edits `site.config.js`; `sync` fans it out to the two engine files and the static surfaces.

And the missing teeth, which is the whole point:

**A brand census gate.** Grep the shipped tree for identity literals *outside* `site.config.js` and fail with `file:line`. This is the same pattern as the existing version-truth census leg (`tests/census.test.cjs`), and it is what turns "replace every YOUR... value" from a manual ritual into a mechanical guarantee. It also catches the regression class this repo has already paid for once (the identity drift the family watches for).

## 9. Templates and the example folder

`templates/site/` is the copyable shell, tokenized the way monoforge tokenizes its blocks (`__NAME__`, `__SITE_URL__`, `__DOCS_URL__`, ...), so `create` is a token substitution rather than a bespoke generator.

`example/` is the dogfood: a real site built from the rig, kept in-tree, exactly as prestruct keeps `example/`. This is where we do it better than prestruct: the example is **generated by the tool** (`flowforge create example && flowforge check example` runs in CI), so it cannot drift from what `create` emits. A template change that breaks the example fails CI the same commit.

## 10. Distribution

Three channels, matching the family:

1. **npm** - the primary channel. `npx flowforge create` and `npm i -D flowforge` (for the gates in an adopter's CI). Requires clearing the 0.x publish gate, so the tool releases as 1.0.0.
2. **GitHub "Use this template"** - zero-code channel. The repo's template button scaffolds a site directly, for people who do not want the CLI. The `templates/site/` contents are the template.
3. **GitHub release on every tag** - the eyestruct ladder, verbatim: `publish.yml` cuts the npm tarball via OIDC trusted publishing, then the `release` job cuts the GH release object from the tag, with notes **extracted from the CHANGELOG's own section** (`scripts/release-notes.cjs` - a release body that disagrees with the changelog is drift, and an empty extraction refuses the cut), then the `verify` job re-proves the served tarball and the release object. This is the eyestruct shape the owner asked to mirror.

## 11. Relationship to monoforge

monoforge is the **factory** (stamps any fleet repo from proven blocks); flowforge is a **species** it stamps (the landing + docs site profile). They are complementary, not overlapping:

| | monoforge | flowforge |
|---|---|---|
| Scope | any fleet repo (npm tool, component family, site) | the landing + docs site, specifically |
| Verb | `new` (stamp) / `doctor` / `lock` / `cut` | `create` / `sync` / `build` / `check` / `doctor` |
| Config | `factory.json` | `site.config.js` |
| Templates | generic blocks (docs system, workflows, release ladder) | the site shell (web + docs + theme axes) |

The tie-in: flowforge is the **site profile** monoforge's PRD already flags as missing ("the first stamped repo that is NOT an npm tool graduates that profile from proposal to proven"). Two honest ways to relate them, to be decided:

- **A: flowforge as a monoforge provider.** monoforge's extensibility doctrine (PRD 6.5) names providers explicitly: "Creadev stands as a monoforge PROVIDER... anyone becoming a provider themselves forges their way." flowforge becomes the site-profile provider: `monoforge new` with the flowforge block set. Then flowforge's `create` is the same template with a thinner entry point.
- **B: flowforge standalone, config-compatible.** flowforge ships its own `create`, and simply keeps its config schema aligned with `factory.json` so the two compose without a hard dependency.

The lean is **B first, A once the profile is proven** - monoforge's own rule of three says a profile graduates only when an instance proves it, and flowforge's `example/` can be that instance.

## 12. Migration phases

**Phase 0 - brand contract (in-repo, no new package).** Add `site.config.js`; make every JS surface import it; add `sync` for the generated surfaces; add the brand census gate. After this, *this repo is a dogfood generated from data*, and the gates prove it. Contained, no breaking change, and every later phase depends on it.

**Phase 1 - split tool from site.** Move the copyable files into `templates/site/`; move the reusable gates into `lib/`; move the dogfood into `example/`. The root package becomes the tool.

**Phase 2 - the CLI.** `bin/flowforge.mjs` with the five verbs. Placeholder substitution plus a residue check (the `doctor` truth-slot law).

**Phase 3 - publish.** Tighten `files`; add `publish.yml` (the eyestruct ladder: npm + GH release + verify); bump to 1.0.0 to clear the 0.x gate; rewrite README/DEPLOY; add a CI smoke test that scaffolds into a tmp dir and builds it.

**Phase 4 - dogfood.** Point flowforge.creadev.org at a `flowforge create` output so the tool proves itself on every push.

## 13. Open questions

1. **Does the dogfood site stay in-tree (`example/`) or move out?** In-tree gives the CI drift guard (section 9); out-of-tree gives a cleaner tarball. The lean is in-tree, gitignored from the tarball via `files`.
2. **Config format: JS or JSON?** JS (`site.config.js`) matches `ssr.config.js` and allows comments; JSON matches `factory.json` and is language-agnostic for the "Use this template" channel. The lean is JS, with a JSON escape hatch for the template button.
3. **How thin is `create` versus monoforge's `new`?** If A is chosen (section 11), `create` may just be `new` with the site block set preselected. Defer until the profile is proven.
4. **Cloudflare Pages vs GitHub Pages as the default deploy?** Both are in the family. The current shell ships GH Pages; the family's newer repos lean Cloudflare (wrangler + functions canary). Pick one default, keep the other as a config value.
5. **Does the 1.0.0 bump wait for Phase 3?** Yes - 0.9.0 stays until the tool is real, per the family ladder (0.x is the manual ship lane).
6. **Does `site.config.js` graduate to a family-shared schema package?** Today flowforge derives `ssr.config.js` + `freestruct.config.yml` from it. A later option (section 5.1) is a published `site.config` schema that prestruct and freestruct import directly, so all three read one source with no derivation step. Defer until a second consumer exists (the rule of three: flowforge is instance one).

**Resolved:** the config file is `site.config.js`, not `flowforge.config.js` - a product-named config would force prestruct and freestruct to depend on flowforge, inverting the engine-to-shell dependency. See section 5.1.

## 14. Non-goals

- Not a runtime framework. flowforge builds static sites; it is not a server, a CMS, or a hosting product.
- Not a monoforge replacement. monoforge stamps any repo; flowforge is the site profile.
- Not a new design system. The tokens stay the single source of palette (house rule 1); this PRD moves where the identity lives, not how the CSS is written.
- Never ships placeholder text. The doctor refuses it, the same law monoforge's factory runs.
