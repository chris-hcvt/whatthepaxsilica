import { useEffect } from 'react';
import { LOCALES, LANGS, UPCOMING, type LangCode } from '../i18n';
import { SourceList } from './bits';
import type { Locale } from '../i18n/types';

export function LangModal({ open, current, onPick, onClose }: { open: boolean; current: LangCode | null; onPick: (l: LangCode) => void; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && current && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, current, onClose]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lang-title">
      <div className="modal-scrim" onClick={() => current && onClose()} />
      <div className="modal-card">
        <div className="modal-mark" aria-hidden="true" />
        <h2 id="lang-title">
          Choose your language
          <span>Piliin ang wika</span>
        </h2>
        <div className="lang-options">
          {LANGS.map((l) => (
            <button key={l} type="button" className={`lang-opt ${current === l ? 'on' : ''}`} onClick={() => onPick(l)} autoFocus={l === 'en'}>
              <b>{LOCALES[l].name}</b>
              <span>{l === 'en' ? 'Continue in English' : 'Magpatuloy sa Tagalog'}</span>
            </button>
          ))}
        </div>
        <div className="lang-soon">
          <span>{(current ? LOCALES[current] : LOCALES.en).ui.moreLanguagesSoon}:</span>
          {UPCOMING.map((u) => (
            <span key={u} className="soon-chip" aria-disabled="true">
              {u}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SourcesDrawer({ L, open, highlight, onClose }: { L: Locale; open: boolean; highlight: string | null; onClose: () => void }) {
  useEffect(() => {
    if (open && highlight) {
      requestAnimationFrame(() => document.getElementById(`src-${highlight}`)?.scrollIntoView({ block: 'center' }));
    }
  }, [open, highlight]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <div className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={L.ui.allSources} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-head">
          <h2>{L.ui.allSources}</h2>
          <button type="button" className="tbtn" onClick={onClose}>
            {L.ui.close}
          </button>
        </div>
        {open && <SourceList highlight={highlight} />}
      </div>
    </div>
  );
}

export function LangButton({ lang, onClick, label }: { lang: LangCode; onClick: () => void; label: string }) {
  return (
    <button type="button" className="tbtn lang-btn" onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9Z" />
      </svg>
      <span className="lang-long">{LOCALES[lang].name}</span>
      <span className="lang-short">{lang.toUpperCase()}</span>
    </button>
  );
}
