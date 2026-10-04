import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { repo } from '../data/repo';
import { ORNEK_METINLER, parseTalep, uretTalepMetni } from '../lib/talepMetni';
import { Field, Kv, PageHead } from '../ui/kit';

export default function TalepMetni(_p: { route: Route }) {
  const showToast = useApp((s) => s.showToast);
  const [metin, setMetin] = useState('');
  const bilgi = useMemo(() => parseTalep(metin), [metin]);
  const cikti = useMemo(() => uretTalepMetni(bilgi), [bilgi]);
  const dolu = metin.trim().length > 0;

  const kopyala = async (t: string) => {
    try { await navigator.clipboard.writeText(t); showToast('Kopyalandı'); } catch { showToast('Kopyalanamadı — metni seçip kopyalayın'); }
  };
  const tamMetin = `${cikti.anlatim}\n\nProje Bilgileri\n${cikti.kunye.map(([k, v]) => `${k}: ${v}`).join('\n')}`;

  return (
    <div className="stack">
      <PageHead title="Talep metni oluşturucu" sub="Yapay zekâ kullanmaz; kural tabanlı ayrıştırma. Bölgeden gelen mail ya da tabloyu yapıştırın." />
      <div className="chips" aria-label="Örnek metinler">
        {ORNEK_METINLER.map((o, i) => <button key={i} className="chip" onClick={() => setMetin(o.metin)}>Örnek {i + 1} · {o.ad}</button>)}
      </div>
      <Field label="Bölge metni">
        <textarea className="input" style={{ minHeight: 170, fontFamily: 'ui-monospace, monospace', fontSize: 14 }} value={metin}
          onChange={(e) => setMetin(e.target.value)} placeholder={'Proje ID: 900123\nHP: 42\nToplam Maliyet: 312.400 TL\n…'} />
      </Field>
      {dolu && (
        <>
          {cikti.gerekce && (
            <div className={`banner ${(bilgi.hpBasi ?? 0) > 5500 ? 'danger' : 'warn'}`}>
              <span>⚖️</span><div><b>Gerekçe:</b> {cikti.gerekce}. <span className="tiny">(Eşik: HP başı 5,5 K TL)</span></div>
            </div>
          )}
          <section className="card stack">
            <div className="row"><div className="section-title" style={{ margin: 0 }}>Anlatım</div><span className="spacer" /><button className="btn ghost small" onClick={() => kopyala(cikti.anlatim)}>Kopyala</button></div>
            <p style={{ margin: 0 }}>{cikti.anlatim}</p>
          </section>
          <section className="card stack">
            <div className="row"><div className="section-title" style={{ margin: 0 }}>Proje bilgileri (künye)</div><span className="spacer" /><button className="btn ghost small" onClick={() => kopyala(tamMetin)}>Tümünü kopyala</button></div>
            <Kv rows={cikti.kunye} />
            {cikti.eksikler.length > 0 && <p className="tiny muted" style={{ margin: 0 }}>Metinde bulunamayan: {cikti.eksikler.join(', ')}</p>}
          </section>
          <button className="btn block" onClick={async () => {
            const hp = bilgi.hp ?? 0, toplam = bilgi.toplam ?? 0, abone = bilgi.abone ?? 0;
            const r = await repo.create('altyapi', {
              Title: bilgi.talep ?? 'Yapıştırılan talep', TalepSahibi: bilgi.talep ?? '', ProjeID: Number(bilgi.projeId) || 0, Sehira: bilgi.il ?? '', Ilce: bilgi.ilce ?? '',
              Adres: bilgi.adres ?? '', AnaKategori: '2. Altyapı', Kaynak: 'VVIP', Takipci: '', HP: hp, CalisanDSL: bilgi.dsl ?? 0,
              MevcutAltyapi: bilgi.altyapi ?? (bilgi.projeTuru === 'GF' ? 'Yok' : ''), MevcutHiz: bilgi.hiz ?? '', FiberMesafesi: bilgi.fiberM ?? 0,
              MaliyetTutari: toplam, MaliyetSayisal: toplam, HPBasiMaliyet: Math.round(bilgi.hpBasi ?? 0), AboneBasiMaliyet: Math.round(bilgi.aboneBasi ?? 0),
              AboneOngoru: abone, Penetrasyon: hp && abone ? Math.round((abone / hp) * 100) : 0, ProjeTuru: bilgi.projeTuru ?? 'BF',
              ButceTuru: '3. Beklemede', ProjeDurumKodu: '5. Bölge', OnayRed: '3. Beklemede', Asama: 'Künye oluşturucudan aktarıldı',
              Aciklama: cikti.anlatim, MaliyetNotu: '', ToptanaBildirildi: false, SunulmaTarihi: null, KararTarihi: null, ImalatBaslangic: null, TahminiTamamlanma: null, TamamlanmaTarihi: null,
            });
            showToast('Altyapı talebi oluşturuldu');
            nav(`/altyapi/${r.ID}`);
          }}>Bu künyeyle altyapı talebi oluştur</button>
        </>
      )}
      <details className="card">
        <summary className="bold" style={{ cursor: 'pointer' }}>Kurallar</summary>
        <ul className="small" style={{ paddingLeft: 18 }}>
          <li>HP başı maliyet 5,5 K TL üzerindeyse: "HP başı maliyet sebebiyle ticari olarak uygun değildir"; değilse "bölge bütçesi bulunmadığı için uygun görülmemiştir".</li>
          <li>Tutarlar K / M biçiminde: 87,2 K TL · 1,6 M TL.</li>
          <li>Fiber mesafesi 999 m'ye kadar "mt.", üstü "km.".</li>
          <li>Mevcut hız sayı + Mbps.</li>
          <li>Proje türü yalnızca BF ya da GF; "Alan Bazlı" çalışan DSL/mevcut altyapıya göre çevrilir. GF metninde "altyapımız bulunmamaktadır" yazılmaz.</li>
        </ul>
      </details>
    </div>
  );
}
