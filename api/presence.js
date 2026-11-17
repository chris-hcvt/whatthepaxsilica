/**
 * Live "viewing now" counter.
 *
 * Each open tab POSTs { id } every ~25 s (and { id, leave: true } when it is hidden or closed). The id is a
 * random per-tab value: no personal data. Tabs seen in the last 60 s are counted.
 *
 * Storage: Vercel's built-in Runtime Cache (no extra service). If an Upstash Redis integration is ever added
 * (KV_REST_API_URL / KV_REST_API_TOKEN), it is used instead for exact counts.
 */
import { getCache } from '@vercel/functions';
import { touch } from './_presence-core.js';

const UPSTASH_KEY = 'wtps:presence';
const WINDOW_MS = 60_000;

async function viaUpstash(url, token, id, leave) {
  const now = Date.now();
  const commands = leave
    ? [['ZREM', UPSTASH_KEY, id], ['ZREMRANGEBYSCORE', UPSTASH_KEY, '0', String(now - WINDOW_MS)], ['ZCARD', UPSTASH_KEY]]
    : [
        ['ZADD', UPSTASH_KEY, String(now), id],
        ['ZREMRANGEBYSCORE', UPSTASH_KEY, '0', String(now - WINDOW_MS)],
        ['ZCARD', UPSTASH_KEY],
        ['PEXPIRE', UPSTASH_KEY, String(WINDOW_MS * 5)],
      ];
  const r = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  const out = await r.json();
  return Number(out?.[2]?.result);
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return res.status(400).json({ error: 'bad id' });
  const leave = body?.leave === true;

  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    const count = url && token ? await viaUpstash(url, token, id, leave) : await touch(getCache({ namespace: 'wtps' }), id, leave);
    return res.status(200).json({ count: Number.isFinite(count) ? count : null });
  } catch {
    return res.status(200).json({ count: null });
  }
}
