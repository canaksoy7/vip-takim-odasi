import { useState } from 'react';
import type { Route } from '../router';
import { fmtTL } from '../lib/format';
import { ekIndirim, type IndirimSatir } from '../lib/rules';
import { PageHead } from '../ui/kit';

const BASLANGIC: IndirimSatir[] = [
  { ad: 'Mobil', taahhutsuz: 1250, taahhutlu: 990, hedef: 800 },
  { ad: 'İnternet', taahhutsuz: 1100, taahhutlu: 849, hedef: 700 },
  { ad: 'TV (Tivibu)', taahhutsuz: 450, taahhutlu: 380, hedef: 300 },
];
const yuzde = (n: number) => `%${n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;

export default function Indirim(_p: { route: Route }) {
  const [satirlar, setSatirlar] = useState(BASLANGIC);
  const [aktif, setAktif] = useState<Record<string, boolean>>({ Mobil: true, 'İnternet': true, 'TV (Tivibu)': true });
  const set = (i: number, k: keyof IndirimSatir, v: number) => setSatirlar((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const secili = satirlar.filter((s) => aktif[s.ad]);
  const toplam = secili.reduce((a, s) => ({ taahhutsuz: a.taahhutsuz + s.taahhutsuz, taahhutlu: a.taahhutlu + s.taahhutlu, hedef: a.hedef + s.hedef }), { taahhutsuz: 0, taahhutlu: 0, hedef: 0 });
  const t = ekIndirim({ ad: 'Toplam', ...toplam });
  return (
    <div className="stack">
      <PageHead title="Ek indirim hesaplama" sub="Taahhütsüz → taahhütlü ücretten hedef ücrete inmek için gereken ek indirim (aylık, KDV dahil varsayım)" />
      {satirlar.map((s, i) => {
        const r = ekIndirim(s);
        return (
          <section key={s.ad} className="card stack" style={{ opacity: aktif[s.ad] ? 1 : 0.55 }}>
            <label className="row bold" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={aktif[s.ad]} onChange={(e) => setAktif({ ...aktif, [s.ad]: e.target.checked })} style={{ width: 22, height: 22 }} />
              {s.ad}
            </label>
            <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {(['taahhutsuz', 'taahhutlu', 'hedef'] as const).map((k) => (
                <label key={k} className="field">
                  <span>{k === 'taahhutsuz' ? 'Taahhütsüz ₺' : k === 'taahhutlu' ? 'Taahhütlü ₺' : 'Hedef ₺'}</span>
                  <input className="input" inputMode="decimal" value={s[k] || ''} onChange={(e) => set(i, k, Number(e.target.value.replace(',', '.')) || 0)} />
                </label>
              ))}
            </div>
            <div className="row wrap small" style={{ gap: 12 }}>
              <span>Taahhüt indirimi: <b>{fmtTL(r.taahhutIndirimi)}</b></span>
              <span>Gereken ek indirim: <b>{fmtTL(r.ekIndirim)}</b> ({yuzde(r.ekOran)})</span>
              <span>Toplam indirim: <b>{yuzde(r.toplamOran)}</b></span>
            </div>
            {s.hedef > s.taahhutlu && <div className="banner info"><span>ℹ️</span><div>Hedef ücret taahhütlü ücretin üzerinde; ek indirim gerekmez.</div></div>}
          </section>
        );
      })}
      <section className="card stack" style={{ background: 'var(--navy)', color: '#fff', borderColor: 'transparent' }}>
        <div className="bold">Toplam özet ({secili.length} ürün)</div>
        <div className="kpis">
          {[['Taahhütsüz', fmtTL(toplam.taahhutsuz)], ['Taahhütlü', fmtTL(toplam.taahhutlu)], ['Hedef', fmtTL(toplam.hedef)], ['Ek indirim', `${fmtTL(t.ekIndirim)} · ${yuzde(t.ekOran)}`]].map(([l, v]) => (
            <div key={l} className="kpi" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', color: '#fff' }}>
              <div className="v" style={{ fontSize: 18 }}>{v}</div><div className="l" style={{ color: 'rgba(255,255,255,.75)' }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="small" style={{ opacity: 0.85 }}>Müşterinin taahhütsüz fiyata göre toplam indirimi: <b>{yuzde(t.toplamOran)}</b></div>
      </section>
    </div>
  );
}
