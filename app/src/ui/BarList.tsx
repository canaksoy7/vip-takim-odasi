import { useState } from 'react';

export interface Bar { label: string; value: number; color?: string; note?: string }

/** Tek seri yatay çubuk grafiği: değer etiketleri metin renginde, renk yalnızca işaret üzerinde; tablo görünümü var. */
export function BarList({ title, rows, fmt = (n) => n.toLocaleString('tr-TR'), color = 'var(--accent)' }: { title: string; rows: Bar[]; fmt?: (n: number) => string; color?: string }) {
  const [tablo, setTablo] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="card stack" style={{ gap: 8 }}>
      <div className="row"><h3 style={{ flex: 1, fontSize: 15 }}>{title}</h3><button className="btn ghost small" onClick={() => setTablo(!tablo)} aria-pressed={tablo}>{tablo ? 'Grafik' : 'Tablo'}</button></div>
      {tablo ? (
        <table className="tbl"><tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td><td className="mono" style={{ textAlign: 'right' }}>{fmt(r.value)}</td></tr>)}</tbody></table>
      ) : (
        <div className="stack" style={{ gap: 6 }} role="img" aria-label={`${title}: ${rows.map((r) => `${r.label} ${fmt(r.value)}`).join(', ')}`}>
          {rows.map((r) => (
            <div key={r.label} className="chart-bar" title={`${r.label}: ${fmt(r.value)}${r.note ? ` · ${r.note}` : ''}`}>
              <span className="ellipsis">{r.label}</span>
              <span className="track"><i style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color, minWidth: r.value > 0 ? 4 : 0 }} /></span>
              <span className="mono small" style={{ textAlign: 'right' }}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
