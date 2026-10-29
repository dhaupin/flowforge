/**
 * site.js - the web bundle's single accessor for the site identity.
 *
 * The identity lives once, at the repo root (site.config.js), so the landing
 * and the docs cannot disagree about who the site is. Everything under web/src
 * imports THIS module, never a hardcoded literal, and the brand census gate
 * holds the line. Re-exported through one file so the deep relative path to
 * the root config appears exactly once.
 */
import site from '../../site.config.js'

export default site

/** The config's route entry for a path (meta source for a page component). */
export function routeMeta(path) {
  const route = site.routes.find((r) => r.path === path)
  return route ? route.meta : {}
}
