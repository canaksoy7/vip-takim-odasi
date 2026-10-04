import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useTable } from '../data/hooks';
import { trNorm } from '../lib/format';
import { Async, Chips, Empty, PageHead } from '../ui/kit';

export default function Hafiza({ route }: { route: Route }) {
  const q = useTable('hafiza');
  const id = route.path[1] ? Number(route.path[1]) : null;
  const [kat, setKat] = useState('tumu');
  const [ara, setAra] = useState('');
  return (
    <Async q={q}>
      {(rows) => {
        if (id) {
          const h = rows.find((x) => x.ID === id);
          if (!h) return <Empty title="Kart bulunamadı" />;
          return (
            <div className="stack">
              <div className="card stack" style={{ gap: 6 }}>
                <div className="row"><span className="tiny muted">{h.Kategori}</span><span className="spacer" /><span className="pill plain" style={{ background: `${h.EtiketRenk}22`, color: h.EtiketRenk }}>{h.Etiket}</span></div>
                <h2 style={{ fontSize: 19 }}>{h.Title}</h2>
                <p className="small muted" style={{ margin: 0 }}>{h.Aciklama}</p>
              </div>
              {h.Uyari && <div className="banner warn"><span>⚠️</span><div>{h.Uyari}</div></div>}
              <div className="card stack">
                <div className="section-title" style={{ margin: 0 }}>Adım adım</div>
                <ol style={{ margin: 0, paddingLeft: 20 }} className="stack">
                  {h.Adimlar.split('\n').filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </div>
              <div className="card"><div className="section-title" style={{ margin: 0 }}>İlgili ekip</div><p style={{ margin: '6px 0 0' }}>{h.Kisiler}</p></div>
              <div className="tiny muted">Anahtar kelimeler: {h.Keywords}</div>
            </div>
          );
        }
        const kategoriler = [...new Set(rows.map((r) => r.Kategori))];
        const liste = rows.filter((r) => (kat === 'tumu' || r.Kategori === kat) && (!ara || trNorm(`${r.Title} ${r.Keywords} ${r.Aciklama}`).includes(trNorm(ara))));
        return (
          <div className="stack">
            <PageHead title="Kurumsal hafıza" sub="Ekip içi süreç kartları — kim, ne, hangi adımlarla" />
            <input className="input" type="search" placeholder="Konu ara: roaming, kvkk, taahhüt…" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Hafızada ara" />
            <Chips value={kat} onChange={setKat} label="Kategori" items={[{ id: 'tumu', label: 'Tümü', n: rows.length }, ...kategoriler.map((k) => ({ id: k, label: k, n: rows.filter((r) => r.Kategori === k).length }))]} />
            {liste.length === 0 ? <Empty icon="🧠" title="Kart bulunamadı" /> : (
              <div className="list">
                {liste.map((h) => (
                  <button key={h.ID} className="card tap" style={{ padding: 12, opacity: h.AktifMi ? 1 : 0.7 }} onClick={() => nav(`/hafiza/${h.ID}`)}>
                    <div className="row"><span className="tiny muted">{h.Kategori}</span><span className="spacer" /><span className="pill plain" style={{ background: `${h.EtiketRenk}22`, color: h.EtiketRenk }}>{h.Etiket}</span></div>
                    <div className="bold">{h.Title}</div>
                    <div className="small muted">{h.Kisiler} · {h.Adimlar.split('\n').length} adım</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </Async>
  );
}
