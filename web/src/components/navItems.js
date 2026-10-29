/**
 * The site's nav vocabulary - ONE list that the header, the burger sidebar,
 * and the footer all render from. Sourced from site.config.js (the single
 * identity file), so the surfaces cannot drift from the brand. Probes (port
 * the web-docs-consistency test if you also ship docs) read this file.
 *
 * Group semantics: 'site' = internal route (NavLink-active), 'out' = external
 * surface (the GitHub icon in the header replaces this entry's label there;
 * the FOOTER still renders the text link - see Nav.jsx HEADER_LINKS).
 */
import site from '../site.js'

export const NAV_ITEMS = site.nav

/** Footer-only extras (legal + provenance). */
export const FOOTER_EXTRAS = site.footerExtras
