import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useTable } from '../data/hooks';
import { repo } from '../data/repo';
import { EKIP } from '../data/seed';
import { bildir, bildirGundem } from '../data/notify';
import {
  BUTCE_KATEGORI, GUNDEM_DURUM, GUNDEM_KATEGORI, HARCAMA_KATEGORI, OHE_LOKASYON,
  type OheCihaz, type OheGundem, type OheStok,
} from '../data/types';
import { choiceLabel, daysBetween, fmtDate, fmtDateTime, fmtNum, fmtTL, trNorm } from '../lib/format';
import { GUNDEM_GECIKME_GUN } from '../lib/rules';
import { Async, Chips, Empty, Field, Kpi, Kv, PageHead, Pill, Progress, Sheet, Tabs, indir } from '../ui/kit';
import { GecmisListe } from '../ui/Gecmis';

type Sekme = 'envanter' | 'gundem' | 'sat' | 'malzeme' | 'test' | 'butce' | 'excel';
const OHE_KISI = EKIP.filter((e) => e.rol === 'ÖHE Ekibi').map((e) => e.ad);
const bugun = () => new Date().toISOString().slice(0, 10);

export default function Ohe({ route }: { route: Route }) {
  const sekme = (route.query.get('sekme') as Sekme) ?? 'envanter';
  const git = (s: Sekme) => nav(`/ohe?sekme=${s}`);
  return (
    <div className="stack">
      <PageHead title="ÖHE bütçe & stok" sub="Envanter, gündem, satın alma, test hatları ve bütçe" />
      <Tabs<Sekme> value={sekme} onChange={git} items={[
        { id: 'envanter', label: 'Envanter' }, { id: 'gundem', label: 'Gündemler' }, { id: 'sat', label: 'SAT' }, { id: 'malzeme', label: 'Malzeme Kodları' },
        { id: 'test', label: 'Test Hatları' }, { id: 'butce', label: 'Bütçe' }, { id: 'excel', label: 'Excel Aktarım' },
      ]} />
      {sekme === 'envanter' && <Envanter q0={route.query.get('q') ?? ''} />}
      {sekme === 'gundem' && <Gundemler />}
      {sekme === 'sat' && <Sat />}
      {sekme === 'malzeme' && <Malzeme />}
      {sekme === 'test' && <TestHatlari />}
      {sekme === 'butce' && <Butce />}
      {sekme === 'excel' && <ExcelAktarim />}
    </div>
  );
}

// ── Envanter (seri no bazlı, kayıtta onay) ───────────────────────
function Envanter({ q0 }: { q0: string }) {
  const q = useTable('ohe_cihaz');
  const { rol, showToast } = useApp();
  const [ara, setAra] = useState(q0);
  const [lok, setLok] = useState<string>('tumu');
  const [durum, setDurum] = useState<'tumu' | '1. Stokta' | '2. Verildi' | 'onay'>('tumu');
  const [sec, setSec] = useState<OheCihaz | null>(null);
  const [yeni, setYeni] = useState(false);
  return (
    <Async q={q}>
      {(rows) => {
        const f = rows.filter((c) => (lok === 'tumu' || c.Lokasyon === lok) && (durum === 'tumu' || (durum === 'onay' ? c.OnayDurumu === 'Onay Bekliyor' : c.Durum === durum)) &&
          (!ara || trNorm(`${c.SeriNo} ${c.Model} ${c.IMEI} ${c.Zimmet}`).includes(trNorm(ara))));
        return (
          <>
            <div className="kpis">
              <Kpi v={rows.length} l="Toplam cihaz" />
              <Kpi v={rows.filter((c) => c.Durum === '1. Stokta').length} l="Stokta" tone="st-onay" />
              <Kpi v={rows.filter((c) => c.Durum === '2. Verildi').length} l="Verildi" tone="st-ust" />
              <Kpi v={rows.filter((c) => c.OnayDurumu === 'Onay Bekliyor').length} l="Onay bekleyen kayıt" tone="st-bekle" onClick={() => setDurum('onay')} on={durum === 'onay'} />
            </div>
            <Chips value={lok} onChange={setLok} label="Lokasyon" items={[{ id: 'tumu', label: 'Tüm lokasyonlar' }, ...OHE_LOKASYON.map((l) => ({ id: l, label: choiceLabel(l), n: rows.filter((c) => c.Lokasyon === l).length }))]} />
            <Chips value={durum} onChange={setDurum} label="Durum" items={[{ id: 'tumu', label: 'Tümü' }, { id: '1. Stokta', label: 'Stokta' }, { id: '2. Verildi', label: 'Verildi' }, { id: 'onay', label: 'Onay bekleyen' }]} />
            <div className="row">
              <input className="input" type="search" placeholder="Seri no, model, IMEI, zimmet" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Envanterde ara" />
              <button className="btn" onClick={() => setYeni(true)}>+ Kayıt</button>
            </div>
            {f.length === 0 ? <Empty icon="📦" title="Cihaz bulunamadı" /> : (
              <div className="list">
                {f.map((c) => (
                  <button key={c.ID} className="card tap" style={{ padding: 12 }} onClick={() => setSec(c)}>
                    <div className="row"><span className="tiny mono muted">{c.SeriNo}</span><span className="spacer" />
                      {c.OnayDurumu !== 'Onaylandı' && <Pill tone={c.OnayDurumu === 'Onay Bekliyor' ? 'bekle' : 'red'} plain>{c.OnayDurumu}</Pill>}
                      <Pill tone={c.Durum === '1. Stokta' ? 'onay' : 'ust'}>{choiceLabel(c.Durum)}</Pill></div>
                    <div className="bold">{c.Model}</div>
                    <div className="small muted">{choiceLabel(c.Lokasyon)}{c.Zimmet ? ` · zimmet: ${c.Zimmet}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
            <Sheet open={!!sec} onClose={() => setSec(null)} title={sec?.Model ?? ''}>
              {sec && (() => {
                const c = rows.find((x) => x.ID === sec.ID) ?? sec;
                return (
                  <div className="stack">
                    <Kv rows={[['Seri no', <span className="mono">{c.SeriNo}</span>], ['IMEI', <span className="mono">{c.IMEI}</span>], ['Lokasyon', choiceLabel(c.Lokasyon)], ['Durum', choiceLabel(c.Durum)], ['Zimmet', c.Zimmet], ['Stok giriş', fmtDate(c.StokGiris)], ['Stok çıkış', fmtDate(c.StokCikis)], ['Kayıt onayı', c.OnayDurumu]]} />
                    {c.OnayDurumu === 'Onay Bekliyor' && (rol === 'Yönetici' ? (
                      <div className="btn-bar">
                        <button className="btn red" onClick={async () => { await repo.update('ohe_cihaz', c.ID, { OnayDurumu: 'Reddedildi' }, 'Karar'); showToast('Reddedildi'); }}>Reddet</button>
                        <button className="btn green" onClick={async () => { await repo.update('ohe_cihaz', c.ID, { OnayDurumu: 'Onaylandı' }, 'Karar'); showToast('Onaylandı'); }}>Onayla</button>
                      </div>
                    ) : <div className="banner info"><span>⏳</span><div>Kayıt yönetici onayı bekliyor.</div></div>)}
                    {c.Durum === '1. Stokta' ? (
                      <ZimmetVer c={c} />
                    ) : (
                      <button className="btn ghost block" onClick={async () => { await repo.update('ohe_cihaz', c.ID, { Durum: '1. Stokta', Zimmet: '', StokCikis: null }, 'İade'); showToast('Stoğa iade alındı'); }}>Stoğa iade al</button>
                    )}
                    <div className="section-title">Geçmiş</div>
                    <GecmisListe liste="ÖHE Envanter" kayitId={c.ID} />
                  </div>
                );
              })()}
            </Sheet>
            <Sheet open={yeni} onClose={() => setYeni(false)} title="Yeni malzeme kaydı">
              <YeniCihaz mevcut={rows} onDone={() => setYeni(false)} />
            </Sheet>
          </>
        );
      }}
    </Async>
  );
}

function ZimmetVer({ c }: { c: OheCihaz }) {
  const showToast = useApp((s) => s.showToast);
  const [kisi, setKisi] = useState('');
  return (
    <div className="row">
      <input className="input" placeholder="Zimmetlenecek kişi / ekip" value={kisi} onChange={(e) => setKisi(e.target.value)} />
      <button className="btn" disabled={!kisi.trim() || c.OnayDurumu !== 'Onaylandı'} onClick={async () => {
        await repo.update('ohe_cihaz', c.ID, { Durum: '2. Verildi', Zimmet: kisi.trim(), StokCikis: bugun() }, 'Zimmet');
        showToast('Zimmetlendi');
      }}>Ver</button>
    </div>
  );
}

function YeniCihaz({ mevcut, onDone }: { mevcut: OheCihaz[]; onDone: () => void }) {
  const showToast = useApp((s) => s.showToast);
  const [v, setV] = useState({ Model: '', SeriNo: 'SN-DEMO-', IMEI: '000000000', Lokasyon: OHE_LOKASYON[0] as OheCihaz['Lokasyon'], Aciklama: '' });
  const cift = mevcut.some((c) => c.SeriNo.toLowerCase() === v.SeriNo.trim().toLowerCase());
  return (
    <div className="stack">
      <Field label="Model *"><input className="input" value={v.Model} onChange={(e) => setV({ ...v, Model: e.target.value })} /></Field>
      <Field label="Seri no *"><input className="input mono" value={v.SeriNo} onChange={(e) => setV({ ...v, SeriNo: e.target.value })} /></Field>
      {cift && <div className="banner danger"><span>⚠️</span><div>Bu seri no zaten kayıtlı.</div></div>}
      <Field label="IMEI"><input className="input mono" value={v.IMEI} onChange={(e) => setV({ ...v, IMEI: e.target.value })} /></Field>
      <Field label="Lokasyon"><select className="input" value={v.Lokasyon} onChange={(e) => setV({ ...v, Lokasyon: e.target.value as OheCihaz['Lokasyon'] })}>{OHE_LOKASYON.map((l) => <option key={l} value={l}>{choiceLabel(l)}</option>)}</select></Field>
      <p className="tiny muted" style={{ margin: 0 }}>Kayıt "Onay Bekliyor" olarak açılır; yönetici onaylayınca zimmetlenebilir.</p>
      <button className="btn green block" disabled={!v.Model.trim() || v.SeriNo.trim().length < 4 || cift} onClick={async () => {
        const c = await repo.create('ohe_cihaz', { ...v, Title: v.Model, SeriNo: v.SeriNo.trim(), Zimmet: '', Durum: '1. Stokta', StokGiris: bugun(), StokCikis: null, OnayDurumu: 'Onay Bekliyor' });
        await bildir({ tur: 'Malzeme onayı', modul: 'ohe', kayitId: c.ID, aliciRolu: 'Yönetici', konu: `[ÖHE] Malzeme kaydı onay bekliyor: ${c.SeriNo}`, govde: `${c.Model} · ${choiceLabel(c.Lokasyon)}\nSeri no: ${c.SeriNo}` });
        showToast('Kayıt onaya gönderildi'); onDone();
      }}>Kaydet ve onaya gönder</button>
    </div>
  );
}

// ── Gündemler ──────────────────────────────────────────
function Gundemler() {
  const q = useTable('ohe_gundem');
  const { showToast, kullanici } = useApp();
  const [f, setF] = useState<string>('tumu');
  const [sec, setSec] = useState<OheGundem | null>(null);
  const [yeni, setYeni] = useState(false);
  const durumDegis = async (g: OheGundem, d: OheGundem['Durum']) => {
    const yeniG = await repo.update('ohe_gundem', g.ID, { Durum: d }, 'Durum değişikliği');
    if (d === '3. Tamamlandı') await bildirGundem(yeniG, 'Tamamlandı');
    showToast(`Durum: ${choiceLabel(d)}`);
  };
  return (
    <Async q={q}>
      {(rows) => {
        const say = (d: string) => rows.filter((g) => g.Durum === d).length;
        const liste = rows.filter((g) => f === 'tumu' || g.Durum === f).sort((a, b) => a.Tarih.localeCompare(b.Tarih));
        return (
          <>
            <div className="kpis">
              <Kpi v={rows.length} l="Toplam" on={f === 'tumu'} onClick={() => setF('tumu')} />
              <Kpi v={say('1. Bekliyor')} l="Bekliyor" on={f === '1. Bekliyor'} onClick={() => setF('1. Bekliyor')} tone="st-bekle" />
              <Kpi v={say('2. Devam Ediyor')} l="Devam" on={f === '2. Devam Ediyor'} onClick={() => setF('2. Devam Ediyor')} tone="st-ust" />
              <Kpi v={say('3. Tamamlandı')} l="Tamamlandı" on={f === '3. Tamamlandı'} onClick={() => setF('3. Tamamlandı')} tone="st-onay" />
            </div>
            <button className="btn block" onClick={() => setYeni(true)}>+ Yeni gündem</button>
            {liste.length === 0 ? <Empty icon="🗒️" title="Gündem yok" /> : (
              <div className="list">
                {liste.map((g) => {
                  const yas = daysBetween(g.Tarih);
                  const gecikti = yas > GUNDEM_GECIKME_GUN && !['3. Tamamlandı', '4. İptal'].includes(g.Durum);
                  return (
                    <button key={g.ID} className={`card tap bar-left ${gecikti ? 'st-red' : ''}`} style={{ padding: 12 }} onClick={() => setSec(g)}>
                      <div className="row"><span className="tiny muted">{choiceLabel(g.Kategori)}</span><span className="spacer" />{gecikti && <Pill tone="red" plain>1 ay+</Pill>}
                        <Pill tone={g.Durum === '1. Bekliyor' ? 'bekle' : g.Durum === '2. Devam Ediyor' ? 'ust' : g.Durum === '3. Tamamlandı' ? 'onay' : 'gri'}>{choiceLabel(g.Durum)}</Pill></div>
                      <div className="bold">{g.Title}</div>
                      <div className="small muted">{g.SorumluKisi} · {fmtDate(g.Tarih)} ({yas} gün)</div>
                    </button>
                  );
                })}
              </div>
            )}
            <Sheet open={!!sec} onClose={() => setSec(null)} title={sec?.Title ?? ''}>
              {sec && (() => {
                const g = rows.find((x) => x.ID === sec.ID) ?? sec;
                return (
                  <div className="stack">
                    <Kv rows={[['Kategori', choiceLabel(g.Kategori)], ['Sorumlu', g.SorumluKisi], ['Tarih', fmtDate(g.Tarih)], ['Açıklama', g.Aciklama]]} />
                    <Field label="Durum"><select className="input" value={g.Durum} onChange={(e) => durumDegis(g, e.target.value as OheGundem['Durum'])}>{GUNDEM_DURUM.map((d) => <option key={d} value={d}>{choiceLabel(d)}</option>)}</select></Field>
                    <p className="tiny muted" style={{ margin: 0 }}>Tamamlandı'ya geçiş, yeni kayıt ve 1 ayı aşan kayıt için Bildirim Kutusu'na mail önizlemesi düşer.</p>
                    <GecmisListe liste="ÖHE Gündem" kayitId={g.ID} />
                  </div>
                );
              })()}
            </Sheet>
            <Sheet open={yeni} onClose={() => setYeni(false)} title="Yeni gündem">
              <YeniGundem kullanici={kullanici} onDone={() => setYeni(false)} />
            </Sheet>
          </>
        );
      }}
    </Async>
  );
}

function YeniGundem({ kullanici, onDone }: { kullanici: string; onDone: () => void }) {
  const showToast = useApp((s) => s.showToast);
  const [v, setV] = useState({ Title: '', Kategori: GUNDEM_KATEGORI[0] as OheGundem['Kategori'], Durum: GUNDEM_DURUM[0] as OheGundem['Durum'], SorumluKisi: OHE_KISI.includes(kullanici) ? kullanici : OHE_KISI[0], Tarih: bugun(), Aciklama: '' });
  return (
    <div className="stack">
      <Field label="Başlık *"><input className="input" value={v.Title} onChange={(e) => setV({ ...v, Title: e.target.value })} /></Field>
      <div className="grid2">
        <Field label="Kategori"><select className="input" value={v.Kategori} onChange={(e) => setV({ ...v, Kategori: e.target.value as OheGundem['Kategori'] })}>{GUNDEM_KATEGORI.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
        <Field label="Durum"><select className="input" value={v.Durum} onChange={(e) => setV({ ...v, Durum: e.target.value as OheGundem['Durum'] })}>{GUNDEM_DURUM.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
      </div>
      <div className="grid2">
        <Field label="Sorumlu"><select className="input" value={v.SorumluKisi} onChange={(e) => setV({ ...v, SorumluKisi: e.target.value })}>{OHE_KISI.map((k) => <option key={k}>{k}</option>)}</select></Field>
        <Field label="Tarih"><input className="input" type="date" value={v.Tarih} onChange={(e) => setV({ ...v, Tarih: e.target.value })} /></Field>
      </div>
      <Field label="Açıklama"><textarea className="input" value={v.Aciklama} onChange={(e) => setV({ ...v, Aciklama: e.target.value })} /></Field>
      <button className="btn green block" disabled={!v.Title.trim()} onClick={async () => {
        const g = await repo.create('ohe_gundem', v);
        await bildirGundem(g, 'Yeni kayıt');
        showToast('Gündem eklendi · bildirim önizlemesi oluştu'); onDone();
      }}>Kaydet</button>
    </div>
  );
}

// ── SAT ──────────────────────────────────────────────────
function Sat() {
  const q = useTable('ohe_sat');
  const showToast = useApp((s) => s.showToast);
  const [v, setV] = useState({ SatNumarasi: '', Donem: '2026-Ç4', Tedarikci: '', Tutar: 0 });
  const [yeni, setYeni] = useState(false);
  return (
    <Async q={q}>
      {(rows) => (
        <>
          <div className="kpis"><Kpi v={rows.length} l="SAT kaydı" /><Kpi v={fmtTL(rows.reduce((a, r) => a + r.Tutar, 0))} l="Toplam tutar" /></div>
          <button className="btn block" onClick={() => setYeni(true)}>+ SAT kaydı</button>
          <div className="list">
            {[...rows].sort((a, b) => b.ID - a.ID).map((r) => (
              <div key={r.ID} className="card row" style={{ padding: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}><div className="bold mono">{r.SatNumarasi}</div><div className="small muted ellipsis">{r.Tedarikci} · {r.Donem}{r.FaturaEki ? ' · 📎 fatura' : ''}</div></div>
                <b className="mono">{fmtTL(r.Tutar)}</b>
              </div>
            ))}
          </div>
          <Sheet open={yeni} onClose={() => setYeni(false)} title="Yeni SAT kaydı">
            <div className="stack">
              <Field label="SAT numarası"><input className="input mono" value={v.SatNumarasi} onChange={(e) => setV({ ...v, SatNumarasi: e.target.value })} /></Field>
              <div className="grid2">
                <Field label="Dönem"><input className="input" value={v.Donem} onChange={(e) => setV({ ...v, Donem: e.target.value })} /></Field>
                <Field label="Tutar (₺)"><input className="input" inputMode="numeric" value={v.Tutar || ''} onChange={(e) => setV({ ...v, Tutar: Number(e.target.value) || 0 })} /></Field>
              </div>
              <Field label="Tedarikçi"><input className="input" value={v.Tedarikci} onChange={(e) => setV({ ...v, Tedarikci: e.target.value })} /></Field>
              <button className="btn green block" disabled={!v.SatNumarasi.trim()} onClick={async () => { await repo.create('ohe_sat', { ...v, Title: v.SatNumarasi, FaturaEki: '' }); setYeni(false); showToast('SAT eklendi'); }}>Kaydet</button>
            </div>
          </Sheet>
        </>
      )}
    </Async>
  );
}

// ── Malzeme kodları (kod bazlı stok) ─────────────────────────────
function Malzeme() {
  const q = useTable('ohe_stok');
  const [ara, setAra] = useState('');
  return (
    <Async q={q}>
      {(rows) => {
        const f = rows.filter((r) => !ara || trNorm(`${r.Title} ${r.Kategori} ${r.Bolum}`).includes(trNorm(ara)));
        return (
          <>
            <input className="input" type="search" placeholder="Malzeme kodu, kategori" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Malzeme ara" />
            <div className="card scroll-x">
              <table className="tbl">
                <thead><tr><th>Kod</th><th>Kategori</th><th>Ank.</th><th>İst.</th><th>İzm.</th><th>Bod.</th><th>Toplam</th></tr></thead>
                <tbody>
                  {f.map((r) => (
                    <tr key={r.ID}>
                      <td className="mono small">{r.Title}<div className="tiny muted">{r.Bolum}</div></td><td className="small">{r.Kategori}</td>
                      <td className="mono">{r.Ankara}</td><td className="mono">{r.Istanbul}</td><td className="mono">{r.Izmir}</td><td className="mono">{r.Bodrum}</td>
                      <td className="mono bold" style={{ color: r.ToplamAdet === 0 ? 'var(--st-red)' : undefined }}>{r.ToplamAdet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      }}
    </Async>
  );
}

// ── Test hatları ───────────────────────────────────────────
function TestHatlari() {
  const q = useTable('ohe_test_hat');
  const showToast = useApp((s) => s.showToast);
  return (
    <Async q={q}>
      {(rows) => (
        <>
          <div className="kpis"><Kpi v={rows.filter((r) => r.HatDurumu === '2. Kullanımda').length} l="Kullanımda" tone="st-ust" /><Kpi v={rows.filter((r) => r.HatDurumu === '1. Stokta').length} l="Stokta" tone="st-onay" /></div>
          <div className="list">
            {rows.map((r) => (
              <div key={r.ID} className="card row" style={{ padding: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bold mono">{r.Title}</div>
                  <div className="small muted">{r.Personel || 'Atanmamış'}{r.YedekSIM ? ` · yedek ${r.YedekSIM}` : ''}</div>
                </div>
                <button className="btn ghost small" onClick={async () => {
                  const kullanimda = r.HatDurumu === '2. Kullanımda';
                  await repo.update('ohe_test_hat', r.ID, { HatDurumu: kullanimda ? '1. Stokta' : '2. Kullanımda', Personel: kullanimda ? '' : useApp.getState().kullanici });
                  showToast(kullanimda ? 'Stoğa alındı' : 'Size atandı');
                }}>{r.HatDurumu === '2. Kullanımda' ? 'Stoğa al' : 'Bana ata'}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Async>
  );
}

// ── Bütçe ────────────────────────────────────────────────
function Butce() {
  const tanim = useTable('ohe_butce');
  const harcama = useTable('ohe_harcama');
  const showToast = useApp((s) => s.showToast);
  const [yeni, setYeni] = useState(false);
  const [v, setV] = useState({ Kategori: HARCAMA_KATEGORI[0] as (typeof HARCAMA_KATEGORI)[number], Tutar: 0, Tedarikci: '', FaturaRef: '' });
  if (!tanim.data || !harcama.data) return <Async q={tanim}>{() => null}</Async>;
  const h = harcama.data;
  const harcanan = (kat: string) => (kat === '1. Genel' ? h.reduce((a, x) => a + x.Tutar, 0) : h.filter((x) => choiceLabel(x.Kategori) === choiceLabel(kat)).reduce((a, x) => a + x.Tutar, 0));
  return (
    <>
      <div className="list">
        {BUTCE_KATEGORI.map((k) => {
          const t = tanim.data!.find((x) => x.Kategori === k);
          if (!t) return null;
          const hc = harcanan(k);
          return (
            <div key={k} className="card stack" style={{ gap: 6 }}>
              <div className="row"><b>{choiceLabel(k)}</b><span className="spacer" /><span className="small muted">{t.Donem}</span></div>
              <Progress value={hc} max={t.ToplamButce} />
              <div className="row small"><span>Harcanan <b>{fmtTL(hc)}</b></span><span className="spacer" /><span>Kalan <b style={{ color: t.ToplamButce - hc < 0 ? 'var(--st-red)' : undefined }}>{fmtTL(t.ToplamButce - hc)}</b> / {fmtTL(t.ToplamButce)}</span></div>
            </div>
          );
        })}
      </div>
      <div className="row"><div className="section-title">Son harcamalar</div><span className="spacer" /><button className="btn small" onClick={() => setYeni(true)}>+ Harcama</button></div>
      <div className="list">
        {[...h].sort((a, b) => b.Tarih.localeCompare(a.Tarih)).slice(0, 12).map((x) => (
          <div key={x.ID} className="card row" style={{ padding: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}><div className="small bold">{choiceLabel(x.Kategori)} · {x.Tedarikci}</div><div className="tiny muted">{fmtDate(x.Tarih)} · {x.FaturaRef}</div></div>
            <b className="mono small">{fmtTL(x.Tutar)}</b>
          </div>
        ))}
      </div>
      <Sheet open={yeni} onClose={() => setYeni(false)} title="Yeni harcama">
        <div className="stack">
          <div className="grid2">
            <Field label="Kategori"><select className="input" value={v.Kategori} onChange={(e) => setV({ ...v, Kategori: e.target.value as typeof v.Kategori })}>{HARCAMA_KATEGORI.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
            <Field label="Tutar (₺)"><input className="input" inputMode="numeric" value={v.Tutar || ''} onChange={(e) => setV({ ...v, Tutar: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Tedarikçi"><input className="input" value={v.Tedarikci} onChange={(e) => setV({ ...v, Tedarikci: e.target.value })} /></Field>
          <Field label="Fatura ref."><input className="input" value={v.FaturaRef} onChange={(e) => setV({ ...v, FaturaRef: e.target.value })} /></Field>
          <button className="btn green block" disabled={!v.Tutar} onClick={async () => { await repo.create('ohe_harcama', { ...v, Title: `Harcama ${v.FaturaRef}`, Tarih: bugun(), Donem: '2026' }); setYeni(false); showToast('Harcama eklendi'); }}>Kaydet</button>
        </div>
      </Sheet>
    </>
  );
}

// ── Excel aktarım (SheetJS, yalnızca cihazda) ─────────────────────
type Hedef = 'cihaz' | 'stok';
const BEKLENEN: Record<Hedef, string[]> = {
  cihaz: ['Model', 'SeriNo', 'IMEI', 'Lokasyon', 'Durum', 'Zimmet'],
  stok: ['Kod', 'Kategori', 'Bolum', 'Ankara', 'Istanbul', 'Izmir', 'Bodrum'],
};

function ExcelAktarim() {
  const showToast = useApp((s) => s.showToast);
  const kullanici = useApp((s) => s.kullanici);
  const log = useTable('ohe_sync_log');
  const [hedef, setHedef] = useState<Hedef>('cihaz');
  const [dosya, setDosya] = useState<string>('');
  const [satirlar, setSatirlar] = useState<Record<string, unknown>[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [sifirla, setSifirla] = useState(true);
  const kolonlar = useMemo(() => (satirlar[0] ? Object.keys(satirlar[0]) : []), [satirlar]);
  const eksik = BEKLENEN[hedef].filter((k) => !kolonlar.some((c) => trNorm(c) === trNorm(k)));
  const deger = (r: Record<string, unknown>, k: string) => { const key = Object.keys(r).find((c) => trNorm(c) === trNorm(k)); return key ? String(r[key] ?? '').trim() : ''; };

  async function oku(f: File) {
    setHata(null); setDosya(f.name);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      if (!rows.length) throw new Error('İlk sayfada veri satırı yok.');
      setSatirlar(rows.slice(0, 2000));
    } catch (e) { setSatirlar([]); setHata(e instanceof Error ? e.message : String(e)); }
  }

  async function sablon() {
    const XLSX = await import('xlsx');
    const veri = hedef === 'cihaz'
      ? [{ Model: 'Tablet T10', SeriNo: 'SN-DEMO-90001', IMEI: '000000000900001', Lokasyon: 'Ankara', Durum: 'Stokta', Zimmet: '' }, { Model: 'Modem FX-300', SeriNo: 'SN-DEMO-00002', IMEI: '000000000100007', Lokasyon: 'İzmir', Durum: 'Verildi', Zimmet: 'Etkinlik Ekibi' }]
      : [{ Kod: 'MLZ-1001', Kategori: 'Telefon', Bolum: 'VIP', Ankara: 4, Istanbul: 6, Izmir: 1, Bodrum: 0 }, { Kod: 'MLZ-2001', Kategori: 'SIM Kart', Bolum: 'Test', Ankara: 20, Istanbul: 15, Izmir: 5, Bodrum: 5 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(veri), 'Veri');
    indir(new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `ohe-${hedef}-sablon-demo.xlsx`);
  }

  async function aktar() {
    let eklenen = 0, guncellenen = 0, sifirlanan = 0, hatali = 0;
    const lokasyon = (s: string) => OHE_LOKASYON.find((l) => trNorm(choiceLabel(l)) === trNorm(s));
    if (hedef === 'cihaz') {
      const mevcut = await repo.list('ohe_cihaz');
      for (const r of satirlar) {
        const seri = deger(r, 'SeriNo'), lok = lokasyon(deger(r, 'Lokasyon'));
        if (!seri || !lok) { hatali++; continue; }
        const durum: OheCihaz['Durum'] = trNorm(deger(r, 'Durum')).startsWith('ver') ? '2. Verildi' : '1. Stokta';
        const v = { Model: deger(r, 'Model'), IMEI: deger(r, 'IMEI'), Lokasyon: lok, Durum: durum, Zimmet: deger(r, 'Zimmet') };
        const m = mevcut.find((c) => c.SeriNo === seri);
        if (m) { await repo.update('ohe_cihaz', m.ID, v, 'Excel aktarım'); guncellenen++; }
        else { await repo.create('ohe_cihaz', { ...v, Title: v.Model, SeriNo: seri, StokGiris: bugun(), StokCikis: null, Aciklama: 'Excel aktarım', OnayDurumu: 'Onay Bekliyor' }); eklenen++; }
      }
    } else {
      const mevcut = await repo.list('ohe_stok');
      const gelen = new Set<string>();
      for (const r of satirlar) {
        const kod = deger(r, 'Kod');
        if (!kod) { hatali++; continue; }
        gelen.add(kod);
        const n = (k: string) => Math.max(0, Number(deger(r, k)) || 0);
        const v: Partial<OheStok> = { Kategori: deger(r, 'Kategori'), Bolum: deger(r, 'Bolum'), Ankara: n('Ankara'), Istanbul: n('Istanbul'), Izmir: n('Izmir'), Bodrum: n('Bodrum') };
        v.ToplamAdet = (v.Ankara ?? 0) + (v.Istanbul ?? 0) + (v.Izmir ?? 0) + (v.Bodrum ?? 0);
        const m = mevcut.find((x) => x.Title === kod);
        if (m) { await repo.update('ohe_stok', m.ID, v); guncellenen++; }
        else { await repo.create('ohe_stok', { ...(v as Omit<OheStok, keyof import('../data/types').BaseRecord>), Title: kod }); eklenen++; }
      }
      if (sifirla) for (const m of mevcut) if (!gelen.has(m.Title) && m.ToplamAdet > 0) { await repo.update('ohe_stok', m.ID, { Ankara: 0, Istanbul: 0, Izmir: 0, Bodrum: 0, ToplamAdet: 0 }); sifirlanan++; }
    }
    await repo.create('ohe_sync_log', { Title: dosya, SyncTarihi: bugun(), Eklenen: eklenen, Guncellenen: guncellenen, Sifirlanan: sifirlanan, Hatali: hatali, Detay: `${hedef === 'cihaz' ? 'Cihaz envanteri' : 'Malzeme stokları'} · ${dosya} · ${kullanici}` });
    setSatirlar([]); setDosya('');
    showToast(`Aktarıldı: +${eklenen} · ~${guncellenen} · 0↓${sifirlanan} · hatalı ${hatali}`);
  }

  return (
    <>
      <div className="banner info"><span>🔒</span><div>Dosya yalnızca bu cihazda okunur; hiçbir yere yüklenmez. Demo için örnek şablonu indirip deneyebilirsiniz.</div></div>
      <Chips<Hedef> value={hedef} onChange={(h) => { setHedef(h); setSatirlar([]); }} label="Hedef" items={[{ id: 'cihaz', label: 'Cihaz envanteri (seri no)' }, { id: 'stok', label: 'Malzeme stokları (kod)' }]} />
      <div className="row wrap">
        <label className="btn" style={{ cursor: 'pointer' }}>.xlsx seç<input type="file" accept=".xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void oku(f); e.target.value = ''; }} /></label>
        <button className="btn ghost" onClick={sablon}>Örnek şablon indir</button>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>Beklenen sütunlar: {BEKLENEN[hedef].join(', ')}</p>
      {hata && <div className="banner danger"><span>⚠️</span><div>Dosya okunamadı: {hata}</div></div>}
      {satirlar.length > 0 && (
        <div className="card stack">
          <div className="row"><b className="ellipsis">{dosya}</b><span className="spacer" /><span className="small muted">{fmtNum(satirlar.length)} satır</span></div>
          {eksik.length > 0 && <div className="banner warn"><span>⚠️</span><div>Eksik sütun: {eksik.join(', ')}. Bu satırlar "hatalı" sayılabilir.</div></div>}
          <div className="scroll-x">
            <table className="tbl">
              <thead><tr>{kolonlar.map((k) => <th key={k}>{k}</th>)}</tr></thead>
              <tbody>{satirlar.slice(0, 20).map((r, i) => <tr key={i}>{kolonlar.map((k) => <td key={k} className="small">{String(r[k] ?? '')}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {satirlar.length > 20 && <p className="tiny muted" style={{ margin: 0 }}>İlk 20 satır gösteriliyor.</p>}
          {hedef === 'stok' && <label className="toggle small"><input type="checkbox" checked={sifirla} onChange={(e) => setSifirla(e.target.checked)} /> Dosyada olmayan kodların adetlerini sıfırla</label>}
          <div className="btn-bar"><button className="btn ghost" onClick={() => setSatirlar([])}>Vazgeç</button><button className="btn green" onClick={aktar}>İçe aktar</button></div>
        </div>
      )}
      <div className="section-title">Aktarım geçmişi</div>
      <Async q={log}>
        {(rows) => rows.length === 0 ? <Empty title="Aktarım yok" /> : (
          <div className="list">
            {[...rows].sort((a, b) => b.ID - a.ID).map((l) => (
              <div key={l.ID} className="card" style={{ padding: 10 }}>
                <div className="row small"><b>{fmtDate(l.SyncTarihi)}</b><span className="spacer" /><span className="tiny muted">{fmtDateTime(l.Created)}</span></div>
                <div className="small">+{l.Eklenen} eklendi · {l.Guncellenen} güncellendi · {l.Sifirlanan} sıfırlandı · {l.Hatali} hatalı</div>
                <div className="tiny muted">{l.Detay}</div>
              </div>
            ))}
          </div>
        )}
      </Async>
    </>
  );
}
