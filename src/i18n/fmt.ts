/** Number wording shared by the 3D labels and the cards. */
const trim = (s: string) => s.replace(/\.0$/, '');

/** 3,110 · 654,000 · 10.2 million · 2.27 billion · 34.1 billion */
export const bigNum = (n: number, million = 'million', billion = 'billion') => {
  if (n >= 1e9) return `${trim((n / 1e9).toFixed(n >= 1e10 ? 1 : 2))} ${billion}`;
  if (n >= 1e6) return `${trim((n / 1e6).toFixed(n >= 1e8 ? 0 : 1))} ${million}`;
  return (n >= 1e5 ? Math.round(n / 1000) * 1000 : Math.round(n)).toLocaleString('en-US');
};

/** homes, rounded the way people say them: 2 · 3,300 · 22,600 · 730,000 · 11 million */
export const homesNum = (n: number, million = 'million') => {
  if (n >= 1e6) return `${Math.round(n / 1e6)} ${million}`;
  if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString('en-US');
  return String(Math.round(n));
};

/** a range rounded to a step: [11126, 11680] → "11,100–11,700" */
export const rangeNum = ([a, b]: [number, number] | number[], step: number) =>
  `${(Math.round(a / step) * step).toLocaleString('en-US')}–${(Math.round(b / step) * step).toLocaleString('en-US')}`;

export const pctNum = (x: number) => `${Math.round(x * 100)}%`;
