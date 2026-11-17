/**
 * Live-viewer counting on top of a simple key/value cache with TTLs (Vercel Runtime Cache).
 *
 * The cache has no atomic counters, so tabs are spread over SHARDS (32) small buckets ({ tabId: lastSeenMs }).
 * Each ping rewrites only its own bucket, which keeps simultaneous writes from clobbering each other;
 * a rare lost update fixes itself on that tab's next ping (every ~25 s). The total is recomputed from
 * all buckets at most every TOTAL_EVERY_MS and cached, so most pings cost 3 cache operations.
 * (Files starting with "_" in api/ are not exposed as endpoints by Vercel.)
 */
export const SHARDS = 32;
export const WINDOW_MS = 60_000;
export const TOTAL_EVERY_MS = 8_000;

export function shardOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}

const live = (bucket, now) => {
  let n = 0;
  if (bucket && typeof bucket === 'object') for (const k in bucket) if (bucket[k] >= now - WINDOW_MS) n++;
  return n;
};

/** store: { get(key) -> Promise<value|null>, set(key, value, { ttl }) -> Promise } */
export async function touch(store, id, leave, now = Date.now()) {
  const mine = shardOf(id);
  const key = (i) => `presence:shard:${i}`;
  const bucket = { ...((await store.get(key(mine))) || {}) };
  for (const k in bucket) if (!(bucket[k] >= now - WINDOW_MS)) delete bucket[k];
  const arriving = !leave && !(id in bucket);
  if (leave) delete bucket[id];
  else bucket[id] = now;
  await store.set(key(mine), bucket, { ttl: 180 });

  let total = await store.get('presence:total');
  if (leave || !total || typeof total.at !== 'number' || now - total.at > TOTAL_EVERY_MS) {
    const buckets = await Promise.all(Array.from({ length: SHARDS }, (_, i) => (i === mine ? bucket : store.get(key(i)))));
    total = { n: buckets.reduce((sum, b) => sum + live(b, now), 0), at: now };
    await store.set('presence:total', total, { ttl: 120 });
  } else if (arriving) {
    // a new tab between recounts: show it right away rather than up to TOTAL_EVERY_MS later
    total = { n: total.n + 1, at: total.at };
    await store.set('presence:total', total, { ttl: 120 });
  }
  return leave ? total.n : Math.max(1, total.n);
}
