/** Maskeli numaralar için yönetici onaylı, süreli görünürlük akışı ve erişim günlüğü. */
import { repo, getCurrentUser } from './repo';
import { bildir } from './notify';
import type { ErisimTalep, ErisimTalepTuru } from './types';

export const ERISIM_SURE_DK = 15;

export function aktifIzin(talepler: ErisimTalep[], kullanici: string, modul: string, kapsam: string, tur: ErisimTalepTuru, now = new Date()): ErisimTalep | undefined {
  return talepler.find((t) =>
    t.Durum === 'Onaylandı' && t.TalepEdenAd === kullanici && t.Modul === modul &&
    (tur === 'Tam Numaralı Rapor' ? t.TalepTuru === 'Tam Numaralı Rapor' && t.Kapsam === 'Tümü' : t.Kapsam === kapsam || t.Kapsam === 'Tümü') &&
    !!t.GecerlilikBitis && new Date(t.GecerlilikBitis) > now);
}

export const bekleyenTalep = (talepler: ErisimTalep[], kullanici: string, modul: string, kapsam: string, tur: ErisimTalepTuru) =>
  talepler.find((t) => t.Durum === 'Bekliyor' && t.TalepEdenAd === kullanici && t.Modul === modul && t.Kapsam === kapsam && t.TalepTuru === tur);

export async function logla(islem: string, modul: string, kapsam: string, kayitId: string, sebep = '', talepId = '') {
  await repo.create('erisim_log', { Title: islem, Islem: islem, Modul: modul, Kapsam: kapsam, KayitId: kayitId, Sebep: sebep, KullaniciAd: getCurrentUser(), TalepId: talepId });
}

export async function talepEt(tur: ErisimTalepTuru, modul: string, kapsam: string, sebep: string) {
  const kim = getCurrentUser();
  const t = await repo.create('erisim_talep', {
    Title: tur, TalepTuru: tur, Modul: modul, Kapsam: kapsam, Sebep: sebep, Durum: 'Bekliyor', TalepEdenAd: kim,
    TalepEdenEposta: '', OnaylayanAd: '', KararNotu: '', KararTarihi: null, GecerlilikBitis: null,
  });
  await logla('Talep oluşturuldu', modul, kapsam, kapsam === 'Tümü' ? '' : kapsam, sebep, String(t.ID));
  await bildir({ tur: 'Erişim talebi', modul: 'ust-hat', kayitId: t.ID, aliciRolu: 'Yönetici (Onaycı)', konu: `[Erişim] ${kim}: ${tur} talebi`, govde: `Modül: ${modul}\nKapsam: ${kapsam}\nSebep: ${sebep}\n\nOnay için uygulamada Yönetici rolüne geçin.` });
  return t;
}

export async function kararVer(id: number, onay: boolean, not: string) {
  const now = new Date();
  const t = await repo.update('erisim_talep', id, {
    Durum: onay ? 'Onaylandı' : 'Reddedildi', OnaylayanAd: getCurrentUser(), KararNotu: not, KararTarihi: now.toISOString(),
    GecerlilikBitis: onay ? new Date(now.getTime() + ERISIM_SURE_DK * 60_000).toISOString() : null,
  }, 'Karar');
  await logla(onay ? 'Onaylandı' : 'Reddedildi', t.Modul, t.Kapsam, t.Kapsam === 'Tümü' ? '' : t.Kapsam, not, String(id));
  await bildir({ tur: 'Erişim kararı', modul: 'ust-hat', kayitId: id, aliciRolu: `Talep eden (${t.TalepEdenAd})`, konu: `[Erişim] Talebiniz ${onay ? 'onaylandı' : 'reddedildi'}`, govde: `${t.TalepTuru} · ${t.Modul} · ${t.Kapsam}\n${onay ? `${ERISIM_SURE_DK} dakika boyunca geçerlidir.` : ''}\nNot: ${not || '—'}` });
}
