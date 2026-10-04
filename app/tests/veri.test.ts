import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { DexieSource, repo, setCurrentUser, setDataSource } from '../src/data/repo';
import { VipDb } from '../src/data/db';
import { seedDatabase } from '../src/data/seed';
import { gunlukTetikleyicileriCalistir } from '../src/data/notify';
import { aktifIzin, kararVer, talepEt } from '../src/data/erisim';

let n = 0;
beforeEach(async () => {
  setDataSource(new DexieSource(new VipDb(`test-${++n}`)));
  setCurrentUser('Ayşe K.');
  await seedDatabase(new Date());
});

describe('Repository', () => {
  it('her kayıtta ID, Created, Modified, Author, Editor var', async () => {
    const r = await repo.create('gorev', { Title: 'Test', Aciklama: '', AtananKisi: 'Ayşe K.', BitisTarihi: null, Oncelik: '2. Normal', Kategori: '1. Genel', Durum: '1. Bekliyor', TamamlandiMi: false, AltAdimlar: '[]' });
    expect(r.ID).toBeGreaterThan(0);
    expect(r.Author).toBe('Ayşe K.');
    expect(r.Editor).toBe('Ayşe K.');
    expect(r.Created).toBeTruthy();
  });
  it('güncelleme yalnız değişen alanlar için geçmişe eski → yeni yazar', async () => {
    const [a] = await repo.query('altyapi', (x) => x.OnayRed === '3. Beklemede');
    setCurrentUser('Murat T.');
    await repo.update('altyapi', a.ID, { OnayRed: 'Üst Yönetime Sunuldu - Bekliyor', Title: a.Title }, 'Durum değişikliği');
    const h = await repo.history('VVIP Altyapı Takip', a.ID);
    expect(h[0]).toMatchObject({ DegisilenAlan: 'OnayRed', OncekiDeger: '3. Beklemede', YeniDeger: 'Üst Yönetime Sunuldu - Bekliyor', DegistireN: 'Murat T.' });
    expect(h.filter((x) => x.Aksiyon === 'Durum değişikliği')).toHaveLength(1);
    expect((await repo.get('altyapi', a.ID))?.Editor).toBe('Murat T.');
  });
  it('sıfırlama sonrası ilişkiler 1\'den başlayan ID\'lerle tutarlı', async () => {
    const ekler = await repo.list('altyapi_ek');
    for (const e of ekler) expect(await repo.get('altyapi', e.AltyapiID)).toBeTruthy();
  });
});

describe('Günlük tetikleyiciler', () => {
  it('günün ilk açılışında çalışır, aynı gün tekrar çalışmaz', async () => {
    const now = new Date();
    const ilk = await gunlukTetikleyicileriCalistir(now);
    expect(ilk).not.toBeNull();
    expect(ilk!.ayrinti.taahhut).toBeGreaterThan(0);
    expect(await gunlukTetikleyicileriCalistir(now)).toBeNull();
  });
  it('zorla çalıştırılsa da aynı eşik için ikinci bildirim üretmez (çift gönderim kilidi)', async () => {
    const now = new Date();
    await gunlukTetikleyicileriCalistir(now);
    const once = (await repo.list('bildirim')).length;
    const ikinci = await gunlukTetikleyicileriCalistir(now, true);
    expect(ikinci!.ayrinti.taahhut).toBe(0);
    expect((await repo.list('bildirim')).length).toBe(once);
  });
});

describe('Erişim onayı', () => {
  it('talep → yönetici onayı → süreli görünürlük; her adım günlüğe yazılır', async () => {
    const t = await talepEt('Numara Görüntüleme', 'Üst Yönetim Hatları', '2', 'test');
    expect(aktifIzin(await repo.list('erisim_talep'), 'Ayşe K.', 'Üst Yönetim Hatları', '2', 'Numara Görüntüleme')).toBeUndefined();
    setCurrentUser('Murat T.');
    await kararVer(t.ID, true, 'uygun');
    const list = await repo.list('erisim_talep');
    expect(aktifIzin(list, 'Ayşe K.', 'Üst Yönetim Hatları', '2', 'Numara Görüntüleme')).toBeTruthy();
    expect(aktifIzin(list, 'Ayşe K.', 'Üst Yönetim Hatları', '3', 'Numara Görüntüleme')).toBeUndefined();
    expect(aktifIzin(list, 'Ayşe K.', 'Üst Yönetim Hatları', '2', 'Numara Görüntüleme', new Date(Date.now() + 16 * 60_000))).toBeUndefined();
    const log = await repo.query('erisim_log', (l) => l.TalepId === String(t.ID));
    expect(log.map((l) => l.Islem)).toEqual(['Talep oluşturuldu', 'Onaylandı']);
  });
});
