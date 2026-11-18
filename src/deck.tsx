import { createContext, useContext } from 'react';
import type { MallKey } from './content/slides';
import type { HomeKey, RefKey, WaterKey } from './content/story';
import type { LL } from './three/geo';
import type { Locale } from './i18n/types';

export interface DeckState {
  L: Locale;
  openSource: (id: string | null) => void;
  // report: mall picker
  mall: MallKey;
  setMall: (m: MallKey) => void;
  // story: reference picker and city map
  refKey: RefKey;
  setRefKey: (k: RefKey) => void;
  homeKey: HomeKey;
  setHomeKey: (k: HomeKey) => void;
  waterKey: WaterKey;
  setWaterKey: (k: WaterKey) => void;
  dropCenter: LL;
  setDropCenter: (c: LL, label?: string) => void;
  dropLabel: string;
}

export const DeckContext = createContext<DeckState | null>(null);

export function useDeck() {
  const v = useContext(DeckContext);
  if (!v) throw new Error('DeckContext missing');
  return v;
}
