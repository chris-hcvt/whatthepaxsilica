import { useEffect, useState } from 'react';

/**
 * Anonymous presence: a random id per tab, a ping every 25 s while the tab is visible, and a
 * "leave" beacon when it is hidden or closed. Returns null (counter hidden) until the server
 * answers, or if the counter is not set up.
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const raw = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    const id = raw.replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
    let stopped = false;
    let failures = 0;
    const ping = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!(r.headers.get('content-type') || '').includes('application/json') || r.status === 503 || r.status === 404) {
          r.body?.cancel().catch(() => undefined); // always release the response
          stopped = true; // not deployed or not configured: keep the counter hidden
          setCount(null);
          return;
        }
        const js = (await r.json()) as { count: number | null; configured?: boolean };
        if (js.configured === false) {
          stopped = true; // counter not set up yet
          setCount(null);
          return;
        }
        if (typeof js.count === 'number') {
          failures = 0;
          setCount(Math.max(1, js.count));
        }
      } catch {
        if (++failures >= 3) setCount(null);
      }
    };
    const leave = () => {
      if (stopped) return;
      try {
        navigator.sendBeacon?.('/api/presence', new Blob([JSON.stringify({ id, leave: true })], { type: 'application/json' }));
      } catch {
        /* ignore */
      }
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? leave() : ping());
    ping();
    const timer = window.setInterval(ping, 25_000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, []);
  return count;
}

export function LiveCount({ count, label }: { count: number | null; label: (n: number) => string }) {
  if (count === null) return null;
  return (
    <div className="livecount" role="status" aria-live="polite" title={label(count)}>
      <span className="live-dot" aria-hidden="true" />
      <b>{count.toLocaleString('en-US')}</b>
      <span className="live-label">{label(count).replace(/^[\d,]+\s*/, '')}</span>
    </div>
  );
}
