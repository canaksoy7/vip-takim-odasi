import { useState } from 'react';
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { EKIP } from '../data/seed';
import { GOREV_KATEGORI, GOREV_ONCELIK, GUNDEM_DURUM, type Gorev as G } from '../data/types';
import { choiceLabel, daysBetween, fmtDate, fmtDateTime } from '../lib/format';
import { Async, Avatar, Chips, Empty, Field, PageHead, Pill, Sheet } from '../ui/kit';

const KISILER = EKIP.filter((e) => e.rol !== 'ÖHE Ekibi').map((e) => e.ad);
const ONCELIK_TON: Record<string, 'gri' | 'ust' | 'turuncu' | 'red'> = { '1. Düşük': 'gri', '2. Normal': 'ust', '3. Yüksek': 'turuncu', '4. Acil': 'red' };
type Adim = { t: string; ok: boolean };
const adimlar = (g: G): Adim[] => { try { return JSON.parse(g.AltAdimlar || '[]') as Adim[]; } catch { return []; } };

export default function Gorev({ route }: { route: Route }) {
  const id = route.path[1] ? Number(route.path[1]) : null;
  const q = useData(async () => ({ g: await repo.list('gorev'), log: await repo.list('gorev_log') }), ['gorev', 'gorev_log']);
  return <Async q={q}>{(d) => id ? <Detay g={d.g.find((x) => x.ID === id)} log={d.log.filter((l) => l.GorevID === id)} /> : <Pano list={d.g} />}</Async>;
}

async function logla(gorevId: number, action: string) {
  await repo.create('gorev_log', { Title: action, GorevID: gorevId, User: useApp.getState().kullanici, Action: action, Time: new Date().toISOString() });
}

function Pano({ list }: { list: G[] }) {
  const kullanici = useApp((s) => s.kullanici);
  const [d, setD] = useState<string>('2. Devam Ediyor');
  const [kim, setKim] = useState<'ben' | 'tumu'>('ben');
  const [yeni, setYeni] = useState(false);
  const f = list.filter((g) => kim === 'tumu' || g.AtananKisi === kullanici);
  return (
    <div className="stack">
      <PageHead title="Görevler" sub="Ekip görev panosu" right={<button className="btn small" onClick={() => setYeni(true)}>+ Görev</button>} />
      <Chips value={kim} onChange={setKim} label="Kişi" items={[{ id: 'ben', label: 'Bana atananlar', n: list.filter((g) => g.AtananKisi === kullanici).length }, { id: 'tumu', label: 'Tüm ekip', n: list.length }]} />
      <Chips value={d} onChange={setD} label="Durum" items={GUNDEM_DURUM.map((x) => ({ id: x, label: choiceLabel(x), n: f.filter((g) => g.Durum === x).length }))} />
      {f.filter((g) => g.Durum === d).length === 0 ? <Empty icon="✅" title="Bu sütunda görev yok" /> : (
        <div className="list">
          {f.filter((g) => g.Durum === d).sort((a, b) => b.Oncelik.localeCompare(a.Oncelik)).map((g) => {
            const a = adimlar(g); const gec = g.BitisTarihi && !g.TamamlandiMi && daysBetween(g.BitisTarihi) > 0;
            return (
              <button key={g.ID} className="card tap" style={{ padding: 12 }} onClick={() => nav(`/gorev/${g.ID}`)}>
                <div className="row"><Pill tone={ONCELIK_TON[g.Oncelik]} plain>{choiceLabel(g.Oncelik)}</Pill><span className="tiny muted">{choiceLabel(g.Kategori)}</span><span className="spacer" /><Avatar name={g.AtananKisi} size={24} /></div>
                <div className="bold" style={{ marginTop: 4 }}>{g.Title}</div>
                <div className="small muted">{g.BitisTarihi ? <span style={{ color: gec ? 'var(--st-red)' : undefined }}>Bitiş {fmtDate(g.BitisTarihi)}{gec ? ' · gecikti' : ''}</span> : 'Bitiş yok'}{a.length ? ` · ${a.filter((x) => x.ok).length}/${a.length} adım` : ''}</div>
              </button>
            );
          })}
        </div>
      )}
      <Sheet open={yeni} onClose={() => setYeni(false)} title="Yeni görev"><Yeni onDone={() => setYeni(false)} /></Sheet>
    </div>
  );
}

function Yeni({ onDone }: { onDone: () => void }) {
  const showToast = useApp((s) => s.showToast);
  const kullanici = useApp((s) => s.kullanici);
  const [v, setV] = useState({ Title: '', AtananKisi: KISILER.includes(kullanici) ? kullanici : KISILER[0], Oncelik: '2. Normal' as G['Oncelik'], Kategori: '1. Genel' as G['Kategori'], BitisTarihi: '' });
  return (
    <div className="stack">
      <Field label="Başlık *"><input className="input" value={v.Title} onChange={(e) => setV({ ...v, Title: e.target.value })} /></Field>
      <div className="grid2">
        <Field label="Atanan"><select className="input" value={v.AtananKisi} onChange={(e) => setV({ ...v, AtananKisi: e.target.value })}>{KISILER.map((k) => <option key={k}>{k}</option>)}</select></Field>
        <Field label="Bitiş"><input className="input" type="date" value={v.BitisTarihi} onChange={(e) => setV({ ...v, BitisTarihi: e.target.value })} /></Field>
      </div>
      <div className="grid2">
        <Field label="Öncelik"><select className="input" value={v.Oncelik} onChange={(e) => setV({ ...v, Oncelik: e.target.value as G['Oncelik'] })}>{GOREV_ONCELIK.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
        <Field label="Kategori"><select className="input" value={v.Kategori} onChange={(e) => setV({ ...v, Kategori: e.target.value as G['Kategori'] })}>{GOREV_KATEGORI.map((k) => <option key={k} value={k}>{choiceLabel(k)}</option>)}</select></Field>
      </div>
      <button className="btn green block" disabled={!v.Title.trim()} onClick={async () => {
        const g = await repo.create('gorev', { ...v, Aciklama: '', BitisTarihi: v.BitisTarihi || null, Durum: '1. Bekliyor', TamamlandiMi: false, AltAdimlar: '[]' });
        await logla(g.ID, 'Oluşturdu'); showToast('Görev eklendi'); onDone();
      }}>Kaydet</button>
    </div>
  );
}

function Detay({ g, log }: { g?: G; log: { ID: number; User: string; Action: string; Time: string }[] }) {
  const showToast = useApp((s) => s.showToast);
  const [adim, setAdim] = useState('');
  if (!g) return <Empty title="Görev bulunamadı" />;
  const a = adimlar(g);
  const setAdimlar = async (n: Adim[], action: string) => { await repo.update('gorev', g.ID, { AltAdimlar: JSON.stringify(n) }); await logla(g.ID, action); };
  return (
    <div className="stack">
      <div className="card stack" style={{ gap: 6 }}>
        <div className="row"><Pill tone={ONCELIK_TON[g.Oncelik]} plain>{choiceLabel(g.Oncelik)}</Pill><span className="tiny muted">{choiceLabel(g.Kategori)}</span></div>
        <h2 style={{ fontSize: 19 }}>{g.Title}</h2>
        <div className="row small"><Avatar name={g.AtananKisi} size={24} />{g.AtananKisi}<span className="spacer" />Bitiş {fmtDate(g.BitisTarihi)}</div>
      </div>
      <Field label="Durum">
        <select className="input" value={g.Durum} onChange={async (e) => {
          const d = e.target.value as G['Durum'];
          await repo.update('gorev', g.ID, { Durum: d, TamamlandiMi: d === '3. Tamamlandı' }, 'Durum değişikliği');
          await logla(g.ID, `Durum: ${choiceLabel(d)}`); showToast(choiceLabel(d));
        }}>{GUNDEM_DURUM.map((x) => <option key={x} value={x}>{choiceLabel(x)}</option>)}</select>
      </Field>
      <div className="card stack" style={{ gap: 4 }}>
        <div className="section-title" style={{ margin: 0 }}>Alt adımlar</div>
        {a.map((x, i) => (
          <label key={i} className="toggle" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={x.ok} onChange={() => setAdimlar(a.map((y, j) => (j === i ? { ...y, ok: !y.ok } : y)), `${x.t} ${x.ok ? 'geri alındı' : 'tamamlandı'}`)} />
            <span style={{ textDecoration: x.ok ? 'line-through' : undefined }}>{x.t}</span>
          </label>
        ))}
        <div className="row"><input className="input" placeholder="Adım ekle" value={adim} onChange={(e) => setAdim(e.target.value)} /><button className="btn small" disabled={!adim.trim()} onClick={async () => { await setAdimlar([...a, { t: adim.trim(), ok: false }], `Adım eklendi: ${adim.trim()}`); setAdim(''); }}>Ekle</button></div>
      </div>
      <div className="section-title">Aktivite</div>
      <div className="list">{[...log].sort((x, y) => y.ID - x.ID).map((l) => <div key={l.ID} className="small"><span className="muted">{fmtDateTime(l.Time)} · {l.User}:</span> {l.Action}</div>)}</div>
    </div>
  );
}
