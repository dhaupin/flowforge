/**
 * site.config.js - THE site identity, authored once, read everywhere.
 *
 * This is the one file an adopter edits for identity. Everything else derives
 * from it: the JS surfaces import it directly (no generation, no drift), and
 * `npm run sync` fans the non-JS surfaces out of it (web/ssr.config.js,
 * docs/freestruct.config.yml, docs/_config.yml, web/public/robots.txt,
 * web/public/site.webmanifest). The brand census gate refuses an identity
 * literal that lives anywhere else, so "replace every YOUR... value" is
 * mechanical, not a manual hunt across three languages.
 *
 * Named site.config.js, not __NAME__.config.js, on purpose: the config is
 * named for the CONCERN (the site), never the tool. prestruct reads
 * web/ssr.config.js and freestruct discovers docs/freestruct.config.yml - both
 * engine-owned, both DERIVED here. A product-named config would force those
 * engines to depend on this repo; this shape keeps the dependency pointing
 * from shell to engines, never the reverse. See labs/prd-__NAME__.md 5.1.
 *
 * The docs identity (docs/_config.yml, freestruct.config.yml) and the landing
 * identity (ssr.config.js, robots, webmanifest) come from ONE block below, so
 * the two sites cannot disagree about who they are.
 */
export default {
  // --- identity -----------------------------------------------------------
  name: '__NAME__',
  wordmark: { accent: 'flow', rest: 'forge' },
  badge: 'beta',
  tagline: 'One repo, two sites, zero styling drift.',
  description:
    'The shell the struct family ships sites from: landing + docs rig + CI/release plumbing, with brand as data.',
  url: '__SITE_URL__',
  repo: '__REPO_URL__',
  author: '__AUTHOR__',
  license: 'MIT',
  keywords:
    '__NAME__, boilerplate, shell, docs, jekyll, landing-page, prerender, react, vite, github-pages, cloudflare-pages',

  // The maker line + org (footer + the docs layout's provenance row).
  maker: { label: '__MAKER_LABEL__', url: '__ORG_URL__' },
  org: { name: '__ORG_NAME__', url: '__ORG_URL__' },

  // --- docs ---------------------------------------------------------------
  // docsUrl is the full public docs URL; docsHost is the Jekyll `url` (the
  // freestruct layer reads host + path separately).
  docs: {
    title: '__NAME__ docs',
    url: '__DOCS_URL__',
    host: '__DOCS_HOST__',
    baseurl: '__DOCS_BASEURL__',
  },

  // --- theme --------------------------------------------------------------
  // The two axes as data. themeKey/schemeKey are protocol constants shared by
  // the pre-paint bootstrap, both switches, and the docs layout - they are NOT
  // brand, so they stay stable across rebrands.
  theme: {
    themeKey: 'site-theme',
    schemeKey: 'site-paint-scheme',
    defaultMode: 'dark',
    defaultScheme: 'iris',
  },

  // --- nav vocabulary -----------------------------------------------------
  // ONE list the header, the burger sidebar, and the footer all render from.
  // 'site' = internal route (NavLink-active); 'out' = external surface (the
  // header GitHub icon replaces this entry's label there; the footer still
  // renders the text link).
  nav: [
    { label: 'Home', to: '/', end: true, group: 'site' },
    { label: 'GitHub', href: '__REPO_URL__', group: 'out' },
  ],
  // Footer-only extras (legal + provenance). Keep legal labels smaller than
  // the nav; provenance links belong in the footer, not the header.
  footerExtras: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],

  // --- routes -------------------------------------------------------------
  // One entry per Route in web/src/AppLayout.jsx; drives the sitemap, the
  // prerender list, and the per-page meta. `title`/`description` are the
  // canonical per-route meta; the page component may override via usePageMeta.
  routes: [
    {
      path: '/',
      priority: '1.0',
      changefreq: 'monthly',
      meta: {
        title: '__NAME__ - the shell the struct family ships sites from',
        description:
          'One repo, two sites, zero styling drift: the landing shell, the docs rig, and the CI/release plumbing the struct family keeps re-porting, with brand as data.',
      },
    },
    {
      path: '/terms',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Terms | __NAME__',
        description: 'Terms of use for the __NAME__ shell and this site.',
      },
    },
    {
      path: '/privacy',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Privacy | __NAME__',
        description: 'What this site collects: nothing hidden, no tracking states to find.',
      },
    },
  ],

  // The static 404 the host serves every miss; the shape + copy match
  // pages/NotFound.jsx so the host-not-found and the hydrate-not-found read
  // as one page, not two.
  notFound: {
    heading: '404',
    body: 'That page does not exist here.',
    primaryCta: { label: 'Back home', href: '/' },
  },
}
