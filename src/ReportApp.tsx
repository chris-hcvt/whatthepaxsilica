import { useEffect, useState } from 'react';
import { DeckContext, type DeckState } from './deck';
import { SLIDES, type MallKey } from './content/slides';
import { LOCALES, LANGS, initialLang, saveLang, type LangCode } from './i18n';
import { SourcesDrawer } from './components/Chrome';

const SECTIONS = SLIDES.filter((s) => s.id !== 'intro' && s.id !== 'drop');

/** The detailed, long-form version of the story. */
export default function ReportApp() {
  const [lang, setLang] = useState<LangCode>(initialLang);
  const [mall, setMall] = useState<MallKey>('moa');
  const [drawer, setDrawer] = useState<{ open: boolean; hl: string | null }>({ open: false, hl: null });
  const L = LOCALES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${L.ui.reportTitle} · What the Pax Silica?`;
  }, [lang, L]);

  const deck: DeckState = {
    L,
    openSource: (id) => setDrawer({ open: true, hl: id }),
    mall,
    setMall,
    refKey: 'moa',
    setRefKey: () => undefined,
    homeKey: 'regular',
    setHomeKey: () => undefined,
    dropCenter: [0, 0],
    setDropCenter: () => undefined,
    dropLabel: '',
  };

  const storyHref = `/${lang !== 'en' ? `?lang=${lang}` : ''}`;
  const acts = SECTIONS.reduce<{ act: string; ids: string[] }[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.act === s.act) last.ids.push(s.id);
    else acc.push({ act: s.act, ids: [s.id] });
    return acc;
  }, []);

  return (
    <DeckContext.Provider value={deck}>
      <header className="sbar report-bar">
        <a className="brand" href={storyHref}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">{L.ui.siteTitle}</span>
        </a>
        <div />
        <div className="sbar-actions">
          <div className="langs" role="group" aria-label={L.ui.language}>
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                className={l === lang ? 'on' : ''}
                aria-pressed={l === lang}
                onClick={() => {
                  setLang(l);
                  saveLang(l);
                }}
              >
                {LOCALES[l].name}
              </button>
            ))}
          </div>
          <button type="button" className="tbtn hide-sm" onClick={() => setDrawer({ open: true, hl: null })}>
            {L.ui.sources}
          </button>
        </div>
      </header>

      <main className="report">
        <div className="report-head">
          <a className="back" href={storyHref}>
            {L.ui.backToStory}
          </a>
          <h1>{L.ui.reportTitle}</h1>
          <p className="lead">{L.ui.reportIntro}</p>
          <nav className="toc" aria-label={L.ui.contents}>
            <h2>{L.ui.contents}</h2>
            <ol>
              {acts.map((a) => (
                <li key={a.act}>
                  <span>{L.acts[a.act as keyof typeof L.acts]}</span>
                  <ul>
                    {a.ids.map((id) => (
                      <li key={id}>
                        <a href={`#${id}`}>{L.slides[id].title}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        {SECTIONS.map((s, i) => {
          const t = L.slides[s.id];
          const newAct = i === 0 || SECTIONS[i - 1].act !== s.act;
          return (
            <section key={s.id} id={s.id} className={`rsec ${s.layout === 'wide' ? 'wide' : ''}`}>
              {newAct && <div className="ract">{L.acts[s.act]}</div>}
              {t.kicker && <div className="kicker">{t.kicker}</div>}
              <h2>{t.title}</h2>
              <div className="body">{t.body}</div>
            </section>
          );
        })}
        <footer className="foot">
          <a className="back" href={storyHref}>
            {L.ui.backToStory}
          </a>
        </footer>
      </main>
      <SourcesDrawer L={L} open={drawer.open} highlight={drawer.hl} onClose={() => setDrawer({ open: false, hl: null })} />
    </DeckContext.Provider>
  );
}
