import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeckContext, type DeckState } from './deck';
import { STEPS, CHAPTERS, type RefKey, type Chapter } from './content/story';
import { LOCALES, initialLang, saveLang, savedLang, urlLang, type LangCode } from './i18n';
import { Stage } from './components/Stage';
import { DropMap } from './components/DropMap';
import { LangButton, LangModal, SourcesDrawer } from './components/Chrome';
import type { LL } from './three/geo';
import type { Insets } from './three/engine';

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function useInsets(): Insets {
  const calc = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w >= 900) return { left: Math.round(Math.min(500, w * 0.4) + 32), bottom: 0, top: 60 };
    return { left: 0, bottom: Math.round(h * 0.44), top: 56 };
  };
  const [ins, setIns] = useState<Insets>(calc);
  useEffect(() => {
    let lastW = window.innerWidth;
    const onR = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        setIns(calc());
      }
    };
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return ins;
}

export default function StoryApp() {
  const [lang, setLang] = useState<LangCode>(initialLang);
  const [langOpen, setLangOpen] = useState(() => !urlLang() && !savedLang());
  const [active, setActive] = useState(0);
  const [refKey, setRefKey] = useState<RefKey>('moa');
  const [dropCenter, setDropCenterState] = useState<LL>([121.0239, 14.5556]);
  const [dropLabel, setDropLabel] = useState('makati');
  const [drawer, setDrawer] = useState<{ open: boolean; hl: string | null }>({ open: false, hl: null });
  const [mapNear, setMapNear] = useState(false);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef<HTMLElement>(null);
  const insets = useInsets();
  const reduced = useMemo(prefersReduced, []);
  const L = LOCALES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'tl' ? 'What the Pax Silica? · Tagalog' : 'What the Pax Silica?';
  }, [lang]);

  // which step is under the middle of the screen (checked on every scroll frame, so fast jumps never miss a step)
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let best = 0;
      let bestDist = Infinity;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-step]'))) {
        const r = el.getBoundingClientRect();
        const d = r.top <= mid && r.bottom > mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bestDist) {
          bestDist = d;
          best = Number(el.dataset.step);
          if (d === 0) break;
        }
      }
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // load the map shortly before it scrolls into view
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setMapNear(true), { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickLang = (l: LangCode) => {
    setLang(l);
    saveLang(l);
    setLangOpen(false);
  };

  const share = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: L.ui.siteTitle, text: L.ui.tagline, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  };

  // jump straight to a chapter: smooth-scrolling past every 3D scene on the way is slow on phones
  const goChapter = useCallback((c: Chapter) => {
    const i = STEPS.findIndex((s) => s.chapter === c);
    const el = document.querySelector<HTMLElement>(`[data-step="${i}"]`);
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.card');
    const target = card
      ? card.getBoundingClientRect().top + window.scrollY - (window.innerHeight - card.offsetHeight) / 2
      : el.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
  }, []);

  const deck: DeckState = {
    L,
    openSource: (id) => setDrawer({ open: true, hl: id }),
    mall: 'moa',
    setMall: () => undefined,
    refKey,
    setRefKey,
    dropCenter,
    setDropCenter: (c, label) => {
      setDropCenterState(c);
      setDropLabel(label ?? 'custom');
    },
    dropLabel,
  };

  const step = STEPS[active];
  // keep the last 3D scene while a full-width section is not yet covering the screen
  const scene = step.scene;
  const chapter = step.chapter;
  const reportHref = `/report/${lang !== 'en' ? `?lang=${lang}` : ''}`;

  return (
    <DeckContext.Provider value={deck}>
      <a className="skip" href="#story">
        {L.ui.skipTo}
      </a>
      <Stage state={scene} refKey={refKey} labels={L.site} insets={insets} reducedMotion={reduced} ui={L.ui} />

      <header className="sbar">
        <a className="brand" href="#top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }))}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">{L.ui.siteTitle}</span>
        </a>
        <nav className="chapters" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button key={c} type="button" className={`chap ${c === chapter ? 'on' : ''} ${chapter && CHAPTERS.indexOf(chapter) > i ? 'past' : ''}`} onClick={() => goChapter(c)}>
              <span className="chap-dot" />
              <span className="chap-label">{L.chapters[c]}</span>
            </button>
          ))}
        </nav>
        <div className="sbar-actions">
          <LangButton lang={lang} label={L.ui.language} onClick={() => setLangOpen(true)} />
          <a className="tbtn report-btn" href={reportHref}>
            {L.ui.fullReport}
          </a>
        </div>
      </header>

      <main id="story" className="story">
        {STEPS.map((s, i) => {
          const t = L.story[s.id];
          if (s.kind === 'hero')
            return (
              <section key={s.id} className="step hero" data-step={i} id="top">
                <div className="card hero-card">
                  <div className="kicker">{t.kicker}</div>
                  <h1 className="hero-title">{t.title}</h1>
                  {t.body}
                  <div className="scroll-cue" aria-hidden="true">
                    {L.ui.scrollCue} <span>↓</span>
                  </div>
                </div>
              </section>
            );
          if (s.kind === 'map')
            return (
              <section key={s.id} className="full mapwrap" data-step={i} ref={mapRef} id={s.id}>
                <DropMap visible={mapNear} />
              </section>
            );
          if (s.kind === 'full')
            return (
              <section key={s.id} className={`full sec-${s.id}`} data-step={i} id={s.id}>
                <div className="full-inner">
                  {t.kicker && <div className="kicker">{t.kicker}</div>}
                  <h2 className="full-title">{t.title}</h2>
                  {t.body}
                  {t.more && (
                    <details className="more">
                      <summary>{L.ui.learnMore}</summary>
                      {t.more}
                    </details>
                  )}
                  {s.id === 'next' && (
                    <div className="cta-row">
                      <a className="cta" href={reportHref}>
                        {L.ui.fullReport} →
                      </a>
                      <button type="button" className="cta ghost" onClick={share}>
                        {copied ? L.ui.copied : L.ui.share}
                      </button>
                      <button type="button" className="cta ghost" onClick={() => setDrawer({ open: true, hl: null })}>
                        {L.ui.allSources}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          return (
            <section key={s.id} className={`step ${s.id === 'size-compare' ? 'tall' : ''}`} data-step={i} id={s.id}>
              <div className={`card ${active === i ? 'active' : ''}`}>
                {t.kicker && <div className="kicker">{t.kicker}</div>}
                <h2 className="card-title">{t.title}</h2>
                {t.body}
                {t.more && (
                  <details className="more">
                    <summary>{L.ui.learnMore}</summary>
                    {t.more}
                  </details>
                )}
              </div>
            </section>
          );
        })}
        <footer className="foot">
          <p>
            <b>{L.ui.siteTitle}</b> — {L.ui.tagline}
          </p>
          <p className="muted">
            {L.ui.credits}{' '}
            <button type="button" className="linklike" onClick={() => setDrawer({ open: true, hl: null })}>
              {L.ui.allSources}
            </button>{' '}
            ·{' '}
            <a href="https://github.com/chris-hcvt/whatthepaxsilica/issues" target="_blank" rel="noopener noreferrer">
              {L.ui.reportError}
            </a>
          </p>
        </footer>
      </main>

      <SourcesDrawer L={L} open={drawer.open} highlight={drawer.hl} onClose={() => setDrawer({ open: false, hl: null })} />
      <LangModal open={langOpen} current={savedLang() ? lang : null} onPick={pickLang} onClose={() => setLangOpen(false)} />
    </DeckContext.Provider>
  );
}
