import type { ReactNode } from 'react';
import type { Act } from '../content/slides';
import type { SourceKind } from '../content/sources';
import type { SiteLabels } from '../three/site';

export interface SlideText {
  kicker?: string;
  title: string;
  body: ReactNode;
}

export interface UiStrings {
  siteTitle: string;
  tagline: string;
  prev: string;
  next: string;
  slideOf: (n: number, total: number) => string;
  sources: string;
  allSources: string;
  close: string;
  language: string;
  share: string;
  copied: string;
  loading3d: string;
  error3d: string;
  noWebgl: string;
  hideText: string;
  showText: string;
  dragHint: string;
  mapHint: string;
  approx: string;
  openLink: string;
  start: string;
  skipTo: string;
}

export interface Locale {
  code: string;
  /** name of the language in that language */
  name: string;
  ui: UiStrings;
  acts: Record<Act, string>;
  kinds: Record<SourceKind, string>;
  site: SiteLabels;
  slides: Record<string, SlideText>;
  cities: Record<string, string>;
}
