import { useState } from 'react';
import type { Route } from '../router';
import { useApp } from '../store';
import { repo } from '../data/repo';
import { SLAYTLAR, type SlaytId } from '../lib/raporVeri';
import { Field, PageHead, indir } from '../ui/kit';
import { trNorm } from '../lib/format';

export default function Studyo(_p: { route: Route }) {
  const showToast = useApp((s) => s.showToast);
  const [baslik, setBaslik] = useState('Haftalık VIP Operasyon Özeti');
  const [secili, setSecili] = useState<Set<SlaytId>>(new Set(SLAYTLAR.map((s) => s.id)));
  const [durum, setDurum] = useState<'hazir' | 'uretiliyor' | 'hata'>('hazir');
  const [hata, setHata] = useState('');
  return (
    <div className="stack">
      <PageHead title="Rapor stüdyosu" sub="Seçtiğiniz slaytlarla demo verisinden PowerPoint (.pptx) üretir — dosya cihazda oluşur." />
      <Field label="Sunum başlığı"><input className="input" value={baslik} onChange={(e) => setBaslik(e.target.value)} /></Field>
      <div className="card stack" style={{ gap: 4 }}>
        <div className="section-title" style={{ margin: 0 }}>Slaytlar ({secili.size})</div>
        {SLAYTLAR.map((s) => (
          <label key={s.id} className="toggle" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={secili.has(s.id)} onChange={() => setSecili((x) => { const n = new Set(x); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} />
            {s.ad}
          </label>
        ))}
      </div>
      {durum === 'hata' && <div className="banner danger"><span>⚠️</span><div>Sunum üretilemedi: {hata}</div></div>}
      <button className="btn block" disabled={!secili.size || durum === 'uretiliyor'} onClick={async () => {
        setDurum('uretiliyor');
        try {
          const { sunumUret } = await import('../lib/pptx');
          const veri = { altyapi: await repo.list('altyapi'), taahhut: await repo.list('taahhut'), vip: await repo.list('vip_talep'), butce: await repo.list('ohe_butce'), harcama: await repo.list('ohe_harcama') };
          const sira = SLAYTLAR.map((s) => s.id).filter((id) => secili.has(id));
          indir(await sunumUret(baslik, sira, veri), `${trNorm(baslik).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sunum'}.pptx`);
          await repo.create('rapor', { Title: baslik, RaporAdi: baslik, Kategori: '4. Özel Analiz', AyYil: new Date().toISOString().slice(0, 10), DosyaTuru: '2. PPTX' });
          setDurum('hazir');
          showToast('Sunum indirildi ve rapor arşivine eklendi');
        } catch (e) { setHata(e instanceof Error ? e.message : String(e)); setDurum('hata'); }
      }}>{durum === 'uretiliyor' ? 'Hazırlanıyor…' : 'PowerPoint oluştur'}</button>
    </div>
  );
}
