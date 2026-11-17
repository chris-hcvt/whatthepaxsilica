import type { ReactNode } from 'react';
import { useDeck } from '../deck';
import { Cite } from './bits';
import { REFS, fitTimes, type RefKey } from '../content/story';

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

export interface PCItem {
  title: ReactNode;
  text: ReactNode;
  cite: string | string[];
}

export function ProsCons({ prosTitle, consTitle, pros, cons }: { prosTitle: ReactNode; consTitle: ReactNode; pros: PCItem[]; cons: PCItem[] }) {
  const col = (items: PCItem[], cls: string, title: ReactNode, sign: string) => (
    <section className={`pc-col ${cls}`}>
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
      <div className="sc-row sc-head" role="row">
        <div role="columnheader">{head[0]}</div>
        <div role="columnheader" className="ph">
          {head[1]}
        </div>
        <div role="columnheader" className="fo">
          {head[2]}
        </div>
      </div>
      {rows.map((r, i) => (
        <div className="sc-row" role="row" key={i}>
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
