import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useData, useTable } from '../data/hooks';
import { repo } from '../data/repo';
import { EKIP } from '../data/seed';
import { ANA_KATEGORI, BUTCE_TURU, PROJE_DURUM, type Altyapi as A } from '../data/types';
import { bildirEksikBilgi } from '../data/notify';
import { choiceLabel, fmtDate, fmtHiz, fmtKM, fmtMesafe, trNorm } from '../lib/format';
import { GECIKEN_ESIK, beklemeGunu, durumGrup, normalizeProjeTuru, sonrakiDurumlar } from '../lib/rules';
import { yatirimMetni, raporBasligi } from '../lib/altyapiMetin';
import { ILLER, ilceler } from '../lib/geo';
import { Async, Chips, Empty, Field, Kv, PageHead, Sheet, Tabs, indir } from '../ui/kit';
import { GecmisListe } from '../ui/Gecmis';
import { AltyapiKart, DurumPill, GecikmeRozet, kararVer, ustYonetimeSun } from './altyapiShared';

type Filtre = 'tumu' | 'beklemede' | 'ust' | 'onay' | 'red' | 'geciken';
const TAKIPCILER = EKIP.filter((e) => e.rol !== 'ÖHE Ekibi').map((e) => e.ad);

export default function Altyapi({ route }: { route: Route }) {
  const id = route.path[1];
  if (id === 'yeni') return <AltyapiForm />;
  if (id) return <AltyapiDetay id={Number(id)} duzenle={route.query.get('duzenle') === '1'} />;
  return <AltyapiListe />;
}

function AltyapiListe() {
  const q = useTable('altyapi');
  const showToast = useApp((s) => s.showToast);
  const [f, setF] = useState<Filtre>('tumu');
  const [ara, setAra] = useState('');
  const [sirala, setSirala] = useState<'yeni' | 'bekleme'>('bekleme');
  const [ekFiltre, setEkFiltre] = useState({ butce: '', kategori: '', takipci: '', durum: '', kaynak: '' });
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [secim, setSecim] = useState<Set<number>>(new Set());
  const [secMod, setSecMod] = useState(false);
  const [uretiliyor, setUretiliyor] = useState(false);

  return (
    <Async q={q}>
      {(rows) => {
        const ekSay = Object.values(ekFiltre).filter(Boolean).length;
        const temel = rows.filter((r) =>
          (!ekFiltre.butce || r.ButceTuru === ekFiltre.butce) && (!ekFiltre.kategori || r.AnaKategori === ekFiltre.kategori) &&
          (!ekFiltre.takipci || (ekFiltre.takipci === '-' ? !r.Takipci : r.Takipci === ekFiltre.takipci)) &&
          (!ekFiltre.durum || r.ProjeDurumKodu === ekFiltre.durum) && (!ekFiltre.kaynak || r.Kaynak === ekFiltre.kaynak) &&
          (!ara || trNorm(`${r.ProjeID} ${r.Title} ${r.Sehira} ${r.Ilce} ${r.Takipci}`).includes(trNorm(ara))));
        const say = (ff: Filtre) => temel.filter((r) => uyar(r, ff)).length;
        const liste = temel.filter((r) => uyar(r, f)).sort((a, b) =>
          sirala === 'bekleme' ? (beklemeGunu(b) ?? -1) - (beklemeGunu(a) ?? -1) || b.ID - a.ID : b.Created.localeCompare(a.Created));
        const secili = rows.filter((r) => secim.has(r.ID));
        return (
          <div className="stack">
            <PageHead title="Altyapı talepleri" sub={`${rows.length} kayıt · Beklemede → Üst yönetim → Onay/Red`}
              right={<button className="btn small" onClick={() => nav('/altyapi/yeni')}>+ Yeni</button>} />
            <Chips<Filtre> label="Durum filtresi" value={f} onChange={setF} items={[
              { id: 'tumu', label: 'Tümü', n: say('tumu') }, { id: 'beklemede', label: 'Beklemede', n: say('beklemede') },
              { id: 'ust', label: 'Üst yönetimde', n: say('ust') }, { id: 'onay', label: 'Onay', n: say('onay') },
              { id: 'red', label: 'Red', n: say('red') }, { id: 'geciken', label: `Geciken (${GECIKEN_ESIK}+ gün)`, n: say('geciken') },
            ]} />
            <div className="row">
              <input className="input" type="search" placeholder="Proje ID, ad, şehir, takipçi…" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Listede ara" />
            </div>
            <div className="row wrap">
              <button className="btn ghost small" onClick={() => setFiltreAcik(true)}>Filtreler{ekSay ? ` (${ekSay})` : ''}</button>
              <select className="input" style={{ width: 'auto', minHeight: 38, fontSize: 14 }} value={sirala} onChange={(e) => setSirala(e.target.value as 'yeni' | 'bekleme')} aria-label="Sıralama">
                <option value="bekleme">Bekleme süresine göre</option>
                <option value="yeni">En yeni önce</option>
              </select>
              <span className="spacer" />
              <button className={`btn small ${secMod ? '' : 'ghost'}`} onClick={() => { setSecMod(!secMod); setSecim(new Set()); }}>{secMod ? 'Seçimi kapat' : 'Word raporu'}</button>
            </div>
            {secMod && (
              <div className="banner info">
                <span>📄</span>
                <div style={{ flex: 1 }}>Rapora eklenecek kayıtları işaretleyin. <b>{secim.size}</b> seçili.</div>
              </div>
            )}
            {liste.length === 0 ? <Empty icon="🏗️" title="Bu filtrede kayıt yok" text="Filtreleri temizlemeyi deneyin." /> : (
              <div className="list">
                {liste.map((r) => (
                  <AltyapiKart key={r.ID} r={r} onClick={() => nav(`/altyapi/${r.ID}`)} secili={secim.has(r.ID)}
                    onSec={secMod ? () => setSecim((s) => { const n = new Set(s); if (n.has(r.ID)) n.delete(r.ID); else n.add(r.ID); return n; }) : undefined} />
                ))}
              </div>
            )}
            {secMod && secim.size > 0 && (
              <div className="sticky-actions">
                <button className="btn" disabled={uretiliyor} onClick={async () => {
                  setUretiliyor(true);
                  try {
                    const { yatirimRaporu } = await import('../lib/word');
                    indir(await yatirimRaporu(secili), `VIP-Yatirim-Degerlendirmesi-${secili.length}.docx`);
                    showToast('Word raporu indirildi');
                  } finally { setUretiliyor(false); }
                }}>{uretiliyor ? 'Hazırlanıyor…' : `Word raporu oluştur (${secim.size})`}</button>
              </div>
            )}
            <Sheet open={filtreAcik} onClose={() => setFiltreAcik(false)} title="Filtreler">
              <div className="stack">
                <Field label="Bütçe"><select className="input" value={ekFiltre.butce} onChange={(e) => setEkFiltre({ ...ekFiltre, butce: e.target.value })}><option value="">Tümü</option>{BUTCE_TURU.map((b) => <option key={b} value={b}>{choiceLabel(b)}</option>)}</select></Field>
                <Field label="Kategori"><select className="input" value={ekFiltre.kategori} onChange={(e) => setEkFiltre({ ...ekFiltre, kategori: e.target.value })}><option value="">Tümü</option>{ANA_KATEGORI.map((b) => <option key={b} value={b}>{choiceLabel(b)}</option>)}</select></Field>
                <Field label="Takipçi"><select className="input" value={ekFiltre.takipci} onChange={(e) => setEkFiltre({ ...ekFiltre, takipci: e.target.value })}><option value="">Tümü</option><option value="-">Atanmamış</option>{TAKIPCILER.map((b) => <option key={b}>{b}</option>)}</select></Field>
                <Field label="Proje durumu"><select className="input" value={ekFiltre.durum} onChange={(e) => setEkFiltre({ ...ekFiltre, durum: e.target.value })}><option value="">Tümü</option>{PROJE_DURUM.map((b) => <option key={b} value={b}>{choiceLabel(b)}</option>)}</select></Field>
                <Field label="Kaynak"><select className="input" value={ekFiltre.kaynak} onChange={(e) => setEkFiltre({ ...ekFiltre, kaynak: e.target.value })}><option value="">Tümü</option><option>VVIP</option><option>Toptan</option></select></Field>
                <div className="btn-bar">
                  <button className="btn ghost" onClick={() => setEkFiltre({ butce: '', kategori: '', takipci: '', durum: '', kaynak: '' })}>Temizle</button>
                  <button className="btn" onClick={() => setFiltreAcik(false)}>Uygula</button>
                </div>
              </div>
            </Sheet>
          </div>
        );
      }}
    </Async>
  );
}

function uyar(r: A, f: Filtre) {
  const g = durumGrup(r.OnayRed);
  if (f === 'tumu') return true;
  if (f === 'geciken') return (beklemeGunu(r) ?? 0) >= GECIKEN_ESIK;
  return g === f;
}

function AltyapiDetay({ id, duzenle }: { id: number; duzenle: boolean }) {
  const q = useData(async () => ({ r: await repo.get('altyapi', id), ekler: await repo.query('altyapi_ek', (e) => e.AltyapiID === id) }), ['altyapi', 'altyapi_ek'], [id]);
  const { rol, showToast } = useApp();
  const [sekme, setSekme] = useState<'bilgi' | 'ekler' | 'gecmis'>('bilgi');
  const [karar, setKarar] = useState<null | boolean>(null);
  const [not, setNot] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);
  if (duzenle && q.data?.r) return <AltyapiForm mevcut={q.data.r} />;
  return (
    <Async q={q}>
      {({ r, ekler }) => {
        if (!r) return <Empty icon="🔎" title="Kayıt bulunamadı" />;
        const g = durumGrup(r.OnayRed);
        const sonraki = sonrakiDurumlar(r.OnayRed);
        return (
          <div className="stack">
            <div className="card stack" style={{ gap: 8 }}>
              <div className="row"><span className="tiny bold muted mono">{r.ProjeID}</span><span className="spacer" /><GecikmeRozet r={r} /><DurumPill r={r} /></div>
              <h2 style={{ fontSize: 19 }}>{r.Title}</h2>
              <div className="small muted">{r.Ilce} / {r.Sehira} · {r.ProjeTuru} · {r.Kaynak} · {choiceLabel(r.AnaKategori)}</div>
              <div className="small">👤 {r.Takipci || 'Takipçi atanmamış'}</div>
            </div>
            {mesaj && <div className="banner warn"><span>⚠️</span><div>{mesaj}</div></div>}
            <Tabs value={sekme} onChange={setSekme} items={[{ id: 'bilgi', label: 'Bilgiler' }, { id: 'ekler', label: `Ekler (${ekler.length})` }, { id: 'gecmis', label: 'Geçmiş' }]} />
            {sekme === 'bilgi' && (
              <>
                <div className="card stack">
                  <div className="section-title" style={{ margin: 0 }}>Değerlendirme özeti</div>
                  <p className="small" style={{ margin: 0 }}>{yatirimMetni(r)}</p>
                </div>
                <div className="card stack">
                  <div className="section-title" style={{ margin: 0 }}>Proje bilgileri</div>
                  <Kv rows={[
                    ['Talep sahibi', r.TalepSahibi], ['Adres', r.Adres], ['HP', r.HP.toLocaleString('tr-TR')], ['Çalışan DSL', r.CalisanDSL],
                    ['Mevcut altyapı', r.MevcutAltyapi], ['Mevcut hız', r.MevcutHiz ? fmtHiz(r.MevcutHiz) : ''], ['Fiber mesafesi', fmtMesafe(r.FiberMesafesi)],
                    ['Toplam maliyet', fmtKM(r.MaliyetTutari)], ['HP başı', fmtKM(r.HPBasiMaliyet)], ['Abone başı', fmtKM(r.AboneBasiMaliyet)],
                    ['Abone öngörüsü', r.AboneOngoru], ['Penetrasyon', `%${r.Penetrasyon}`], ['Bütçe', choiceLabel(r.ButceTuru)],
                    ['Proje durumu', choiceLabel(r.ProjeDurumKodu)], ['Aşama', r.Asama], ['Sunulma', fmtDate(r.SunulmaTarihi)], ['Karar', fmtDate(r.KararTarihi)],
                    ...(r.Kaynak === 'VVIP' ? [['İmalat başlangıç', fmtDate(r.ImalatBaslangic)], ['Tahmini tamamlanma', fmtDate(r.TahminiTamamlanma)], ['Tamamlanma', fmtDate(r.TamamlanmaTarihi)]] as [string, string][] : [['Toptan\'a bildirildi', r.ToptanaBildirildi ? 'Evet' : 'Hayır']] as [string, string][]),
                    ['Açıklama', r.Aciklama], ['Maliyet notu', r.MaliyetNotu],
                  ]} />
                </div>
              </>
            )}
            {sekme === 'ekler' && <Ekler altyapi={r} ekler={ekler} />}
            {sekme === 'gecmis' && <GecmisListe liste="VVIP Altyapı Takip" kayitId={r.ID} />}

            <div className="sticky-actions">
              <button className="btn ghost" onClick={() => nav(`/altyapi/${r.ID}?duzenle=1`)}>Düzenle</button>
              {g === 'beklemede' && sonraki.length > 0 && (
                <button className="btn" onClick={async () => { const m = await ustYonetimeSun(r); setMesaj(m); if (!m) showToast('Üst yönetime sunuldu'); }}>Üst yönetime sun</button>
              )}
              {g === 'ust' && rol === 'Yönetici' && (
                <>
                  <button className="btn red" onClick={() => setKarar(false)}>Red</button>
                  <button className="btn green" onClick={() => setKarar(true)}>Onay</button>
                </>
              )}
              {g === 'ust' && rol !== 'Yönetici' && <button className="btn" disabled title="Yalnızca Yönetici">Onay bekleniyor</button>}
              {(g === 'onay' || g === 'red') && (
                <button className="btn" onClick={async () => { const { yatirimRaporu } = await import('../lib/word'); indir(await yatirimRaporu([r]), `${r.ProjeID}.docx`); showToast('Word raporu indirildi'); }}>Word</button>
              )}
            </div>

            <Sheet open={karar !== null} onClose={() => setKarar(null)} title={karar ? 'Talebi onayla' : 'Talebi reddet'}>
              <div className="stack">
                <p className="small" style={{ margin: 0 }}>{raporBasligi(r)}</p>
                <Field label="Not (isteğe bağlı)"><textarea className="input" value={not} onChange={(e) => setNot(e.target.value)} /></Field>
                <button className={`btn block ${karar ? 'green' : 'red'}`} onClick={async () => { await kararVer(r, !!karar, not); setKarar(null); setNot(''); showToast(karar ? 'Onaylandı' : 'Reddedildi'); }}>
                  {karar ? 'Onayla' : 'Reddet'}
                </button>
              </div>
            </Sheet>
          </div>
        );
      }}
    </Async>
  );
}

function Ekler({ altyapi, ekler }: { altyapi: A; ekler: { ID: number; Title: string; MimeType: string; Icerik: string }[] }) {
  const showToast = useApp((s) => s.showToast);
  const src = (e: { MimeType: string; Icerik: string }) => (e.MimeType === 'image/svg+xml' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(e.Icerik)}` : e.Icerik);
  return (
    <div className="stack">
      {ekler.length === 0 && <Empty icon="🗺️" title="Ek yok" text="Harita görseli ya da fotoğraf ekleyebilirsiniz." />}
      {ekler.map((e) => (
        <figure key={e.ID} className="card" style={{ margin: 0 }}>
          <div className="map-thumb"><img src={src(e)} alt={e.Title} /></div>
          <figcaption className="row small" style={{ marginTop: 8 }}>
            <span className="ellipsis">{e.Title}</span><span className="spacer" />
            <button className="btn ghost small" onClick={async () => { await repo.remove('altyapi_ek', e.ID); showToast('Ek silindi'); }}>Sil</button>
          </figcaption>
        </figure>
      ))}
      <label className="btn ghost block" style={{ cursor: 'pointer' }}>
        Görsel ekle (yalnızca cihazda saklanır)
        <input type="file" accept="image/*" hidden onChange={(ev) => {
          const f = ev.target.files?.[0];
          if (!f) return;
          if (f.size > 2_000_000) { showToast('Dosya 2 MB\'tan büyük olamaz'); return; }
          const rd = new FileReader();
          rd.onload = async () => {
            await repo.create('altyapi_ek', { Title: f.name, AltyapiID: altyapi.ID, MimeType: f.type, Icerik: String(rd.result) });
            showToast('Ek eklendi');
          };
          rd.readAsDataURL(f);
        }} />
      </label>
    </div>
  );
}

const BOS: Partial<A> = {
  Title: '', TalepSahibi: '', ProjeID: 0, Sehira: '', Ilce: '', Adres: '', AnaKategori: '2. Altyapı', Kaynak: 'VVIP', Takipci: '',
  HP: 0, CalisanDSL: 0, MevcutAltyapi: '', MevcutHiz: '', FiberMesafesi: 0, MaliyetTutari: 0, AboneOngoru: 0,
  ButceTuru: '3. Beklemede', ProjeDurumKodu: '5. Bölge', Asama: 'Bölgeden maliyet bekleniyor', Aciklama: '', MaliyetNotu: '', ToptanaBildirildi: false,
};

function AltyapiForm({ mevcut }: { mevcut?: A }) {
  const showToast = useApp((s) => s.showToast);
  const [adim, setAdim] = useState(0);
  const [v, setV] = useState<Partial<A>>(mevcut ?? BOS);
  const [turHam, setTurHam] = useState<string>(mevcut?.ProjeTuru ?? 'BF');
  const set = <K extends keyof A>(k: K, val: A[K]) => setV((x) => ({ ...x, [k]: val }));
  const tur = useMemo(() => normalizeProjeTuru(turHam, { CalisanDSL: v.CalisanDSL, MevcutAltyapi: v.MevcutAltyapi }), [turHam, v.CalisanDSL, v.MevcutAltyapi]);
  const num = (k: keyof A) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, (Number(e.target.value) || 0) as never);
  const adimlar = ['Künye', 'Teknik & maliyet', 'Durum & not'];

  async function kaydet() {
    if (!v.Title?.trim()) { setAdim(0); showToast('Talep adı zorunlu'); return; }
    const hp = v.HP || 0, toplam = v.MaliyetTutari || 0, abone = v.AboneOngoru || 0;
    const veri = {
      ...v, ProjeTuru: tur, TalepSahibi: v.TalepSahibi || v.Title, MaliyetSayisal: toplam,
      HPBasiMaliyet: hp ? Math.round(toplam / hp) : 0, AboneBasiMaliyet: abone ? Math.round(toplam / abone) : 0,
      Penetrasyon: hp ? Math.round((abone / hp) * 100) : 0,
    };
    if (mevcut) {
      await repo.update('altyapi', mevcut.ID, veri);
      showToast(turHam !== tur && !['BF', 'GF'].includes(turHam) ? `Kaydedildi · "${turHam}" → ${tur}` : 'Kaydedildi');
      nav(`/altyapi/${mevcut.ID}`);
    } else {
      const yeni = await repo.create('altyapi', {
        ...(BOS as A), ...veri, OnayRed: '3. Beklemede', SunulmaTarihi: null, KararTarihi: null, ImalatBaslangic: null, TahminiTamamlanma: null, TamamlanmaTarihi: null,
      } as Omit<A, 'ID' | 'Created' | 'Modified' | 'Author' | 'Editor'>);
      if (!['BF', 'GF'].includes(turHam)) await repo.update('altyapi', yeni.ID, { ProjeTuru: tur }, 'Otomatik düzeltme');
      await bildirEksikBilgi(yeni);
      showToast('Talep oluşturuldu');
      nav(`/altyapi/${yeni.ID}`);
    }
  }

  return (
    <div className="stack">
      <PageHead title={mevcut ? 'Talebi düzenle' : 'Yeni altyapı talebi'} sub={`Adım ${adim + 1}/3 · ${adimlar[adim]}`} />
      <Tabs value={String(adim)} onChange={(x) => setAdim(Number(x))} items={adimlar.map((a, i) => ({ id: String(i), label: `${i + 1}. ${a}` }))} />
      <div className="card stack">
        {adim === 0 && (
          <>
            <Field label="Talep (kişi, kurum ya da yer) *"><input className="input" value={v.Title} onChange={(e) => set('Title', e.target.value)} /></Field>
            <Field label="Proje ID"><input className="input" inputMode="numeric" value={v.ProjeID || ''} onChange={num('ProjeID')} /></Field>
            <div className="grid2">
              <Field label="İl"><select className="input" value={v.Sehira} onChange={(e) => { set('Sehira', e.target.value); set('Ilce', ''); }}><option value="">Seçin</option>{ILLER.map((i) => <option key={i}>{i}</option>)}</select></Field>
              <Field label="İlçe"><select className="input" value={v.Ilce} onChange={(e) => set('Ilce', e.target.value)}><option value="">Seçin</option>{v.Sehira && ilceler(v.Sehira).map((i) => <option key={i}>{i}</option>)}</select></Field>
            </div>
            <Field label="Adres"><input className="input" value={v.Adres} onChange={(e) => set('Adres', e.target.value)} /></Field>
            <div className="grid2">
              <Field label="Kategori"><select className="input" value={v.AnaKategori} onChange={(e) => set('AnaKategori', e.target.value as A['AnaKategori'])}>{ANA_KATEGORI.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
              <Field label="Kaynak"><select className="input" value={v.Kaynak} onChange={(e) => set('Kaynak', e.target.value as A['Kaynak'])}><option>VVIP</option><option>Toptan</option></select></Field>
            </div>
            <Field label="Takipçi"><select className="input" value={v.Takipci} onChange={(e) => set('Takipci', e.target.value)}><option value="">Atanmamış</option>{TAKIPCILER.map((t) => <option key={t}>{t}</option>)}</select></Field>
          </>
        )}
        {adim === 1 && (
          <>
            <Field label="Proje türü (BF / GF / Alan Bazlı)">
              <select className="input" value={turHam} onChange={(e) => setTurHam(e.target.value)}><option>BF</option><option>GF</option><option>Alan Bazlı</option></select>
            </Field>
            {turHam === 'Alan Bazlı' && <div className="banner info"><span>ℹ️</span><div>"Alan Bazlı" kaydedilmez; çalışan DSL ya da mevcut altyapıya göre <b>{tur}</b> olarak kaydedilecek.</div></div>}
            <div className="grid2">
              <Field label="HP"><input className="input" inputMode="numeric" value={v.HP || ''} onChange={num('HP')} /></Field>
              <Field label="Çalışan DSL"><input className="input" inputMode="numeric" value={v.CalisanDSL || ''} onChange={num('CalisanDSL')} /></Field>
            </div>
            <div className="grid2">
              <Field label="Mevcut altyapı"><select className="input" value={v.MevcutAltyapi} onChange={(e) => set('MevcutAltyapi', e.target.value)}><option value="">—</option><option>Yok</option><option>Bakır</option><option>ADSL</option><option>VDSL</option></select></Field>
              <Field label="Mevcut hız (Mbps)"><input className="input" inputMode="numeric" value={v.MevcutHiz} onChange={(e) => set('MevcutHiz', e.target.value)} /></Field>
            </div>
            <div className="grid2">
              <Field label="Fiber mesafesi (m)"><input className="input" inputMode="numeric" value={v.FiberMesafesi || ''} onChange={num('FiberMesafesi')} /></Field>
              <Field label="Abone öngörüsü"><input className="input" inputMode="numeric" value={v.AboneOngoru || ''} onChange={num('AboneOngoru')} /></Field>
            </div>
            <Field label="Toplam maliyet (₺)"><input className="input" inputMode="numeric" value={v.MaliyetTutari || ''} onChange={num('MaliyetTutari')} /></Field>
            <p className="small muted" style={{ margin: 0 }}>
              HP başı: <b>{v.HP ? fmtKM((v.MaliyetTutari || 0) / v.HP) : '—'}</b> · Abone başı: <b>{v.AboneOngoru ? fmtKM((v.MaliyetTutari || 0) / v.AboneOngoru) : '—'}</b> · Fiber: <b>{v.FiberMesafesi ? fmtMesafe(v.FiberMesafesi) : '—'}</b>
            </p>
          </>
        )}
        {adim === 2 && (
          <>
            <div className="grid2">
              <Field label="Bütçe"><select className="input" value={v.ButceTuru} onChange={(e) => set('ButceTuru', e.target.value as A['ButceTuru'])}>{BUTCE_TURU.map((b) => <option key={b} value={b}>{choiceLabel(b)}</option>)}</select></Field>
              <Field label="Proje durumu"><select className="input" value={v.ProjeDurumKodu} onChange={(e) => set('ProjeDurumKodu', e.target.value as A['ProjeDurumKodu'])}>{PROJE_DURUM.map((b) => <option key={b} value={b}>{choiceLabel(b)}</option>)}</select></Field>
            </div>
            <Field label="Aşama"><input className="input" value={v.Asama} onChange={(e) => set('Asama', e.target.value)} /></Field>
            <Field label="Açıklama"><textarea className="input" value={v.Aciklama} onChange={(e) => set('Aciklama', e.target.value)} /></Field>
            <Field label="Maliyet notu"><input className="input" value={v.MaliyetNotu} onChange={(e) => set('MaliyetNotu', e.target.value)} /></Field>
            {v.Kaynak === 'Toptan' ? (
              <label className="toggle"><input type="checkbox" checked={!!v.ToptanaBildirildi} onChange={(e) => set('ToptanaBildirildi', e.target.checked)} /> Toptan'a bildirildi</label>
            ) : (
              <div className="grid2">
                <Field label="İmalat başlangıç"><input className="input" type="date" value={v.ImalatBaslangic ?? ''} onChange={(e) => set('ImalatBaslangic', e.target.value || null)} /></Field>
                <Field label="Tahmini tamamlanma"><input className="input" type="date" value={v.TahminiTamamlanma ?? ''} onChange={(e) => set('TahminiTamamlanma', e.target.value || null)} /></Field>
              </div>
            )}
            <p className="tiny muted" style={{ margin: 0 }}>Durum (Beklemede → Üst yönetim → Onay/Red) kayıt ekranındaki düğmelerle değişir; her geçiş geçmişe yazılır.</p>
          </>
        )}
      </div>
      <div className="sticky-actions">
        {adim > 0 ? <button className="btn ghost" onClick={() => setAdim(adim - 1)}>Geri</button> : <button className="btn ghost" onClick={() => nav(mevcut ? `/altyapi/${mevcut.ID}` : '/altyapi')}>Vazgeç</button>}
        {adim < 2 ? <button className="btn" onClick={() => setAdim(adim + 1)}>İleri</button> : <button className="btn green" onClick={kaydet}>Kaydet</button>}
      </div>
    </div>
  );
}
