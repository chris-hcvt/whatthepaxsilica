import { useEffect, useRef } from 'react';
import { PH_CAPAS, PH_MANILA, PH_PATH, PH_VIEWBOX } from '../content/ph-outline';
import type { ReactNode } from 'react';
import { useDeck } from '../deck';
import { Cite } from './bits';
import { HOME_KEYS, HOME_LOTS, REFS, fitTimes, type HomeKey, type RefKey } from '../content/story';

const MALLS: RefKey[] = ['moa', 'glorietta', 'northedsa', 'megamall', 'smpampanga', 'smclark'];
const DISTRICTS: RefKey[] = ['bgc', 'makaticbd', 'ortigas'];

export function RefPicker({ malls, districts, result }: { malls: ReactNode; districts: ReactNode; result: (k: RefKey, times: string) => ReactNode }) {
  const { refKey, setRefKey } = useDeck();
  const chip = (k: RefKey) => (
    <button key={k} type="button" role="radio" aria-checked={refKey === k} className={`chip ${refKey === k ? 'on' : ''}`} onClick={() => setRefKey(k)}>
      {REFS[k].name}
    </button>
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
export function HomePicker({ names, lot, count }: { names: Record<HomeKey, ReactNode>; lot: (m2: number) => ReactNode; count: (n: number) => ReactNode }) {
  const { homeKey, setHomeKey } = useDeck();
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
