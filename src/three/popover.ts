/**
 * A picture pop-up for labels in the 3D view: hover with a mouse, tap on touch screens (tap again or anywhere
 * else to close). On phones it opens as a panel under the top bar; elsewhere it sits beside the label.
 */

export interface PopContent {
  title: string;
  /** one short line under the title */
  sub?: string;
  img: { src: string; w: number; h: number; alt: string };
  caption: string;
  /** credit line, as safe HTML built by the caller (links to the author's file page and licence) */
  credit: string;
  link?: { href: string; text: string };
  /** the close button's accessible name */
  close: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export class Popover {
  readonly el = document.createElement('div');
  private anchor: HTMLElement | null = null;
  private hideTimer = 0;
  private sources = new Map<HTMLElement, () => PopContent | null>();

  constructor(private layer: HTMLElement) {
    this.el.className = 'pop3d';
    this.el.setAttribute('role', 'dialog');
    this.el.hidden = true;
    layer.appendChild(this.el);
    // keep it open while the mouse is over it (to reach the links)
    this.el.addEventListener('pointerenter', () => window.clearTimeout(this.hideTimer));
    this.el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.hideSoon());
    document.addEventListener('pointerdown', (e) => {
      if (this.el.hidden) return;
      const t = e.target as Node;
      if (!this.el.contains(t) && !(this.anchor && this.anchor.contains(t))) this.hide();
    });
    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.hide());
  }

  /** make a label open the pop-up; `content` is asked each time, so it follows the language */
  attach(el: HTMLElement, content: () => PopContent | null) {
    this.sources.set(el, content);
    el.classList.add('has-pop');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-haspopup', 'dialog');
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      window.clearTimeout(this.hideTimer);
      this.show(el);
    });
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.hideSoon());
    el.addEventListener('click', () => (this.anchor === el && !this.el.hidden ? this.hide() : this.show(el)));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.anchor === el && !this.el.hidden) this.hide();
        else this.show(el);
      }
    });
  }

  private show(el: HTMLElement) {
    const c = this.sources.get(el)?.();
    if (!c) return;
    if (this.anchor && this.anchor !== el) this.anchor.setAttribute('aria-expanded', 'false');
    this.anchor = el;
    el.setAttribute('aria-expanded', 'true');
    const ratio = (c.img.h / c.img.w) * 100;
    this.el.setAttribute('aria-label', c.title);
    this.el.innerHTML = `
      <button type="button" class="pop-close" aria-label="${esc(c.close)}">×</button>
      <div class="pop-img" style="padding-top:${ratio.toFixed(2)}%"><img src="${esc(c.img.src)}" alt="${esc(c.img.alt)}" width="${c.img.w}" height="${c.img.h}" /></div>
      <div class="pop-body">
        <div class="pop-title">${esc(c.title)}</div>
        ${c.sub ? `<div class="pop-sub">${esc(c.sub)}</div>` : ''}
        <p class="pop-cap">${esc(c.caption)}</p>
        <div class="pop-credit">${c.credit}</div>
        ${c.link ? `<a class="pop-link" href="${esc(c.link.href)}" target="_blank" rel="noopener noreferrer">${esc(c.link.text)} ↗</a>` : ''}
      </div>`;
    this.el.querySelector('.pop-close')!.addEventListener('click', () => this.hide());
    this.el.hidden = false;
    this.place();
  }

  /** beside the label (above it when there is room), kept on screen; phones get a panel under the top bar */
  private place() {
    const a = this.anchor;
    if (!a) return;
    const box = this.layer.getBoundingClientRect();
    const phone = box.width < 600;
    this.el.classList.toggle('sheet', phone);
    if (phone) {
      this.el.style.transform = '';
      return;
    }
    const r = a.getBoundingClientRect();
    const w = this.el.offsetWidth;
    const h = this.el.offsetHeight;
    let x = r.left - box.left + r.width / 2 - w / 2;
    let y = r.top - box.top - h - 10;
    if (y < 70) y = r.bottom - box.top + 10;
    x = Math.min(Math.max(x, 12), box.width - w - 12);
    y = Math.min(Math.max(y, 70), box.height - h - 12);
    this.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  private hideSoon() {
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.hide(), 260);
  }

  hide() {
    window.clearTimeout(this.hideTimer);
    if (this.anchor) this.anchor.setAttribute('aria-expanded', 'false');
    this.anchor = null;
    this.el.hidden = true;
  }
}

/** "Photo: Author · Licence" with links, for PopContent.credit */
export function creditHtml(label: string, author: string, page: string, license: string, licenseUrl?: string) {
  const lic = licenseUrl ? `<a href="${esc(licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(license)}</a>` : esc(license);
  return `${esc(label)} <a href="${esc(page)}" target="_blank" rel="noopener noreferrer">${esc(author)}</a> · ${lic}`;
}
