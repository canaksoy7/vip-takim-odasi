import { Component, useEffect, type ReactNode } from 'react';
import { EKIP } from '../data/seed';

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Chips<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; n?: number }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="chips" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} className={`chip${value === it.id ? ' on' : ''}`} onClick={() => onChange(it.id)}>
          {it.label}
          {it.n !== undefined && <span className="n">{it.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} className={value === it.id ? 'on' : ''} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Kpi({ v, l, on, onClick, tone }: { v: ReactNode; l: string; on?: boolean; onClick?: () => void; tone?: string }) {
  const inner = (
    <>
      <div className="v" style={tone ? { color: `var(--${tone})` } : undefined}>{v}</div>
      <div className="l">{l}</div>
    </>
  );
  return onClick ? (
    <button className={`kpi${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on}>{inner}</button>
  ) : (
    <div className="kpi">{inner}</div>
  );
}

export function Pill({ tone, children, plain }: { tone: 'bekle' | 'ust' | 'onay' | 'red' | 'turuncu' | 'gri'; children: ReactNode; plain?: boolean }) {
  return <span className={`pill st-${tone}${plain ? ' plain' : ''}`}>{children}</span>;
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" />)}
    </div>
  );
}

export function Empty({ icon = '🗂️', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="state">
      <div className="big" aria-hidden>{icon}</div>
      <h3>{title}</h3>
      {text && <p className="small">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorView({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <div className="big" aria-hidden>⚠️</div>
      <h3>Bir şeyler ters gitti</h3>
      <p className="small">{error.message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Tekrar dene</button>}
    </div>
  );
}

/** Veri durumunu tek yerde ele alır: yükleniyor / hata / içerik. */
export function Async<V>({ q, children }: { q: { data: V | undefined; loading: boolean; error: Error | null; reload: () => void }; children: (d: V) => ReactNode }) {
  if (q.error) return <ErrorView error={q.error} onRetry={q.reload} />;
  if (q.data === undefined) return <Loading />;
  return <>{children(q.data)}</>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) return <ErrorView error={this.state.err} onRetry={() => this.setState({ err: null })} />;
    return this.props.children;
  }
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="row" style={{ marginBottom: 6 }}>
          <h3 style={{ flex: 1, margin: 0 }}>{title}</h3>
          <button className="btn ghost small" onClick={onClose} aria-label="Kapat">Kapat</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const e = EKIP.find((x) => x.ad === name);
  const short = e?.short ?? name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  return <span className="avatar" style={{ background: e?.color ?? '#64748b', width: size, height: size }} aria-hidden>{short}</span>;
}

export function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v === '' || v === null || v === undefined ? '—' : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const p = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={`progress${p > 100 ? ' over' : p > 85 ? ' warn' : ''}`} role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

export const Icon = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>,
};

/** Dosya indirme yardımcısı (yalnızca cihazda, sunucuya gönderim yok). */
export function indir(blob: Blob, ad: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = ad;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV üretir (Excel uyumu için BOM + noktalı virgül ayırıcı). */
export function csv(rows: (string | number | null | undefined)[][]): Blob {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return new Blob(['﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
