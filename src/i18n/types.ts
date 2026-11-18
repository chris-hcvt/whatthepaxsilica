import type { ReactNode } from 'react';
import type { Act } from '../content/slides';
import type { Chapter } from '../content/story';
import type { SourceKind } from '../content/sources';
import type { SiteLabels } from '../three/site';

/** A section of the detailed report. */
export interface SlideText {
  kicker?: string;
  title: string;
  body: ReactNode;
}

/** One step of the scrolling story. */
export interface StoryStep {
  kicker?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** optional "Learn more" content */
  more?: ReactNode;
}

export interface UiStrings {
  siteTitle: string;
  tagline: string;
  sources: string;
  allSources: string;
  close: string;
  language: string;
  share: string;
  copied: string;
  loading3d: string;
  error3d: string;
  noWebgl: string;
  dragHint: string;
  approx: string;
  skipTo: string;
  fullReport: string;
  backToStory: string;
  learnMore: string;
  /** phones: fold a card to its title so the 3D shows in full */
  hideText: string;
  showText: string;
  scrollCue: string;
  chooseLanguage: string;
  moreLanguagesSoon: string;
  soon: string;
  mapSearch: string;
  mapSearchGo: string;
  mapNotFound: string;
  mapSearchBusy: string;
  mapHint: string;
  /** the unit word, never abbreviated */
  hectares: string;
  mapTwoFingers: string;
  reportTitle: string;
  reportIntro: string;
  contents: string;
  reportError: string;
  insetPlace: string;
  insetNote: string;
  stepOf: (k: number, n: number) => string;
  credits: string;
  // kept for the report's interactive bits
  prev: string;
  next: string;
}

export interface Locale {
  code: string;
  /** name of the language in that language */
  name: string;
  ui: UiStrings;
  acts: Record<Act, string>;
  chapters: Record<Chapter, string>;
  kinds: Record<SourceKind, string>;
  site: SiteLabels;
  /** report sections */
  slides: Record<string, SlideText>;
  /** story steps */
  story: Record<string, StoryStep>;
  cities: Record<string, string>;
}
