import { en } from './en';
import { fil } from './fil';
import type { Locale } from './types';

/**
 * To add a language (e.g. Cebuano or Ilocano): copy `fil.tsx`, translate every
 * string, then register it here. Keys missing from a locale fall back to English.
 */
export const LOCALES = { en, fil } satisfies Record<string, Locale>;
export type LangCode = keyof typeof LOCALES;
export const LANGS = Object.keys(LOCALES) as LangCode[];

export function detectLang(): LangCode {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q && q in LOCALES) return q as LangCode;
  try {
    const saved = localStorage.getItem('wtps-lang');
    if (saved && saved in LOCALES) return saved as LangCode;
  } catch {
    /* storage unavailable */
  }
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('fil') || nav.startsWith('tl') ? 'fil' : 'en';
}
