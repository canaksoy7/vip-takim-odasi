import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useTable } from '../data/hooks';
import { repo } from '../data/repo';
import type { Kades as K } from '../data/types';
import { fmtDate, fmtTL } from '../lib/format';
import { Async, Chips, Empty, Field, Kpi, Kv, PageHead, Pill, Progress, Sheet } from '../ui/kit';
import { GecmisListe } from '../ui/Gecmis';

export default function Kades({ route }: { route: Route }) {
  const q = useTable('kades');
  const id = route.path[1] ? Number(route.path[1]) : null;
  const [tur, setTur] = useState<'tumu' | K['Tur']>('tumu');
  return (
    <Async q={q}>
      {(rows) => {
        if (id) return <Detay k={rows.find((x) => x.ID === id)} rows={rows} />;
        const kades = rows.filter((r) => r.Tur === 'KADES');
        const atanan = kades.reduce((a, r) => a + r.Tutar, 0), harcanan = kades.reduce((a, r) => a + r.Harcanan, 0);
        const liste = rows.filter((r) => tur === 'tumu' || r.Tur === tur);
        return (
          <div className="stack">
            <PageHead title="KADES & ürün kodları" sub="Atanan bütçe, harcanan ve kalan" />
            <div className="kpis">
              <Kpi v={fmtTL(atanan)} l="Atanan (KADES)" />
              <Kpi v={fmtTL(harcanan)} l="Harcanan" tone="st-ust" />
              <Kpi v={fmtTL(atanan - harcanan)} l="Kalan" tone={atanan - harcanan < 0 ? 'st-red' : 'st-onay'} />
              <Kpi v={kades.filter((r) => r.Harcanan > r.Tutar).length} l="Aşılan KADES" tone="st-red" />
            </div>
            <Chips value={tur} onChange={setTur} label="Tür" items={[{ id: 'tumu', label: 'Tümü', n: rows.length }, { id: 'KADES', label: 'KADES', n: kades.length }, { id: 'Ürün Kodu', label: 'Ürün kodları', n: rows.length - kades.length }]} />
            {liste.length === 0 ? <Empty icon="💳" title="Kayıt yok" /> : (
              <div className="list">
                {liste.map((r) => (
                  <button key={r.ID} className="card tap stack" style={{ gap: 6, padding: 12 }} onClick={() => nav(`/kades/${r.ID}`)}>
                    <div className="row"><span className="tiny mono muted">{r.Title}</span><span className="spacer" /><Pill tone={r.Tur === 'KADES' ? 'ust' : 'gri'} plain>{r.Tur}</Pill><Pill tone={r.Durum === 'Aktif' ? 'onay' : r.Durum === 'Kapandı' ? 'gri' : 'bekle'}>{r.Durum}</Pill></div>
                    <div className="bold">{r.Ad}</div>
                    <Progress value={r.Harcanan} max={r.Tutar} />
                    <div className="row small"><span>{fmtTL(r.Harcanan)} / {fmtTL(r.Tutar)}</span><span className="spacer" /><span>Kalan <b style={{ color: r.Tutar - r.Harcanan < 0 ? 'var(--st-red)' : undefined }}>{fmtTL(r.Tutar - r.Harcanan)}</b></span></div>
                    {r.Tur === 'Ürün Kodu' && r.IlgiliKades && <div className="tiny muted">Bağlı KADES: {r.IlgiliKades}</div>}
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

function Detay({ k, rows }: { k?: K; rows: K[] }) {
  const showToast = useApp((s) => s.showToast);
  const [harca, setHarca] = useState(false);
  const [tutar, setTutar] = useState(0);
  if (!k) return <Empty title="Kayıt bulunamadı" />;
  const urunler = rows.filter((r) => r.IlgiliKades === k.Title);
  return (
    <div className="stack">
      <div className="card stack" style={{ gap: 6 }}>
        <div className="row"><span className="tiny mono muted">{k.Title}</span><span className="spacer" /><Pill tone="ust" plain>{k.Tur}</Pill></div>
        <h2 style={{ fontSize: 19 }}>{k.Ad}</h2>
        <Progress value={k.Harcanan} max={k.Tutar} />
        <div className="row small"><span>Harcanan {fmtTL(k.Harcanan)}</span><span className="spacer" /><span>Kalan <b>{fmtTL(k.Tutar - k.Harcanan)}</b></span></div>
      </div>
      <div className="card"><Kv rows={[['Atanan bütçe', fmtTL(k.Tutar)], ['Mali kalem', k.MaliKalem], ['Fon', k.Fon], ['Muhatap', k.Muhatap], ['Portal', k.Portal], ['Son harcama', fmtDate(k.HarcananTarih)], ['Durum', k.Durum], ['İlgili KADES', k.IlgiliKades], ['Notlar', k.Notlar]]} /></div>
      {urunler.length > 0 && (
        <div className="card stack"><div className="section-title" style={{ margin: 0 }}>Bağlı ürün kodları</div>
          {urunler.map((u) => <button key={u.ID} className="row small" style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 8 }} onClick={() => nav(`/kades/${u.ID}`)}><span className="mono">{u.Title}</span><span className="muted ellipsis">{u.Ad}</span><span className="spacer" /><span>{fmtTL(u.Harcanan)}</span></button>)}
        </div>
      )}
      <div className="section-title">Geçmiş</div>
      <GecmisListe liste="KADES" kayitId={k.ID} />
      <div className="sticky-actions"><button className="btn" onClick={() => setHarca(true)}>Harcama ekle</button></div>
      <Sheet open={harca} onClose={() => setHarca(false)} title="Harcama ekle">
        <div className="stack">
          <Field label="Tutar (₺)"><input className="input" inputMode="numeric" value={tutar || ''} onChange={(e) => setTutar(Number(e.target.value) || 0)} /></Field>
          {k.Harcanan + tutar > k.Tutar && <div className="banner warn"><span>⚠️</span><div>Bu harcama atanan bütçeyi aşıyor.</div></div>}
          <button className="btn green block" disabled={!tutar} onClick={async () => { await repo.update('kades', k.ID, { Harcanan: k.Harcanan + tutar, HarcananTarih: new Date().toISOString().slice(0, 10) }, 'Harcama'); setHarca(false); setTutar(0); showToast('Harcama eklendi'); }}>Kaydet</button>
        </div>
      </Sheet>
    </div>
  );
}
