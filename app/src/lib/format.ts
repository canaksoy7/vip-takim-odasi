/** tr-TR biçimlendirme yardımcıları. */

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const tlFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat('tr-TR');

export const fmtDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const fmtDateTime = (iso?: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const fmtTL = (n?: number | null) => (n === null || n === undefined || Number.isNaN(n) ? '—' : tlFmt.format(n));
export const fmtNum = (n?: number | null) => (n === null || n === undefined ? '—' : numFmt.format(n));

/** Tek ondalıklı Türkçe sayı; ",0" düşer. */
function oneDecimal(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

/** Para birimi K / M biçimi: 87200 → "87,2 K TL", 1600000 → "1,6 M TL", 850 → "850 TL". */
export function fmtKM(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${oneDecimal(n / 1_000_000)} M TL`;
  if (a >= 1_000) return `${oneDecimal(n / 1_000)} K TL`;
  return `${Math.round(n).toLocaleString('tr-TR')} TL`;
}

/** Fiber mesafesi: 999 m'ye kadar "mt.", üstü "km.". */
export function fmtMesafe(m: number): string {
  if (m <= 999) return `${Math.round(m)} mt.`;
  return `${oneDecimal(m / 1000)} km.`;
}

/** Mevcut hız: sayı + "Mbps" ("16 mbps", "16", "16 Mb" → "16 Mbps"). */
export function fmtHiz(v: string | number): string {
  const m = String(v).replace(',', '.').match(/\d+(\.\d+)?/);
  if (!m) return String(v).trim() || '—';
  return `${Number(m[0]).toLocaleString('tr-TR')} Mbps`;
}

/**
 * Numara maskeleme: ilk 4 hane (0 5XX) ve son 2 hane açık, aradakiler "*".
 * "0 5XX 000 00 01" → "0 5XX *** ** 01". Boşluklar korunur.
 */
export function maskNumber(s: string): string {
  const chars = [...s];
  const pos = chars.map((c, i) => (/[0-9Xx]/.test(c) ? i : -1)).filter((i) => i >= 0);
  const keep = new Set([...pos.slice(0, 4), ...pos.slice(-2)]);
  return chars.map((c, i) => (pos.includes(i) && !keep.has(i) ? '*' : c)).join('');
}

/** Türkçe karakter ve büyük/küçük harf duyarsız karşılaştırma için normalleştirme. */
export function trNorm(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/i̇/g, 'i')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const DAY = 86_400_000;
/** İki tarih arasındaki tam gün sayısı (yerel gün sınırlarına göre). */
export function daysBetween(fromIso: string, to: Date = new Date()): number {
  const a = new Date(fromIso); a.setHours(0, 0, 0, 0);
  const b = new Date(to); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY);
}
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** SharePoint seçenek metnindeki "1. " önekini gizler. */
export const choiceLabel = (s?: string | null) => (s ? s.replace(/^\d+\.\s*/, '') : '—');
