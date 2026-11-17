/**
 * Live "viewing now" counter.
 *
 * Each open tab sends { id } every ~25 s (and { id, leave: true } when it closes). The id is a random
 * per-tab value — no personal data. Tabs seen in the last 60 s are counted with a Redis sorted set.
 *
 * Storage: Upstash Redis via the Vercel Marketplace integration, which sets KV_REST_API_URL and
 * KV_REST_API_TOKEN (UPSTASH_REDIS_REST_URL / _TOKEN also work). Without them the endpoint answers
 * { configured: false } and the site simply hides the counter.
 */
export const config = { runtime: 'edge' };

const KEY = 'wtps:presence';
const WINDOW_MS = 60_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export default async function handler(req) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return json({ count: null, configured: false });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return json({ error: 'bad id' }, 400);

  const now = Date.now();
  const commands = body.leave
    ? [
        ['ZREM', KEY, id],
        ['ZREMRANGEBYSCORE', KEY, '0', String(now - WINDOW_MS)],
        ['ZCARD', KEY],
      ]
    : [
        ['ZADD', KEY, String(now), id],
        ['ZREMRANGEBYSCORE', KEY, '0', String(now - WINDOW_MS)],
        ['ZCARD', KEY],
        ['PEXPIRE', KEY, String(WINDOW_MS * 5)],
      ];

  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!r.ok) return json({ count: null }, 502);
    const out = await r.json();
    const count = Number(out?.[2]?.result);
    return json({ count: Number.isFinite(count) ? count : null });
  } catch {
    return json({ count: null }, 502);
  }
}
