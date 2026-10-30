# PRD: coreforge (the site shell, formerly flowforge)

**Status:** v0.2 - current (2026-10-29) · Owner: dhaupin
**Role:** forge - the site rig. It is the landing plus docs shell the family ships from.
**Package:** `coreforge` (renamed from `flowforge`; `coreforge` is free on npm). The tree is at 0.9.0; the tool releases as 1.0.0 to clear the 0.x gate.
**Core law:** one repo, two sites, zero styling drift. When a bug is caught twice, it becomes a gate.
**Family:** the five arms are **govstruct** (govern), **packstruct** (spec),
**crashtest** (attack), **eyestruct** (watch), **poststruct** (audit).
coreforge is a **forge**, not an arm: it rigs the site half of a member. Its
sibling forge is **monoforge** (the repo stamp). Both are composed by
**railyard**.

---

## 1. One-line pitch

**coreforge is the site shell you pull in and run: one config file, four verbs,
two surfaces (landing plus docs), zero hand-editing of brand data.** Today the
repo is a template you copy and hand-edit; this PRD turns it into a package you
install, run, and derive from.

## 2. Why (the evidence, not the idea)

The original repo was a quick-and-dirty first proto and it showed in three
concrete ways, all measured against the tree:

- **There was no entry point.** `package.json` had no `bin`, no `main`, no
  `exports`. `npm i flowforge` unpacked 75 files into `node_modules/` and
  stopped - nothing ran.
- **The brand was hardcoded across about 18 shipped files in three languages.**
  The identity literals lived in `web/ssr.config.js`, `web/src/components/navItems.js`,
  `web/src/theme.js`, the page copy, `web/index.html`, `robots.txt`,
  `site.webmanifest`, `docs/_config.yml`, `docs/_layouts/default.html`,
  `docs/_data/nav.yml`, both `package.json`s, and the workflow files. Nothing
  derived from a single source, so the README's "replace every YOUR... value"
  was a manual find-and-replace across languages.
- **The tool and its own deployment were the same tree.** The repo IS
  flowforge.creadev.org. A published artifact would carry the dogfood's
  identity, sample pages, and its own CI - a template, not a tool.

The house rule that decides the shape: **when a bug is caught twice, it becomes
a gate.** Brand drift is the bug; the gate is a brand census (section 8).

## 3. The model: two identities

The root cause is that one string meant two different things. The whole design
falls out of splitting them:

| | Rig identity | Site identity |
|---|---|---|
| What it is | the tool: gates, build orchestration, templates | the adopter's brand |
| Lives in | the npm package (versioned) | one config file in the adopter's repo |
| Changes | on version bumps | per adopter |
| Who owns it | the family | the adopter |

Everything else is a consequence: the config is the site identity, the package
is the rig, and the example folder is a site identity the rig dogfoods.

## 4. The target UX

```bash
npx coreforge create my-site
cd my-site
npm install
npm run dev        # landing on :5173
npm run docs       # docs on :4000
npm run build      # prerendered dist/
npm run check      # the gates (brand census + docs + theme parity + birth-gate)
git push           # CI deploys
```

Then one file, `site.config.js`, is the only thing an adopter edits for
identity. This is the `create-vite` / `create-astro` shape, which is what "pull
in and run as expected" means for a site rig.

## 5. The config contract

### 5.1 The name: `site.config.js`, not `coreforge.config.js`

The obvious name is wrong, and the reason is a dependency-direction rule, not
taste. This repo already carries **two engine-owned identity files**: prestruct
reads `web/ssr.config.js` (identity plus routes) and freestruct discovers
`docs/freestruct.config.yml`. If the single source of truth were
`coreforge.config.js`, then for either engine to read it, a *shared engine*
would have to depend on *one product* - the dependency points the wrong way.
The shell depends on the engines; the engines never depend on the shell.

The family's own convention settles it: config files are named for the
**concern**, not the repo - `crashtest.config.js` appears in prestruct,
freestruct, crashtest, packstruct, and eyestruct alike. The concern here is the
site, so the neutral name is **`site.config.js`**. It reads as *what it
configures*, not *who made the tool*, and any engine in the family can read it
without importing coreforge.

The end state has **one identity file, three readers**: `site.config.js` is
authored once, and coreforge derives `web/ssr.config.js` plus
`docs/freestruct.config.yml` from it in `sync` (prestruct and freestruct keep
reading their own engine-owned files, unchanged).

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
  theme: { defaultMode: 'dark', defaultScheme: 'petrol' },
  nav: [
    { label: 'Home', to: '/', end: true, group: 'site' },
    { label: 'GitHub', href: 'https://github.com/me/my-site', group: 'out' },
  ],
  routes: [ /* path + per-route meta */ ],
  deploy: 'github-pages',   // or 'cloudflare-pages'
}
```

This mirrors the shape monoforge already uses for `factory.json`, so the two
tools speak the same vocabulary: a monoforge `factory.json` can be the seed a
`site.config.js` is derived from.

## 6. The CLI: four verbs plus doctor

The full verb set, in the family's plain-verb voice (monoforge: new/doctor/lock/cut;
prestruct: init/build/audit):

| Verb | What it does |
|---|---|
| `coreforge create [dir]` | Scaffold the shell into `dir` from the config (or an interactive prompt). Never clobbers existing files. The `create-vite` shape. |
| `coreforge sync` | Regenerate the derived surfaces from the config: the two engine-owned files plus `docs/_config.yml`, `robots.txt`, `site.webmanifest`, and `index.html`'s meta. Refuses on a stale generated file. |
| `coreforge build` | The prerender pipeline: validate config, vite build, inject brand, prerender routes, repair and verify 404. |
| `coreforge check` | The gates, run against the adopter's tree: brand census, docs frontmatter/links/style/fiction/liquid, theme parity, birth-gate. This is the verb CI calls. |
| `coreforge doctor [dir]` | The truth battery: validate the config, refuse placeholder residue (monoforge's `FORGE-TODO` law), confirm the derived files are current, run `check`. Exit 0 is PASS only when nothing failed. |

`doctor` is the load-bearing half, exactly as in monoforge: **generated green is
never shipped.** An unfilled slot or a stale derived file is a failure, not a
warning.

## 7. Package layout

```
bin/coreforge.mjs        the CLI (the verbs above)
lib/                     gates + build orchestration, versioned once, imported
  gates/                 the check-*.cjs family (brand census, docs, theme, birth)
  root.cjs / root.mjs    resolve the SITE root (walk up to site.config.js)
  sync.mjs               fan site.config.js out to the non-importable surfaces
  template.mjs           build templates/site/ from the dogfood tree
  lint-packs.cjs         the packstruct wrapper verb
  ship-from-download.cjs the phone publish lane
templates/site/          what `create` copies (web/ + docs/ + site.config.js)
site.config.js           the DOGFOOD site's config (coreforge.creadev.org)
web/ + docs/             the dogfood site, LEFT IN PLACE
```

Phase 1 landed this shape (2026-10-29): the tool half moved from `scripts/` to
`lib/` (one `lib/gates/` home for the `check-*.cjs` family plus the shared
`lib/root.*` resolver), and `templates/site/` was added as the copy source. The
gates resolve their SITE root by walking up to the nearest `site.config.js`
(skipping any candidate under `node_modules`), so one code path serves both the
dogfood and an installed adopter.

The dogfood does **not** move to `example/`. The tree stays where it is (`web/`
plus `docs/` at the root, with `site.config.js` beside them). It is the
lowest-churn path, and it matches the family's current shape - the sibling tree
keeps its own dogfood at `web/` plus `docs/`, so "dogfood lives at `web/`" is
the convention, not a compromise.

`files` tightens to `bin/`, `lib/`, `templates/` - no dogfood output in the
tarball. The gate fixes flow to adopters through version bumps; the adopter owns
their app code but not the gates. That split is the reason for `lib/` rather
than a fresh copy per site: a gate bug fixed once must reach every adopter
through `npm update`, not through a re-copy.

## 8. The derivation model (the load-bearing half)

Two kinds of surface, and the split matters:

- **JS surfaces import the config directly** - `site.config.js` is imported by
  the theme bootstrap and by the surfaces coreforge owns (`navItems.js` and the
  page metadata). No generation, no drift possible.
- **Non-JS and engine-owned surfaces get generated** by `coreforge sync` -
  `web/ssr.config.js` and `docs/freestruct.config.yml` (the two files prestruct
  and freestruct read), plus `docs/_config.yml`, `robots.txt`,
  `site.webmanifest`, and `index.html`'s meta. A gate then fails when any
  generated file is stale.

The engine-owned files are generated rather than imported on purpose: prestruct
and freestruct keep reading exactly what they read today, so no engine change is
required and no engine depends on coreforge.

**A brand census gate.** Grep the shipped tree for identity literals *outside*
`site.config.js` and fail with `file:line`. This is the same pattern as the
version-truth census leg, and it is what turns "replace every YOUR... value"
from a manual ritual into a mechanical guarantee. It also catches the
regression class this repo has already paid for once - and the census now walks
**filenames** too, not just contents (a brand name in a filename is invisible to
a content scan; this class has now bitten twice, so it became a gate).

## 9. Templates and the dogfood

`templates/site/` is the copyable shell, tokenized the way monoforge tokenizes
its blocks (`__NAME__`, `__SITE_URL__`, `__DOCS_URL__`), so `create` is a token
substitution rather than a bespoke generator.

The dogfood stays at `web/` plus `docs/`. It is a real site built from the rig,
kept in-tree. `templates/site/` is **generated** from the dogfood tree by
`lib/template.mjs` (`npm run template`), not hand-kept. A hand-maintained
duplicate would reintroduce exactly the churn the dogfood-in-place decision
avoids - two copies to edit in lockstep. One generator, one guard:
`npm run template:check` refuses a drifted or stale template, and the generator
itself refuses to emit if any dogfood identity literal survives tokenization.
The template is the derivation, so it cannot drift the way a hand-kept example
does.

The tool half (`lib/`) is deliberately NOT templated: it reaches an adopter by
`npm install`, not by copy. Only the site half is templated.

## 10. Distribution

Three channels, matching the family:

1. **npm** - the primary channel. `npx coreforge create` and `npm i -D coreforge`.
   Requires clearing the 0.x publish gate, so the tool releases as 1.0.0.
2. **GitHub "Use this template"** - zero-code channel. The repo's template
   button scaffolds a site directly. The `templates/site/` contents are the
   template.
3. **GitHub release on every tag** - the eyestruct ladder, verbatim:
   `publish.yml` cuts the npm tarball via OIDC trusted publishing, then the
   `release` job cuts the GH release object from the tag, with notes extracted
   from the CHANGELOG's own section, then the `verify` job re-proves the served
   tarball and the release object.

## 11. Relationship to monoforge and railyard

### 11.1 monoforge

monoforge is the **factory** (stamps any fleet repo from proven blocks);
coreforge is a **species** it stamps (the landing plus docs site profile). They
are complementary, not overlapping:

| | monoforge | coreforge |
|---|---|---|
| Scope | any fleet repo (npm tool, component family, site) | the landing plus docs site, specifically |
| Verb | `new` / `doctor` / `lock` / `cut` | `create` / `sync` / `build` / `check` / `doctor` |
| Config | `factory.json` | `site.config.js` |
| Templates | generic blocks (docs system, workflows, release ladder) | the site shell (web plus docs plus theme axes) |

The tie-in: coreforge is the **site profile** monoforge's PRD flags as missing
("the first stamped repo that is NOT an npm tool graduates that profile from
proposal to proven"). Two honest ways to relate them: **A**, coreforge as a
monoforge provider (`monoforge new` with the coreforge block set); or **B**,
coreforge standalone and config-compatible. The lean is **B first, A once the
profile is proven** - monoforge's own rule of three says a profile graduates
only when an instance proves it, and coreforge's dogfood can be that instance.

### 11.2 The parent: railyard

coreforge and monoforge are forges; neither owns the other. The product that
**uses them together** - mint, cut, create, update, push, track, download,
eventually behind a web interface - is **railyard**. A railyard is where forges
sit and where staged work is switched and dispatched, which is the container
role, not a peer role: a `-forge` name would read as a third sibling instead of
the thing the siblings live in. railyard is the first home of the
`mounts/{public,private,local}` registry; coreforge and monoforge are mounts it
holds. It is a **service, not an npm package**.

### 11.3 mounts/ - the shared proto-spec

`mounts/` is a convention the family is building *with* coreforge and monoforge,
not a law inherited from either. Three tiers, one registry:

```
mounts/
  public/<mount>/     # payload ships upstream (dhaupin/<mount>)
  private/<mount>/    # shared inside the ecosystem (install-visible, not public)
  local/<mount>/      # never pushes anywhere
  state.json          # the registry: tier, tree, repo, boot contents per mount
```

railyard is where this gets its real home. The parity ask rides to vant and
packstruct, so the models/mounts/packs rigs all speak public/private/local the
same way.

## 12. Migration phases

- **Phase 0 - brand contract.** Add `site.config.js`; make every JS surface
  import it; add `sync`; add the brand census gate. After this, the repo is a
  dogfood generated from data. **DONE.**
- **Phase 1 - split tool from site.** Move copyable files into
  `templates/site/`; move reusable gates into `lib/`. **DONE** (2026-10-29).
- **Phase 2 - the CLI.** `bin/coreforge.mjs` with the five verbs, placeholder
  substitution plus a residue check. **PENDING.**
- **Phase 3 - publish.** Tighten `files`; add `publish.yml` (the eyestruct
  ladder); bump to 1.0.0 to clear the 0.x gate; rewrite README/DEPLOY; add a CI
  smoke test that scaffolds into a tmp dir and builds it. **PENDING.**
- **Phase 4 - dogfood.** Point coreforge.creadev.org at a `coreforge create`
  output so the tool proves itself on every push. **PENDING.**

## 13. Open questions

1. **Does the dogfood site stay in-tree or move out?** Resolved (owner): stays
   in place at `web/` plus `docs/`.
2. **Config format: JS or JSON?** Lean JS, with a JSON escape hatch for the
   template button.
3. **How thin is `create` versus monoforge's `new`?** Defer until the profile
   is proven.
4. **Cloudflare Pages vs GitHub Pages as the default deploy?** Pick one
   default, keep the other as a config value.
5. **Does `site.config.js` graduate to a family-shared schema package?** Defer
   until a second consumer exists (the rule of three: coreforge is instance
   one).

## 14. Non-goals

- Not a runtime framework. coreforge builds static sites; it is not a server, a
  CMS, or a hosting product.
- Not a monoforge replacement. monoforge stamps any repo; coreforge is the site
  profile.
- Not a new design system. The tokens stay the single source of palette; this
  PRD moves where the identity lives, not how the CSS is written.
- Never ships placeholder text. The doctor refuses it, the same law monoforge's
  factory runs.
