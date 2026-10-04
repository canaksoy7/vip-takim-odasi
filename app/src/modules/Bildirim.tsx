import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useTable } from '../data/hooks';
import { repo } from '../data/repo';
import { fmtDateTime } from '../lib/format';
import { Async, Chips, Empty, PageHead, Pill } from '../ui/kit';

const OHE_MODUL = ['ohe', 'kades', 'ohe-yon'];

export default function Bildirim(_p: { route: Route }) {
  const rol = useApp((s) => s.rol);
  const q = useTable('bildirim');
  const [f, setF] = useState<'okunmamis' | 'tumu'>('okunmamis');
  const [acik, setAcik] = useState<number | null>(null);
  return (
    <Async q={q}>
      {(all) => {
        const rows = all.filter((b) => rol !== 'ÖHE Ekibi' || OHE_MODUL.includes(b.KaynakModul)).sort((a, b) => b.ID - a.ID);
        const liste = rows.filter((b) => f === 'tumu' || !b.Okundu);
        return (
          <div className="stack">
            <PageHead title="Bildirim kutusu" sub="Gerçek e-posta gönderilmez; gönderilecek mailler burada önizlenir."
              right={<button className="btn ghost small" disabled={!rows.some((b) => !b.Okundu)} onClick={async () => { for (const b of rows.filter((x) => !x.Okundu)) await repo.update('bildirim', b.ID, { Okundu: true }); }}>Tümünü okundu say</button>} />
            <Chips value={f} onChange={setF} label="Filtre" items={[{ id: 'okunmamis', label: 'Okunmamış', n: rows.filter((b) => !b.Okundu).length }, { id: 'tumu', label: 'Tümü', n: rows.length }]} />
            {liste.length === 0 ? <Empty icon="📭" title="Bildirim yok" text="Yeni mail önizlemeleri burada görünür." /> : (
              <div className="list">
                {liste.map((b) => (
                  <div key={b.ID} className="card" style={{ padding: 12, borderLeft: b.Okundu ? undefined : '4px solid var(--accent)' }}>
                    <button style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }} aria-expanded={acik === b.ID} onClick={async () => {
                      setAcik(acik === b.ID ? null : b.ID);
                      if (!b.Okundu) await repo.update('bildirim', b.ID, { Okundu: true });
                    }}>
                      <div className="row tiny"><Pill tone="ust" plain>{b.Tur}</Pill><span className="muted">Alıcı: {b.AliciRolu}</span><span className="spacer" /><span className="muted">{fmtDateTime(b.Created)}</span></div>
                      <div className={b.Okundu ? '' : 'bold'} style={{ marginTop: 4 }}>{b.Title}</div>
                      {acik !== b.ID && <div className="small muted ellipsis">{b.Govde.split('\n')[0]}</div>}
                    </button>
                    {acik === b.ID && (
                      <div className="stack" style={{ marginTop: 8 }}>
                        <div className="mail">{`Konu: ${b.Title}\nAlıcı rolü: ${b.AliciRolu}\n\n${b.Govde}`}</div>
                        {b.KaynakID && <button className="btn ghost small" onClick={() => nav(`/${b.KaynakModul}${['ohe'].includes(b.KaynakModul) ? '?sekme=gundem' : `/${b.KaynakID}`}`)}>Kayda git</button>}
                      </div>
                    )}
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
