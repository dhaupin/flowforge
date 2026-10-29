# DEPLOY.md - the deploy + release runbook

The setup: **two static sites** (a landing shell, a docs rig) plus an optional npm package, all deployable with the workflows this rig ships. The box contents live in [README.md](./README.md); agent conventions live in [AGENTS.md](./AGENTS.md); version bumps are logged in [CHANGELOG.md](./CHANGELOG.md). Nothing here needs a database, a key, or a server - the rig's shell is static all the way out.

## 1. The landing (`web/`, prestruct)

The build command is `prestruct build` (via `npm run build --prefix web`); it compiles/URLs the app graph, prerenders **every route** into `web/dist/<route>/index.html`, and injects the brand meta from `web/ssr.config.js`. Whatever static host serves `dist/` per-path with 404 -> the prerendered `404.html` will run it as-is (Cloudflare Pages is the family default - `web/public/_headers` and `_redirects` ship the CSP and the do-NOT-SPA-fallback wisdom).

Healthy = the build's last line reads `N/N pages rendered` with N equal to your routes, and no `screen/style` bloat errors. That is the same gate the family's CI runs.

## 2. The docs (`docs/`, Jekyll + pagefind)

GitHub Pages territory: `.github/workflows/docs-deploy.yml` (a thin caller) hands off to the reusable `.github/workflows/docs-build.yml`, which runs gates -> Jekyll -> freestruct (pinned) -> pagefind -> Pages artifact upload. Set `docs/_config.yml`'s `url` + `baseurl` to YOUR deploy location FIRST - the layout composes canonical/OG/pagefind/logo paths from it. Without the pagefind index the search modal reports that honestly (it never pretends to search). The `paths:` filter means the workflow only fires on `docs/**` changes, so landing edits never cost a docs deploy.

The build lane is a **reusable workflow** (issue #9): the runbook lives once in `docs-build.yml` (`on: workflow_call`, inputs `docs-path` / `ruby-version` / `node-version` / `pagefind-version` / `freestruct-version`), and each repo keeps only a thin caller that sets its own inputs, permissions, concurrency group, and deploy job. This replaced three hand-copied runbooks that had already drifted apart (Ruby 3.2 vs 3.4, upload-pages-artifact v3 vs v5, a pagefind scrape vs an npm pin). A sibling calls it with `uses: dhaupin/flowforge/.github/workflows/docs-build.yml@<ref>`; the caller must grant `pages: write` + `id-token: write` for the deploy half. The birth-gate checks the contract both ways (a local caller must point at a `workflow_call` file, and a reusable file must be called).

## 3. The staging branch (issue #30)

`staging` is a **permanent integration branch**: work branches off it, PRs target it, and promotion to `main` is the only path out. The full pattern (with the proof behind each rule) is dhaupin/poststruct#32; the short version:

1. **CI covers staging as well as main** - `test.yml` pushes on both `main` and `staging`, so a red battery red-lights the integration branch before a promotion, not after.
2. **Any deploy job is gated to `main`.** `docs-deploy.yml` now builds on `staging` too (a docs change that breaks the build should fail there), but its `deploy` job carries `if: github.ref == 'refs/heads/main'`. This is the trap point: once `staging` is in a trigger list, the trigger no longer keeps its content out of production - the job guard does.
3. **After every promotion, fast-forward staging to main:**
   ```bash
   git push origin origin/main:staging     # ff, non-destructive
   ```
   A merge-commit promotion puts a commit on `main` that `staging` lacks, so the two drift by one on **every** promotion even when the flow is followed exactly. The sync is a required step, not a repair. (Promoting by fast-forward instead removes the drift entirely - only viable if nothing ever lands on `main` directly.)

## 4. Release (npm + GitHub release)

The Version protocol (also in [AGENTS.md](./AGENTS.md)): bump `package.json` + `web/package.json` in the SAME commit as the [CHANGELOG.md](./CHANGELOG.md) entry -> commit -> tag `vX.Y.Z` -> push the tag. `.github/workflows/release.yml` publishes to npm via Trusted Publishing (OIDC): no `NPM_TOKEN` secret involved, provenance signed.

- One-time setup per account: link your npm package to the repo under npmjs.com -> package Settings -> Publishing access (or npm trusted publishing config) - the OIDC flow needs that mapping to mint credentials.
- If a tag-driven run fails, re-push the tag for the retry: `git push origin :refs/tags/vX.Y.Z && git push origin vX.Y.Z` (the workflow cannot re-run a failed run directly).
- Then create the GitHub release FROM the tag (Release -> New from tag) and paste the changelog entry as its body.

## 5. Local checks before any push

```bash
# the docs gates + liquid trap + theme parity (fast, pure node)
node --check lib/gates/*.cjs && node lib/gates/check-docs-frontmatter.cjs \
  && node lib/gates/check-docs-links.cjs && node lib/gates/check-docs-style.cjs \
  && node lib/gates/check-fiction-signatures.cjs && node lib/gates/check-jekyll-filters.cjs

# or just the full battery (what CI runs): npm test && npm run check && npm run lint:docs

# the shell, for real
npm install --prefix web && npm run build --prefix web
```

Docs builds are CI's job locally-optional (Jekyll is too much runtime to demand); the deploy workflow is the truth.

### Local docs preview without tainting the tree (issue #22)

When you do want the Jekyll stack locally - and an agent sandbox with no sudo and no system Ruby will - run it out-of-tree so nothing lands in the repo (worked example: dhaupin/eyestruct@8a194ad, gitignore block ca2f62a). The shape, no root anywhere:

1. Unpack a prebuilt, platform-matched Ruby from the official ruby/ruby-builder releases into `$HOME` (e.g. `~/rubies`), never the repo. The release tag is the VERSION (`ruby-<ver>`, asset `ruby-<ver>-<os>-x64.tar.gz`); a `toolcache` tag 404s.
2. `libruby.so` lives in the unpacked lib tree: `LD_LIBRARY_PATH=~/rubies/x64/lib`.
3. The shipped gem/bundle/jekyll binstubs bake hostedtoolcache shebangs - shim each through the interpreter: `#!/bin/sh` + `exec ~/rubies/x64/bin/ruby ~/rubies/x64/bin/<tool> "$@"`.
4. `GEM_HOME`/`GEM_PATH` point at the unpacked gem dir (`lib/ruby/gems/<ver>.0`); RubyGems needs `RUBYLIB` to the stdlib + arch dirs when the prefix moves.
5. Bundler never writes into the repo: set `BUNDLE_PATH` outside it. This rig commits no `docs/Gemfile.lock` (CI resolves fresh).
6. Build from a scratch COPY of `docs/` (e.g. `/tmp/docs-preview`) - jekyll writes `_site` beside the source, so the copy carries every build product away from the tree.
7. Serve `_site` under the real baseurl (symlink `<webroot>/<baseurl>` to `_site`, then `python3 -m http.server`) so baseurl'd links resolve.

The root `.gitignore` already carries the belt-and-suspenders block (`docs/.bundle/`, `docs/vendor/`, `docs/_site/`, `docs/Gemfile.lock`) so an accidental in-tree build taints nothing.

## 6. What is deliberately NOT in this runbook

- Pack publication, the pack lint lane, and SPEC receipts: packs are a family contract explained in [packs/README.md](./packs/README.md), not part of the shell's own deploy story.
- Server work: there is none. If your project needs a backend, that is a feature of YOUR project, not of this rig.
