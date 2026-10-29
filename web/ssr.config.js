/**
 * ssr.config.js - the prestruct engine's config, DERIVED from site.config.js.
 *
 * This file is an ADAPTER, not a second source of truth: it imports the one
 * identity file and reshapes it into what prestruct expects (siteUrl, siteName,
 * routes, notFound). prestruct reads exactly what it always read, so the engine
 * needs no change and no engine depends on flowforge. Edit site.config.js, not
 * this file.
 *
 * Filled by `prestruct build` (inject-brand + prerender): the site's SEO tags
 * and route list. One route entry per Route in src/AppLayout.jsx.
 */
import site from '../site.config.js'

export default {
  siteUrl: site.url,
  siteName: site.name,
  author: site.author,
  tagline: site.tagline,
  ogImage: `${site.url}/og-image.png`,
  keywords: site.keywords,
  routes: site.routes,
  notFound: site.notFound,
}
