import { createContext, useContext } from 'react';
import type { MallKey } from './content/slides';
import type { LL } from './three/geo';
import type { Locale } from './i18n/types';

export interface DeckState {
  L: Locale;
  mall: MallKey;
  setMall: (m: MallKey) => void;
  dropCenter: LL;
  setDropCenter: (c: LL, label?: string) => void;
  dropLabel: string;
  openSource: (id: string | null) => void;
  go: (index: number) => void;
}

export const DeckContext = createContext<DeckState | null>(null);

export function useDeck() {
  const v = useContext(DeckContext);
  if (!v) throw new Error('DeckContext missing');
  return v;
}
