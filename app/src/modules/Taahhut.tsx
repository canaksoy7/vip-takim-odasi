import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { VERILEN_TIP, type Taahhut as T } from '../data/types';
import { daysBetween, fmtDate, fmtDateTime, trNorm } from '../lib/format';
import { cakismalar, taahhutGrubu, TAAHHUT_ESIKLERI } from '../lib/rules';
import { Async, Chips, Empty, Field, Kv, PageHead, Pill, Sheet, Tabs } from '../ui/kit';
import { GecmisListe } from '../ui/Gecmis';
import { MaskeliNumara } from '../ui/MaskeliNumara';

type Grup = 'tumu' | 'gecmis' | 'yakin' | 'uzak' | 'cakisan';
type Tip = 'tumu' | (typeof VERILEN_TIP)[number];
const kalan = (t: T) => daysBetween(new Date().toISOString(), new Date(t.TaahhutBitis));

export default function Taahhut({ route }: { route: Route }) {
  const id = route.path[1];
  const q = useData(async () => ({ list: await repo.list('taahhut'), alarm: await repo.list('taahhut_bildirim') }), ['taahhut', 'taahhut_bildirim']);
  return (
    <Async q={q}>
      {({ list, alarm }) => id === 'yeni' ? <Form /> : id ? <Detay t={list.find((x) => x.ID === Number(id))} list={list} /> : <Liste list={list} alarm={alarm} />}
    </Async>
  );
}

function Liste({ list, alarm }: { list: T[]; alarm: { ID: number; KayitID: number; Esik: number; KalanGun: number; MusteriAdi: string; GonderimZamani: string; Tetikleyen: string }[] }) {
  const [sekme, setSekme] = useState<'liste' | 'alarm'>('liste');
  const [g, setG] = useState<Grup>('yakin');
  const [tip, setTip] = useState<Tip>('tumu');
  const [ara, setAra] = useState('');
  const cak = useMemo(() => cakismalar(list), [list]);
  const tipli = list.filter((t) => (tip === 'tumu' || t.VerilenTip === tip) && (!ara || trNorm(`${t.KisiUnvan} ${t.Tarife}`).includes(trNorm(ara))));
  const uy = (t: T, gg: Grup) => gg === 'tumu' || (gg === 'cakisan' ? cak.has(t.ID) : taahhutGrubu(kalan(t)) === gg);
  const liste = tipli.filter((t) => uy(t, g)).sort((a, b) => a.TaahhutBitis.localeCompare(b.TaahhutBitis));
  return (
    <div className="stack">
      <PageHead title="VVIP taahhütler" sub={`Alarm eşikleri: ${TAAHHUT_ESIKLERI.join(' / ')} gün · günün ilk açılışında çalışır`}
        right={<button className="btn small" onClick={() => nav('/taahhut/yeni')}>+ Yeni</button>} />
      <div className="row wrap">
        <button className="btn ghost small" onClick={() => nav('/ust-hat')}>🔒 Üst Yönetim Hatları</button>
        <button className="btn ghost small" onClick={() => nav('/indirim')}>🧮 Ek indirim hesapla</button>
      </div>
      <Tabs value={sekme} onChange={setSekme} items={[{ id: 'liste', label: 'Taahhütler' }, { id: 'alarm', label: `Alarm kayıtları (${alarm.length})` }]} />
      {sekme === 'liste' ? (
        <>
          <Chips<Grup> value={g} onChange={setG} label="Bitiş" items={[
            { id: 'yakin', label: '30 gün içinde', n: tipli.filter((t) => uy(t, 'yakin')).length },
            { id: 'gecmis', label: 'Bitişi geçmiş', n: tipli.filter((t) => uy(t, 'gecmis')).length },
            { id: 'uzak', label: 'İleri tarihli', n: tipli.filter((t) => uy(t, 'uzak')).length },
            { id: 'cakisan', label: 'Çakışan', n: tipli.filter((t) => uy(t, 'cakisan')).length },
            { id: 'tumu', label: 'Tümü', n: tipli.length },
          ]} />
          <Chips<Tip> value={tip} onChange={setTip} label="Ürün tipi" items={[{ id: 'tumu', label: 'Tüm ürünler' }, ...VERILEN_TIP.map((v) => ({ id: v, label: v }))]} />
          <input className="input" type="search" placeholder="Kişi / ünvan / tarife" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Ara" />
          {liste.length === 0 ? <Empty icon="🔄" title="Bu filtrede taahhüt yok" /> : (
            <div className="list">
              {liste.map((t) => {
                const k = kalan(t);
                const grp = taahhutGrubu(k);
                return (
                  <button key={t.ID} className={`card tap bar-left ${grp === 'gecmis' ? 'st-red' : grp === 'yakin' ? 'st-bekle' : 'st-onay'}`} onClick={() => nav(`/taahhut/${t.ID}`)}>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="tiny muted">{t.VerilenTip}</span>
                      {cak.has(t.ID) && <Pill tone="red" plain>Çakışma</Pill>}
                      <span className="spacer" />
                      <Pill tone={grp === 'gecmis' ? 'red' : grp === 'yakin' ? (k <= 7 ? 'turuncu' : 'bekle') : 'onay'} plain>
                        {k < 0 ? `${-k} gün geçti` : `${k} gün kaldı`}
                      </Pill>
                    </div>
                    <div className="bold ellipsis">{t.KisiUnvan}</div>
                    <div className="small muted">{t.Tarife} · %{t.IndirimOrani} · bitiş {fmtDate(t.TaahhutBitis)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        alarm.length === 0 ? <Empty icon="🔔" title="Alarm kaydı yok" /> : (
          <div className="list">
            {[...alarm].sort((a, b) => b.ID - a.ID).map((a) => (
              <button key={a.ID} className="card tap" onClick={() => nav(`/taahhut/${a.KayitID}`)}>
                <div className="row small"><Pill tone="bekle" plain>{a.Esik} gün eşiği</Pill><span className="spacer" /><span className="muted">{fmtDateTime(a.GonderimZamani)}</span></div>
                <div className="bold ellipsis">{a.MusteriAdi}</div>
                <div className="tiny muted">Kalan {a.KalanGun} gün · tetikleyen {a.Tetikleyen} · Bildirim Kutusu'na yazıldı</div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Detay({ t, list }: { t?: T; list: T[] }) {
  const [duzenle, setDuzenle] = useState(false);
  const [sekme, setSekme] = useState<'bilgi' | 'gecmis'>('bilgi');
  if (!t) return <Empty icon="🔎" title="Taahhüt bulunamadı" />;
  const cak = cakismalar(list).get(t.ID) ?? [];
  const k = kalan(t);
  return (
    <div className="stack">
      <div className="card stack" style={{ gap: 6 }}>
        <div className="row"><span className="tiny muted">{t.VerilenTip}</span><span className="spacer" /><Pill tone={k < 0 ? 'red' : k <= 30 ? 'bekle' : 'onay'} plain>{k < 0 ? `${-k} gün geçti` : `${k} gün kaldı`}</Pill></div>
        <h2 style={{ fontSize: 19 }}>{t.KisiUnvan}</h2>
        <div className="small">📱 <MaskeliNumara value={t.MSISDN} modul="VVIP Taahhüt" kayitId={t.ID} /></div>
      </div>
      {cak.length > 0 && (
        <div className="banner danger"><span>⚠️</span><div><b>Çakışma:</b> aynı numarada tarih aralığı örtüşen {cak.length} kayıt var.{' '}
          {cak.map((c) => <button key={c} className="btn ghost small" style={{ marginLeft: 4 }} onClick={() => nav(`/taahhut/${c}`)}>#{c}</button>)}</div></div>
      )}
      <Tabs value={sekme} onChange={setSekme} items={[{ id: 'bilgi', label: 'Bilgiler' }, { id: 'gecmis', label: 'Değişiklik geçmişi' }]} />
      {sekme === 'bilgi' ? (
        <div className="card">
          <Kv rows={[
            ['Ürün tipi', t.VerilenTip], ['Tarife', t.Tarife], ['İndirim oranı', `%${t.IndirimOrani}`], ['Başlangıç', fmtDate(t.TaahhutBaslangic)],
            ['Bitiş', fmtDate(t.TaahhutBitis)], ['Kimden geldi', t.KimdenGeldi], ['Hediye', t.Hediye], ['Hediye notu', t.HediyeNot], ['Ekleyen', t.Ekleyen],
          ]} />
        </div>
      ) : <GecmisListe liste="VVIP Taahhüt" kayitId={t.ID} />}
      <div className="sticky-actions">
        <button className="btn ghost" onClick={() => nav('/indirim')}>İndirim hesapla</button>
        <button className="btn" onClick={() => setDuzenle(true)}>Düzenle</button>
      </div>
      <Sheet open={duzenle} onClose={() => setDuzenle(false)} title="Taahhüdü düzenle"><Form mevcut={t} onDone={() => setDuzenle(false)} /></Sheet>
    </div>
  );
}

function Form({ mevcut, onDone }: { mevcut?: T; onDone?: () => void }) {
  const showToast = useApp((s) => s.showToast);
  const kullanici = useApp((s) => s.kullanici);
  const bugun = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState({
    KisiUnvan: mevcut?.KisiUnvan ?? '', MSISDN: mevcut?.MSISDN ?? '0 5XX 000 00 ', VerilenTip: mevcut?.VerilenTip ?? 'Mobil' as T['VerilenTip'],
    Tarife: mevcut?.Tarife ?? '', IndirimOrani: mevcut?.IndirimOrani ?? 10, TaahhutBaslangic: mevcut?.TaahhutBaslangic ?? bugun,
    TaahhutBitis: mevcut?.TaahhutBitis ?? bugun, KimdenGeldi: mevcut?.KimdenGeldi ?? '', Hediye: mevcut?.Hediye ?? '', HediyeNot: mevcut?.HediyeNot ?? '',
  });
  const set = (k: keyof typeof v, val: string | number) => setV((x) => ({ ...x, [k]: val }));
  return (
    <div className="stack">
      {!mevcut && <PageHead title="Yeni taahhüt" sub="Numaralar demo biçiminde (0 5XX 000 …) girilmelidir" />}
      <Field label="Kişi — Ünvan"><input className="input" value={v.KisiUnvan} onChange={(e) => set('KisiUnvan', e.target.value)} /></Field>
      {!mevcut && <Field label="Numara"><input className="input mono" value={v.MSISDN} onChange={(e) => set('MSISDN', e.target.value)} /></Field>}
      <div className="grid2">
        <Field label="Ürün tipi"><select className="input" value={v.VerilenTip} onChange={(e) => set('VerilenTip', e.target.value)}>{VERILEN_TIP.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="İndirim (%)"><input className="input" inputMode="numeric" value={v.IndirimOrani} onChange={(e) => set('IndirimOrani', Number(e.target.value) || 0)} /></Field>
      </div>
      <Field label="Tarife"><input className="input" value={v.Tarife} onChange={(e) => set('Tarife', e.target.value)} /></Field>
      <div className="grid2">
        <Field label="Başlangıç"><input className="input" type="date" value={v.TaahhutBaslangic} onChange={(e) => set('TaahhutBaslangic', e.target.value)} /></Field>
        <Field label="Bitiş"><input className="input" type="date" value={v.TaahhutBitis} onChange={(e) => set('TaahhutBitis', e.target.value)} /></Field>
      </div>
      <Field label="Kimden geldi"><input className="input" value={v.KimdenGeldi} onChange={(e) => set('KimdenGeldi', e.target.value)} /></Field>
      <Field label="Hediye"><input className="input" value={v.Hediye} onChange={(e) => set('Hediye', e.target.value)} /></Field>
      <button className="btn block green" disabled={!v.KisiUnvan.trim()} onClick={async () => {
        if (mevcut) { await repo.update('taahhut', mevcut.ID, v); showToast('Kaydedildi'); onDone?.(); }
        else { const r = await repo.create('taahhut', { ...v, Title: `${v.KisiUnvan} — ${v.VerilenTip}`, Ekleyen: kullanici }); showToast('Taahhüt eklendi'); nav(`/taahhut/${r.ID}`); }
      }}>Kaydet</button>
    </div>
  );
}
