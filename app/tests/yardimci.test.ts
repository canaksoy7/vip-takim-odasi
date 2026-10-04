import { describe, expect, it } from 'vitest';
import { mesaiDisiMi, sureAraligi, tahminEt, yerBul, OHE_EKIPLERI } from '../src/lib/geo';
import { rehberAra, vakaOner } from '../src/lib/rehberMatch';
import { buildSeed } from '../src/data/seed';
import type { Rehber } from '../src/data/types';
import { DEPARTMANLAR } from '../src/data/types';
import { durumGrup, beklemeGunu } from '../src/lib/rules';

describe('ÖHE Yönlendirme', () => {
  it('ekip konumları: Ankara 2, İstanbul 2, Bodrum 1, İzmir 1', () => {
    const say = (il: string) => OHE_EKIPLERI.filter((e) => e.il === il).length;
    expect([say('Ankara'), say('İstanbul'), say('Muğla'), say('İzmir')]).toEqual([2, 2, 1, 1]);
  });
  it('Marmaris için en yakın ekip Bodrum, süre aralık olarak verilir', () => {
    const t = tahminEt(yerBul('Muğla', 'Marmaris')!);
    expect(t[0].ekip.ad).toBe('Bodrum Ekibi');
    expect(t[0].aralik).toMatch(/–/);
  });
  it('süre aralığı biçimi', () => {
    expect(sureAraligi(2.2)).toBe('2–3 saat');
    expect(sureAraligi(0.5)).toMatch(/dk/);
  });
  it('mesai dışı: hafta sonu ve 17:30 sonrası', () => {
    expect(mesaiDisiMi(new Date('2026-10-03T12:00:00'))).toBe(true); // Cumartesi
    expect(mesaiDisiMi(new Date('2026-10-05T10:00:00'))).toBe(false);
    expect(mesaiDisiMi(new Date('2026-10-05T19:00:00'))).toBe(true);
  });
});

describe('Sorumluluk rehberi', () => {
  const rows = buildSeed(new Date('2026-10-04T10:00:00')).rehber.rows.map((r, i) => ({ ...r, ID: i + 1 })) as Rehber[];
  it('9 departman, ~80 satır', () => {
    expect(new Set(rows.map((r) => r.Departman)).size).toBe(9);
    expect(rows.length).toBeGreaterThanOrEqual(75);
    expect(rows.length).toBeLessThanOrEqual(85);
    expect([...new Set(rows.map((r) => r.Departman))].sort()).toEqual([...DEPARTMANLAR].sort());
  });
  it('Türkçe karakter duyarsız arama', () => {
    expect(rehberAra(rows, 'TÜMLEŞİK').length).toBeGreaterThan(0);
    expect(rehberAra(rows, 'tumlesik').length).toBe(rehberAra(rows, 'Tümleşik').length);
  });
  it('vaka metninden sorumlu önerir', () => {
    const s = vakaOner(rows, 'Tivibu set üstü kutu yayın sorunu');
    expect(s.oneriler[0]?.kayit.Departman).toBe('TV Müşteri Deneyimi');
  });
});

describe('Demo verisi', () => {
  const now = new Date('2026-10-04T10:00:00');
  const a = buildSeed(now), b = buildSeed(now);
  it('tekrarlanabilir (sabit tohum)', () => {
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('istenen hacimler', () => {
    expect(a.altyapi.rows).toHaveLength(60);
    expect(a.taahhut).toHaveLength(40);
    expect(a.ustHat).toHaveLength(10);
    expect(a.vip.talepler).toHaveLength(80);
  });
  it('altyapı: tüm durumlar, VVIP+Toptan, BF+GF, 4/7/14 gün aşanlar ve ekler var', () => {
    const rows = a.altyapi.rows;
    expect(new Set(rows.map((r) => durumGrup(r.OnayRed)))).toEqual(new Set(['beklemede', 'ust', 'onay', 'red']));
    expect(new Set(rows.map((r) => r.Kaynak))).toEqual(new Set(['VVIP', 'Toptan']));
    expect(new Set(rows.map((r) => r.ProjeTuru))).toEqual(new Set(['BF', 'GF']));
    const gun = rows.map((r) => beklemeGunu(r, now) ?? -1);
    expect(gun.some((g) => g >= 4 && g < 7)).toBe(true);
    expect(gun.some((g) => g >= 7 && g < 14)).toBe(true);
    expect(gun.some((g) => g >= 14)).toBe(true);
    expect(a.altyapi.ekler.length).toBeGreaterThan(5);
    expect(a.altyapi.ekler.every((e) => e.Icerik.startsWith('<svg'))).toBe(true);
  });
  it('taahhüt: geçmiş, 30 gün içi ve uzak tarihli karışık', () => {
    const k = a.taahhut.map((t) => Math.round((new Date(t.TaahhutBitis).getTime() - now.getTime()) / 864e5));
    expect(k.some((x) => x < 0)).toBe(true);
    expect(k.some((x) => x >= 0 && x <= 30)).toBe(true);
    expect(k.some((x) => x > 30)).toBe(true);
  });
  it('tüm numaralar açıkça sahte (000 bloklu), e-postalar .invalid', () => {
    const numaralar = [...a.taahhut.map((t) => t.MSISDN), ...a.ustHat.map((h) => h.HatNumarasi), ...a.vip.talepler.map((t) => t.HizmetNo)];
    for (const n of numaralar) expect(n).toMatch(/^0 5XX 000 \d\d \d\d$/);
    for (const e of [...a.ekip.map((x) => x.Email), ...a.rehber.rows.map((x) => x.Eposta)]) expect(e).toMatch(/@demo\.invalid$/);
  });
  it('VIP talepleri: tüm durumlar ve VVIP varyasyonları', () => {
    expect(new Set(a.vip.talepler.map((t) => t.Durum))).toEqual(new Set(['Devam', 'Takip', 'Ön Başvuru', 'Kapalı']));
    expect(a.vip.talepler.some((t) => /VVİP|Vvıp/.test(t.RequestSubject))).toBe(true);
  });
});
