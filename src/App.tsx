import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DeckContext, type DeckState } from './deck';
import { SLIDES, FACTS, type MallKey } from './content/slides';
import { LOCALES, LANGS, detectLang, type LangCode } from './i18n';
import { Stage } from './components/Stage';
import { DropMap } from './components/DropMap';
import { SourceList } from './components/bits';
import type { LL } from './three/geo';
import type { Insets } from './three/engine';

const idFromHash = () => {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const i = SLIDES.findIndex((s) => s.id === h);
  return i >= 0 ? i : 0;
};

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export default function App() {
  const [lang, setLangState] = useState<LangCode>(detectLang);
  const [index, setIndex] = useState(idFromHash);
  const [mall, setMall] = useState<MallKey>('moa');
  const [dropCenter, setDropCenterState] = useState<LL>([121.0244, 14.5547]);
  const [dropLabel, setDropLabel] = useState('makati');
  const [drawer, setDrawer] = useState<{ open: boolean; hl: string | null }>({ open: false, hl: null });
  const [collapsed, setCollapsed] = useState(false);
  const [insets, setInsets] = useState<Insets>({ left: 0, bottom: 0 });
  const [mapUsed, setMapUsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const reduced = useMemo(prefersReduced, []);

  const L = LOCALES[lang];
  const slide = SLIDES[index];
  const text = L.slides[slide.id];

  const setLang = (l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem('wtps-lang', l);
    } catch {
      /* storage unavailable */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';
  }, [lang]);

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(n);
    setCollapsed(false);
  }, []);

  // hash <-> index
  useEffect(() => {
    const id = SLIDES[index].id;
    const want = index === 0 ? '' : `#/${id}`;
    if (window.location.hash !== want) history.replaceState(null, '', want || window.location.pathname + window.location.search);
    if (slide.scene.kind === 'map') setMapUsed(true);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHash = () => setIndex(idFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (drawer.open) {
        if (e.key === 'Escape') setDrawer({ open: false, hl: null });
        return;
      }
      if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        go(index + 1);
      } else if (['ArrowLeft', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(SLIDES.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go, drawer.open]);

  // measure how much of the screen the text panel covers, so 3D content can be centred in the rest
  useLayoutEffect(() => {
    const measure = () => {
      const el = panelRef.current;
      const mobile = window.innerWidth < 760;
      const top = mobile ? 52 : 56;
      const set = (i: Insets) =>
        setInsets((prev) => (prev.left === i.left && prev.bottom === i.bottom && prev.top === i.top ? prev : i));
      if (slide.layout === 'hero') {
        return mobile
          ? set({ left: 0, bottom: Math.round(window.innerHeight * 0.42), top })
          : set({ left: Math.round(window.innerWidth * 0.4), bottom: 0, top: 0 });
      }
      if (!el || slide.layout !== 'side') return set({ left: 0, bottom: 0, top: 0 });
      const r = el.getBoundingClientRect();
      if (mobile) set({ left: 0, bottom: Math.round(collapsed ? 104 : Math.max(0, window.innerHeight - r.top)), top });
      else set({ left: Math.round(Math.max(0, r.right)), bottom: 0, top: 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [index, collapsed, lang, slide.layout]);

  // swipe on the text panel
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) go(index + (dx < 0 ? 1 : -1));
  };

  useEffect(() => {
    if (drawer.open && drawer.hl) {
      requestAnimationFrame(() => document.getElementById(`src-${drawer.hl}`)?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }));
    }
  }, [drawer, reduced]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: L.ui.siteTitle, text: L.ui.tagline, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user cancelled */
    }
  };

  const deck: DeckState = {
    L,
    mall,
    setMall,
    dropCenter,
    setDropCenter: (c, label) => {
      setDropCenterState(c);
      setDropLabel(label ?? 'custom');
    },
    dropLabel,
    openSource: (id) => setDrawer({ open: true, hl: id }),
    go,
  };

  const firstSite = SLIDES.findIndex((s) => s.scene.kind === 'site');
  const actIndex = SLIDES.slice(0, index + 1).filter((s, i, arr) => i === 0 || s.act !== arr[i - 1].act).length;

  return (
    <DeckContext.Provider value={deck}>
      <a className="skip" href="#panel">
        {L.ui.skipTo}
      </a>
      <Stage
        preset={slide.scene}
        mall={mall}
        labels={L.site}
        insets={insets}
        prefetchSite={index >= firstSite - 3}
        reducedMotion={reduced}
        ui={L.ui}
      />
      {mapUsed && (
        <DropMap
          active={slide.scene.kind === 'map'}
          center={dropCenter}
          insets={insets}
          onPick={(ll) => deck.setDropCenter(ll, 'custom')}
          areaLabel={`≈ ${FACTS.hubHa.toLocaleString('en-US')} ha · ${L.ui.approx}`}
        />
      )}
      <div className={`bg-plain ${slide.scene.kind === 'plain' ? 'on' : ''}`} aria-hidden="true" />

      <header className="topbar">
        <button className="brand" type="button" onClick={() => go(0)}>
          <span className="brand-mark" aria-hidden="true" />
          {L.ui.siteTitle}
        </button>
        <div className="act" aria-hidden={slide.act === 'intro'}>
          {slide.act !== 'intro' && (
            <>
              <span className="act-num">{String(actIndex - 1).padStart(2, '0')}</span> {L.acts[slide.act]}
            </>
          )}
        </div>
        <div className="top-actions">
          <div className="langs" role="group" aria-label={L.ui.language}>
            {LANGS.map((l) => (
              <button key={l} type="button" className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
                {LOCALES[l].code.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="tbtn" onClick={() => setDrawer({ open: true, hl: null })}>
            {L.ui.sources}
          </button>
          <button type="button" className="tbtn hide-sm" onClick={share}>
            {copied ? L.ui.copied : L.ui.share}
          </button>
        </div>
      </header>

      <main
        id="panel"
        ref={panelRef}
        key={`${slide.id}-${lang}`}
        className={`panel layout-${slide.layout} scene-${slide.scene.kind} ${collapsed ? 'collapsed' : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-live="polite"
      >
        {slide.layout === 'side' && (
          <button type="button" className="sheet-toggle" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
            {collapsed ? L.ui.showText : L.ui.hideText}
          </button>
        )}
        <div className="panel-inner">
          {text.kicker && <div className="kicker">{text.kicker}</div>}
          <h1 className="title">{text.title}</h1>
          <div className="body">{text.body}</div>
          {slide.id === 'intro' && (
            <button type="button" className="cta" onClick={() => go(1)}>
              {L.ui.start} →
            </button>
          )}
        </div>
      </main>

      <nav className="bottombar" aria-label="Slides">
        <button type="button" className="nav prev" onClick={() => go(index - 1)} disabled={index === 0} aria-label={L.ui.prev}>
          ←
        </button>
        <div className="progress" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              className={`dot ${i === index ? 'on' : ''} ${i < index ? 'past' : ''} act-${s.act}`}
              onClick={() => go(i)}
              title={LOCALES[lang].slides[s.id].title}
            />
          ))}
        </div>
        <div className="count">{L.ui.slideOf(index + 1, SLIDES.length)}</div>
        <button type="button" className="nav next" onClick={() => go(index + 1)} disabled={index === SLIDES.length - 1} aria-label={L.ui.next}>
          →
        </button>
      </nav>

      <div className={`drawer ${drawer.open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={L.ui.allSources} aria-hidden={!drawer.open}>
        <div className="drawer-scrim" onClick={() => setDrawer({ open: false, hl: null })} />
        <div className="drawer-panel">
          <div className="drawer-head">
            <h2>{L.ui.allSources}</h2>
            <button type="button" className="tbtn" onClick={() => setDrawer({ open: false, hl: null })}>
              {L.ui.close}
            </button>
          </div>
          {drawer.open && <SourceList highlight={drawer.hl} />}
        </div>
      </div>
    </DeckContext.Provider>
  );
}
