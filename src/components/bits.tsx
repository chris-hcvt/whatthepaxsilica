import type { ReactNode } from 'react';
import { useDeck } from '../deck';
import { SOURCES, SOURCE_INDEX, sourceById, type SourceKind } from '../content/sources';
import { FACTS, timesFit, type MallKey } from '../content/slides';

export function Cite({ s }: { s: string | string[] }) {
  const { openSource } = useDeck();
  const ids = Array.isArray(s) ? s : [s];
  return (
    <sup className="cite">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openSource(id);
          }}
          title={`${sourceById(id)?.publisher} — ${sourceById(id)?.title}`}
          aria-label={`Source ${SOURCE_INDEX[id]}: ${sourceById(id)?.publisher}`}
        >
          {SOURCE_INDEX[id] ?? '?'}
        </button>
      ))}
    </sup>
  );
}

export function Stat({ value, label, cite, tone }: { value: ReactNode; label: ReactNode; cite?: string | string[]; tone?: 'red' | 'amber' | 'teal' }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">
        {label}
        {cite && <Cite s={cite} />}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stat-grid">{children}</div>;
}

export function Quote({ text, who, cite, side }: { text: ReactNode; who: ReactNode; cite?: string | string[]; side?: 'gov' | 'community' }) {
  return (
    <figure className={`quote ${side ?? ''}`}>
      <blockquote>{text}</blockquote>
      <figcaption>
        — {who}
        {cite && <Cite s={cite} />}
      </figcaption>
    </figure>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="lead">{children}</p>;
}

export interface ChartRow {
  value: number;
  display: string;
  who: ReactNode;
  what: ReactNode;
  cite: string | string[];
  side: 'gov' | 'critic' | 'media';
}

export function NumberChart({ title, rows, max }: { title: ReactNode; rows: ChartRow[]; max: number }) {
  const lmax = Math.log10(max);
  return (
    <div className="nchart">
      <div className="nchart-title">{title}</div>
      {rows.map((r, i) => (
        <div className={`nrow ${r.side}`} key={i}>
          <div className="nrow-who">
            {r.who}
            <Cite s={r.cite} />
          </div>
          <div className="nrow-bar">
            <span style={{ width: `${Math.max(4, (Math.log10(Math.max(1, r.value)) / lmax) * 100)}%` }} />
            <b>{r.display}</b>
          </div>
          <div className="nrow-what">{r.what}</div>
        </div>
      ))}
    </div>
  );
}

export interface TLItem {
  date: string;
  text: ReactNode;
  cite?: string | string[];
  tag?: 'gov' | 'us' | 'people' | 'next';
}

export function Timeline({ items }: { items: TLItem[] }) {
  return (
    <ol className="timeline">
      {items.map((it, i) => (
        <li key={i} className={it.tag ?? ''}>
          <time>{it.date}</time>
          <div>
            {it.text}
            {it.cite && <Cite s={it.cite} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface ActorGroup {
  title: ReactNode;
  tone: 'us' | 'gov' | 'biz' | 'congress' | 'people' | 'watch';
  items: { name: ReactNode; role: ReactNode; cite?: string | string[] }[];
}

export function Actors({ groups }: { groups: ActorGroup[] }) {
  return (
    <div className="actors">
      {groups.map((g, i) => (
        <section key={i} className={`actor-group ${g.tone}`}>
          <h3>{g.title}</h3>
          <ul>
            {g.items.map((it, j) => (
              <li key={j}>
                <b>{it.name}</b>
                <span>
                  {it.role}
                  {it.cite && <Cite s={it.cite} />}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function GainsTable({ head, rows }: { head: [ReactNode, ReactNode, ReactNode]; rows: { who: ReactNode; gains: ReactNode; costs: ReactNode }[] }) {
  return (
    <div className="gains" role="table">
      <div className="gains-row head" role="row">
        {head.map((h, i) => (
          <div role="columnheader" key={i}>
            {h}
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div className="gains-row" role="row" key={i}>
          <div role="cell" className="who">
            {r.who}
          </div>
          <div role="cell" className="g">
            {r.gains}
          </div>
          <div role="cell" className="c">
            {r.costs}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TwoCol({ left, right, leftTitle, rightTitle }: { left: ReactNode; right: ReactNode; leftTitle: ReactNode; rightTitle: ReactNode }) {
  return (
    <div className="twocol">
      <section className="gov">
        <h3>{leftTitle}</h3>
        {left}
      </section>
      <section className="critic">
        <h3>{rightTitle}</h3>
        {right}
      </section>
    </div>
  );
}

export function CityBars({ rows, hubLabel, unit }: { rows: { name: ReactNode; ha: number }[]; hubLabel: ReactNode; unit: string }) {
  const all = [{ name: hubLabel, ha: FACTS.hubHa, hub: true }, ...rows.map((r) => ({ ...r, hub: false }))].sort((a, b) => b.ha - a.ha);
  const max = Math.max(...all.map((r) => r.ha));
  return (
    <div className="citybars">
      {all.map((r, i) => (
        <div className={`cbar ${r.hub ? 'hub' : ''}`} key={i}>
          <div className="cbar-name">{r.name}</div>
          <div className="cbar-track">
            <span style={{ width: `${(r.ha / max) * 100}%` }} />
          </div>
          <div className="cbar-val">{r.ha.toLocaleString('en-US', { maximumFractionDigits: 0 })} {unit}</div>
        </div>
      ))}
    </div>
  );
}

export function MallPicker({ label }: { label: (n: number, name: string, ha: number, packed: number) => ReactNode }) {
  const { mall, setMall } = useDeck();
  const names: Record<MallKey, string> = { moa: 'SM Mall of Asia', megamall: 'SM Megamall', northedsa: 'SM North EDSA', smclark: 'SM City Clark' };
  return (
    <div className="mallpicker">
      <div className="chips" role="radiogroup">
        {(Object.keys(names) as MallKey[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={mall === k} className={`chip ${mall === k ? 'on' : ''}`} onClick={() => setMall(k)}>
            {names[k]}
          </button>
        ))}
      </div>
      <div className="mall-result">{label(timesFit(FACTS.malls[mall]), names[mall], FACTS.malls[mall], FACTS.mallsPacked[mall])}</div>
    </div>
  );
}

const KIND_ORDER: SourceKind[] = ['official', 'state-media', 'rights', 'mapping', 'analysis', 'news', 'advocacy', 'reference', 'data'];

export function SourceList({ highlight }: { highlight?: string | null }) {
  const { L } = useDeck();
  return (
    <div className="sourcelist">
      {KIND_ORDER.map((k) => {
        const list = SOURCES.filter((s) => s.kind === k);
        if (!list.length) return null;
        return (
          <section key={k}>
            <h3>{L.kinds[k]}</h3>
            <ol>
              {list.map((s) => (
                <li key={s.id} id={`src-${s.id}`} className={highlight === s.id ? 'hl' : ''}>
                  <span className="num">{SOURCE_INDEX[s.id]}</span>
                  <div>
                    <div className="pub">
                      {s.publisher} · <span className="date">{s.date}</span>
                    </div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    {s.note && <div className="snote">{s.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  mineral: <path d="M7 3h10l4 6-9 12L3 9l4-6Zm-4 6h18M9 3l3 18M15 3l-3 18" />,
  energy: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  chip: <path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4M10 10h4v4h-4z" />,
  factory: <path d="M3 21V10l6 4V10l6 4V6h6v15H3Zm4-4h2m4 0h2" />,
  logistics: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01" />,
  network: <path d="M12 4a2 2 0 1 0 0 .01M5 18a2 2 0 1 0 0 .01M19 18a2 2 0 1 0 0 .01M12 6v5m0 0-6 6m6-6 6 6" />,
};

export function Goals({ items }: { items: { icon: keyof typeof ICONS | string; title: ReactNode; text: ReactNode }[] }) {
  return (
    <div className="goals">
      {items.map((g, i) => (
        <div className="goal" key={i}>
          <svg className="goal-icon" viewBox="0 0 24 24" aria-hidden="true">
            {ICONS[g.icon]}
          </svg>
          <div>
            <h3>{g.title}</h3>
            <p>{g.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocList({ items }: { items: { date: string; title: ReactNode; text: ReactNode; cite: string | string[]; status?: 'signed' | 'pending' | 'missing' }[] }) {
  return (
    <ul className="doclist">
      {items.map((d, i) => (
        <li key={i} className={d.status ?? ''}>
          <time>{d.date}</time>
          <div>
            <h3>
              {d.title}
              <Cite s={d.cite} />
            </h3>
            <p>{d.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A plain data table that scrolls sideways on narrow screens. `num` marks columns to right-align. */
export function DataTable({ head, rows, num = [], caption, emphasis }: { head: ReactNode[]; rows: ReactNode[][]; num?: number[]; caption?: ReactNode; emphasis?: number }) {
  return (
    <div className="dtable-wrap">
      <table className="dtable">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={num.includes(i) ? 'num' : ''}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, j) => (
            <tr key={j} className={emphasis === j ? 'em' : ''}>
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={i} className={num.includes(i) ? 'num' : ''}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
