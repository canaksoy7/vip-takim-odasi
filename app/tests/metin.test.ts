import { describe, expect, it } from 'vitest';
import { ORNEK_METINLER, parseTalep, parseTrNumber, uretTalepMetni } from '../src/lib/talepMetni';
import { raporBasligi, yatirimMetni } from '../src/lib/altyapiMetin';
import type { Altyapi } from '../src/data/types';

describe('Talep metni oluşturucu', () => {
  it('Türkçe sayıları ve birimleri okur', () => {
    expect(parseTrNumber('312.400 TL')).toBe(312400);
    expect(parseTrNumber('1,6 M TL')).toBe(1_600_000);
    expect(parseTrNumber('87,2 K')).toBe(87_200);
    expect(parseTrNumber('2.350 m', 'mesafe')).toBe(2350);
    expect(parseTrNumber('1,8 km', 'mesafe')).toBe(1800);
  });
  it('örnek 1 (mail, BF): HP başı > 5,5 K → ticari gerekçe', () => {
    const b = parseTalep(ORNEK_METINLER[0].metin);
    expect(b.projeId).toBe('900123');
    expect(b.projeTuru).toBe('BF');
    expect(b.fiberM).toBe(2350);
    const c = uretTalepMetni(b);
    expect(c.gerekce).toBe('HP başı maliyet sebebiyle ticari olarak uygun değildir');
    expect(c.anlatim).toContain('312,4 K TL');
    expect(c.anlatim).toContain('2,4 km.');
    expect(c.anlatim).toContain('16 Mbps');
  });
  it('örnek 2 (tablo, Alan Bazlı, DSL 0): GF olur, bütçe gerekçesi, "altyapımız bulunmamaktadır" yazılmaz', () => {
    const b = parseTalep(ORNEK_METINLER[1].metin);
    expect(b.projeTuru).toBe('GF');
    expect(b.hpBasi).toBe(4400);
    const c = uretTalepMetni(b);
    expect(c.gerekce).toBe('bölge bütçesi bulunmadığı için uygun görülmemiştir');
    expect(c.anlatim).not.toMatch(/altyapımız bulunmamaktadır/i);
    expect(c.kunye.find(([k]) => k === 'Fiber Mesafesi')?.[1]).toBe('640 mt.');
  });
  it('örnek 3 (K/M biçimli): Alan Bazlı + DSL → BF; M TL okunur', () => {
    const b = parseTalep(ORNEK_METINLER[2].metin);
    expect(b.projeTuru).toBe('BF');
    expect(b.toplam).toBe(1_600_000);
    expect(b.fiberM).toBe(1800);
    const c = uretTalepMetni(b);
    expect(c.kunye.find(([k]) => k === 'Toplam Maliyet')?.[1]).toBe('1,6 M TL');
    expect(c.kunye.find(([k]) => k === 'HP Başı Maliyet')?.[1]).toBe('88,9 K TL');
  });
  it('künye alanları eksiksiz listelenir', () => {
    const c = uretTalepMetni(parseTalep(ORNEK_METINLER[0].metin));
    expect(c.kunye.map(([k]) => k)).toEqual(['Proje ID', 'Proje Türü', 'HP', 'HP Başı Maliyet', 'Çalışan DSL', 'Abone Başı Maliyet', 'Toplam Maliyet', 'Fiber Mesafesi', 'Harita']);
  });
});

const ornek = (p: Partial<Altyapi>): Altyapi => ({
  ID: 1, Title: 'Martı Sitesi Yönetimi', Created: '', Modified: '', Author: '', Editor: '', AnaKategori: '3. Fiber', TalepSahibi: '', ProjeID: 900111,
  HPBasiMaliyet: 7200, AboneBasiMaliyet: 12000, MaliyetTutari: 360000, MaliyetSayisal: 360000, Penetrasyon: 60, Asama: '', ProjeDurumKodu: '6. Red',
  ButceTuru: '3. Beklemede', OnayRed: '2. Red', Aciklama: '', Adres: '', Takipci: '', Sehira: 'Muğla', Ilce: 'Bodrum', HP: 50, ProjeTuru: 'GF', CalisanDSL: 0,
  AboneOngoru: 30, MevcutAltyapi: 'Yok', MevcutHiz: '', FiberMesafesi: 1200, MaliyetNotu: '', SunulmaTarihi: null, KararTarihi: null, ImalatBaslangic: null,
  TahminiTamamlanma: null, TamamlanmaTarihi: null, Kaynak: 'VVIP', ToptanaBildirildi: false, ...p,
});

describe('VIP Yatırım Değerlendirmesi metni', () => {
  it('başlık: ProjeID / Talep — İlçe / İl', () => {
    expect(raporBasligi(ornek({}))).toBe('900111 / Martı Sitesi Yönetimi — Bodrum / Muğla');
  });
  it('GF metninde "altyapımız bulunmamaktadır" yok, çift nokta yok, red gerekçesi var', () => {
    const t = yatirimMetni(ornek({}));
    expect(t).not.toMatch(/altyapımız bulunmamaktadır/i);
    expect(t).not.toContain('..');
    expect(t).toContain('HP başı maliyet sebebiyle ticari olarak uygun değildir');
  });
  it('BF metni mevcut altyapıyı ve hızı bir kez anar', () => {
    const t = yatirimMetni(ornek({ ProjeTuru: 'BF', MevcutAltyapi: 'VDSL', CalisanDSL: 12, MevcutHiz: '24', OnayRed: '1. Onay', ButceTuru: '1. VIP' }));
    expect(t).toContain('mevcut VDSL altyapısının');
    expect(t.match(/24 Mbps/g)).toHaveLength(1);
    expect(t).toContain('VIP bütçesinden onaylanmıştır');
  });
});
