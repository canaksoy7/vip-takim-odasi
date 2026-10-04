import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useTable } from '../data/hooks';
import { repo } from '../data/repo';
import { EKIP } from '../data/seed';
import type { Altyapi } from '../data/types';
import { durumGrup } from '../lib/rules';
import { choiceLabel, fmtDate } from '../lib/format';
import { Async, Avatar, Chips, Empty, Kpi, PageHead } from '../ui/kit';
import { AltyapiKart, takipteMi, ustlen } from './altyapiShared';

type Kirilim = 'yeni' | 'mevcut' | 'onayli' | 'red';
type Kaynak = 'tumu' | 'VVIP' | 'Toptan';
const KISILER = EKIP.filter((e) => e.rol === 'Ekip Üyesi').map((e) => e.ad);

export default function Masa(_p: { route: Route }) {
  const { kullanici, showToast } = useApp();
  const q = useTable('altyapi');
  const [kisi, setKisi] = useState(KISILER.includes(kullanici) ? kullanici : KISILER[0]);
  const [k, setK] = useState<Kirilim>('yeni');
  const [kaynak, setKaynak] = useState<Kaynak>('tumu');

  return (
    <Async q={q}>
      {(rows) => {
        const kf = rows.filter((r) => kaynak === 'tumu' || r.Kaynak === kaynak);
        const grup: Record<Kirilim, Altyapi[]> = {
          yeni: kf.filter((r) => !r.Takipci && takipteMi(r)),
          mevcut: kf.filter((r) => r.Takipci === kisi && takipteMi(r)),
          onayli: kf.filter((r) => r.Takipci === kisi && durumGrup(r.OnayRed) === 'onay'),
          red: kf.filter((r) => r.Takipci === kisi && durumGrup(r.OnayRed) === 'red'),
        };
        const liste = grup[k];
        return (
          <div className="stack">
            <PageHead title="Altyapı Masası" sub="Kişi bazlı takip · VVIP talepler tamamlanana kadar takipte kalır" />
            <div className="chips" aria-label="Kişi">
              {KISILER.map((p) => (
                <button key={p} className={`chip person-chip${p === kisi ? ' on' : ''}`} onClick={() => setKisi(p)}>
                  <Avatar name={p} size={28} />{p === kullanici ? `${p} (ben)` : p}
                </button>
              ))}
            </div>
            <div className="kpis">
              <Kpi v={grup.yeni.length} l="Yeni (atanmamış)" on={k === 'yeni'} onClick={() => setK('yeni')} />
              <Kpi v={grup.mevcut.length} l={`${kisi} · mevcut`} on={k === 'mevcut'} onClick={() => setK('mevcut')} />
              <Kpi v={grup.onayli.length} l="Onaylı" on={k === 'onayli'} onClick={() => setK('onayli')} tone="st-onay" />
              <Kpi v={grup.red.length} l="Reddedilen" on={k === 'red'} onClick={() => setK('red')} tone="st-red" />
            </div>
            <Chips<Kaynak> value={kaynak} onChange={setKaynak} label="Kaynak" items={[
              { id: 'tumu', label: 'Tümü', n: rows.length }, { id: 'VVIP', label: 'VVIP', n: rows.filter((r) => r.Kaynak === 'VVIP').length },
              { id: 'Toptan', label: 'Toptan', n: rows.filter((r) => r.Kaynak === 'Toptan').length },
            ]} />
            {liste.length === 0 ? <Empty icon="🧑‍💼" title="Bu kırılımda talep yok" /> : (
              <div className="list">
                {liste.map((r) => (
                  <div key={r.ID} className="stack" style={{ gap: 6 }}>
                    <AltyapiKart r={r} onClick={() => nav(`/altyapi/${r.ID}`)} />
                    <div className="row wrap" style={{ gap: 6, paddingLeft: 6 }}>
                      {k === 'yeni' && (
                        <button className="btn small" onClick={async () => { await ustlen(r, kullanici); showToast(`${kullanici} üstlendi`); }}>Üstlen</button>
                      )}
                      {r.Kaynak === 'Toptan' && (
                        <label className="chip" style={{ minHeight: 36 }}>
                          <input type="checkbox" checked={r.ToptanaBildirildi} onChange={async (e) => { await repo.update('altyapi', r.ID, { ToptanaBildirildi: e.target.checked }); }} />
                          Toptan'a bildirildi
                        </label>
                      )}
                      {r.Kaynak === 'VVIP' && durumGrup(r.OnayRed) === 'onay' && (
                        <span className="tiny muted">İmalat: {choiceLabel(r.ProjeDurumKodu)} · tahmini {fmtDate(r.TahminiTamamlanma)}</span>
                      )}
                      {r.Kaynak === 'Toptan' && durumGrup(r.OnayRed) === 'onay' && <span className="tiny muted">Toptan — imalat takip edilmez</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </Async>
  );
}
