// Pages Function: GET /api/health - the house "prove the Functions wire works" canary.
// The landing host (Cloudflare Pages) runs `functions/` as Workers under the
// hood; this endpoint is the living proof the wire is connected. Add more only
// when a real need shows.
export async function onRequestGet(context) {
  return Response.json({
    ok: true,
    name: context.env.SITE_NAME || 'flowforge',
    service: 'flowforge-site',
    spec: 'coreforge@1',
    ts: new Date().toISOString(),
  })
}
