import { en } from './en';
import { tl } from './tl';
import type { Locale } from './types';

/**
 * To add a language (e.g. Bisaya or Ilocano): copy `tl.tsx` and `story-tl.tsx`, translate every
 * string, then register it here and in UPCOMING below.
 */
export const LOCALES = { en, tl } satisfies Record<string, Locale>;
export type LangCode = keyof typeof LOCALES;
export const LANGS = Object.keys(LOCALES) as LangCode[];

/** Shown in the language picker as "coming soon". */
export const UPCOMING = ['Bisaya', 'Ilocano', 'Kapampangan', 'Hiligaynon'];

const ALIASES: Record<string, LangCode> = { fil: 'tl', tagalog: 'tl' };

export function urlLang(): LangCode | null {
  const q = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
  if (q in LOCALES) return q as LangCode;
  return ALIASES[q] ?? null;
}

export function savedLang(): LangCode | null {
  try {
    const s = localStorage.getItem('wtps-lang');
    if (s && s in LOCALES) return s as LangCode;
    if (s && ALIASES[s]) return ALIASES[s];
  } catch {
    /* storage unavailable */
  }
  return null;
}

export function saveLang(l: LangCode) {
  try {
    localStorage.setItem('wtps-lang', l);
  } catch {
    /* storage unavailable */
  }
}

/** English is the default. */
export function initialLang(): LangCode {
  return urlLang() ?? savedLang() ?? 'en';
}
