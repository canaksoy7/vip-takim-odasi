/** İş kuralları — saf fonksiyonlar (Vitest ile test edilir). */
import type { Altyapi, OnayRed, VipDurum } from '../data/types';
import { daysBetween, trNorm } from './format';

// ── VVIP Altyapı ─────────────────────────────────────────
export type DurumGrup = 'beklemede' | 'ust' | 'onay' | 'red';
export function durumGrup(o: OnayRed): DurumGrup {
  if (o === '1. Onay') return 'onay';
  if (o === '2. Red') return 'red';
  if (o === 'Üst Yönetime Sunuldu - Bekliyor') return 'ust';
  return 'beklemede';
}
export const DURUM_ETIKET: Record<DurumGrup, string> = {
  beklemede: 'Beklemede', ust: 'Üst yönetimde', onay: 'Onay', red: 'Red',
};

/** Bekleme süresi: Beklemede → oluşturma tarihinden, Üst yönetimde → sunulma tarihinden. Karar verilmişse null. */
export function beklemeGunu(r: Pick<Altyapi, 'OnayRed' | 'Created' | 'SunulmaTarihi'>, now = new Date()): number | null {
  const g = durumGrup(r.OnayRed);
  if (g === 'beklemede') return daysBetween(r.Created, now);
  if (g === 'ust') return daysBetween(r.SunulmaTarihi ?? r.Created, now);
  return null;
}

export type GecikmeSeviye = 'yok' | 'sari' | 'turuncu' | 'kirmizi';
/** 4+ gün sarı, 7+ turuncu, 14+ kırmızı. */
export function gecikmeSeviyesi(gun: number | null): GecikmeSeviye {
  if (gun === null) return 'yok';
  if (gun >= 14) return 'kirmizi';
  if (gun >= 7) return 'turuncu';
  if (gun >= 4) return 'sari';
  return 'yok';
}
/** "Geciken" filtresi: karar bekleyen ve 7+ gündür bekleyen kayıtlar. */
export const GECIKEN_ESIK = 7;

/** İzin verilen durum geçişleri. */
export function sonrakiDurumlar(o: OnayRed): OnayRed[] {
  switch (durumGrup(o)) {
    case 'beklemede': return ['Üst Yönetime Sunuldu - Bekliyor'];
    case 'ust': return ['1. Onay', '2. Red'];
    default: return [];
  }
}

/**
 * Proje türü yalnızca BF (brownfield) ya da GF (greenfield).
 * "Alan Bazlı" veya tanınmayan değer → bölgede çalışan DSL ya da mevcut altyapı varsa BF, yoksa GF.
 */
export function normalizeProjeTuru(input: string, ctx: { CalisanDSL?: number; MevcutAltyapi?: string } = {}): 'BF' | 'GF' {
  const t = trNorm(input).trim();
  if (/^bf\b|brown/.test(t)) return 'BF';
  if (/^gf\b|green/.test(t)) return 'GF';
  const altyapi = trNorm(ctx.MevcutAltyapi ?? '').trim();
  const altyapiVar = altyapi !== '' && altyapi !== 'yok' && altyapi !== '-';
  return (ctx.CalisanDSL ?? 0) > 0 || altyapiVar ? 'BF' : 'GF';
}

// ── Talep metni gerekçesi ───────────────────────────────────
export const HP_BASI_ESIK = 5500;
export function redGerekcesi(hpBasiMaliyet: number): string {
  return hpBasiMaliyet > HP_BASI_ESIK
    ? 'HP başı maliyet sebebiyle ticari olarak uygun değildir'
    : 'bölge bütçesi bulunmadığı için uygun görülmemiştir';
}

// ── VIP Talep Takip ────────────────────────────────────────
/** Açık = Devam + Takip. Ön Başvuru ve Kapalı kapalı sayılır. */
export const isAcik = (d: VipDurum) => d === 'Devam' || d === 'Takip';
export type YasRenk = 'yok' | 'sari' | 'kirmizi';
/** Açık talepte yaş: 4+ gün sarı, 8+ gün kırmızı. */
export function yasRengi(gun: number, acik: boolean): YasRenk {
  if (!acik) return 'yok';
  if (gun >= 8) return 'kirmizi';
  if (gun >= 4) return 'sari';
  return 'yok';
}
/** Başlıkta VVIP geçiyor mu (büyük/küçük harf ve İ/ı varyasyonları dahil). */
export const isVvipBaslik = (s: string) => trNorm(s).includes('vvip');
export const VVIP_UYARI_GUN = 7;

// ── Taahhüt ───────────────────────────────────────────────
export const TAAHHUT_ESIKLERI = [30, 15, 7] as const;
/** Kalan güne göre tetiklenen en dar eşik (ör. 10 gün → 15). Süresi geçmiş ya da uzaksa null. */
export function taahhutEsigi(kalanGun: number): number | null {
  if (kalanGun < 0) return null;
  let e: number | null = null;
  for (const t of TAAHHUT_ESIKLERI) if (kalanGun <= t) e = t;
  return e;
}
export type TaahhutGrup = 'gecmis' | 'yakin' | 'uzak';
export function taahhutGrubu(kalanGun: number): TaahhutGrup {
  if (kalanGun < 0) return 'gecmis';
  if (kalanGun <= 30) return 'yakin';
  return 'uzak';
}
/** Aynı numarada tarih aralığı çakışan taahhütleri bulur → çakışan kayıt ID'leri. */
export function cakismalar<T extends { ID: number; MSISDN: string; TaahhutBaslangic: string; TaahhutBitis: string }>(list: T[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const by = new Map<string, T[]>();
  for (const r of list) by.set(r.MSISDN, [...(by.get(r.MSISDN) ?? []), r]);
  for (const grp of by.values()) {
    for (let i = 0; i < grp.length; i++)
      for (let j = i + 1; j < grp.length; j++) {
        const a = grp[i], b = grp[j];
        if (a.TaahhutBaslangic <= b.TaahhutBitis && b.TaahhutBaslangic <= a.TaahhutBitis) {
          out.set(a.ID, [...(out.get(a.ID) ?? []), b.ID]);
          out.set(b.ID, [...(out.get(b.ID) ?? []), a.ID]);
        }
      }
  }
  return out;
}

// ── Ek indirim ───────────────────────────────────────────────
export interface IndirimSatir { ad: string; taahhutsuz: number; taahhutlu: number; hedef: number }
export interface IndirimSonuc { ad: string; taahhutIndirimi: number; ekIndirim: number; ekOran: number; toplamOran: number }
/** Taahhütsüz → taahhütlü fark ve taahhütlüden hedefe inmek için gereken ek indirim. */
export function ekIndirim(s: IndirimSatir): IndirimSonuc {
  const taahhutIndirimi = Math.max(0, s.taahhutsuz - s.taahhutlu);
  const ekIndirim = Math.max(0, s.taahhutlu - s.hedef);
  const ekOran = s.taahhutlu > 0 ? (ekIndirim / s.taahhutlu) * 100 : 0;
  const toplamOran = s.taahhutsuz > 0 ? ((s.taahhutsuz - Math.min(s.hedef, s.taahhutsuz)) / s.taahhutsuz) * 100 : 0;
  return { ad: s.ad, taahhutIndirimi, ekIndirim, ekOran, toplamOran };
}

// ── ÖHE gündem ──────────────────────────────────────────────
export const GUNDEM_GECIKME_GUN = 30;
