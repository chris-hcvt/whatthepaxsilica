import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeckContext, type DeckState } from './deck';
import { STEPS, CHAPTERS, type RefKey, type HomeKey, type WaterKey, type EnergyKey, type Chapter } from './content/story';
import { LOCALES, initialLang, saveLang, savedLang, urlLang, type LangCode } from './i18n';
import { Stage } from './components/Stage';
import { MapLayer, DropControls } from './components/DropMap';
import { PhInset } from './components/story-bits';
import { LangButton, LangModal, SourcesDrawer } from './components/Chrome';
import type { LL } from './three/geo';
import type { Insets } from './three/engine';

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const MAP_STEP = STEPS.findIndex((s) => s.kind === 'map');

function useInsets(active: number): Insets {
  const calc = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w >= 900) return { left: Math.round(Math.min(520, w * 0.4) + 40), bottom: 0, top: 60 };
    // phones: the card covers the bottom; frame the 3D in what is left above it (tall cards leave less)
    let bottom = h * 0.46;
    const step = STEPS[active];
    if (step?.kind === 'card') {
      const card = document.getElementById(step.id)?.querySelector<HTMLElement>('.card');
      if (card) bottom = Math.min(h * 0.74, Math.max(bottom, card.offsetHeight + h * 0.05 + 8));
    }
    return { left: 0, bottom: Math.round(bottom), top: 56 };
  };
  const [ins, setIns] = useState<Insets>(calc);
  useEffect(() => {
    const next = calc();
    setIns((cur) => (cur.left === next.left && cur.bottom === next.bottom && cur.top === next.top ? cur : next));
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
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
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return ins;
}

/** position of each step inside its chapter, for the "2 of 4" label */
const CHAPTER_POS = STEPS.map((s, i) => {
  if (!s.chapter) return null;
  const inChap = STEPS.filter((x) => x.chapter === s.chapter);
  return { k: inChap.indexOf(STEPS[i]) + 1, n: inChap.length };
});

export default function StoryApp() {
  const [lang, setLang] = useState<LangCode>(initialLang);
  const [langOpen, setLangOpen] = useState(() => !urlLang() && !savedLang());
  const [active, setActive] = useState(0);
  const [refKey, setRefKey] = useState<RefKey>('moa');
  const [homeKey, setHomeKey] = useState<HomeKey>('regular');
  const [waterKey, setWaterKey] = useState<WaterKey>('high');
  const [energyKey, setEnergyKey] = useState<EnergyKey>('regular');
  const [dropCenter, setDropCenterState] = useState<LL>([121.0239, 14.5556]);
  const [dropLabel, setDropLabel] = useState('makati');
  const [drawer, setDrawer] = useState<{ open: boolean; hl: string | null }>({ open: false, hl: null });
  const [copied, setCopied] = useState(false);
  const insets = useInsets(active);
  const reduced = useMemo(prefersReduced, []);
  const L = LOCALES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'tl' ? 'What the Pax Silica? · Tagalog' : 'What the Pax Silica?';
  }, [lang]);

  // which step is under the middle of the screen (checked on every scroll frame)
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

  // snap scrolling is for the story page only
  useEffect(() => {
    document.documentElement.classList.add('snap-page');
    return () => document.documentElement.classList.remove('snap-page');
  }, []);

  // desktop mouse wheel / trackpad: one gesture moves exactly one card (phones use native swipe snapping)
  useEffect(() => {
    if (window.matchMedia?.('(pointer: coarse)').matches) return;
    let lockedUntil = 0;
    let lastEvent = 0;
    const centreOf = (i: number) => {
      const el = document.querySelector<HTMLElement>(`[data-step="${i}"]`)!;
      const r = el.getBoundingClientRect();
      return el.classList.contains('full') ? r.top + window.scrollY - 60 : r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const target = e.target as HTMLElement;
      if (target.closest('.drawer, .modal, .drop-sugg')) return;
      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-step]'));
      const mid = window.innerHeight / 2;
      const cur = els.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom > mid;
      });
      const dir = Math.sign(e.deltaY);
      const curEl = els[cur];
      // inside a long reading section: scroll normally until its top or bottom edge
      if (curEl?.classList.contains('full')) {
        const r = curEl.getBoundingClientRect();
        const atTop = r.top >= 50;
        const atBottom = r.bottom <= window.innerHeight + 4;
        if (!(dir < 0 && atTop) && !(dir > 0 && atBottom)) return;
      }
      const next = cur + dir;
      if (cur < 0 || next < 0 || next >= els.length) return;
      e.preventDefault();
      // swallow the rest of this gesture (trackpad inertia) before taking the next step
      if (now < lockedUntil || gap < 60) {
        lockedUntil = Math.max(lockedUntil, now + 120);
        return;
      }
      lockedUntil = now + 700;
      const nextEl = els[next];
      const top =
        dir < 0 && nextEl.classList.contains('full')
          ? nextEl.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
          : centreOf(next);
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [reduced]);

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

  // jump straight to a step: smooth-scrolling past every 3D scene on the way is slow on phones
  const goStep = useCallback((i: number) => {
    const el = document.querySelector<HTMLElement>(`[data-step="${i}"]`);
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.card');
    const target = card
      ? el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2 - window.innerHeight / 2
      : el.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
  }, []);
  const goChapter = useCallback((c: Chapter) => goStep(STEPS.findIndex((s) => s.chapter === c)), [goStep]);

  const deck: DeckState = {
    L,
    openSource: (id) => setDrawer({ open: true, hl: id }),
    mall: 'moa',
    setMall: () => undefined,
    refKey,
    setRefKey,
    homeKey,
    setHomeKey,
    waterKey,
    setWaterKey,
    energyKey,
    setEnergyKey,
    dropCenter,
    setDropCenter: (c, label) => {
      setDropCenterState(c);
      setDropLabel(label ?? 'custom');
    },
    dropLabel,
  };

  const step = STEPS[active];
  const chapter = step.chapter;
  const reportHref = `/report/${lang !== 'en' ? `?lang=${lang}` : ''}`;
  const progress = active / (STEPS.length - 1);

  return (
    <DeckContext.Provider value={deck}>
      <a className="skip" href="#story">
        {L.ui.skipTo}
      </a>
      <Stage state={step.scene} refKey={refKey} homeKey={homeKey} waterKey={waterKey} energyKey={energyKey} labels={L.site} insets={insets} reducedMotion={reduced} ui={L.ui} quiet={step.kind === 'full' || step.kind === 'map'} />
      <MapLayer prepare={active >= MAP_STEP - 3} active={step.kind === 'map'} insets={insets} />
      <PhInset visible={!!step.inset} place={L.ui.insetPlace} note={L.ui.insetNote} />
      <div className={`vignette ${step.kind === 'full' ? 'dim' : ''}`} aria-hidden="true" />

      <header className="sbar">
        <a className="brand" href="#top" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0, behavior: 'auto' }))}>
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
        <div className="sbar-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      </header>

      <nav className="rail" aria-label="Steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`rail-dot ${i === active ? 'on' : ''} ${i < active ? 'past' : ''} k-${s.kind}`}
            onClick={() => goStep(i)}
            aria-label={`${s.chapter ? L.chapters[s.chapter] + ' · ' : ''}${typeof L.story[s.id].title === 'string' ? L.story[s.id].title : ''}`}
            title={s.chapter ? L.chapters[s.chapter] : L.ui.siteTitle}
          />
        ))}
      </nav>

      <main id="story" className="story">
        {STEPS.map((s, i) => {
          const t = L.story[s.id];
          const pos = CHAPTER_POS[i];
          if (s.kind === 'hero')
            return (
              <section key={s.id} className={`step hero ${active === i ? 'is-active' : ''}`} data-step={i} id="top">
                <div className="card hero-card">
                  <div className="kicker">{t.kicker}</div>
                  <h1 className="hero-title">{t.title}</h1>
                  {t.body}
                  <button type="button" className="scroll-cue" onClick={() => goStep(1)}>
                    {L.ui.scrollCue} <span aria-hidden="true">↓</span>
                  </button>
                </div>
              </section>
            );
          if (s.kind === 'full')
            return (
              <section key={s.id} className={`full sec-${s.id} ${active === i ? 'is-active' : ''}`} data-step={i} id={s.id}>
                <div className="full-inner">
                  <header className="full-head snap">
                    {t.kicker && <div className="kicker">{t.kicker}</div>}
                    <h2 className="full-title">{t.title}</h2>
                  </header>
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
            <section key={s.id} className={`step ${s.kind === 'map' ? 'step-map' : ''} ${s.id === 'size-compare' ? 'tall' : ''} ${active === i ? 'is-active' : ''}`} data-step={i} id={s.id}>
              <div className={`card ${active === i ? 'active' : ''}`}>
                {s.chapter && pos && (
                  <div className="card-meta">
                    <span className="card-chap">{L.chapters[s.chapter]}</span>
                    <span className="card-count">{L.ui.stepOf(pos.k, pos.n)}</span>
                  </div>
                )}
                {t.kicker && <div className="kicker">{t.kicker}</div>}
                <h2 className="card-title">{t.title}</h2>
                <div className="card-body">
                  {t.body}
                  {s.kind === 'map' && <DropControls />}
                </div>
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
