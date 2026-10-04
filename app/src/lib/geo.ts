/**
 * ÖHE Yönlendirme için uygulama içi il/ilçe koordinat tablosu (yaklaşık merkez noktaları).
 * Harici harita servisi kullanılmaz; süre kuş uçuşu × yol katsayısı ile tahmin edilir.
 */
export interface Yer { il: string; ilce: string; lat: number; lon: number }

const IL_MERKEZ: [string, number, number][] = [
  ['Adana', 37.0, 35.32], ['Adıyaman', 37.76, 38.28], ['Afyonkarahisar', 38.76, 30.54], ['Ağrı', 39.72, 43.05],
  ['Aksaray', 38.37, 34.03], ['Amasya', 40.65, 35.83], ['Ankara', 39.93, 32.86], ['Antalya', 36.89, 30.71],
  ['Ardahan', 41.11, 42.7], ['Artvin', 41.18, 41.82], ['Aydın', 37.85, 27.85], ['Balıkesir', 39.65, 27.88],
  ['Bartın', 41.63, 32.34], ['Batman', 37.88, 41.13], ['Bayburt', 40.26, 40.23], ['Bilecik', 40.14, 29.98],
  ['Bingöl', 38.88, 40.5], ['Bitlis', 38.4, 42.11], ['Bolu', 40.74, 31.61], ['Burdur', 37.72, 30.29],
  ['Bursa', 40.19, 29.06], ['Çanakkale', 40.15, 26.41], ['Çankırı', 40.6, 33.62], ['Çorum', 40.55, 34.95],
  ['Denizli', 37.78, 29.09], ['Diyarbakır', 37.91, 40.24], ['Düzce', 40.84, 31.16], ['Edirne', 41.68, 26.56],
  ['Elazığ', 38.68, 39.22], ['Erzincan', 39.75, 39.49], ['Erzurum', 39.9, 41.27], ['Eskişehir', 39.78, 30.52],
  ['Gaziantep', 37.07, 37.38], ['Giresun', 40.91, 38.39], ['Gümüşhane', 40.46, 39.48], ['Hakkari', 37.57, 43.74],
  ['Hatay', 36.2, 36.16], ['Iğdır', 39.92, 44.05], ['Isparta', 37.76, 30.55], ['İstanbul', 41.01, 28.98],
  ['İzmir', 38.42, 27.14], ['Kahramanmaraş', 37.58, 36.94], ['Karabük', 41.2, 32.62], ['Karaman', 37.18, 33.22],
  ['Kars', 40.6, 43.1], ['Kastamonu', 41.38, 33.78], ['Kayseri', 38.73, 35.48], ['Kilis', 36.72, 37.12],
  ['Kırıkkale', 39.85, 33.51], ['Kırklareli', 41.74, 27.22], ['Kırşehir', 39.15, 34.16], ['Kocaeli', 40.77, 29.94],
  ['Konya', 37.87, 32.48], ['Kütahya', 39.42, 29.98], ['Malatya', 38.36, 38.31], ['Manisa', 38.61, 27.43],
  ['Mardin', 37.31, 40.74], ['Mersin', 36.8, 34.64], ['Muğla', 37.22, 28.36], ['Muş', 38.75, 41.5],
  ['Nevşehir', 38.62, 34.71], ['Niğde', 37.97, 34.68], ['Ordu', 40.98, 37.88], ['Osmaniye', 37.07, 36.25],
  ['Rize', 41.02, 40.52], ['Sakarya', 40.69, 30.44], ['Samsun', 41.29, 36.33], ['Şanlıurfa', 37.17, 38.79],
  ['Siirt', 37.93, 41.94], ['Sinop', 42.03, 35.15], ['Şırnak', 37.52, 42.46], ['Sivas', 39.75, 37.02],
  ['Tekirdağ', 40.98, 27.51], ['Tokat', 40.31, 36.55], ['Trabzon', 41.0, 39.72], ['Tunceli', 39.11, 39.55],
  ['Uşak', 38.68, 29.41], ['Van', 38.5, 43.38], ['Yalova', 40.66, 29.27], ['Yozgat', 39.82, 34.81],
  ['Zonguldak', 41.45, 31.79],
];

const ILCE: [string, string, number, number][] = [
  ['İstanbul', 'Kadıköy', 40.99, 29.03], ['İstanbul', 'Beşiktaş', 41.04, 29.01], ['İstanbul', 'Şişli', 41.06, 28.99],
  ['İstanbul', 'Üsküdar', 41.03, 29.02], ['İstanbul', 'Bakırköy', 40.98, 28.87], ['İstanbul', 'Sarıyer', 41.17, 29.05],
  ['İstanbul', 'Ataşehir', 40.99, 29.12], ['İstanbul', 'Beylikdüzü', 40.98, 28.64], ['İstanbul', 'Pendik', 40.88, 29.25],
  ['İstanbul', 'Silivri', 41.07, 28.25], ['İstanbul', 'Şile', 41.18, 29.61],
  ['Ankara', 'Çankaya', 39.9, 32.86], ['Ankara', 'Keçiören', 39.98, 32.87], ['Ankara', 'Yenimahalle', 39.97, 32.8],
  ['Ankara', 'Etimesgut', 39.95, 32.67], ['Ankara', 'Gölbaşı', 39.79, 32.81], ['Ankara', 'Polatlı', 39.58, 32.15],
  ['Ankara', 'Beypazarı', 40.17, 31.92],
  ['İzmir', 'Konak', 38.42, 27.13], ['İzmir', 'Karşıyaka', 38.46, 27.11], ['İzmir', 'Bornova', 38.47, 27.22],
  ['İzmir', 'Çeşme', 38.32, 26.3], ['İzmir', 'Urla', 38.32, 26.77], ['İzmir', 'Bergama', 39.12, 27.18],
  ['İzmir', 'Seferihisar', 38.2, 26.84],
  ['Muğla', 'Bodrum', 37.03, 27.43], ['Muğla', 'Marmaris', 36.85, 28.27], ['Muğla', 'Fethiye', 36.62, 29.12],
  ['Muğla', 'Dalaman', 36.77, 28.8], ['Muğla', 'Menteşe', 37.22, 28.36], ['Muğla', 'Datça', 36.73, 27.69],
  ['Muğla', 'Milas', 37.32, 27.78],
  ['Antalya', 'Muratpaşa', 36.88, 30.71], ['Antalya', 'Alanya', 36.54, 32.0], ['Antalya', 'Kemer', 36.6, 30.56],
  ['Antalya', 'Kaş', 36.2, 29.64], ['Antalya', 'Manavgat', 36.79, 31.44],
  ['Aydın', 'Kuşadası', 37.86, 27.26], ['Aydın', 'Didim', 37.38, 27.27], ['Aydın', 'Efeler', 37.85, 27.84],
  ['Balıkesir', 'Ayvalık', 39.32, 26.69], ['Balıkesir', 'Edremit', 39.6, 27.02], ['Balıkesir', 'Karesi', 39.65, 27.88],
  ['Bursa', 'Osmangazi', 40.2, 29.06], ['Bursa', 'Nilüfer', 40.21, 28.98], ['Bursa', 'Mudanya', 40.38, 28.88],
  ['Çanakkale', 'Bozcaada', 39.83, 26.07], ['Çanakkale', 'Gelibolu', 40.41, 26.67],
  ['Tekirdağ', 'Süleymanpaşa', 40.98, 27.51], ['Tekirdağ', 'Çorlu', 41.16, 27.8],
  ['Kocaeli', 'İzmit', 40.77, 29.92], ['Kocaeli', 'Gebze', 40.8, 29.43],
  ['Eskişehir', 'Odunpazarı', 39.76, 30.53], ['Eskişehir', 'Tepebaşı', 39.79, 30.5],
  ['Konya', 'Selçuklu', 37.95, 32.5], ['Konya', 'Meram', 37.84, 32.43],
  ['Kayseri', 'Melikgazi', 38.73, 35.49], ['Nevşehir', 'Ürgüp', 38.63, 34.91],
  ['Trabzon', 'Ortahisar', 41.0, 39.72], ['Samsun', 'Atakum', 41.33, 36.27], ['Samsun', 'İlkadım', 41.29, 36.33],
  ['Gaziantep', 'Şahinbey', 37.05, 37.37], ['Diyarbakır', 'Kayapınar', 37.94, 40.17], ['Erzurum', 'Yakutiye', 39.91, 41.27],
  ['Van', 'İpekyolu', 38.5, 43.38], ['Mersin', 'Yenişehir', 36.79, 34.6], ['Adana', 'Seyhan', 36.99, 35.32],
];

export const YERLER: Yer[] = [
  ...ILCE.map(([il, ilce, lat, lon]) => ({ il, ilce, lat, lon })),
  ...IL_MERKEZ.filter(([il]) => !ILCE.some((x) => x[0] === il)).map(([il, lat, lon]) => ({ il, ilce: 'Merkez', lat, lon })),
].sort((a, b) => a.il.localeCompare(b.il, 'tr') || a.ilce.localeCompare(b.ilce, 'tr'));

export const ILLER = [...new Set(YERLER.map((y) => y.il))];
export const ilceler = (il: string) => YERLER.filter((y) => y.il === il).map((y) => y.ilce);
export const yerBul = (il: string, ilce: string) => YERLER.find((y) => y.il === il && y.ilce === ilce);

export interface OheEkip { ad: string; il: string; ilce: string; lat: number; lon: number }
/** ÖHE ekip konumları: Ankara (2), İstanbul (2), Bodrum (1), İzmir (1). */
export const OHE_EKIPLERI: OheEkip[] = [
  { ad: 'Ankara Ekip 1', il: 'Ankara', ilce: 'Çankaya', lat: 39.9, lon: 32.86 },
  { ad: 'Ankara Ekip 2', il: 'Ankara', ilce: 'Yenimahalle', lat: 39.97, lon: 32.8 },
  { ad: 'İstanbul Avrupa Ekibi', il: 'İstanbul', ilce: 'Şişli', lat: 41.06, lon: 28.99 },
  { ad: 'İstanbul Anadolu Ekibi', il: 'İstanbul', ilce: 'Ataşehir', lat: 40.99, lon: 29.12 },
  { ad: 'Bodrum Ekibi', il: 'Muğla', ilce: 'Bodrum', lat: 37.03, lon: 27.43 },
  { ad: 'İzmir Ekibi', il: 'İzmir', ilce: 'Bornova', lat: 38.47, lon: 27.22 },
];

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const YOL_KATSAYISI = 1.3;
export const ORT_HIZ_KMS = 75;
export const HAZIRLIK_SAAT = 0.25;

export interface Tahmin { ekip: OheEkip; kusUcusuKm: number; yolKm: number; aralik: string; minSaat: number; ucakOnerisi: boolean }

/** Süreyi net değil aralık olarak verir: "30–45 dk", "2–3 saat". */
export function sureAraligi(saat: number): string {
  if (saat < 1) {
    const lo = Math.max(15, Math.floor((saat * 60) / 15) * 15);
    const hi = Math.ceil((saat * 1.3 * 60 + 1) / 15) * 15;
    return hi >= 60 ? `${lo} dk – 1 saat` : `${lo}–${Math.max(hi, lo + 15)} dk`;
  }
  const lo = Math.max(1, Math.floor(saat));
  let hi = Math.ceil(saat * 1.25);
  if (hi <= lo) hi = lo + 1;
  return `${lo}–${hi} saat`;
}

export function tahminEt(hedef: { lat: number; lon: number }): Tahmin[] {
  return OHE_EKIPLERI.map((ekip) => {
    const kus = haversineKm(ekip, hedef);
    const yol = kus * YOL_KATSAYISI;
    const saat = yol / ORT_HIZ_KMS + HAZIRLIK_SAAT;
    return { ekip, kusUcusuKm: kus, yolKm: yol, aralik: sureAraligi(saat), minSaat: saat, ucakOnerisi: saat > 8 };
  }).sort((a, b) => a.minSaat - b.minSaat);
}

/** Mesai: hafta içi 08:30–17:30. */
export function mesaiDisiMi(d: Date): boolean {
  const g = d.getDay();
  if (g === 0 || g === 6) return true;
  const dk = d.getHours() * 60 + d.getMinutes();
  return dk < 8 * 60 + 30 || dk > 17 * 60 + 30;
}
