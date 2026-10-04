import { describe, expect, it } from 'vitest';
import { fmtHiz, fmtKM, fmtMesafe, maskNumber, trNorm } from '../src/lib/format';
import {
  beklemeGunu, cakismalar, ekIndirim, gecikmeSeviyesi, isAcik, isVvipBaslik, normalizeProjeTuru, redGerekcesi,
  sonrakiDurumlar, taahhutEsigi, taahhutGrubu, yasRengi,
} from '../src/lib/rules';

const gunOnce = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe('VVIP Altyapı — gecikme renkleri', () => {
  it('4+ sarı, 7+ turuncu, 14+ kırmızı', () => {
    expect(gecikmeSeviyesi(null)).toBe('yok');
    expect(gecikmeSeviyesi(3)).toBe('yok');
    expect(gecikmeSeviyesi(4)).toBe('sari');
    expect(gecikmeSeviyesi(6)).toBe('sari');
    expect(gecikmeSeviyesi(7)).toBe('turuncu');
    expect(gecikmeSeviyesi(13)).toBe('turuncu');
    expect(gecikmeSeviyesi(14)).toBe('kirmizi');
  });
  it('bekleme süresi: beklemede → oluşturma, üst yönetimde → sunulma, karar verilmişse yok', () => {
    expect(beklemeGunu({ OnayRed: '3. Beklemede', Created: gunOnce(9), SunulmaTarihi: null })).toBe(9);
    expect(beklemeGunu({ OnayRed: 'Üst Yönetime Sunuldu - Bekliyor', Created: gunOnce(30), SunulmaTarihi: gunOnce(5) })).toBe(5);
    expect(beklemeGunu({ OnayRed: '1. Onay', Created: gunOnce(30), SunulmaTarihi: gunOnce(5) })).toBeNull();
  });
  it('karar akışı: Beklemede → Üst yönetim → Onay/Red', () => {
    expect(sonrakiDurumlar('3. Beklemede')).toEqual(['Üst Yönetime Sunuldu - Bekliyor']);
    expect(sonrakiDurumlar('Üst Yönetime Sunuldu - Bekliyor')).toEqual(['1. Onay', '2. Red']);
    expect(sonrakiDurumlar('1. Onay')).toEqual([]);
  });
});

describe('BF / GF dönüşümü', () => {
  it('BF ve GF olduğu gibi kalır', () => {
    expect(normalizeProjeTuru('BF')).toBe('BF');
    expect(normalizeProjeTuru('gf')).toBe('GF');
    expect(normalizeProjeTuru('Greenfield')).toBe('GF');
  });
  it('"Alan Bazlı" altyapı/DSL varsa BF, yoksa GF olur', () => {
    expect(normalizeProjeTuru('Alan Bazlı', { CalisanDSL: 5 })).toBe('BF');
    expect(normalizeProjeTuru('ALAN BAZLI', { CalisanDSL: 0, MevcutAltyapi: 'VDSL' })).toBe('BF');
    expect(normalizeProjeTuru('Alan Bazlı', { CalisanDSL: 0, MevcutAltyapi: 'Yok' })).toBe('GF');
    expect(normalizeProjeTuru('alan bazli')).toBe('GF');
  });
});

describe('5,5 K gerekçe kuralı', () => {
  it('5.500 TL üzeri → HP başı maliyet; eşit ve altı → bölge bütçesi', () => {
    expect(redGerekcesi(5501)).toBe('HP başı maliyet sebebiyle ticari olarak uygun değildir');
    expect(redGerekcesi(5500)).toBe('bölge bütçesi bulunmadığı için uygun görülmemiştir');
    expect(redGerekcesi(1200)).toBe('bölge bütçesi bulunmadığı için uygun görülmemiştir');
  });
});

describe('K / M ve mt. / km. biçimleri', () => {
  it('para birimi', () => {
    expect(fmtKM(87_200)).toBe('87,2 K TL');
    expect(fmtKM(1_600_000)).toBe('1,6 M TL');
    expect(fmtKM(87_000)).toBe('87 K TL');
    expect(fmtKM(5_500)).toBe('5,5 K TL');
    expect(fmtKM(850)).toBe('850 TL');
  });
  it('fiber mesafesi', () => {
    expect(fmtMesafe(999)).toBe('999 mt.');
    expect(fmtMesafe(640)).toBe('640 mt.');
    expect(fmtMesafe(1000)).toBe('1 km.');
    expect(fmtMesafe(2350)).toBe('2,4 km.');
  });
  it('hız', () => {
    expect(fmtHiz('16 mbps')).toBe('16 Mbps');
    expect(fmtHiz(35)).toBe('35 Mbps');
  });
});

describe('Numara maskeleme', () => {
  it('ilk 4 ve son 2 hane açık', () => {
    expect(maskNumber('0 5XX 000 00 01')).toBe('0 5XX *** ** 01');
    expect(maskNumber('0 5XX 000 10 07')).toBe('0 5XX *** ** 07');
  });
  it('gerçek numara içermez (kalan haneler gizli)', () => {
    expect(maskNumber('0 532 123 45 67')).toBe('0 532 *** ** 67');
  });
});

describe('VIP Talep Takip', () => {
  it('açık = Devam + Takip; Ön Başvuru kapalı sayılır', () => {
    expect(isAcik('Devam')).toBe(true);
    expect(isAcik('Takip')).toBe(true);
    expect(isAcik('Ön Başvuru')).toBe(false);
    expect(isAcik('Kapalı')).toBe(false);
  });
  it('yaş renkleri: 4 gün sarı, 8 gün kırmızı; kapalıda renk yok', () => {
    expect(yasRengi(3, true)).toBe('yok');
    expect(yasRengi(4, true)).toBe('sari');
    expect(yasRengi(8, true)).toBe('kirmizi');
    expect(yasRengi(20, false)).toBe('yok');
  });
  it('VVIP başlığı İ/ı ve büyük/küçük harf duyarsız', () => {
    for (const t of ['VVIP - hız', 'vvip talep', 'VVİP Roaming', 'Vvıp fatura', 'RE: vVıP']) expect(isVvipBaslik(t)).toBe(true);
    expect(isVvipBaslik('VIP talep')).toBe(false);
  });
  it('Türkçe normalleştirme', () => {
    expect(trNorm('İSTANBUL Şişli ÇAĞRI')).toBe('istanbul sisli cagri');
  });
});

describe('Taahhüt', () => {
  it('alarm eşikleri 30 / 15 / 7', () => {
    expect(taahhutEsigi(40)).toBeNull();
    expect(taahhutEsigi(30)).toBe(30);
    expect(taahhutEsigi(10)).toBe(15);
    expect(taahhutEsigi(7)).toBe(7);
    expect(taahhutEsigi(0)).toBe(7);
    expect(taahhutEsigi(-1)).toBeNull();
  });
  it('gruplar', () => {
    expect(taahhutGrubu(-3)).toBe('gecmis');
    expect(taahhutGrubu(12)).toBe('yakin');
    expect(taahhutGrubu(90)).toBe('uzak');
  });
  it('aynı numarada örtüşen tarihler çakışma sayılır', () => {
    const m = cakismalar([
      { ID: 1, MSISDN: 'A', TaahhutBaslangic: '2026-01-01', TaahhutBitis: '2026-12-31' },
      { ID: 2, MSISDN: 'A', TaahhutBaslangic: '2026-06-01', TaahhutBitis: '2027-06-01' },
      { ID: 3, MSISDN: 'A', TaahhutBaslangic: '2027-07-01', TaahhutBitis: '2028-01-01' },
      { ID: 4, MSISDN: 'B', TaahhutBaslangic: '2026-01-01', TaahhutBitis: '2026-12-31' },
    ]);
    expect(m.get(1)).toEqual([2]);
    expect(m.get(2)).toEqual([1]);
    expect(m.has(3)).toBe(false);
    expect(m.has(4)).toBe(false);
  });
  it('ek indirim hesabı', () => {
    const r = ekIndirim({ ad: 'Mobil', taahhutsuz: 1000, taahhutlu: 800, hedef: 600 });
    expect(r.taahhutIndirimi).toBe(200);
    expect(r.ekIndirim).toBe(200);
    expect(r.ekOran).toBe(25);
    expect(r.toplamOran).toBe(40);
    expect(ekIndirim({ ad: 'TV', taahhutsuz: 400, taahhutlu: 300, hedef: 350 }).ekIndirim).toBe(0);
  });
});
