/**
 * Bildirim kutusu ve otomatik tetikleyiciler.
 * Gerçek e-posta gönderilmez: "gönderilecek mail" kayıtları uygulama içi gelen kutusuna yazılır.
 * SharePoint'teki log listelerinin çift gönderim kilidi `bildirim_kilit` tablosuyla taklit edilir.
 */
import { repo, getCurrentUser } from './repo';
import type { Altyapi, OheGundem, VipTalep } from './types';
import { daysBetween, fmtDate, todayKey, choiceLabel } from '../lib/format';
import { GUNDEM_GECIKME_GUN, VVIP_UYARI_GUN, beklemeGunu, isAcik, isVvipBaslik, taahhutEsigi } from '../lib/rules';

export interface BildirimGirdi {
  konu: string;
  aliciRolu: string;
  govde: string;
  tur: string;
  modul: string;
  kayitId?: number | null;
}

/** Kilit anahtarı verilirse aynı anahtar için ikinci bildirim üretilmez. Üretildiyse true döner. */
export async function bildir(b: BildirimGirdi, kilit?: string): Promise<boolean> {
  if (kilit) {
    const var_ = await repo.query('bildirim_kilit', (k) => k.Anahtar === kilit);
    if (var_.length) return false;
    await repo.create('bildirim_kilit', { Title: kilit, Anahtar: kilit }, { silent: true });
  }
  await repo.create('bildirim', {
    Title: b.konu, Tur: b.tur, AliciRolu: b.aliciRolu, Govde: b.govde, Okundu: false, KaynakModul: b.modul, KaynakID: b.kayitId ?? null,
  });
  return true;
}

const imza = '\n\n— VIP Hafıza (demo) · Bu mesaj gönderilmemiştir, yalnızca önizlemedir.';

// ── Olay bazlı bildirimler ──────────────────────────────────

export async function bildirAtama(r: Altyapi, kisi: string) {
  await bildir({
    tur: 'Atama', modul: 'altyapi', kayitId: r.ID, aliciRolu: `Takipçi (${kisi})`,
    konu: `[VVIP Altyapı] Talep size atandı: ${r.ProjeID} / ${r.Title}`,
    govde: `Merhaba ${kisi},\n\n${r.ProjeID} / ${r.Title} — ${r.Ilce} / ${r.Sehira} talebinin takibi size atanmıştır.\nDurum: ${choiceLabel(r.OnayRed)}${imza}`,
  }, `atama:${r.ID}:${kisi}`);
}

export const ZORUNLU_ALANLAR: [keyof Altyapi, string][] = [
  ['ProjeID', 'Proje ID'], ['HP', 'HP'], ['HPBasiMaliyet', 'HP başı maliyet'], ['FiberMesafesi', 'Fiber mesafesi'], ['Sehira', 'İl'], ['Ilce', 'İlçe'],
];
export function eksikAlanlar(r: Altyapi): string[] {
  return ZORUNLU_ALANLAR.filter(([k]) => r[k] === '' || r[k] === null || r[k] === undefined || r[k] === 0).map(([, l]) => l);
}
export async function bildirEksikBilgi(r: Altyapi) {
  const eksik = eksikAlanlar(r);
  if (!eksik.length) return;
  await bildir({
    tur: 'Eksik bilgi', modul: 'altyapi', kayitId: r.ID, aliciRolu: 'Takipçi + Bölge',
    konu: `[VVIP Altyapı] Eksik bilgi: ${r.ProjeID || '—'} / ${r.Title}`,
    govde: `Merhaba,\n\nAşağıdaki alanlar eksik olduğu için talep üst yönetime sunulamıyor:\n• ${eksik.join('\n• ')}${imza}`,
  }, `eksik:${r.ID}:${eksik.join('|')}`);
}

export async function bildirGundem(g: OheGundem, olay: 'Yeni kayıt' | 'Tamamlandı' | '1 ayı aştı') {
  const gonderildi = await bildir({
    tur: 'ÖHE Gündem', modul: 'ohe', kayitId: g.ID, aliciRolu: 'ÖHE Ekibi',
    konu: `[ÖHE Gündem] ${olay}: ${g.Title}`,
    govde: `Gündem: ${g.Title}\nKategori: ${choiceLabel(g.Kategori)}\nDurum: ${choiceLabel(g.Durum)}\nSorumlu: ${g.SorumluKisi}\nTarih: ${fmtDate(g.Tarih)}${imza}`,
  }, `gundem:${g.ID}:${olay}`);
  if (gonderildi) {
    await repo.create('ohe_gundem_log', { Title: olay, Olay: olay, GundemId: g.ID, Durum: 'Önizlemeye yazıldı', Deneme: 1, Tetikleyen: getCurrentUser(), Detay: g.Title }, { silent: true });
  }
}

// ── Günlük tetikleyiciler ─────────────────────────────────────

export interface TetikOzet { zaman: string; tetikleyen: string; adet: number; ayrinti: Record<string, number> }

/**
 * "Sayfayı günün ilk açanı tetikler" mantığı: uygulama o gün ilk açıldığında çalışır,
 * aynı gün tekrar çalışmaz (force ile demo amaçlı yeniden çalıştırılabilir).
 */
export async function gunlukTetikleyicileriCalistir(now = new Date(), force = false): Promise<TetikOzet | null> {
  const gun = todayKey(now);
  if (!force && (await repo.getMeta<string>('sonTetiklemeGunu')) === gun) return null;
  await repo.setMeta('sonTetiklemeGunu', gun);
  const ayrinti: Record<string, number> = { taahhut: 0, gundem: 0, vipHatirlatma: 0, vvip: 0, altyapi: 0 };
  const kim = getCurrentUser();

  // 1) Taahhüt alarmı (30/15/7 gün eşikleri)
  for (const t of await repo.list('taahhut')) {
    const kalan = daysBetween(now.toISOString(), new Date(t.TaahhutBitis));
    const esik = taahhutEsigi(kalan);
    if (esik === null) continue;
    const ok = await bildir({
      tur: 'Taahhüt alarmı', modul: 'taahhut', kayitId: t.ID, aliciRolu: 'VIP Ekibi',
      konu: `[Taahhüt] ${kalan} gün kaldı: ${t.KisiUnvan}`,
      govde: `Taahhüt bitişine ${kalan} gün kaldı (eşik: ${esik} gün).\nKişi: ${t.KisiUnvan}\nÜrün: ${t.VerilenTip} · ${t.Tarife}\nBitiş: ${fmtDate(t.TaahhutBitis)}\nİndirim: %${t.IndirimOrani}${imza}`,
    }, `taahhut:${t.ID}:${esik}`);
    if (ok) {
      ayrinti.taahhut++;
      await repo.create('taahhut_bildirim', {
        Title: `Alarm ${t.ID}/${esik}`, KayitID: t.ID, Esik: esik, BitisTarihi: t.TaahhutBitis, KalanGun: kalan, MusteriAdi: t.KisiUnvan,
        Durum: 'Önizlemeye yazıldı', Deneme: 1, GonderimZamani: now.toISOString(), Tetikleyen: kim, Alici: 'VIP Ekibi', HataDetay: '',
      }, { silent: true });
    }
  }

  // 2) ÖHE gündemleri 1 ayı aşan
  for (const g of await repo.list('ohe_gundem')) {
    if (g.Durum === '3. Tamamlandı' || g.Durum === '4. İptal') continue;
    if (daysBetween(g.Tarih, now) > GUNDEM_GECIKME_GUN) {
      const once = (await repo.query('bildirim_kilit', (k) => k.Anahtar === `gundem:${g.ID}:1 ayı aştı`)).length;
      await bildirGundem(g, '1 ayı aştı');
      if (!once) ayrinti.gundem++;
    }
  }

  // 3) VIP talep hatırlatmaları + 4) 7 günü aşan açık VVIP
  const talepler = new Map<number, VipTalep>((await repo.list('vip_talep')).map((t) => [t.ID, t]));
  for (const m of await repo.list('vip_meta')) {
    const t = talepler.get(m.VipFormID);
    if (!t || !isAcik(t.Durum) || !m.HatirlatmaTarihi || m.HatirlatmaKilit === gun) continue;
    if (m.HatirlatmaTarihi.slice(0, 10) <= gun) {
      await bildir({
        tur: 'Hatırlatma', modul: 'vip-talep', kayitId: t.ID, aliciRolu: `Takipçi (${m.Takipci})`,
        konu: `[VIP Talep] Hatırlatma: ${t.TalepNo} — ${t.RequestSubject}`,
        govde: `${m.HatirlatmaNotu}\nMüşteri: ${t.Musteri}\nDurum: ${t.Durum}${imza}`,
      });
      await repo.update('vip_meta', m.ID, { HatirlatmaKilit: gun, HatirlatmaDurum: 'Gönderildi' }, 'Hatırlatma');
      ayrinti.vipHatirlatma++;
    }
  }
  for (const t of talepler.values()) {
    if (isAcik(t.Durum) && isVvipBaslik(t.RequestSubject) && daysBetween(t.AcilisTarihi, now) > VVIP_UYARI_GUN) {
      const ok = await bildir({
        tur: 'VVIP uyarısı', modul: 'vip-talep', kayitId: t.ID, aliciRolu: 'Yönetici',
        konu: `[VVIP] 7 günü aşan açık talep: ${t.TalepNo}`,
        govde: `${t.RequestSubject}\nAçılış: ${fmtDate(t.AcilisTarihi)} (${daysBetween(t.AcilisTarihi, now)} gün)\nMüşteri: ${t.Musteri}${imza}`,
      }, `vvip7:${t.ID}`);
      if (ok) ayrinti.vvip++;
    }
  }

  // 5) 14+ gün bekleyen altyapı talepleri
  for (const a of await repo.list('altyapi')) {
    const g = beklemeGunu(a, now);
    if (g !== null && g >= 14) {
      const ok = await bildir({
        tur: 'Gecikme', modul: 'altyapi', kayitId: a.ID, aliciRolu: 'Yönetici',
        konu: `[VVIP Altyapı] ${g} gündür bekliyor: ${a.ProjeID} / ${a.Title}`,
        govde: `${a.ProjeID} / ${a.Title} — ${a.Ilce} / ${a.Sehira}\nDurum: ${choiceLabel(a.OnayRed)}\nTakipçi: ${a.Takipci || 'atanmamış'}${imza}`,
      }, `altyapi14:${a.ID}`);
      if (ok) ayrinti.altyapi++;
    }
  }

  const ozet: TetikOzet = { zaman: now.toISOString(), tetikleyen: kim, adet: Object.values(ayrinti).reduce((a, b) => a + b, 0), ayrinti };
  await repo.setMeta('sonTetiklemeOzet', ozet);
  repo.notifyAll();
  return ozet;
}
