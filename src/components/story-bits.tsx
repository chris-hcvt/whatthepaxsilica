import { useEffect, useRef, useState } from 'react';
import { PH_CAPAS, PH_MANILA, PH_PATH, PH_VIEWBOX } from '../content/ph-outline';
import type { ReactNode } from 'react';
import { useDeck } from '../deck';
import { Cite } from './bits';
import { usePhone } from './usePhone';
import { ENERGY, ENERGY_KEYS, HOME_KEYS, HOME_LOTS, REFS, WATER_KEYS, WATER_MLD, billOf, fitTimes, homesOf, type EnergyKey, type HomeKey, type RefKey, type WaterKey } from '../content/story';

const MALLS: RefKey[] = ['moa', 'glorietta', 'northedsa', 'megamall', 'smpampanga', 'smclark'];
const DISTRICTS: RefKey[] = ['bgc', 'makaticbd', 'ortigas'];

export function RefPicker({
  malls,
  districts,
  result,
  compact = false,
}: {
  malls: ReactNode;
  districts: ReactNode;
  result: (k: RefKey, times: string) => ReactNode;
  /** phones: malls and districts in one sideways row, and only the headline result */
  compact?: boolean;
}) {
  const { refKey, setRefKey } = useDeck();
  const chip = (k: RefKey) => (
    <button key={k} type="button" role="radio" aria-checked={refKey === k} className={`chip ${refKey === k ? 'on' : ''}`} onClick={() => setRefKey(k)}>
      {REFS[k].name}
    </button>
  );
  if (compact)
    return (
      <div className="refpicker compact">
        <div className="rgroup" role="radiogroup">
          <span className="rgroup-label">{malls}</span>
          {MALLS.map(chip)}
        </div>
        <div className="rgroup" role="radiogroup">
          <span className="rgroup-label">{districts}</span>
          {DISTRICTS.map(chip)}
        </div>
        <div className="ref-result" aria-live="polite">
          {result(refKey, fitTimes(refKey))}
        </div>
      </div>
    );
  return (
    <div className="refpicker">
      <div className="ref-group">
        <div className="ref-label">{malls}</div>
        <div className="chips" role="radiogroup">
          {MALLS.map(chip)}
        </div>
      </div>
      <div className="ref-group">
        <div className="ref-label">{districts}</div>
        <div className="chips" role="radiogroup">
          {DISTRICTS.map(chip)}
        </div>
      </div>
      <div className="ref-result" aria-live="polite">
        {result(refKey, fitTimes(refKey))}
      </div>
    </div>
  );
}

/** The four home sizes as a list; the chosen one fills the one-hectare square in 3D. */
export function HomePicker({
  names,
  lot,
  count,
  compact = false,
}: {
  names: Record<HomeKey, ReactNode>;
  lot: (m2: number) => ReactNode;
  count: (n: number) => ReactNode;
  /** phones: one sideways row of chips (name and count) */
  compact?: boolean;
}) {
  const { homeKey, setHomeKey } = useDeck();
  if (compact)
    return (
      <div className="hgrid" role="radiogroup">
        {HOME_KEYS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={k === homeKey} className={`hcell ${k === homeKey ? 'on' : ''}`} onClick={() => setHomeKey(k)}>
            <span className={`home-ico h-${k}`} aria-hidden="true" />
            <b>{names[k]}</b>
            <span className="hcell-n">{count(HOME_LOTS[k].perHectare)}</span>
          </button>
        ))}
      </div>
    );
  return (
    <div className="homes" role="radiogroup">
      {HOME_KEYS.map((k) => {
        const h = HOME_LOTS[k];
        const on = k === homeKey;
        return (
          <button key={k} type="button" role="radio" aria-checked={on} className={`home-row ${on ? 'on' : ''}`} onClick={() => setHomeKey(k)}>
            <span className={`home-ico h-${k}`} aria-hidden="true" />
            <span className="home-name">
              <b>{names[k]}</b>
              <small>{lot(h.lot)}</small>
            </span>
            <span className="home-n">{count(h.perHectare)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The electricity ladder, from one home to the whole zone. Bars are to scale (linear), so everything
 * below the chip factory is a sliver next to the zone: that is the point.
 */
export function EnergyPicker({
  names,
  kwh,
  peso,
  detail,
  tap,
  next,
  restart,
  mark = '*',
  compact = false,
  short,
}: {
  names: Record<EnergyKey, ReactNode>;
  kwh: (n: number) => ReactNode;
  peso: (n: number) => ReactNode;
  detail: (k: EnergyKey, homes: number) => ReactNode;
  /** badge on the row that comes next ("Tap to add") */
  tap: ReactNode;
  /** the button under the detail that adds the next building */
  next: (name: ReactNode) => ReactNode;
  /** the same button once the zone is shown */
  restart: ReactNode;
  /** footnote mark on the zone's bill: it is an illustration at household rates */
  mark?: string;
  /** phones: a grid of every building and the next button (the bill in 3D carries the numbers) */
  compact?: boolean;
  /** short names for the phone grid */
  short?: Record<EnergyKey, ReactNode>;
}) {
  const { energyKey: on, setEnergyKey: setOn } = useDeck();
  const nextKey = ENERGY_KEYS[ENERGY_KEYS.indexOf(on) + 1];
  const max = ENERGY.hub;
  const rowsRef = useRef<HTMLDivElement>(null);
  // phones show the rows as a sideways strip: keep the chosen one in view (without moving the page)
  useEffect(() => {
    const box = rowsRef.current;
    const btn = box?.querySelector<HTMLElement>('.energy-row.on');
    if (!box || !btn || box.scrollWidth <= box.clientWidth) return;
    const left = btn.offsetLeft - (box.clientWidth - btn.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [on]);
  if (compact) {
    const at = ENERGY_KEYS.indexOf(on);
    return (
      <div className="energy compact">
        {/* every building at once: added (✓), on screen now, next (+), still to come */}
        <div className="egrid" role="radiogroup">
          {ENERGY_KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on === k}
              aria-label={typeof names[k] === 'string' ? (names[k] as string) : undefined}
              className={`ecell ${i < at ? 'past' : ''} ${on === k ? 'on' : ''} ${k === nextKey ? 'next' : ''}`}
              onClick={() => setOn(k)}
            >
              <span className="ecell-mark" aria-hidden="true">
                {i < at ? '✓' : on === k ? '●' : k === nextKey ? '＋' : ''}
              </span>
              {short?.[k] ?? names[k]}
            </button>
          ))}
        </div>
        <button type="button" className={`energy-next ${nextKey ? '' : 'again'}`} onClick={() => setOn(nextKey ?? ENERGY_KEYS[0])}>
          {nextKey ? next(names[nextKey]) : restart}
        </button>
      </div>
    );
  }
  return (
    <div className={`energy ${compact ? 'compact' : ''}`}>
      <div className="energy-rows" role="radiogroup" ref={rowsRef}>
        {ENERGY_KEYS.map((k) => {
          const v = ENERGY[k];
          return (
            <button key={k} type="button" role="radio" aria-checked={on === k} className={`energy-row e-${k} ${on === k ? 'on' : ''} ${k === nextKey ? 'next' : ''}`} onClick={() => setOn(k)}>
              <span className="energy-name">
                <b>{names[k]}</b>
                <small>{kwh(v)}</small>
                {k === nextKey && <span className="energy-tap">{tap}</span>}
              </span>
              <span className="energy-bill">
                {peso(billOf(v))}
                {k === 'hub' && <sup className="energy-mark">{mark}</sup>}
              </span>
              <span className="energy-bar" aria-hidden="true">
                <span style={{ width: `max(3px, ${(v / max) * 100}%)` }} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="energy-detail" aria-live="polite">
        <div className="energy-detail-kwh">{kwh(ENERGY[on])}</div>
        {detail(on, homesOf(ENERGY[on]))}
      </div>
      <button type="button" className={`energy-next ${nextKey ? '' : 'again'}`} onClick={() => setOn(nextKey ?? ENERGY_KEYS[0])}>
        {nextKey ? next(names[nextKey]) : restart}
      </button>
    </div>
  );
}

/** What is lined up against what is needed: a to-scale bar with a legend. */
export function GapBar({
  parts,
  rest,
  compact = false,
}: {
  parts: { share: number; color: string; striped?: boolean; label: ReactNode }[];
  rest: ReactNode;
  /** phones: the bar and the "no plan" line only */
  compact?: boolean;
}) {
  return (
    <div className={`gapbar ${compact ? 'compact' : ''}`}>
      <div className="gap-track" aria-hidden="true">
        {parts.map((p, i) => (
          <span key={i} className={p.striped ? 'striped' : ''} style={{ width: `max(4px, ${p.share * 100}%)`, background: p.striped ? undefined : p.color, color: p.color }} />
        ))}
      </div>
      <ul className="gap-legend">
        {parts.map((p, i) => (
          <li key={i}>
            <i className={p.striped ? 'striped' : ''} style={{ background: p.striped ? undefined : p.color, color: p.color }} />
            <span>{p.label}</span>
          </li>
        ))}
        <li>
          <i className="empty" />
          <span>{rest}</span>
        </li>
      </ul>
    </div>
  );
}

/** Ways a gap could be filled, with land and fuel side by side; `zones` draws that many zone-sized tiles. */
export function FillOptions({ items }: { items: { icon: 'sun' | 'flame' | 'grid' | 'atom'; title: ReactNode; land: ReactNode; fuel: ReactNode; zones?: number }[] }) {
  return (
    <ul className="fillopts">
      {items.map((it, i) => (
        <li key={i}>
          <span className={`fill-ico i-${it.icon}`} aria-hidden="true" />
          <div>
            <b>{it.title}</b>
            <span className="fill-row">
              {it.zones ? (
                <span className="zone-tiles" aria-hidden="true">
                  {Array.from({ length: it.zones }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
              ) : null}
              {it.land}
            </span>
            <span className="fill-row fuel">{it.fuel}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A clearly marked note on how to read a comparison (assumptions, illustration only, etc.). */
export function Assumption({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="assume" role="note">
      <span className="assume-ico" aria-hidden="true">
        i
      </span>
      <div>
        <b>{title}</b> {children}
      </div>
    </div>
  );
}

/** The daily water scenarios; the chosen one sets the height of the 3D column. */
export function WaterPicker({
  names,
  tags,
  result,
  compact = false,
}: {
  names: Record<WaterKey, ReactNode>;
  tags: Record<WaterKey, ReactNode>;
  result: (k: WaterKey, mld: number) => ReactNode;
  /** phones: smaller chips; pass a short `result` */
  compact?: boolean;
}) {
  const { waterKey, setWaterKey } = useDeck();
  return (
    <div className={`waterpick ${compact ? 'compact' : ''}`}>
      <div className="water-chips" role="radiogroup">
        {WATER_KEYS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={waterKey === k} className={`water-chip w-${k} ${waterKey === k ? 'on' : ''}`} onClick={() => setWaterKey(k)}>
            <b>{names[k]}</b>
            <small>{tags[k]}</small>
          </button>
        ))}
      </div>
      <div className="water-result" aria-live="polite">
        {result(waterKey, WATER_MLD[waterKey])}
      </div>
    </div>
  );
}

export interface PCItem {
  title: ReactNode;
  text: ReactNode;
  cite: string | string[];
}

export function ProsCons({ prosTitle, consTitle, pros, cons }: { prosTitle: ReactNode; consTitle: ReactNode; pros: PCItem[]; cons: PCItem[] }) {
  const col = (items: PCItem[], cls: string, title: ReactNode, sign: string) => (
    <section className={`pc-col snap ${cls}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <span className="pc-sign" aria-hidden="true">
              {sign}
            </span>
            <div>
              <b>{it.title}</b>
              <p>
                {it.text}
                <Cite s={it.cite} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
  const phone = usePhone();
  const [tab, setTab] = useState<'pros' | 'cons'>('pros');
  // phones: one side at a time, behind two tabs, instead of two long lists one after the other
  if (phone)
    return (
      <div className="proscons tabs">
        <div className="pc-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'pros'} className={`pc-tab pros ${tab === 'pros' ? 'on' : ''}`} onClick={() => setTab('pros')}>
            {prosTitle} <span>{pros.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'cons'} className={`pc-tab cons ${tab === 'cons' ? 'on' : ''}`} onClick={() => setTab('cons')}>
            {consTitle} <span>{cons.length}</span>
          </button>
        </div>
        {tab === 'pros' ? col(pros, 'pros', prosTitle, '+') : col(cons, 'cons', consTitle, '−')}
      </div>
    );
  return (
    <div className="proscons">
      {col(pros, 'pros', prosTitle, '+')}
      {col(cons, 'cons', consTitle, '−')}
    </div>
  );
}

export type Tag = 'doc' | 'promised' | 'proposed' | 'unclear' | 'planned' | 'reported' | 'goal';

export interface ScoreCell {
  text: ReactNode;
  tag: Tag;
  cite: string | string[];
}

export function ScoreCard({
  head,
  rows,
  tags,
}: {
  head: [ReactNode, ReactNode, ReactNode];
  rows: { topic: ReactNode; ph: ScoreCell; foreign: ScoreCell }[];
  tags: Record<Tag, string>;
}) {
  const cell = (c: ScoreCell) => (
    <>
      <span className={`tag tag-${c.tag}`}>{tags[c.tag]}</span>
      <p>
        {c.text}
        <Cite s={c.cite} />
      </p>
    </>
  );
  const phone = usePhone();
  // phones: one topic at a time (tap to open), each with both sides one under the other
  if (phone)
    return (
      <div className="scorecard acc">
        {rows.map((r, i) => (
          <details className="sc-acc" key={i} open={i === 0}>
            <summary>{r.topic}</summary>
            <div className="sc-cell ph">
              <div className="sc-side">{head[1]}</div>
              {cell(r.ph)}
            </div>
            <div className="sc-cell fo">
              <div className="sc-side">{head[2]}</div>
              {cell(r.foreign)}
            </div>
          </details>
        ))}
      </div>
    );
  return (
    <div className="scorecard" role="table">
      <div className="sc-row sc-head snap" role="row">
        <div role="columnheader">{head[0]}</div>
        <div role="columnheader" className="ph">
          {head[1]}
        </div>
        <div role="columnheader" className="fo">
          {head[2]}
        </div>
      </div>
      {rows.map((r, i) => (
        <div className="sc-row snap" role="row" key={i}>
          <div role="rowheader" className="sc-topic">
            {r.topic}
          </div>
          <div role="cell" className="sc-cell ph" data-label={typeof head[1] === 'string' ? head[1] : undefined}>
            {cell(r.ph)}
          </div>
          <div role="cell" className="sc-cell fo" data-label={typeof head[2] === 'string' ? head[2] : undefined}>
            {cell(r.foreign)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BigNumber({ value, unit, children }: { value: ReactNode; unit?: ReactNode; children?: ReactNode }) {
  return (
    <div className="bignum">
      <div className="bignum-value">
        {value}
        {unit && <span className="bignum-unit">{unit}</span>}
      </div>
      {children && <div className="bignum-text">{children}</div>}
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="bullets">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}


/** Small Philippines map with a pin on Capas, shown at the start of the story. */
export function PhInset({ visible, place, note }: { visible: boolean; place: ReactNode; note: ReactNode }) {
  return (
    <div className={`ph-inset ${visible ? 'on' : ''}`} aria-hidden={!visible}>
      <svg viewBox={PH_VIEWBOX} role="img" aria-label="Map of the Philippines">
        <path d={PH_PATH} className="ph-land" />
        <circle cx={PH_MANILA[0]} cy={PH_MANILA[1]} r="1.6" className="ph-manila" />
        <circle cx={PH_CAPAS[0]} cy={PH_CAPAS[1]} r="5" className="ph-pulse" />
        <circle cx={PH_CAPAS[0]} cy={PH_CAPAS[1]} r="2.4" className="ph-pin" />
      </svg>
      <div className="ph-text">
        <b>{place}</b>
        <span>{note}</span>
      </div>
    </div>
  );
}

export interface DotRow {
  people: number;
  display: string;
  who: ReactNode;
  what: ReactNode;
  cite: string | string[];
  side: 'gov' | 'critic' | 'media';
}

/** Each dot is 10 people, so the gap between estimates is visible at a glance. */
export function DotChart({ rows, legend }: { rows: DotRow[]; legend: ReactNode }) {
  return (
    <div className="dotchart">
      <div className="dot-legend">
        <span className="dot-sample" aria-hidden="true" /> {legend}
      </div>
      {rows.map((r, i) => (
        <div className={`dotrow ${r.side}`} key={i}>
          <div className="dotrow-head">
            <b>{r.display}</b>
            <span>
              {r.who} — {r.what}
              <Cite s={r.cite} />
            </span>
          </div>
          <DotCanvas n={Math.max(1, Math.round(r.people / 10))} side={r.side} />
        </div>
      ))}
    </div>
  );
}

function DotCanvas({ n, side }: { n: number; side: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const draw = () => {
      const w = c.parentElement!.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = 5;
      const gap = 2;
      const cols = Math.max(1, Math.floor((w + gap) / (size + gap)));
      const rows = Math.ceil(n / cols);
      const h = rows * (size + gap);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.height = `${h}px`;
      const ctx = c.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = side === 'critic' ? '#ffc94d' : side === 'gov' ? '#74a9ff' : '#a5b1c2';
      for (let i = 0; i < n; i++) {
        const x = (i % cols) * (size + gap) + size / 2;
        const y = Math.floor(i / cols) * (size + gap) + size / 2;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c.parentElement!);
    return () => ro.disconnect();
  }, [n, side]);
  return <canvas ref={ref} className="dotcanvas" aria-hidden="true" />;
}
