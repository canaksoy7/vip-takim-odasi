import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { ILLER, ilceler, mesaiDisiMi, tahminEt, yerBul, YOL_KATSAYISI, ORT_HIZ_KMS } from '../lib/geo';
import { Field, PageHead, Pill } from '../ui/kit';

const yerel = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function OheYon(_p: { route: Route }) {
  const [il, setIl] = useState('Muğla');
  const [ilce, setIlce] = useState('Marmaris');
  const [zaman, setZaman] = useState(yerel(new Date()));
  const hedef = yerBul(il, ilce);
  const sonuc = useMemo(() => (hedef ? tahminEt(hedef) : []), [hedef]);
  const mesaiDisi = mesaiDisiMi(new Date(zaman));
  const en = sonuc[0];
  return (
    <div className="stack">
      <PageHead title="ÖHE yönlendirme" sub="En yakın ÖHE ekibi ve tahmini ulaşım aralığı (harici harita servisi kullanılmaz)" />
      <div className="card stack">
        <div className="grid2">
          <Field label="Hedef il"><select className="input" value={il} onChange={(e) => { setIl(e.target.value); setIlce(ilceler(e.target.value)[0]); }}>{ILLER.map((i) => <option key={i}>{i}</option>)}</select></Field>
          <Field label="İlçe"><select className="input" value={ilce} onChange={(e) => setIlce(e.target.value)}>{ilceler(il).map((i) => <option key={i}>{i}</option>)}</select></Field>
        </div>
        <Field label="Talep zamanı"><input className="input" type="datetime-local" value={zaman} onChange={(e) => setZaman(e.target.value)} /></Field>
      </div>
      {mesaiDisi && <div className="banner warn"><span>🌙</span><div><b>Mesai dışı talep.</b> Yönlendirmeden önce ÖHE ile teyitleşin (mesai: hafta içi 08:30–17:30).</div></div>}
      {en && (
        <div className="card stack" style={{ background: 'var(--navy)', color: '#fff', borderColor: 'transparent' }}>
          <div className="small" style={{ opacity: 0.8 }}>Önerilen ekip</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{en.ekip.ad}</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{en.aralik}</div>
          <div className="small" style={{ opacity: 0.85 }}>{en.ekip.ilce} / {en.ekip.il} → {ilce} / {il} · yaklaşık {Math.round(en.yolKm)} km yol</div>
          {en.ucakOnerisi && <div className="small"><b>✈️ Karayolu çok uzun; uçakla ulaşım değerlendirilmeli.</b></div>}
        </div>
      )}
      <div className="section-title">Tüm ekipler</div>
      <div className="list">
        {sonuc.map((t, i) => (
          <div key={t.ekip.ad} className="card row" style={{ padding: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}><div className="bold">{t.ekip.ad}</div><div className="tiny muted">{t.ekip.ilce} / {t.ekip.il} · kuş uçuşu {Math.round(t.kusUcusuKm)} km</div></div>
            {i === 0 ? <Pill tone="onay">{t.aralik}</Pill> : <span className="small bold">{t.aralik}</span>}
          </div>
        ))}
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Hesap: kuş uçuşu × {YOL_KATSAYISI.toLocaleString('tr-TR')} yol katsayısı ÷ {ORT_HIZ_KMS} km/sa + hazırlık. Sonuç net süre değil, aralıktır; trafik ve hava koşulları dahil değildir.</p>
    </div>
  );
}
