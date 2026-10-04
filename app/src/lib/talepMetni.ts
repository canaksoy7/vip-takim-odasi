/**
 * Altyapı Talep Metni Oluşturucu — yapay zekâ kullanmayan, kural tabanlı ayrıştırıcı ve metin üretici.
 * Bölgeden gelen "Anahtar: Değer" satırlarını ya da sekmeyle ayrılmış başlık+değer tablosunu okur.
 */
import { fmtHiz, fmtKM, fmtMesafe, trNorm } from './format';
import { normalizeProjeTuru, redGerekcesi } from './rules';

export interface TalepBilgi {
  projeId?: string;
  projeTuruHam?: string;
  projeTuru?: 'BF' | 'GF';
  hp?: number;
  hpBasi?: number;
  dsl?: number;
  aboneBasi?: number;
  abone?: number;
  toplam?: number;
  fiberM?: number;
  hiz?: string;
  altyapi?: string;
  il?: string;
  ilce?: string;
  talep?: string;
  adres?: string;
  harita?: string;
}

const ALIAS: [keyof TalepBilgi, string[]][] = [
  ['projeId', ['proje id', 'proje no', 'projeid', 'proje numarasi']],
  ['projeTuruHam', ['proje turu', 'proje tipi', 'proje tur']],
  ['hpBasi', ['hp basi maliyet', 'hp basi', 'hp basina maliyet', 'hp basina']],
  ['hp', ['hp', 'hp sayisi', 'hane sayisi', 'hane']],
  ['dsl', ['calisan dsl sayisi', 'calisan dsl', 'aktif dsl', 'dsl']],
  ['aboneBasi', ['abone basi maliyet', 'abone basi', 'abone basina maliyet']],
  ['abone', ['abone ongorusu', 'abone sayisi', 'abone']],
  ['toplam', ['toplam maliyet', 'maliyet tutari', 'toplam', 'maliyet']],
  ['fiberM', ['fiber mesafesi', 'fiber mesafe', 'fiber', 'mesafe']],
  ['hiz', ['mevcut hiz', 'hiz']],
  ['altyapi', ['mevcut altyapi', 'altyapi']],
  ['ilce', ['ilce']],
  ['il', ['il', 'sehir']],
  ['talep', ['talep sahibi', 'talep eden', 'musteri', 'kurum', 'talep']],
  ['adres', ['adres', 'lokasyon', 'konum']],
  ['harita', ['harita', 'koordinat', 'harita linki']],
];

function keyFor(rawKey: string): keyof TalepBilgi | undefined {
  const k = trNorm(rawKey).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [field, names] of ALIAS) if (names.includes(k)) return field;
  for (const [field, names] of ALIAS) if (names.some((n) => n.length > 3 && k.startsWith(n))) return field;
  return undefined;
}

/** "87.200,50 TL" · "87,2 K" · "1,6 M TL" · "5500" · "1,2 km" → sayı. */
export function parseTrNumber(s: string, tur: 'para' | 'mesafe' | 'sayi' = 'para'): number | undefined {
  const t = trNorm(s);
  const m = t.match(/-?\d[\d.\s]*(,\d+)?/);
  if (!m) return undefined;
  let num = m[0].replace(/\s/g, '');
  // Binlik ayırıcı nokta, ondalık virgül; "5.5" gibi tek nokta + 1-2 hane → ondalık say
  if (/^\d+\.\d{1,2}$/.test(num)) num = num.replace('.', ',');
  num = num.replace(/\./g, '').replace(',', '.');
  let v = Number(num);
  if (Number.isNaN(v)) return undefined;
  const rest = t.slice((m.index ?? 0) + m[0].length).trim();
  if (tur === 'mesafe') return /^km\b/.test(rest) ? v * 1_000 : v; // "m", "mt", "metre" → metre
  if (/^(m|mn|milyon)\b/.test(rest)) v *= 1_000_000;
  else if (/^(k|bin)\b/.test(rest)) v *= 1_000;
  return v;
}

const NUMERIC: (keyof TalepBilgi)[] = ['hp', 'hpBasi', 'dsl', 'aboneBasi', 'abone', 'toplam', 'fiberM'];

export function parseTalep(text: string): TalepBilgi {
  const out: Record<string, unknown> = {};
  const set = (field: keyof TalepBilgi, val: string) => {
    const v = val.trim();
    if (!v || out[field] !== undefined) return;
    out[field] = NUMERIC.includes(field) ? parseTrNumber(v, field === 'fiberM' ? 'mesafe' : ['hp', 'dsl', 'abone'].includes(field) ? 'sayi' : 'para') : v;
  };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Sekmeli tablo: başlık satırı + değer satırı
  for (let i = 0; i < lines.length - 1; i++) {
    const head = lines[i].split('\t');
    if (head.length < 3) continue;
    const vals = lines[i + 1].split('\t');
    const fields = head.map(keyFor);
    if (fields.filter(Boolean).length >= 3) {
      fields.forEach((f, j) => { if (f && vals[j] !== undefined) set(f, vals[j]); });
      i++;
    }
  }
  // "Anahtar: Değer" / "Anahtar - Değer" / "Anahtar<TAB>Değer"
  for (const l of lines) {
    const m = l.match(/^[-•*\s]*([^:\t]{2,40}?)\s*(?::|\t| - | – )\s*(.+)$/);
    if (!m) continue;
    const f = keyFor(m[1]);
    if (f) set(f, m[2]);
  }

  const b = out as TalepBilgi;
  if (b.hpBasi === undefined && b.toplam && b.hp) b.hpBasi = b.toplam / b.hp;
  if (b.aboneBasi === undefined && b.toplam && b.abone) b.aboneBasi = b.toplam / b.abone;
  if (b.projeTuruHam !== undefined || b.dsl !== undefined || b.altyapi !== undefined) {
    b.projeTuru = normalizeProjeTuru(b.projeTuruHam ?? '', { CalisanDSL: b.dsl, MevcutAltyapi: b.altyapi });
  }
  return b;
}

export interface TalepCikti { anlatim: string; kunye: [string, string][]; gerekce: string | null; eksikler: string[] }

const yer = (b: TalepBilgi) => [b.ilce, b.il].filter(Boolean).join(' / ');

export function uretTalepMetni(b: TalepBilgi): TalepCikti {
  const parca: string[] = [];
  const yerStr = yer(b);
  const giris = [b.talep ? `${b.talep} talebi kapsamında` : 'İlgili talep kapsamında', yerStr, b.adres].filter(Boolean).join(' ');
  parca.push(`${giris} için altyapı çalışması değerlendirilmiştir.`);

  if (b.projeTuru === 'GF') {
    parca.push(`Bölge yeni yerleşim alanı niteliğinde olup proje GF olarak planlanmıştır${b.hp ? ` (${b.hp.toLocaleString('tr-TR')} HP)` : ''}.`);
  } else if (b.projeTuru === 'BF') {
    const bf: string[] = [];
    if (b.altyapi) bf.push(`mevcut ${b.altyapi} altyapısı`);
    if (b.hiz) bf.push(`${fmtHiz(b.hiz)} hız`);
    const dsl = b.dsl !== undefined ? `, ${b.dsl.toLocaleString('tr-TR')} çalışan DSL bulunmaktadır` : '';
    const hp = b.hp ? `${b.hp.toLocaleString('tr-TR')} HP'lik bölgede ` : 'Bölgede ';
    parca.push(`${hp}${bf.length ? bf.join(' ile ') + ' sunulmakta' : 'hizmet verilmekte'}${dsl}.`);
  } else if (b.hp) {
    parca.push(`Bölgede ${b.hp.toLocaleString('tr-TR')} HP bulunmaktadır.`);
  }

  const maliyet: string[] = [];
  if (b.toplam !== undefined) maliyet.push(`toplam maliyet ${fmtKM(b.toplam)}`);
  if (b.hpBasi !== undefined) maliyet.push(`HP başı ${fmtKM(b.hpBasi)}`);
  if (b.aboneBasi !== undefined) maliyet.push(`abone başı ${fmtKM(b.aboneBasi)}`);
  if (maliyet.length) {
    const s = maliyet.join(', ');
    parca.push(`Projede ${s}${b.fiberM !== undefined ? `, fiber mesafesi ${fmtMesafe(b.fiberM)}` : ''} olarak hesaplanmıştır.`);
  } else if (b.fiberM !== undefined) {
    parca.push(`Fiber mesafesi: ${fmtMesafe(b.fiberM)}`);
  }

  const gerekce = b.hpBasi !== undefined ? redGerekcesi(b.hpBasi) : null;
  if (gerekce) parca.push(`Talep, ${gerekce}.`);

  const kunye: [string, string][] = [
    ['Proje ID', b.projeId ?? '—'],
    ['Proje Türü', b.projeTuru ?? '—'],
    ['HP', b.hp !== undefined ? b.hp.toLocaleString('tr-TR') : '—'],
    ['HP Başı Maliyet', b.hpBasi !== undefined ? fmtKM(b.hpBasi) : '—'],
    ['Çalışan DSL', b.dsl !== undefined ? b.dsl.toLocaleString('tr-TR') : '—'],
    ['Abone Başı Maliyet', b.aboneBasi !== undefined ? fmtKM(b.aboneBasi) : '—'],
    ['Toplam Maliyet', b.toplam !== undefined ? fmtKM(b.toplam) : '—'],
    ['Fiber Mesafesi', b.fiberM !== undefined ? fmtMesafe(b.fiberM) : '—'],
    ['Harita', b.harita ?? '—'],
  ];
  const eksikler = kunye.filter(([, v]) => v === '—').map(([k]) => k);
  return { anlatim: parca.join(' '), kunye, gerekce, eksikler };
}

/** Demo için hazır, tamamen uydurma yapıştırma metinleri. */
export const ORNEK_METINLER: { ad: string; metin: string }[] = [
  {
    ad: 'Mail — BF, yüksek maliyet',
    metin: `Merhaba,
Bölgemizden gelen talep bilgileri aşağıdadır.
Talep Sahibi: Yıldız Tepe Sitesi Yönetimi
İl: Muğla
İlçe: Bodrum
Adres: Gündoğan Mah. Örnek Sok. No:0
Proje ID: 900123
Proje Türü: BF
HP: 42
Çalışan DSL: 11
Mevcut Altyapı: Bakır
Mevcut Hız: 16 mbps
Toplam Maliyet: 312.400 TL
Fiber Mesafesi: 2.350 m
Harita: Ekte
İyi çalışmalar.`,
  },
  {
    ad: 'Tablo — Alan Bazlı, düşük maliyet',
    metin: `Proje ID\tProje Türü\tHP\tÇalışan DSL\tToplam Maliyet\tFiber Mesafesi\tİl\tİlçe\tTalep Sahibi
900245\tAlan Bazlı\t160\t0\t704.000 TL\t640 m\tİzmir\tUrla\tZeytinlik Konutları Kooperatifi`,
  },
  {
    ad: 'Kısa not — K/M biçimli',
    metin: `- Talep: Örnek Teknopark Yönetimi
- İl: Ankara  
- İlçe: Gölbaşı
- Proje No: 900377
- Proje Tipi: Alan Bazlı
- HP Sayısı: 18
- Aktif DSL: 6
- Mevcut Altyapı: VDSL
- Hız: 35
- Maliyet: 1,6 M TL
- Abone Öngörüsü: 12
- Mesafe: 1,8 km`,
  },
];
