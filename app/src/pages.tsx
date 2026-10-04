import { useMemo, useState } from 'react';
import { useApp, type Tema } from './store';
import { nav } from './router';
import { MODULLER, erisebilir } from './modules/registry';
import { useData } from './data/hooks';
import { repo } from './data/repo';
import { resetDemo } from './data/seed';
import { gunlukTetikleyicileriCalistir, type TetikOzet } from './data/notify';
import type { Rol } from './data/types';
import { fmtDateTime, trNorm } from './lib/format';
import { Chips, Empty, Field, PageHead, Sheet } from './ui/kit';

export function TumuPage() {
  const rol = useApp((s) => s.rol);
  const gruplar = [...new Set(MODULLER.map((m) => m.grup))];
  return (
    <div className="stack">
      <PageHead title="Tüm modüller" sub={`${rol} rolüyle erişebildiğiniz ekranlar`} />
      {gruplar.map((g) => {
        const list = MODULLER.filter((m) => m.grup === g && erisebilir(rol, m.id));
        if (!list.length) return null;
        return (
          <section key={g} className="stack" style={{ gap: 8 }}>
            <div className="section-title">{g}</div>
            <div className="mod-grid">
              {list.map((m) => (
                <button key={m.id} className="card tap mod-card" onClick={() => nav(`/${m.id}`)}>
                  <span className="ico" aria-hidden>{m.ikon}</span>
                  <span className="t">{m.ad}</span>
                  <span className="d">{m.aciklama}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface Sonuc { grup: string; baslik: string; alt: string; git: string; modul: string }

export function AraPage() {
  const rol = useApp((s) => s.rol);
  const [q, setQ] = useState('');
  const veri = useData(async () => ({
    altyapi: await repo.list('altyapi'),
    vip: await repo.list('vip_talep'),
    meta: await repo.list('vip_meta'),
    taahhut: await repo.list('taahhut'),
    rehber: await repo.list('rehber'),
    gorev: await repo.list('gorev'),
    hafiza: await repo.list('hafiza'),
    cihaz: await repo.list('ohe_cihaz'),
    kades: await repo.list('kades'),
  }), ['*']);

  const sonuc = useMemo<Sonuc[]>(() => {
    const n = trNorm(q).trim();
    const d = veri.data;
    if (!d || n.length < 2) return [];
    const has = (...xs: (string | number | null | undefined)[]) => trNorm(xs.filter((x) => x !== null && x !== undefined).join(' ')).includes(n);
    const out: Sonuc[] = [];
    for (const a of d.altyapi) if (has(a.ProjeID, a.Title, a.TalepSahibi, a.Sehira, a.Ilce, a.Takipci)) out.push({ grup: 'VVIP Altyapı', baslik: `${a.ProjeID} / ${a.Title}`, alt: `${a.Ilce} / ${a.Sehira} · ${a.Takipci || 'takipçi yok'}`, git: `/altyapi/${a.ID}`, modul: 'altyapi' });
    const takipci = new Map(d.meta.map((m) => [m.VipFormID, m.Takipci]));
    for (const t of d.vip) if (has(t.TalepNo, t.RequestSubject, t.Subject, t.Musteri, t.KaydiGiren, takipci.get(t.ID))) out.push({ grup: 'VIP Talep', baslik: `${t.TalepNo} · ${t.RequestSubject}`, alt: `${t.Musteri} · ${t.Durum} · ${takipci.get(t.ID) ?? ''}`, git: `/vip-talep/${t.ID}`, modul: 'vip-talep' });
    for (const t of d.taahhut) if (has(t.KisiUnvan, t.Tarife, t.Ekleyen, t.KimdenGeldi)) out.push({ grup: 'Taahhüt', baslik: t.KisiUnvan, alt: `${t.VerilenTip} · ${t.Tarife}`, git: `/taahhut/${t.ID}`, modul: 'taahhut' });
    for (const r of d.rehber) if (has(r.Title, r.Departman, r.Alanlar)) out.push({ grup: 'Sorumluluk Rehberi', baslik: r.Title, alt: `${r.Departman} · ${r.Rol}`, git: `/rehber?q=${encodeURIComponent(r.Title)}`, modul: 'rehber' });
    for (const g of d.gorev) if (has(g.Title, g.AtananKisi)) out.push({ grup: 'Görevler', baslik: g.Title, alt: g.AtananKisi, git: `/gorev/${g.ID}`, modul: 'gorev' });
    for (const h of d.hafiza) if (has(h.Title, h.Keywords, h.Kategori)) out.push({ grup: 'Kurumsal Hafıza', baslik: h.Title, alt: h.Kategori, git: `/hafiza/${h.ID}`, modul: 'hafiza' });
    for (const c of d.cihaz) if (has(c.SeriNo, c.Model, c.Zimmet)) out.push({ grup: 'ÖHE Envanter', baslik: `${c.SeriNo} · ${c.Model}`, alt: c.Zimmet || 'Stokta', git: `/ohe?sekme=envanter&q=${encodeURIComponent(c.SeriNo)}`, modul: 'ohe' });
    for (const k of d.kades) if (has(k.Title, k.Ad, k.Muhatap)) out.push({ grup: 'KADES', baslik: `${k.Title} · ${k.Ad}`, alt: k.Tur, git: `/kades/${k.ID}`, modul: 'kades' });
    return out.filter((s) => erisebilir(rol, s.modul));
  }, [q, veri.data, rol]);

  const gruplar = [...new Set(sonuc.map((s) => s.grup))];
  return (
    <div className="stack">
      <input className="input" autoFocus type="search" placeholder="En az 2 harf yazın…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Genel arama" />
      <p className="tiny muted" style={{ margin: 0 }}>Proje ID, müşteri, şehir, kişi, talep no, seri no… Türkçe karakter duyarsız.</p>
      {q.trim().length >= 2 && !sonuc.length && <Empty icon="🔎" title="Sonuç yok" text={`"${q}" için eşleşme bulunamadı.`} />}
      {gruplar.map((g) => (
        <section key={g} className="stack" style={{ gap: 8 }}>
          <div className="section-title">{g} · {sonuc.filter((s) => s.grup === g).length}</div>
          {sonuc.filter((s) => s.grup === g).slice(0, 8).map((s, i) => (
            <button key={i} className="card tap" onClick={() => nav(s.git)}>
              <div className="bold ellipsis">{s.baslik}</div>
              <div className="small muted ellipsis">{s.alt}</div>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

export function AyarlarPage() {
  const { rol, setRol, tema, setTema, showToast, kullanici } = useApp();
  const [onay, setOnay] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const ozet = useData(() => repo.getMeta<TetikOzet>('sonTetiklemeOzet'), ['*']);

  const roller: { id: Rol; label: string; d: string }[] = [
    { id: 'Ekip Üyesi', label: 'Ekip Üyesi', d: 'Tüm operasyon ekranları; onay/red yok.' },
    { id: 'Yönetici', label: 'Yönetici', d: 'Her şey + onay/red, erişim talebi kararları, panoda tek dokunuş.' },
    { id: 'ÖHE Ekibi', label: 'ÖHE Ekibi', d: 'Yalnızca ÖHE Bütçe & Stok, KADES ve Yönlendirme.' },
  ];

  return (
    <div className="stack">
      <section className="card stack">
        <h3>Rol (demo)</h3>
        <p className="small muted" style={{ margin: 0 }}>Rol değişince oturum kişisi ve görünen ekranlar değişir. Şu an: <b>{kullanici}</b></p>
        {roller.map((r) => (
          <label key={r.id} className="card flat row" style={{ cursor: 'pointer', padding: 12 }}>
            <input type="radio" name="rol" checked={rol === r.id} onChange={() => { setRol(r.id); showToast(`${r.label} rolüne geçildi`); }} style={{ width: 22, height: 22 }} />
            <div><div className="bold">{r.label}</div><div className="small muted">{r.d}</div></div>
          </label>
        ))}
      </section>

      <section className="card stack">
        <h3>Tema</h3>
        <Chips<Tema> items={[{ id: 'sistem', label: 'Sistem' }, { id: 'acik', label: 'Açık' }, { id: 'koyu', label: 'Koyu' }]} value={tema} onChange={setTema} label="Tema" />
      </section>

      <section className="card stack">
        <h3>Günlük tetikleyiciler</h3>
        <p className="small muted" style={{ margin: 0 }}>
          SharePoint'te "sayfayı günün ilk açanı" çalıştırır. Burada uygulama o gün ilk açıldığında çalışır, aynı gün tekrar çalışmaz.
        </p>
        {ozet.data ? (
          <p className="small" style={{ margin: 0 }}>Son çalışma: <b>{fmtDateTime(ozet.data.zaman)}</b> · tetikleyen {ozet.data.tetikleyen} · {ozet.data.adet} yeni bildirim</p>
        ) : <p className="small muted" style={{ margin: 0 }}>Henüz çalışmadı.</p>}
        <button className="btn ghost" disabled={calisiyor} onClick={async () => {
          setCalisiyor(true);
          const s = await gunlukTetikleyicileriCalistir(new Date(), true);
          setCalisiyor(false);
          showToast(`Tetikleyiciler çalıştı: ${s?.adet ?? 0} yeni bildirim`);
        }}>Şimdi yeniden çalıştır (demo)</button>
      </section>

      <section className="card stack">
        <h3>Demo verisi</h3>
        <p className="small muted" style={{ margin: 0 }}>Tüm kayıtlar, geçmiş ve bildirimler silinir; başlangıçtaki örnek veri yeniden yüklenir.</p>
        <button className="btn red" onClick={() => setOnay(true)}>Demo verisini sıfırla</button>
      </section>

      <section className="card stack">
        <h3>Bu uygulama hakkında</h3>
        <p className="small" style={{ margin: 0 }}>
          <b>VIP Hafıza — mobil gösterim prototipi.</b> Canlı sistem değildir. İçindeki tüm kişi, numara, kurum ve tutarlar
          uydurmadır. Hiçbir kurum sistemine bağlanmaz, VPN gerektirmez, dış servise veri göndermez. Veriler yalnızca bu cihazda
          (IndexedDB) saklanır. E-postalar gönderilmez; Bildirim Kutusu'nda önizleme olarak görünür.
        </p>
        <p className="tiny muted" style={{ margin: 0 }}>Sürüm 0.1.0 · çevrimdışı çalışır (PWA)</p>
      </section>

      <Sheet open={onay} onClose={() => setOnay(false)} title="Demo verisi sıfırlansın mı?">
        <p className="small">Yaptığınız tüm değişiklikler silinecek. Bu işlem geri alınamaz.</p>
        <div className="btn-bar">
          <button className="btn ghost" onClick={() => setOnay(false)}>Vazgeç</button>
          <button className="btn red" onClick={async () => {
            await resetDemo();
            await gunlukTetikleyicileriCalistir(new Date(), true);
            setOnay(false);
            showToast('Demo verisi sıfırlandı');
          }}>Sıfırla</button>
        </div>
      </Sheet>
      <Field label="Kısayol"><button className="btn ghost" onClick={() => nav('/tumu')}>Tüm modüllere dön</button></Field>
    </div>
  );
}
