import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { DUYURU_KAYNAK } from '../data/types';
import { choiceLabel, fmtDate } from '../lib/format';
import { Async, Chips, PageHead, Pill, Tabs } from '../ui/kit';

interface Dugum { soru?: string; secenek?: { etiket: string; git: string }[]; sonuc?: string; ton?: 'onay' | 'bekle' | 'red'; link?: { etiket: string; yol: string } }
interface Agac { id: string; ad: string; ikon: string; dugumler: Record<string, Dugum> }

/** Örnek karar ağaçları (demo içerik). */
export const AGACLAR: Agac[] = [
  {
    id: 'roaming', ad: 'Yurtdışında hat çalışmıyor', ikon: '✈️', dugumler: {
      bas: { soru: 'Hatta roaming (yurtdışı kullanım) yetkisi açık mı?', secenek: [{ etiket: 'Evet', git: 'fatura' }, { etiket: 'Hayır', git: 'ac' }, { etiket: 'Bilmiyorum', git: 'kontrol' }] },
      kontrol: { sonuc: 'Müşteri profilinden roaming yetkisini kontrol edin, ardından bu akışa geri dönün.', ton: 'bekle' },
      ac: { sonuc: 'Roaming yetkisini açın. 15 dakika sonra cihazın yeniden başlatılmasını isteyin. Açılamıyorsa Mobil departmanına yönlendirin.', ton: 'onay', link: { etiket: 'Rehberde "roaming"', yol: '/rehber?q=roaming' } },
      fatura: { soru: 'Fatura sınırı aşıldı mı?', secenek: [{ etiket: 'Evet', git: 'sinir' }, { etiket: 'Hayır', git: 'operator' }] },
      sinir: { sonuc: 'Kısıt fatura sınırından kaynaklanıyor. Tümleşik Yönetim Sistemleri (fatura) ile teyit edin, müşteriye bilgi verin.', ton: 'bekle', link: { etiket: 'Rehberde "fatura"', yol: '/rehber?q=fatura' } },
      operator: { soru: 'Sorun tek bir yerel operatörde mi?', secenek: [{ etiket: 'Evet', git: 'manuel' }, { etiket: 'Hayır / tüm operatörlerde', git: 'eskalasyon' }] },
      manuel: { sonuc: 'Cihazda manuel şebeke seçimi yaptırın; başka operatöre geçmesini isteyin.', ton: 'onay' },
      eskalasyon: { sonuc: 'Eskalasyon gerekli: Mobil departmanına iletin ve VIP Talep Takip\'e kayıt açın.', ton: 'red', link: { etiket: 'VIP Talep Takip', yol: '/vip-talep' } },
    },
  },
  {
    id: 'hiz', ad: 'VIP müşteri hız şikâyeti', ikon: '🐢', dugumler: {
      bas: { soru: 'Müşterinin altyapısı nedir?', secenek: [{ etiket: 'Fiber', git: 'profil' }, { etiket: 'Bakır / VDSL', git: 'bakir' }, { etiket: 'Altyapı yok', git: 'yok' }] },
      profil: { soru: 'Tanımlı hız profili, müşterinin paketiyle uyumlu mu?', secenek: [{ etiket: 'Evet', git: 'ariza' }, { etiket: 'Hayır', git: 'profilduzelt' }] },
      profilduzelt: { sonuc: 'Hız profili güncelleme talebini Bireysel Sabit ekibine iletin.', ton: 'onay', link: { etiket: 'Rehberde "hız"', yol: '/rehber?q=hiz' } },
      ariza: { sonuc: 'Arıza kaydı açın; 24 saat içinde dönüş yoksa VIP Talep Takip\'te takibe alın.', ton: 'bekle', link: { etiket: 'VIP Talep Takip', yol: '/vip-talep' } },
      bakir: { sonuc: 'Fiber dönüşüm (BF) değerlendirmesi için bölgeden maliyet isteyin ve künyeyi hazırlayın.', ton: 'bekle', link: { etiket: 'Talep Metni Oluşturucu', yol: '/talep-metni' } },
      yok: { sonuc: 'Yeni altyapı (GF) talebi açın. HP başı maliyet 5,5 K TL üzerindeyse ticari olarak uygun görülmeyebilir.', ton: 'red', link: { etiket: 'Yeni altyapı talebi', yol: '/altyapi/yeni' } },
    },
  },
  {
    id: 'taahhut', ad: 'Taahhüt bitişi yaklaşan VVIP', ikon: '🔄', dugumler: {
      bas: { soru: 'Taahhüt bitişine kaç gün kaldı?', secenek: [{ etiket: '30 gün veya daha az', git: 'yakin' }, { etiket: '30 günden fazla', git: 'erken' }, { etiket: 'Süre geçti', git: 'gecti' }] },
      erken: { sonuc: 'Henüz erken. Alarm 30 / 15 / 7 gün kala otomatik düşecek.', ton: 'onay', link: { etiket: 'Taahhütler', yol: '/taahhut' } },
      gecti: { sonuc: 'Taahhüt bitmiş; müşteri taahhütsüz fiyata geçmiş olabilir. Hemen arayın ve yenileme teklifini yöneticiye sunun.', ton: 'red', link: { etiket: 'Ek indirim hesapla', yol: '/indirim' } },
      yakin: { soru: 'Hedef ücrete inmek için gereken ek indirim yetki sınırınız içinde mi?', secenek: [{ etiket: 'Evet', git: 'yetki' }, { etiket: 'Hayır', git: 'onay' }, { etiket: 'Hesaplamadım', git: 'hesapla' }] },
      hesapla: { sonuc: 'Önce Ek İndirim Hesaplama ekranında ürün bazlı ek indirimi hesaplayın.', ton: 'bekle', link: { etiket: 'Ek indirim hesapla', yol: '/indirim' } },
      yetki: { sonuc: 'Yenilemeyi yapın; aynı numarada çakışan taahhüt açılmadığını kontrol edin.', ton: 'onay', link: { etiket: 'Çakışanları gör', yol: '/taahhut' } },
      onay: { sonuc: 'Teklifi gerekçesiyle Yönetici onayına sunun.', ton: 'bekle' },
    },
  },
];

export default function Pusula(_p: { route: Route }) {
  const [sekme, setSekme] = useState<'agac' | 'duyuru'>('agac');
  return (
    <div className="stack">
      <PageHead title="Pusula motoru" sub="Adım adım karar ağaçları ve güncel duyurular" />
      <Tabs value={sekme} onChange={setSekme} items={[{ id: 'agac', label: 'Karar ağaçları' }, { id: 'duyuru', label: 'Duyurular' }]} />
      {sekme === 'agac' ? <Agaclar /> : <Duyurular />}
    </div>
  );
}

function Agaclar() {
  const [agacId, setAgacId] = useState<string | null>(null);
  const [yol, setYol] = useState<{ id: string; etiket?: string }[]>([{ id: 'bas' }]);
  const notlar = useData(() => repo.list('pusula'), ['pusula']);
  const agac = AGACLAR.find((a) => a.id === agacId);
  if (!agac) {
    return (
      <>
        <div className="list">
          {AGACLAR.map((a) => (
            <button key={a.id} className="card tap row" style={{ padding: 14 }} onClick={() => { setAgacId(a.id); setYol([{ id: 'bas' }]); }}>
              <span style={{ fontSize: 26 }}>{a.ikon}</span><span className="bold" style={{ flex: 1 }}>{a.ad}</span><span className="muted">›</span>
            </button>
          ))}
        </div>
        <div className="section-title">Pusula notları</div>
        <Async q={notlar}>{(rows) => <div className="list">{rows.map((n) => <div key={n.ID} className="card small"><b>{n.Kategori}:</b> {n.Icerik}</div>)}</div>}</Async>
      </>
    );
  }
  const son = yol[yol.length - 1];
  const d = agac.dugumler[son.id];
  return (
    <div className="stack">
      <div className="row"><b style={{ flex: 1 }}>{agac.ikon} {agac.ad}</b><button className="btn ghost small" onClick={() => setAgacId(null)}>Konular</button></div>
      <ol className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
        {yol.slice(0, -1).map((y, i) => <li key={i}>{agac.dugumler[y.id].soru} → <b>{yol[i + 1].etiket}</b></li>)}
      </ol>
      {d.soru ? (
        <div className="card stack">
          <div className="bold" style={{ fontSize: 17 }}>{d.soru}</div>
          {d.secenek!.map((s) => <button key={s.git} className="btn ghost block tree-opt" onClick={() => setYol([...yol, { id: s.git, etiket: s.etiket }])}>{s.etiket}</button>)}
        </div>
      ) : (
        <div className={`banner ${d.ton === 'onay' ? 'ok' : d.ton === 'red' ? 'danger' : 'warn'}`} style={{ flexDirection: 'column' }}>
          <b>Öneri</b><div>{d.sonuc}</div>
          {d.link && <button className="btn small" onClick={() => nav(d.link!.yol)}>{d.link.etiket} →</button>}
        </div>
      )}
      <div className="btn-bar">
        <button className="btn ghost" disabled={yol.length < 2} onClick={() => setYol(yol.slice(0, -1))}>Bir adım geri</button>
        <button className="btn ghost" onClick={() => setYol([{ id: 'bas' }])}>Baştan başla</button>
      </div>
    </div>
  );
}

function Duyurular() {
  const q = useData(() => repo.list('duyuru'), ['duyuru']);
  const [k, setK] = useState('tumu');
  return (
    <Async q={q}>
      {(rows) => (
        <>
          <Chips value={k} onChange={setK} label="Kaynak" items={[{ id: 'tumu', label: 'Tümü' }, ...DUYURU_KAYNAK.map((x) => ({ id: x, label: choiceLabel(x), n: rows.filter((r) => r.Kaynak === x).length }))]} />
          <div className="list">
            {rows.filter((r) => k === 'tumu' || r.Kaynak === k).sort((a, b) => b.YayinTarihi.localeCompare(a.YayinTarihi)).map((r) => (
              <div key={r.ID} className="card stack" style={{ gap: 4, padding: 12, opacity: r.Durum === '3. Arşiv' ? 0.6 : 1 }}>
                <div className="row"><Pill tone="ust" plain>{choiceLabel(r.Kaynak)}</Pill><span className="tiny muted">{r.Segment}</span><span className="spacer" /><span className="tiny muted">{fmtDate(r.YayinTarihi)}</span></div>
                <div className="bold">{r.Title}</div>
                <div className="small muted">{r.Ozet}</div>
                <div className="tiny faint">{r.Gonderen} · {choiceLabel(r.Durum)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Async>
  );
}
