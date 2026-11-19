import { useEffect, useRef, type ReactNode } from 'react';
import { LANGS, LOCALES, type LangCode } from '../i18n';
import type { Chapter } from '../content/story';
import type { Locale } from '../i18n/types';

/** While a sheet is open: Escape closes it, the page behind it doesn't scroll, focus moves into it. */
function useSheet(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    panel.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev;
    };
  }, [open, onClose, panel]);
}

/**
 * Phones: the full text of a step (numbers, notes, sources, "learn more") in a sheet that slides up over the
 * 3D, so the story card itself can stay a headline and a sentence or two.
 */
export function DetailSheet({
  open,
  chapter,
  title,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  chapter: ReactNode;
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useSheet(open, onClose, panel);
  if (!open) return null;
  return (
    <div className="psheet" role="dialog" aria-modal="true" aria-labelledby="dsheet-title">
      <div className="psheet-scrim" onClick={onClose} />
      <div className="psheet-panel" ref={panel} tabIndex={-1}>
        <div className="psheet-head">
          <div>
            <div className="card-chap">{chapter}</div>
            <h2 id="dsheet-title">{title}</h2>
          </div>
          <button type="button" className="psheet-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className="psheet-body card-body">{children}</div>
      </div>
    </div>
  );
}

/** Phones: chapters, language, the full report and sources, behind one menu button in the top bar. */
export function PhoneMenu({
  open,
  L,
  lang,
  chapters,
  current,
  reportHref,
  onChapter,
  onLang,
  onSources,
  onClose,
}: {
  open: boolean;
  L: Locale;
  lang: LangCode;
  chapters: Chapter[];
  current: Chapter | null;
  reportHref: string;
  onChapter: (c: Chapter) => void;
  onLang: (l: LangCode) => void;
  onSources: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useSheet(open, onClose, panel);
  if (!open) return null;
  return (
    <div className="psheet pmenu" role="dialog" aria-modal="true" aria-label={L.ui.menu}>
      <div className="psheet-scrim" onClick={onClose} />
      <div className="psheet-panel" ref={panel} tabIndex={-1}>
        <div className="psheet-head">
          <h2>{L.ui.chaptersTitle}</h2>
          <button type="button" className="psheet-close" onClick={onClose} aria-label={L.ui.close}>
            ×
          </button>
        </div>
        <ol className="pmenu-chapters">
          {chapters.map((c, i) => (
            <li key={c}>
              <button type="button" className={c === current ? 'on' : ''} aria-current={c === current ? 'step' : undefined} onClick={() => onChapter(c)}>
                <span className="pmenu-n">{i + 1}</span>
                {L.chapters[c]}
              </button>
            </li>
          ))}
        </ol>
        <div className="pmenu-row">
          <span className="pmenu-label">{L.ui.language}</span>
          <div className="pmenu-langs" role="radiogroup">
            {LANGS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={l === lang} className={l === lang ? 'on' : ''} onClick={() => onLang(l)}>
                {LOCALES[l].name}
              </button>
            ))}
          </div>
        </div>
        <div className="pmenu-links">
          <a className="cta" href={reportHref}>
            {L.ui.fullReport} →
          </a>
          <button type="button" className="cta ghost" onClick={onSources}>
            {L.ui.allSources}
          </button>
        </div>
      </div>
    </div>
  );
}
