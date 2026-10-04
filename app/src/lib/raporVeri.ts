/** Raporlama ve Rapor Stüdyosu'nun ortak, saf özet hesapları. */
import type { Altyapi, OheButce, OheHarcama, Taahhut, VipTalep } from '../data/types';
import { choiceLabel, daysBetween } from './format';
import { DURUM_ETIKET, durumGrup, isAcik, type DurumGrup } from './rules';

export function altyapiDurum(rows: Altyapi[]) {
  const g: DurumGrup[] = ['beklemede', 'ust', 'onay', 'red'];
  return g.map((x) => ({ grup: x, label: DURUM_ETIKET[x], value: rows.filter((r) => durumGrup(r.OnayRed) === x).length }));
}
export function ilBazli(rows: Altyapi[], n = 8) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(r.Sehira, (m.get(r.Sehira) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
}
export function taahhutTakvim(rows: Taahhut[], ay = 6, now = new Date()) {
  return Array.from({ length: ay }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { label: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }), value: rows.filter((r) => r.TaahhutBitis.startsWith(key)).length };
  });
}
export function vipYas(rows: VipTalep[], now = new Date()) {
  const acik = rows.filter((r) => isAcik(r.Durum)).map((r) => daysBetween(r.AcilisTarihi, now));
  return [
    { label: '0–3 gün', value: acik.filter((d) => d < 4).length },
    { label: '4–7 gün', value: acik.filter((d) => d >= 4 && d < 8).length },
    { label: '8+ gün', value: acik.filter((d) => d >= 8).length },
  ];
}
export function butceKullanim(tanim: OheButce[], harcama: OheHarcama[]) {
  return tanim.filter((t) => t.Kategori !== '1. Genel').map((t) => {
    const h = harcama.filter((x) => choiceLabel(x.Kategori) === choiceLabel(t.Kategori)).reduce((a, x) => a + x.Tutar, 0);
    return { label: choiceLabel(t.Kategori), butce: t.ToplamButce, harcanan: h, oran: t.ToplamButce ? Math.round((h / t.ToplamButce) * 100) : 0 };
  });
}

export type SlaytId = 'ozet' | 'altyapi' | 'bekleyen' | 'taahhut' | 'vip' | 'ohe';
export const SLAYTLAR: { id: SlaytId; ad: string }[] = [
  { id: 'ozet', ad: 'Yönetici özeti (KPI)' }, { id: 'altyapi', ad: 'Altyapı durum ve il dağılımı' },
  { id: 'bekleyen', ad: 'Onay bekleyen talepler tablosu' }, { id: 'taahhut', ad: 'Taahhüt bitiş takvimi' },
  { id: 'vip', ad: 'VIP talep yaş dağılımı' }, { id: 'ohe', ad: 'ÖHE bütçe kullanımı' },
];
