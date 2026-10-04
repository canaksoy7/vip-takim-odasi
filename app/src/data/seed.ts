/**
 * Demo veri üretici. Tüm veriler uydurmadır; kişi adları, numaralar ve kurumlar gerçek değildir.
 * Sabit tohum (SEED) kullanılır: aynı günde sıfırlanan veri birebir aynı çıkar. Tarihler "bugün"e göre
 * göreli üretilir ki gecikme rozetleri ve alarm eşikleri her zaman anlamlı görünsün.
 */
import { createRng, type Rng } from '../lib/rng';
import { YERLER } from '../lib/geo';
import { addDays } from '../lib/format';
import { normalizeProjeTuru } from '../lib/rules';
import { repo } from './repo';
import {
  DEPARTMANLAR, GOREV_KATEGORI, GOREV_ONCELIK, OHE_LOKASYON, VERILEN_TIP,
  type Altyapi, type AltyapiEk, type BaseRecord, type Ekip, type Gecmis, type Rol, type TableName, type Tables,
} from './types';

export const SEED = 20260704;

type Row<T extends TableName> = Omit<Tables[T], 'ID'>;

export const EKIP: { ad: string; short: string; color: string; rol: Rol; manager?: boolean }[] = [
  { ad: 'Ayşe K.', short: 'AK', color: '#2563eb', rol: 'Ekip Üyesi' },
  { ad: 'Murat T.', short: 'MT', color: '#0b2a4a', rol: 'Yönetici', manager: true },
  { ad: 'Elif D.', short: 'ED', color: '#7c3aed', rol: 'Ekip Üyesi' },
  { ad: 'Can Y.', short: 'CY', color: '#0e7490', rol: 'Ekip Üyesi' },
  { ad: 'Zeynep A.', short: 'ZA', color: '#be185d', rol: 'Ekip Üyesi' },
  { ad: 'Burak S.', short: 'BS', color: '#15803d', rol: 'Ekip Üyesi' },
  { ad: 'Selin Ö.', short: 'SÖ', color: '#c2410c', rol: 'Ekip Üyesi' },
  { ad: 'Deniz Ç.', short: 'DÇ', color: '#0f766e', rol: 'ÖHE Ekibi' },
  { ad: 'Okan B.', short: 'OB', color: '#4d7c0f', rol: 'ÖHE Ekibi' },
];
/** Rol seçildiğinde oturumu açan demo kişi. */
export const ROL_KISI: Record<Rol, string> = { 'Ekip Üyesi': 'Ayşe K.', Yönetici: 'Murat T.', 'ÖHE Ekibi': 'Deniz Ç.' };
const TAKIP_EKIBI = EKIP.filter((e) => e.rol !== 'ÖHE Ekibi').map((e) => e.ad);
const OHE_EKIBI = EKIP.filter((e) => e.rol === 'ÖHE Ekibi').map((e) => e.ad);

const eposta = (ad: string) =>
  `${ad.toLocaleLowerCase('tr-TR').replace(/[ç]/g, 'c').replace(/[ğ]/g, 'g').replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ş]/g, 's').replace(/[ü]/g, 'u').replace(/[^a-z]+/g, '.').replace(/\.+$/, '')}@demo.invalid`;

const ADLAR = ['Ayten', 'Kemal', 'Leyla', 'Nihat', 'Sevgi', 'Tarık', 'Gülay', 'Orhan', 'Pelin', 'Rıza', 'Sibel', 'Tamer', 'Ülkü', 'Volkan', 'Yasemin', 'Hakan', 'Filiz', 'Erdem', 'Derya', 'Cengiz', 'Bahar', 'Arda', 'Nermin', 'İlker', 'Şule', 'Ferit', 'Gönül', 'Koray'];
const HARF = 'ABCDEFGHİKLMNOPRSTUVYZ';
const kisi = (r: Rng) => `${r.pick(ADLAR)} ${r.pick([...HARF])}.`;
/** Açıkça sahte numara: "0 5XX 000 BB NN". */
const sahteNo = (blok: number, n: number) => `0 5XX 000 ${String(blok).padStart(2, '0')} ${String(n % 100).padStart(2, '0')}`;

interface Ctx { r: Rng; now: Date; iso: (daysAgo: number, hour?: number) => string; day: (offset: number) => string }

function base(ctx: Ctx, title: string, daysAgo: number, author = 'Sistem'): Omit<BaseRecord, 'ID'> {
  const t = ctx.iso(daysAgo, ctx.r.int(8, 18));
  return { Title: title, Created: t, Modified: t, Author: author, Editor: author };
}

// ── Basit SVG harita eki (uygulama içinde üretilir) ──
function haritaSvg(r: Rng, baslik: string): string {
  const streets: string[] = [];
  for (let i = 0; i < 5; i++) {
    const y = 30 + i * 45 + r.int(-8, 8);
    streets.push(`<path d="M0 ${y} Q 160 ${y + r.int(-20, 20)} 320 ${y + r.int(-10, 10)}" stroke="#cbd5e1" stroke-width="${r.int(4, 9)}" fill="none"/>`);
  }
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 80 + r.int(-10, 10);
    streets.push(`<path d="M${x} 0 L ${x + r.int(-25, 25)} 240" stroke="#e2e8f0" stroke-width="5" fill="none"/>`);
  }
  const px = r.int(170, 260), py = r.int(60, 170);
  const poly = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return `${px + Math.cos(a) * r.int(30, 50)},${py + Math.sin(a) * r.int(25, 40)}`;
  }).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f1f5f9"/>${streets.join('')}` +
    `<polygon points="${poly}" fill="#2563eb33" stroke="#2563eb" stroke-width="2"/>` +
    `<path d="M20 220 L ${px - 60} ${py + 40} L ${px} ${py}" stroke="#f97316" stroke-width="3" stroke-dasharray="8 5" fill="none"/>` +
    `<circle cx="20" cy="220" r="7" fill="#0b2a4a"/><circle cx="${px}" cy="${py}" r="6" fill="#dc2626"/>` +
    `<rect x="6" y="6" width="190" height="38" rx="6" fill="#ffffffdd"/>` +
    `<text x="14" y="22" font-size="11" font-family="sans-serif" fill="#0f172a">${baslik.replace(/[<&>]/g, '')}</text>` +
    `<text x="14" y="37" font-size="9" font-family="sans-serif" fill="#64748b">Örnek harita · demo · ölçeksiz</text></svg>`;
}

const YER_ADI_1 = ['Çamlık', 'Yeşilvadi', 'Gökkuşağı', 'Lale', 'Martı', 'Zeytinli', 'Kardelen', 'Akasya', 'Defne', 'Mavi Koy', 'Sedir', 'Ihlamur', 'Papatya', 'Çınaraltı', 'Poyraz', 'Yakamoz', 'Gün Işığı', 'Kumsal', 'Palmiye', 'Turna'];
const YER_ADI_2 = ['Sitesi Yönetimi', 'Konutları', 'Butik Otel', 'Organize Sanayi Bölgesi', 'Kamp Alanı', 'Teknokent', 'Yazlık Sitesi', 'Köy Muhtarlığı', 'Lojmanları', 'Çiftlik Evleri', 'Marina', 'Kültür Merkezi', 'Kooperatifi'];
const SAHIL = ['Muğla', 'İzmir', 'Antalya', 'Aydın', 'Balıkesir', 'Çanakkale'];

function seedAltyapi(ctx: Ctx) {
  const { r } = ctx;
  const rows: Row<'altyapi'>[] = [];
  const ekler: Omit<AltyapiEk, 'ID'>[] = [];
  const gecmis: Omit<Gecmis, 'ID'>[] = [];
  const plan: Altyapi['OnayRed'][] = [
    ...Array(18).fill('3. Beklemede'), ...Array(14).fill('Üst Yönetime Sunuldu - Bekliyor'),
    ...Array(18).fill('1. Onay'), ...Array(10).fill('2. Red'),
  ];
  const yerHavuzu = YERLER.filter((y) => SAHIL.includes(y.il) || ['İstanbul', 'Ankara'].includes(y.il) || r.chance(0.15));
  r.shuffle(plan).forEach((onay, i) => {
    const yer = r.pick(yerHavuzu);
    const ad = `${r.pick(YER_ADI_1)} ${r.pick(YER_ADI_2)}`;
    const kaynak: Altyapi['Kaynak'] = r.chance(0.3) ? 'Toptan' : 'VVIP';
    const hamTur = r.pick(['BF', 'GF', 'Alan Bazlı', 'BF', 'GF']);
    const dsl = hamTur === 'GF' ? 0 : hamTur === 'BF' ? r.int(1, 40) : r.chance(0.5) ? r.int(1, 20) : 0;
    const mevcut = dsl > 0 ? r.pick(['Bakır', 'ADSL', 'VDSL']) : 'Yok';
    const tur = normalizeProjeTuru(hamTur, { CalisanDSL: dsl, MevcutAltyapi: mevcut });
    const hp = r.int(6, 380);
    const hpBasi = r.int(15, 150) * 100;
    const toplam = hp * hpBasi;
    const abone = Math.max(1, Math.round(hp * (r.int(20, 65) / 100)));
    const grup = onay === '1. Onay' ? 'onay' : onay === '2. Red' ? 'red' : onay === '3. Beklemede' ? 'bekle' : 'ust';
    // Bekleyenlerin yaşı 0–30 gün; geciken örnekleri garanti etmek için ilk birkaç kayda büyük değer
    const createdAgo = grup === 'bekle' ? (i % 5 === 0 ? r.int(15, 30) : r.int(0, 16)) : grup === 'ust' ? r.int(12, 45) : r.int(30, 160);
    const sunulmaAgo = grup === 'bekle' ? null : grup === 'ust' ? (i % 4 === 0 ? r.int(14, 22) : r.int(0, 12)) : createdAgo - r.int(3, 15);
    const kararAgo = grup === 'onay' || grup === 'red' ? Math.max(1, (sunulmaAgo ?? 10) - r.int(1, 10)) : null;
    const takipci = r.chance(0.13) && grup !== 'onay' && grup !== 'red' ? '' : r.pick(TAKIP_EKIBI.filter((x) => x !== 'Murat T.'));
    let durumKodu: Altyapi['ProjeDurumKodu'] = r.pick(['5. Bölge', '4. Erişim']);
    let imalat: string | null = null, tahmini: string | null = null, tamam: string | null = null;
    if (grup === 'red') durumKodu = '6. Red';
    if (grup === 'onay') {
      if (kaynak === 'Toptan') durumKodu = '3. Toptan';
      else if (r.chance(0.35)) {
        durumKodu = '1. Tamamlandı';
        imalat = ctx.day(-(kararAgo! - 5)); tamam = ctx.day(-r.int(1, Math.max(2, kararAgo! - 6)));
      } else {
        durumKodu = '2. İmalat';
        imalat = ctx.day(-Math.max(0, kararAgo! - 7)); tahmini = ctx.day(r.int(10, 90));
      }
    }
    const created = base(ctx, ad, createdAgo, r.pick(TAKIP_EKIBI));
    const id = i + 1;
    rows.push({
      ...created,
      AnaKategori: r.pick(['1. Dönüşüm', '2. Altyapı', '3. Fiber', '4. Altyapı-Dönüşüm', '5. Omurga Projesi'] as const),
      TalepSahibi: ad,
      ProjeID: 900000 + id * 37,
      HPBasiMaliyet: hpBasi,
      AboneBasiMaliyet: Math.round(toplam / abone),
      MaliyetTutari: toplam,
      MaliyetSayisal: toplam,
      Penetrasyon: Math.round((abone / hp) * 100),
      Asama: grup === 'bekle' ? 'Bölgeden maliyet bekleniyor' : grup === 'ust' ? 'Üst yönetim değerlendirmesinde' : grup === 'onay' ? 'Onaylandı, imalat planlamasında' : 'Değerlendirme sonucu reddedildi',
      ProjeDurumKodu: durumKodu,
      ButceTuru: grup === 'onay' ? r.pick(['1. VIP', '2. Ticari'] as const) : '3. Beklemede',
      OnayRed: onay,
      Aciklama: r.pick([
        'Bölgede sezonluk kullanım yoğun; yaz aylarında hız şikâyeti artıyor.',
        'Talep üst yönetim ziyareti sonrasında iletildi.',
        'Komşu parselde fiber hattı mevcut; bağlantı mesafesi kısa.',
        'Kurum yeni hizmet binasına taşınıyor, açılış tarihi yakın.',
        'Site yönetimi ortak altyapı için yazılı talepte bulundu.',
      ]),
      Adres: `${r.pick(['Cumhuriyet', 'Atatürk', 'Yalı', 'Bahçelievler', 'Fatih', 'Kocatepe', 'Gündoğan'])} Mah. Örnek Sok. No:${r.int(1, 99)}`,
      Takipci: takipci,
      Sehira: yer.il,
      Ilce: yer.ilce,
      HP: hp,
      ProjeTuru: tur,
      CalisanDSL: dsl,
      AboneOngoru: abone,
      MevcutAltyapi: mevcut,
      MevcutHiz: dsl > 0 ? String(r.pick([8, 16, 24, 35, 50])) : '',
      FiberMesafesi: r.int(80, 4800),
      MaliyetNotu: r.chance(0.3) ? 'Maliyet bölgeden teyit edildi.' : '',
      SunulmaTarihi: sunulmaAgo !== null ? ctx.day(-sunulmaAgo) : null,
      KararTarihi: kararAgo !== null ? ctx.day(-kararAgo) : null,
      ImalatBaslangic: imalat,
      TahminiTamamlanma: tahmini,
      TamamlanmaTarihi: tamam,
      Kaynak: kaynak,
      ToptanaBildirildi: kaynak === 'Toptan' && r.chance(0.5),
    });
    const g = (daysAgo: number, aksiyon: string, alan: string, eski: string, yeni: string, kim: string) =>
      gecmis.push({ ...base(ctx, `VVIP Altyapı Takip #${id}`, daysAgo, kim), Liste: 'VVIP Altyapı Takip', KayitID: id, Aksiyon: aksiyon, DegisilenAlan: alan, OncekiDeger: eski, YeniDeger: yeni, DegistireN: kim });
    g(createdAgo, 'Oluşturuldu', '—', '', ad, created.Author);
    if (hamTur === 'Alan Bazlı') g(createdAgo, 'Otomatik düzeltme', 'ProjeTuru', 'Alan Bazlı', tur, 'Sistem');
    if (sunulmaAgo !== null) g(sunulmaAgo, 'Durum değişikliği', 'OnayRed', '3. Beklemede', 'Üst Yönetime Sunuldu - Bekliyor', takipci || 'Ayşe K.');
    if (kararAgo !== null) g(kararAgo, 'Karar', 'OnayRed', 'Üst Yönetime Sunuldu - Bekliyor', onay, 'Murat T.');
    if (r.chance(0.35)) {
      ekler.push({ ...base(ctx, `harita-${900000 + id * 37}.svg`, createdAgo, created.Author), AltyapiID: id, MimeType: 'image/svg+xml', Icerik: haritaSvg(r, `${yer.ilce} / ${yer.il}`) });
    }
  });
  return { rows, ekler, gecmis };
}

function seedTaahhut(ctx: Ctx) {
  const { r } = ctx;
  const unvan = ['Genel Müdür', 'Yönetim Kurulu Üyesi', 'Daire Başkanı', 'Bölge Müdürü', 'Danışman', 'Kurum Başkanı', 'Genel Sekreter'];
  const tarifeler: Record<string, string[]> = {
    Mobil: ['Platin 40 GB', 'Kurumsal Sınırsız', 'Elit 100 GB'],
    'İnternet': ['Fiber 1000 Mbps', 'Fiber 500 Mbps', 'VDSL 100 Mbps'],
    'TV (Tivibu)': ['Tivibu Süper Paket', 'Tivibu Spor Paket'],
  };
  // Bitiş dağılımı: 10 geçmiş, 12 yakın (≤30 gün), 18 uzak
  const offsets = [...Array.from({ length: 10 }, () => -r.int(1, 90)), ...Array.from({ length: 12 }, (_, i) => [2, 5, 7, 9, 12, 14, 16, 19, 22, 25, 28, 30][i]), ...Array.from({ length: 18 }, () => r.int(35, 420))];
  return r.shuffle(offsets).map((off, i) => {
    const tip = r.pick(VERILEN_TIP);
    const bitis = addDays(ctx.now, off);
    const ay = r.pick([12, 24]);
    const bas = new Date(bitis); bas.setMonth(bas.getMonth() - ay);
    // 2 çakışma örneği: 38/39 numaralı kayıtlar 3 ve 7 ile aynı numarayı kullanır
    const msisdn = i === 38 ? sahteNo(0, 3) : i === 39 ? sahteNo(0, 7) : sahteNo(0, i);
    const k = kisi(r);
    const ekleyen = r.pick(TAKIP_EKIBI);
    return {
      ...base(ctx, `${k} — ${tip}`, r.int(20, 300), ekleyen),
      KisiUnvan: `${k} — ${r.pick(unvan)}`,
      MSISDN: msisdn,
      KimdenGeldi: r.pick(['Genel Müdürlük', 'Bölge Müdürlüğü', 'Kurumsal Satış', 'Protokol Birimi']),
      IndirimOrani: r.pick([10, 15, 20, 25, 30, 40, 50]),
      TaahhutBaslangic: bas.toISOString().slice(0, 10),
      TaahhutBitis: bitis.toISOString().slice(0, 10),
      Tarife: r.pick(tarifeler[tip]),
      Ekleyen: ekleyen,
      VerilenTip: tip,
      Hediye: r.chance(0.25) ? r.pick(['Cihaz', 'Ek paket', 'Modem']) : '',
      HediyeNot: '',
    } satisfies Row<'taahhut'>;
  });
}

function seedUstHat(ctx: Ctx): Row<'ust_hat'>[] {
  const { r } = ctx;
  const kat = ['Yönetim Kurulu', 'Genel Müdürlük', 'Genel Müdür Yardımcılığı', 'Direktörlük'];
  return Array.from({ length: 10 }, (_, i) => ({
    ...base(ctx, `${kat[i % 4]} — Hat ${String(i + 1).padStart(2, '0')}`, r.int(30, 400), 'Murat T.'),
    Kategori: kat[i % 4],
    HatTipi: r.pick(['Mobil', 'Data', 'Mobil']),
    HatNumarasi: sahteNo(10, i + 1),
    Aciklama: r.pick(['Makam hattı', 'Yedek hat', 'Araç içi data hattı', 'Ofis hattı']),
    Ekleyen: 'Murat T.',
    Sirket: r.pick(['Demo Grup Şirketi A', 'Demo Grup Şirketi B']),
  }));
}

function seedVip(ctx: Ctx) {
  const { r } = ctx;
  const kategoriler = ['Mobil', 'İnternet', 'TV', 'Fatura', 'Altyapı', 'Roaming'];
  const konular: Record<string, string[]> = {
    Mobil: ['Kapsama sorunu', 'Numara taşıma talebi', 'Paket değişikliği'],
    'İnternet': ['Hız düşüklüğü', 'Sık bağlantı kopması', 'Modem değişimi'],
    TV: ['Yayın donması', 'Kanal paketi tanımlanmadı'],
    Fatura: ['Fatura itirazı', 'Mükerrer tahsilat', 'İndirim yansımadı'],
    Altyapı: ['Fiber altyapı talebi', 'Yeni binaya hat taşıma'],
    Roaming: ['Yurtdışında hat çalışmıyor', 'Roaming ücret itirazı'],
  };
  const vvipVaryant = ['VVIP', 'VVİP', 'vvip', 'Vvıp', 'VvIP'];
  const durumlar = [...Array(25).fill('Devam'), ...Array(15).fill('Takip'), ...Array(12).fill('Ön Başvuru'), ...Array(28).fill('Kapalı')] as const;
  const talepler: Row<'vip_talep'>[] = [];
  const meta: Row<'vip_meta'>[] = [];
  const log: Row<'vip_log'>[] = [];
  r.shuffle([...durumlar]).forEach((durum, i) => {
    const kat = r.pick(kategoriler);
    const konu = r.pick(konular[kat]);
    const vvip = r.chance(0.22);
    const onemli = !vvip && r.chance(0.18);
    const acilisAgo = durum === 'Devam' || durum === 'Takip' ? (i % 6 === 0 ? r.int(8, 25) : r.int(0, 12)) : r.int(3, 120);
    const k = kisi(r);
    const giren = r.pick(TAKIP_EKIBI);
    const takipci = i % 3 === 0 ? 'Ayşe K.' : r.pick(TAKIP_EKIBI);
    const id = i + 1;
    const acilis = ctx.iso(acilisAgo, r.int(8, 18));
    talepler.push({
      ...base(ctx, `${vvip ? r.pick(vvipVaryant) + ' - ' : ''}${konu} hk.`, acilisAgo, giren),
      TalepNo: `VT-2026-${String(1000 + id)}`,
      RequestSubject: `${r.pick(['RE: ', 'FW: ', ''])}${vvip ? r.pick(vvipVaryant) + ' - ' : onemli ? 'ÖNEMLİ - ' : ''}${konu} hk.`,
      Subject: `${k} adına iletilen ${konu.toLocaleLowerCase('tr-TR')} talebi. ${r.pick(['Müşteri geri dönüş bekliyor.', 'Bölge ekibine iletildi.', 'Teknik inceleme sürüyor.', 'Müşteri ile görüşüldü, takipteyiz.'])}`,
      Musteri: k,
      HizmetNo: sahteNo(20 + (id % 10), id),
      Kategori: kat,
      Kanal: r.pick(['E-posta', 'Telefon', 'Sosyal Medya', 'Üst Yönetim', 'Resmi Yazı']),
      KaydiGiren: giren,
      Durum: durum,
      AcilisTarihi: acilis,
      KapanisTarihi: durum === 'Kapalı' ? ctx.iso(Math.max(0, acilisAgo - r.int(1, 10))) : null,
      OnemliSikayet: onemli,
    });
    const acik = durum === 'Devam' || durum === 'Takip';
    meta.push({
      ...base(ctx, `Meta #${id}`, acilisAgo, giren),
      VipFormID: id, Baslik2: konu, Takipci: takipci,
      SonNot: r.pick(['Müşteri arandı.', 'Bölgeden dönüş bekleniyor.', 'Çözüm teyidi alınacak.', '']),
      SonNotTarihi: ctx.iso(Math.max(0, acilisAgo - 1)),
      HatirlatmaTarihi: acik && r.chance(0.25) ? ctx.day(-r.int(0, 2)) : null,
      HatirlatmaNotu: 'Müşteriye ara bilgi verilecek.',
      HatirlatmaDurum: 'Bekliyor', HatirlatmaKilit: '', HatirlatmaAlicilar: takipci,
    });
    const n = r.int(1, 3);
    for (let j = 0; j < n; j++) log.push({ ...base(ctx, `Not #${id}.${j + 1}`, Math.max(0, acilisAgo - j * 2), takipci), VipFormID: id, Ekleyen: takipci, Detay: r.pick(['Talep kaydı açıldı.', 'Müşteri bilgilendirildi.', 'Teknik ekibe aktarıldı.', 'Geri dönüş alındı.', 'Durum güncellendi.']) });
  });
  return { talepler, meta, log };
}

function seedOhe(ctx: Ctx) {
  const { r } = ctx;
  const modeller = ['Akıllı Telefon X12', 'Akıllı Telefon Pro 14', 'Tablet T10', 'Modem FX-300', 'Mobil Hotspot M5', 'Uydu Telefonu S2', 'Akıllı Saat W3'];
  const cihaz: Row<'ohe_cihaz'>[] = Array.from({ length: 42 }, (_, i) => {
    const verildi = r.chance(0.4);
    const girisAgo = r.int(20, 300);
    return {
      ...base(ctx, `${r.pick(modeller)}`, girisAgo, r.pick(OHE_EKIBI)),
      Model: modeller[i % modeller.length],
      SeriNo: `SN-DEMO-${String(i + 1).padStart(5, '0')}`,
      IMEI: `000000000${String(100000 + i * 7).slice(-6)}`,
      Lokasyon: r.pick(OHE_LOKASYON),
      Zimmet: verildi ? r.pick([...TAKIP_EKIBI, 'Etkinlik Ekibi']) : '',
      Durum: verildi ? '2. Verildi' : '1. Stokta',
      StokGiris: ctx.day(-girisAgo),
      StokCikis: verildi ? ctx.day(-r.int(1, girisAgo)) : null,
      Aciklama: r.chance(0.2) ? 'Kutusu açılmamış.' : '',
      OnayDurumu: i >= 39 ? 'Onay Bekliyor' : 'Onaylandı',
    };
  });
  cihaz.forEach((c) => (c.Title = c.Model));
  const kategoriler = ['Telefon', 'Tablet', 'Modem', 'SIM Kart', 'Aksesuar'];
  const stok: Row<'ohe_stok'>[] = Array.from({ length: 15 }, (_, i) => {
    const a = r.int(0, 20), ist = r.int(0, 25), b = r.int(0, 8), iz = r.int(0, 10);
    return { ...base(ctx, `MLZ-${String(1001 + i)}`, r.int(30, 200)), Kategori: kategoriler[i % 5], Bolum: r.pick(['VIP', 'Kurumsal', 'Test']), ToplamAdet: a + ist + b + iz, Ankara: a, Istanbul: ist, Bodrum: b, Izmir: iz };
  });
  const sync: Row<'ohe_sync_log'>[] = [60, 30, 7].map((d) => ({ ...base(ctx, `Senkron ${d} gün önce`, d, 'Deniz Ç.'), SyncTarihi: ctx.day(-d), Eklenen: r.int(0, 12), Guncellenen: r.int(0, 30), Sifirlanan: r.int(0, 3), Hatali: r.int(0, 2), Detay: 'Demo içe aktarım kaydı.' }));
  const gundemBaslik = ['Yeni SIM kart siparişi', 'Test hattı yenileme', 'Bodrum deposu sayımı', 'Etkinlik cihaz talebi', 'Modem tedarik görüşmesi', 'Uydu telefonu bakım', 'İzmir lokasyon taşıma', 'Yıl sonu envanter mutabakatı', 'Kılıf ve aksesuar alımı', 'Test senaryosu güncelleme', 'Tablet yazılım güncellemesi', 'SAT fatura eşleştirme', 'Yedek SIM dağıtımı', 'Ankara depo düzenleme', 'Fiber test ekipmanı'];
  const gundem: Row<'ohe_gundem'>[] = gundemBaslik.map((t, i) => {
    const ago = i < 4 ? r.int(35, 70) : r.int(0, 28);
    const durum = i < 3 ? r.pick(['1. Bekliyor', '2. Devam Ediyor'] as const) : r.pick(['1. Bekliyor', '2. Devam Ediyor', '3. Tamamlandı', '3. Tamamlandı', '4. İptal'] as const);
    return { ...base(ctx, t, ago, r.pick(OHE_EKIBI)), Kategori: r.pick(['1. Satın Alma', '2. Altyapı', '3. SIM Kart', '4. Test', '5. Diğer'] as const), Durum: durum, SorumluKisi: r.pick(OHE_EKIBI), Tarih: ctx.day(-ago), Aciklama: 'Demo gündem maddesi.' };
  });
  const sat: Row<'ohe_sat'>[] = Array.from({ length: 8 }, (_, i) => ({ ...base(ctx, `SAT-2026-${String(i + 1).padStart(4, '0')}`, r.int(10, 250)), Donem: `2026-Ç${(i % 4) + 1}`, Tedarikci: r.pick(['Örnek Tedarik A.Ş.', 'Demo Teknoloji Ltd.', 'Kurgu Lojistik A.Ş.']), SatNumarasi: `SAT-2026-${String(i + 1).padStart(4, '0')}`, Tutar: r.int(20, 400) * 1000, FaturaEki: r.chance(0.6) ? 'fatura-ornek.pdf' : '' }));
  const test: Row<'ohe_test_hat'>[] = Array.from({ length: 12 }, (_, i) => { const k = r.chance(0.6); return { ...base(ctx, sahteNo(30, i + 1), r.int(30, 300)), HatDurumu: k ? '2. Kullanımda' : '1. Stokta', Personel: k ? r.pick([...OHE_EKIBI, ...TAKIP_EKIBI]) : '', YedekSIM: r.chance(0.4) ? `SIM-DEMO-${String(i + 1).padStart(3, '0')}` : '', Aciklama: '' }; });
  const butceTanim: Row<'ohe_butce'>[] = (['1. Genel', '2. Mobil', '3. Sabit', '4. VIP', '5. Kurumsal'] as const).map((k) => ({ ...base(ctx, `2026 ${k.slice(3)} bütçesi`, 270), Kategori: k, ToplamButce: r.int(5, 40) * 100_000, Donem: '2026', Aciklama: 'Yıllık demo bütçe tanımı.' }));
  const harcama: Row<'ohe_harcama'>[] = Array.from({ length: 22 }, (_, i) => { const ago = r.int(1, 270); return { ...base(ctx, `Harcama ${i + 1}`, ago), Kategori: r.pick(['1. Mobil', '2. Sabit', '3. VIP', '4. Kurumsal'] as const), Tutar: r.int(5, 120) * 1000, Tarih: ctx.day(-ago), Donem: '2026', Tedarikci: r.pick(['Örnek Tedarik A.Ş.', 'Demo Teknoloji Ltd.']), FaturaRef: `FTR-DEMO-${1000 + i}` }; });
  const kades: Row<'kades'>[] = [];
  for (let i = 0; i < 6; i++) {
    const tutar = r.int(10, 80) * 50_000;
    const no = `KADES-2026-${String(i + 1).padStart(3, '0')}`;
    kades.push({ ...base(ctx, no, r.int(40, 250), 'Deniz Ç.'), Tur: 'KADES', Ad: r.pick(['VIP cihaz alımı', 'Etkinlik iletişim hizmeti', 'Test hattı hizmet bedeli', 'Bakım-onarım çerçeve', 'Aksesuar alımı', 'Saha destek hizmeti']), Portal: 'Satınalma Portalı (demo)', Tutar: tutar, Harcanan: Math.round(tutar * (r.int(5, 105) / 100)), HarcananTarih: ctx.day(-r.int(1, 40)), Fon: r.pick(['Pazarlama Fonu', 'VIP Operasyon Fonu', 'Yatırım Fonu']), MaliKalem: r.pick(['Cihaz Alımı', 'Hizmet Alımı', 'Etkinlik', 'Bakım-Onarım']), Muhatap: r.pick(['Örnek Tedarik A.Ş.', 'Demo Teknoloji Ltd.', 'Kurgu Lojistik A.Ş.']), Durum: r.pick(['Aktif', 'Aktif', 'Onay Bekliyor', 'Kapandı']), IlgiliKades: '', Notlar: '' });
    kades.push({ ...base(ctx, `UK-${7000 + i * 3}`, r.int(30, 200), 'Okan B.'), Tur: 'Ürün Kodu', Ad: r.pick(modeller), Portal: 'Satınalma Portalı (demo)', Tutar: Math.round(tutar / 3), Harcanan: Math.round((tutar / 3) * (r.int(0, 100) / 100)), HarcananTarih: null, Fon: '', MaliKalem: 'Cihaz Alımı', Muhatap: '', Durum: 'Aktif', IlgiliKades: no, Notlar: '' });
  }
  return { cihaz, stok, sync, gundem, sat, test, butceTanim, harcama, kades };
}

const DEPT_ALAN: Record<(typeof DEPARTMANLAR)[number], string[]> = {
  'Bireysel Sabit': ['fiber', 'adsl', 'vdsl', 'modem', 'arıza', 'nakil', 'hız', 'kurulum', 'sabit hat', 'altyapı'],
  Dijital: ['online işlemler', 'mobil uygulama', 'web sitesi', 'şifre', 'giriş sorunu', 'e-fatura', 'chatbot'],
  Kanal: ['bayi', 'mağaza', 'satış noktası', 'çağrı merkezi', 'randevu', 'kanal şikâyeti'],
  'Kurumsal Segment': ['kurumsal hat', 'metro ethernet', 'data hattı', 'sla', 'kurumsal fatura', 'vpn'],
  Mobil: ['roaming', 'yurtdışı', 'numara taşıma', 'sim kart', 'kapsama', 'şebeke', 'paket', 'esim'],
  'Resmi Kanallar': ['btk', 'cimer', 'tüketici hakem heyeti', 'resmi yazı', 'dilekçe', 'kvkk'],
  'TV Müşteri Deneyimi': ['tivibu', 'kanal paketi', 'yayın', 'set üstü kutu', 'maç', 'provizyon'],
  'Müşteri Yönetim Sistemleri': ['crm', 'abonelik kaydı', 'sözleşme', 'tarife değişikliği', 'kampanya tanımı'],
  'Tümleşik Yönetim Sistemleri': ['fatura', 'ödeme', 'tahsilat', 'iade', 'borç', 'kilitli fatura', 'ocs'],
};

function seedRehber(ctx: Ctx) {
  const { r } = ctx;
  const roller = ['Müdür', 'Takım Lideri', 'Kıdemli Uzman', 'Uzman', 'Uzman Yardımcısı'];
  const rows: Row<'rehber'>[] = [];
  DEPARTMANLAR.forEach((d, di) => {
    const n = di < 8 ? 9 : 8;
    for (let i = 0; i < n; i++) {
      const ad = kisi(r);
      const alanlar = r.shuffle(DEPT_ALAN[d]).slice(0, r.int(2, 4));
      rows.push({ ...base(ctx, ad, r.int(30, 300), 'Murat T.'), Departman: d, Rol: i === 0 ? 'Müdür' : r.pick(roller.slice(1)), Eposta: eposta(`${ad}${di}${i}`), Alanlar: alanlar.join(', '), Anahtar: alanlar.slice(0, 2).join(', ') });
    }
  });
  const aramalar: [string, number, 'Kelime' | 'Vaka'][] = [['roaming', 6, 'Kelime'], ['fatura', 9, 'Kelime'], ['uçak wifi', 0, 'Kelime'], ['tivibu', 5, 'Kelime'], ['bağış servisi', 0, 'Kelime'], ['444 numara havuzu', 0, 'Vaka'], ['metro ethernet', 3, 'Kelime'], ['ivr inceleme', 0, 'Kelime'], ['kvkk', 4, 'Kelime'], ['kara liste çıkarma', 0, 'Vaka'], ['modem', 7, 'Kelime'], ['uçak wifi', 0, 'Vaka'], ['şifre', 4, 'Kelime'], ['esim', 3, 'Kelime']];
  const aramaRows: Row<'rehber_arama'>[] = aramalar.map(([t, s, m], i) => ({ ...base(ctx, t, 20 - i, r.pick(TAKIP_EKIBI)), Sonuc: s, Mod: m, Departmanlar: '' }));
  return { rows, aramaRows };
}

function seedHafiza(ctx: Ctx): Row<'hafiza'>[] {
  const kayitlar: [string, string, string, string, string[], string, string][] = [
    ['Mobil', 'Yurtdışında hat çalışmıyor (roaming)', 'AKTİF', 'roaming, yurtdışı, şebeke', ['Hattın roaming yetkisini kontrol et.', 'Fatura sınırı engeli var mı bak.', 'Gerekirse VIP Mobil Ekibi üzerinden eskalasyon aç.'], 'Fatura sınırı aşımında hat otomatik kısıtlanır.', 'VIP Mobil Ekibi'],
    ['Mobil', 'Yurtdışında numara kilidi', 'YAKINDA', 'numara, kilit, yurtdışı', ['Talebi kayda al.', 'Mobil ekibine ilet.'], '', 'VIP Mobil Ekibi'],
    ['Mobil', 'Dolandırıcılık şüphesi bildirimi', 'AKTİF', 'fraud, dolandırıcılık', ['Müşteriden olay özetini al.', 'Fraud ekibine kayıt aç.', 'Müşteriye 24 saat içinde bilgi ver.'], 'Müşteri bilgilerini mail gövdesine yazma.', 'Fraud Ekibi'],
    ['İnternet', '1000/1000 Mbps hız artırımı', 'AKTİF', 'hız, fiber, 1000', ['Altyapı uygunluğunu kontrol et.', 'Teknik ekibe hız profili talebi aç.', 'Müşteriye tahmini süreyi bildir.'], 'Bakır altyapıda bu hız sunulamaz.', 'Teknik Destek Ekibi'],
    ['İnternet', 'Altyapı talebi açma süreci', 'AKTİF', 'altyapı, talep, fiber', ['Bölgeden maliyet ve HP bilgisini iste.', 'Talep Metni Oluşturucu ile künyeyi hazırla.', 'VVIP Altyapı Takip listesine kaydet.'], 'Proje türü yalnızca BF ya da GF olabilir.', 'Altyapı Masası'],
    ['Sosyal Medya', 'Kurumsal hesaptan gelen şikâyet', 'AKTİF', 'sosyal medya, şikayet', ['Paylaşımın ekran görüntüsünü al.', 'Müşteriye DM üzerinden ulaş.', 'VIP Talep Takip\'e kaydet.'], 'Kişisel veriyi açık paylaşımda isteme.', 'Sosyal Medya Ekibi'],
    ['Sosyal Medya', 'Tivibu yayın sorunu bildirimi', 'YAKINDA', 'tivibu, yayın', ['TV ekibine ilet.'], '', 'TV Ekibi'],
    ['Uyum / Hukuk', 'KVKK görüş ve bilgi talepleri', 'AKTİF', 'kvkk, kişisel veri, görüş', ['Talebi yazılı al.', 'KVKK ekibine ilet.', 'Yanıt süresini müşteriye bildir.'], 'Yasal yanıt süresi sınırlıdır; geciktirme.', 'KVKK Ekibi'],
    ['Uyum / Hukuk', 'Hukuki yazı / ihtarname', 'AKTİF', 'hukuk, ihtarname, yazı', ['Belgeyi tarat.', 'Hukuk ekibine ilet.'], 'Müşteriye hukuki değerlendirme yapma.', 'Hukuk Ekibi'],
    ['VIP Operasyonlar', 'Taahhüt yenileme süreci', 'AKTİF', 'taahhüt, yenileme, indirim', ['Bitişe 30 gün kala alarmı kontrol et.', 'Ek İndirim Hesaplama ile teklif hazırla.', 'Yönetici onayı al.'], 'Aynı numarada çakışan taahhüt açılmamalı.', 'VIP Ekibi'],
    ['VIP Operasyonlar', 'İndirim yetkisi ve onay', 'AKTİF', 'indirim, onay, yetki', ['Oranı hesapla.', 'Yetki sınırını aşıyorsa yöneticiye sun.'], '', 'VIP Ekibi'],
    ['Kontakt Rehberi', 'Hangi ekip neye bakar?', 'AKTİF', 'rehber, sorumlu, ekip', ['Sorumluluk Rehberi\'nde ara.', 'Bulamazsan vaka metnini yapıştır.'], '', 'VIP Ekibi'],
    ['Monitoring', 'Uçak Wi-Fi kod talepleri', 'AKTİF', 'uçak, wifi, kod', ['Uçuş bilgisini al.', 'Kod talebini ilgili ekibe ilet.'], '', 'Monitoring Ekibi'],
    ['Monitoring', 'Kilitli fatura / OCS', 'YAKINDA', 'fatura, ocs, kilit', ['Fatura ekibine ilet.'], '', 'Fatura Ekibi'],
  ];
  const renk: Record<string, string> = { AKTİF: '#16a34a', YAKINDA: '#d97706' };
  return kayitlar.map(([kat, t, etiket, kw, adimlar, uyari, kisiler], i) => ({
    ...base(ctx, t, 200 - i * 10, 'Murat T.'), Kategori: kat, Etiket: etiket, EtiketRenk: renk[etiket], Aciklama: `${t} için ekip içi standart akış.`, Keywords: kw, Adimlar: adimlar.join('\n'), Uyari: uyari, Kisiler: kisiler, AktifMi: etiket === 'AKTİF',
  }));
}

function seedDiger(ctx: Ctx) {
  const { r } = ctx;
  const rapor: Row<'rapor'>[] = [
    ['Eylül Aylık Monitoring', '1. Aylık Monitoring', 25, '2. PPTX'], ['Ağustos Aylık Monitoring', '1. Aylık Monitoring', 55, '2. PPTX'],
    ['Alt Markalar Çeyrek Raporu', '2. Alt Markalar Raporu', 40, '1. PDF'], ['Kesinti Değerlendirmesi', '3. Kriz & Alarm', 70, '1. PDF'],
    ['Bodrum Sezon Analizi', '4. Özel Analiz', 30, '2. PPTX'], ['Temmuz Aylık Monitoring', '1. Aylık Monitoring', 85, '2. PPTX'],
  ].map(([t, k, ago, tur]) => ({ ...base(ctx, t as string, ago as number, 'Elif D.'), RaporAdi: t as string, Kategori: k as Row<'rapor'>['Kategori'], AyYil: ctx.day(-(ago as number)), DosyaTuru: tur as Row<'rapor'>['DosyaTuru'] }));
  const pusula: Row<'pusula'>[] = [
    ['Roaming', 'Yurtdışı şikâyetlerinde önce hattın roaming yetkisi ve fatura sınırı kontrol edilir.'],
    ['Hız', 'Hız şikâyetlerinde altyapı türü (BF/GF) ve mevcut hız künyeden kontrol edilir.'],
    ['Altyapı', 'Altyapı talebi künyesi eksiksiz olmadan üst yönetime sunulmaz.'],
  ].map(([k, i], n) => ({ ...base(ctx, `Pusula notu ${n + 1}`, 60), Kategori: k, Icerik: i }));
  const duyuru: Row<'duyuru'>[] = [
    ['Yeni roaming paketleri yayında', '2. Mobil', 'Bireysel'], ['Fiber kampanyası bölge listesi güncellendi', '5. İnternet', 'Bireysel'],
    ['Kurumsal tarife değişikliği duyurusu', '3. Serbest', 'Kurumsal'], ['Pusula: VIP eskalasyon akışı revize edildi', '1. Pusula', 'VIP'],
    ['Sabit hat nakil süreci güncellemesi', '6. PSTN', 'Bireysel'], ['Yaz kampanyası sona eriyor', '4. Kampanya', 'Bireysel'],
    ['Pusula: Hafta sonu nöbet planı', '1. Pusula', 'VIP'], ['Tivibu spor paketi fiyat güncellemesi', '4. Kampanya', 'Bireysel'],
  ].map(([t, k, s], i) => ({ ...base(ctx, t, i * 4 + 1, 'Sistem'), Kaynak: k as Row<'duyuru'>['Kaynak'], Gonderen: r.pick(['Pazarlama İletişimi (demo)', 'Ürün Yönetimi (demo)', 'Pusula Ekibi (demo)']), Segment: s, YayinTarihi: ctx.day(-(i * 4 + 1)), Ozet: `${t}. Ayrıntılar demo içeriğidir.`, Durum: i === 7 ? '3. Arşiv' : '1. Yayında' }));
  const gorevBaslik = ['Altyapı haftalık raporunu hazırla', 'Bodrum taahhüt yenilemelerini ara', 'Rehberde eksik alanları tamamla', 'Sosyal medya şikâyetlerini sınıflandır', 'Yönetici sunumu için KPI derle', 'Test hattı envanterini doğrula', 'VVIP gecikenleri gözden geçir', 'Yeni ekip üyesine eğitim', 'Erişim günlüğünü incele', 'KADES harcama mutabakatı', 'Pusula karar ağacını güncelle', 'Yıl sonu taahhüt listesini çıkar', 'İzmir saha ziyareti planı', 'Fatura itirazlarını kapat', 'Hafıza kartlarını gözden geçir'];
  const gorev: Row<'gorev'>[] = gorevBaslik.map((t) => {
    const durum = r.pick(['1. Bekliyor', '2. Devam Ediyor', '2. Devam Ediyor', '3. Tamamlandı'] as const);
    const adim = Array.from({ length: r.int(0, 4) }, (_, j) => ({ t: `Adım ${j + 1}`, ok: durum === '3. Tamamlandı' || r.chance(0.4) }));
    return { ...base(ctx, t, r.int(1, 40), 'Murat T.'), Aciklama: `${t} — demo görev.`, AtananKisi: r.pick(TAKIP_EKIBI), BitisTarihi: ctx.day(r.int(-5, 20)), Oncelik: r.pick(GOREV_ONCELIK), Kategori: r.pick(GOREV_KATEGORI), Durum: durum, TamamlandiMi: durum === '3. Tamamlandı', AltAdimlar: JSON.stringify(adim) };
  });
  const gorevLog: Row<'gorev_log'>[] = gorev.map((g, i) => ({ ...base(ctx, 'Görev oluşturuldu', 10), GorevID: i + 1, User: g.Author, Action: 'Oluşturdu', Time: g.Created }));
  return { rapor, pusula, duyuru, gorev, gorevLog };
}

function seedErisim(ctx: Ctx) {
  const onayci: Row<'erisim_onayci'>[] = [{ ...base(ctx, 'Onaycı', 200, 'Murat T.'), Onayci: 'Murat T.', Aktif: true }];
  const talep: Row<'erisim_talep'>[] = [
    { ...base(ctx, 'Numara görüntüleme', 12, 'Elif D.'), TalepTuru: 'Numara Görüntüleme', Modul: 'Üst Yönetim Hatları', Kapsam: '3', Sebep: 'Hat değişikliği teyidi', Durum: 'Onaylandı', TalepEdenAd: 'Elif D.', TalepEdenEposta: eposta('Elif D.'), OnaylayanAd: 'Murat T.', KararNotu: 'Uygun.', KararTarihi: ctx.iso(12), GecerlilikBitis: ctx.iso(12) },
    { ...base(ctx, 'Tam numaralı rapor', 5, 'Can Y.'), TalepTuru: 'Tam Numaralı Rapor', Modul: 'Üst Yönetim Hatları', Kapsam: 'Tümü', Sebep: 'Yıl sonu mutabakatı', Durum: 'Reddedildi', TalepEdenAd: 'Can Y.', TalepEdenEposta: eposta('Can Y.'), OnaylayanAd: 'Murat T.', KararNotu: 'Maskeli rapor yeterli.', KararTarihi: ctx.iso(5), GecerlilikBitis: null },
    { ...base(ctx, 'Numara görüntüleme', 0, 'Zeynep A.'), TalepTuru: 'Numara Görüntüleme', Modul: 'Üst Yönetim Hatları', Kapsam: '6', Sebep: 'Arıza kaydı açılacak', Durum: 'Bekliyor', TalepEdenAd: 'Zeynep A.', TalepEdenEposta: eposta('Zeynep A.'), OnaylayanAd: '', KararNotu: '', KararTarihi: null, GecerlilikBitis: null },
  ];
  const log: Row<'erisim_log'>[] = [
    { ...base(ctx, 'Talep', 12, 'Elif D.'), Islem: 'Talep oluşturuldu', Modul: 'Üst Yönetim Hatları', Kapsam: '3', KayitId: '3', Sebep: 'Hat değişikliği teyidi', KullaniciAd: 'Elif D.', TalepId: '1' },
    { ...base(ctx, 'Onay', 12, 'Murat T.'), Islem: 'Onaylandı', Modul: 'Üst Yönetim Hatları', Kapsam: '3', KayitId: '3', Sebep: 'Uygun.', KullaniciAd: 'Murat T.', TalepId: '1' },
    { ...base(ctx, 'Görüntüleme', 12, 'Elif D.'), Islem: 'Numara görüntülendi', Modul: 'Üst Yönetim Hatları', Kapsam: '3', KayitId: '3', Sebep: '', KullaniciAd: 'Elif D.', TalepId: '1' },
    { ...base(ctx, 'Red', 5, 'Murat T.'), Islem: 'Reddedildi', Modul: 'Üst Yönetim Hatları', Kapsam: 'Tümü', KayitId: '', Sebep: 'Maskeli rapor yeterli.', KullaniciAd: 'Murat T.', TalepId: '2' },
    { ...base(ctx, 'Talep', 0, 'Zeynep A.'), Islem: 'Talep oluşturuldu', Modul: 'Üst Yönetim Hatları', Kapsam: '6', KayitId: '6', Sebep: 'Arıza kaydı açılacak', KullaniciAd: 'Zeynep A.', TalepId: '3' },
  ];
  return { onayci, talep, log };
}

/** Tüm demo verisini üretir (veritabanına yazmaz) — testlerde de kullanılır. */
export function buildSeed(now = new Date()) {
  const r = createRng(SEED);
  const ctx: Ctx = {
    r, now,
    iso: (daysAgo, hour = 10) => { const d = addDays(now, -daysAgo); d.setHours(hour, (daysAgo * 7) % 60, 0, 0); return d.toISOString(); },
    day: (offset) => { const d = addDays(now, offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  };
  const ekip: Omit<Ekip, 'ID'>[] = EKIP.map((e) => ({ ...base(ctx, e.ad, 365), Email: eposta(e.ad), Short: e.short, Color: e.color, IsManager: !!e.manager, Rol: e.rol }));
  return {
    ekip,
    altyapi: seedAltyapi(ctx),
    taahhut: seedTaahhut(ctx),
    ustHat: seedUstHat(ctx),
    vip: seedVip(ctx),
    ohe: seedOhe(ctx),
    rehber: seedRehber(ctx),
    hafiza: seedHafiza(ctx),
    diger: seedDiger(ctx),
    erisim: seedErisim(ctx),
  };
}

export async function seedDatabase(now = new Date()) {
  const s = buildSeed(now);
  await repo.bulkLoad('ekip', s.ekip);
  await repo.bulkLoad('altyapi', s.altyapi.rows);
  await repo.bulkLoad('altyapi_ek', s.altyapi.ekler);
  await repo.bulkLoad('gecmis', s.altyapi.gecmis);
  await repo.bulkLoad('taahhut', s.taahhut);
  await repo.bulkLoad('ust_hat', s.ustHat);
  await repo.bulkLoad('vip_talep', s.vip.talepler);
  await repo.bulkLoad('vip_meta', s.vip.meta);
  await repo.bulkLoad('vip_log', s.vip.log);
  await repo.bulkLoad('ohe_cihaz', s.ohe.cihaz);
  await repo.bulkLoad('ohe_stok', s.ohe.stok);
  await repo.bulkLoad('ohe_sync_log', s.ohe.sync);
  await repo.bulkLoad('ohe_gundem', s.ohe.gundem);
  await repo.bulkLoad('ohe_sat', s.ohe.sat);
  await repo.bulkLoad('ohe_test_hat', s.ohe.test);
  await repo.bulkLoad('ohe_butce', s.ohe.butceTanim);
  await repo.bulkLoad('ohe_harcama', s.ohe.harcama);
  await repo.bulkLoad('kades', s.ohe.kades);
  await repo.bulkLoad('rehber', s.rehber.rows);
  await repo.bulkLoad('rehber_arama', s.rehber.aramaRows);
  await repo.bulkLoad('hafiza', s.hafiza);
  await repo.bulkLoad('rapor', s.diger.rapor);
  await repo.bulkLoad('pusula', s.diger.pusula);
  await repo.bulkLoad('duyuru', s.diger.duyuru);
  await repo.bulkLoad('gorev', s.diger.gorev);
  await repo.bulkLoad('gorev_log', s.diger.gorevLog);
  await repo.bulkLoad('erisim_onayci', s.erisim.onayci);
  await repo.bulkLoad('erisim_talep', s.erisim.talep);
  await repo.bulkLoad('erisim_log', s.erisim.log);
  await repo.setMeta('seededAt', now.toISOString());
}

export async function ensureSeeded() {
  if (!(await repo.getMeta<string>('seededAt'))) await seedDatabase();
}

export async function resetDemo() {
  await repo.clearAll();
  await seedDatabase();
  repo.notifyAll();
}
