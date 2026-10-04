/** VIP Yatırım Değerlendirmesi metni — kısa, tekrarsız, "ne eksik ne fazla". */
import type { Altyapi } from '../data/types';
import { choiceLabel, fmtDate, fmtHiz, fmtKM, fmtMesafe } from './format';
import { durumGrup, redGerekcesi } from './rules';

/** Başlık biçimi: `ProjeID / Talep — İlçe / İl` */
export const raporBasligi = (r: Pick<Altyapi, 'ProjeID' | 'Title' | 'Ilce' | 'Sehira'>) =>
  `${r.ProjeID} / ${r.Title} — ${[r.Ilce, r.Sehira].filter(Boolean).join(' / ')}`;

/** Cümle sonuna nokta ekler; "km." gibi kısaltmayla bitiyorsa ikinci nokta eklemez. */
export const nokta = (s: string) => (s.endsWith('.') ? s : `${s}.`);

export function yatirimMetni(r: Altyapi): string {
  const s: string[] = [];
  const kapsam = choiceLabel(r.AnaKategori).toLocaleLowerCase('tr-TR');
  const hp = r.HP ? `${r.HP.toLocaleString('tr-TR')} HP'lik ` : '';
  if (r.ProjeTuru === 'GF') {
    s.push(`Talep, ${kapsam} kapsamında ${hp}yeni yerleşim alanı (GF) için fiber altyapı kurulumunu içermektedir.`);
  } else {
    const mevcut = r.MevcutAltyapi && r.MevcutAltyapi !== 'Yok' ? `mevcut ${r.MevcutAltyapi} altyapısının ` : 'mevcut altyapının ';
    s.push(`Talep, ${kapsam} kapsamında ${hp}bölgede ${mevcut}fibere dönüştürülmesini içermektedir.`);
    const dsl = r.CalisanDSL ? `${r.CalisanDSL.toLocaleString('tr-TR')} çalışan DSL` : '';
    const hiz = r.MevcutHiz ? `mevcut hız ${fmtHiz(r.MevcutHiz)}` : '';
    if (dsl || hiz) s.push(`Bölgede ${[dsl, hiz].filter(Boolean).join(', ')}${dsl && !hiz ? ' bulunmaktadır' : ''}.`);
  }
  const m: string[] = [];
  if (r.MaliyetTutari) m.push(`toplam maliyet ${fmtKM(r.MaliyetTutari)}`);
  if (r.HPBasiMaliyet) m.push(`HP başı ${fmtKM(r.HPBasiMaliyet)}`);
  if (r.AboneBasiMaliyet) m.push(`abone başı ${fmtKM(r.AboneBasiMaliyet)}`);
  if (r.FiberMesafesi) m.push(`fiber mesafesi ${fmtMesafe(r.FiberMesafesi)}`);
  if (m.length) s.push(nokta(`${m[0][0].toLocaleUpperCase('tr-TR')}${m.join(', ').slice(1)}`));
  switch (durumGrup(r.OnayRed)) {
    case 'onay': s.push(`Proje ${choiceLabel(r.ButceTuru)} bütçesinden onaylanmıştır${r.TahminiTamamlanma ? `; tahmini tamamlanma ${fmtDate(r.TahminiTamamlanma)}` : ''}.`); break;
    case 'red': s.push(`Talep, ${redGerekcesi(r.HPBasiMaliyet)}.`); break;
    case 'ust': s.push(`Talep ${fmtDate(r.SunulmaTarihi)} tarihinde üst yönetim onayına sunulmuştur.`); break;
    default: s.push('Talep değerlendirme aşamasındadır.');
  }
  return s.join(' ');
}
