import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Route } from '../router';
import { useTable } from '../data/hooks';
import { repo } from '../data/repo';
import { DEPARTMANLAR, type Rehber as R } from '../data/types';
import { fmtDateTime, trNorm } from '../lib/format';
import { rehberAra, vakaOner, type VakaSonuc } from '../lib/rehberMatch';
import { Async, Chips, Empty, Field, PageHead, Pill, Tabs } from '../ui/kit';

type Sekme = 'ara' | 'vaka' | 'bosluk';

export default function Rehber({ route }: { route: Route }) {
  const q = useTable('rehber');
  const [sekme, setSekme] = useState<Sekme>('ara');
  return (
    <div className="stack">
      <PageHead title="Sorumluluk rehberi" sub="Deneyim ekipleri · 9 departman · Türkçe karakter duyarsız" />
      <Tabs value={sekme} onChange={setSekme} items={[{ id: 'ara', label: 'Ara' }, { id: 'vaka', label: 'Vaka → sorumlu' }, { id: 'bosluk', label: 'Boşluk analizi' }]} />
      <Async q={q}>
        {(rows) => sekme === 'ara' ? <Ara rows={rows} q0={route.query.get('q') ?? ''} /> : sekme === 'vaka' ? <Vaka rows={rows} /> : <Bosluk />}
      </Async>
    </div>
  );
}

function vurgula(text: string, q: string): ReactNode {
  const n = trNorm(q).trim();
  if (!n) return text;
  const terms = n.split(/\s+/).filter(Boolean);
  const norm = trNorm(text);
  const marks: [number, number][] = [];
  for (const t of terms) { let i = norm.indexOf(t); while (i >= 0) { marks.push([i, i + t.length]); i = norm.indexOf(t, i + t.length); } }
  if (!marks.length || norm.length !== text.length) return text;
  marks.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = []; let p = 0;
  marks.forEach(([s, e], k) => { if (s < p) return; out.push(text.slice(p, s), <mark key={k}>{text.slice(s, e)}</mark>); p = e; });
  out.push(text.slice(p));
  return out;
}

function Kart({ r, q, eslesen }: { r: R; q?: string; eslesen?: string[] }) {
  return (
    <div className="card stack" style={{ gap: 4, padding: 12 }}>
      <div className="row"><b>{vurgula(r.Title, q ?? '')}</b><span className="spacer" /><Pill tone="ust" plain>{r.Departman}</Pill></div>
      <div className="small muted">{r.Rol} · <span className="mono">{r.Eposta}</span></div>
      <div className="small">{vurgula(r.Alanlar, q ?? '')}</div>
      {eslesen && <div className="tiny muted">Eşleşen: {eslesen.join(', ')}</div>}
    </div>
  );
}

function Ara({ rows, q0 }: { rows: R[]; q0: string }) {
  const [q, setQ] = useState(q0);
  const [dep, setDep] = useState<string>('tumu');
  const sonuc = useMemo(() => rehberAra(rows, q).filter((r) => dep === 'tumu' || r.Departman === dep), [rows, q, dep]);
  // Arama kaydı (yazma bittikten 1 sn sonra)
  useEffect(() => {
    const t = q.trim();
    if (t.length < 3) return;
    const h = setTimeout(() => {
      void repo.create('rehber_arama', { Title: t, Sonuc: sonuc.length, Mod: 'Kelime', Departmanlar: [...new Set(sonuc.map((s) => s.Departman))].join(', ') }, { silent: true });
    }, 1000);
    return () => clearTimeout(h);
  }, [q, sonuc]);
  return (
    <>
      <input className="input" type="search" autoFocus placeholder="Kelime ya da harf: fatura, roaming, tivibu…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rehberde ara" />
      <Chips value={dep} onChange={setDep} label="Departman" items={[{ id: 'tumu', label: 'Tüm departmanlar' }, ...DEPARTMANLAR.map((d) => ({ id: d, label: d, n: rows.filter((r) => r.Departman === d).length }))]} />
      <div className="tiny muted">{sonuc.length} kişi/ekip</div>
      {sonuc.length === 0 ? <Empty icon="🔍" title="Sonuç bulunamadı" text="Bu arama boşluk analizine kaydedildi. Vaka sekmesinde metni yapıştırmayı deneyin." /> : (
        <div className="list">{sonuc.slice(0, 60).map((r) => <Kart key={r.ID} r={r} q={q} />)}</div>
      )}
    </>
  );
}

function Vaka({ rows }: { rows: R[] }) {
  const [metin, setMetin] = useState('');
  const [sonuc, setSonuc] = useState<VakaSonuc | null>(null);
  const ornekler = [
    'Müşteri yurtdışında roaming açık olmasına rağmen şebekeye bağlanamıyor, ayrıca faturasında yüksek tutar var.',
    'Tivibu set üstü kutu maç yayınında donuyor, kanal paketi de tanımlanmamış görünüyor.',
    'Kurumsal müşterinin metro ethernet data hattında SLA ihlali var, kurumsal fatura itirazı da iletti.',
  ];
  return (
    <>
      <div className="chips">{ornekler.map((o, i) => <button key={i} className="chip" onClick={() => { setMetin(o); setSonuc(null); }}>Örnek vaka {i + 1}</button>)}</div>
      <Field label="Vaka metni"><textarea className="input" value={metin} onChange={(e) => setMetin(e.target.value)} placeholder="Müşteri şikâyetini ya da mail metnini yapıştırın…" /></Field>
      <button className="btn block" disabled={metin.trim().length < 5} onClick={async () => {
        const s = vakaOner(rows, metin);
        setSonuc(s);
        await repo.create('rehber_arama', { Title: metin.trim().slice(0, 80), Sonuc: s.oneriler.length, Mod: 'Vaka', Departmanlar: s.oneriler.map((o) => o.kayit.Departman).join(', ') }, { silent: true });
      }}>Sorumlu öner</button>
      {sonuc && (sonuc.oneriler.length === 0 ? <Empty icon="🤷" title="Eşleşen sorumlu yok" text="Anahtar kelime bulunamadı; vaka boşluk analizine kaydedildi." /> : (
        <div className="stack">
          {sonuc.cakisma && <div className="banner warn"><span>🔀</span><div><b>Yönlendirme notu:</b> {sonuc.cakisma}</div></div>}
          {sonuc.oneriler.map((o, i) => (
            <div key={o.kayit.ID}>
              <div className="tiny bold muted" style={{ margin: '0 0 4px 4px' }}>{i === 0 ? '1. öneri' : `${i + 1}. öneri`} · puan {o.puan}</div>
              <Kart r={o.kayit} eslesen={o.eslesen} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Bosluk() {
  const q = useTable('rehber_arama');
  return (
    <Async q={q}>
      {(rows) => {
        const bos = new Map<string, { n: number; son: string; mod: string }>();
        for (const r of rows.filter((x) => x.Sonuc === 0)) {
          const k = trNorm(r.Title);
          const v = bos.get(k);
          bos.set(k, { n: (v?.n ?? 0) + 1, son: v && v.son > r.Created ? v.son : r.Created, mod: r.Mod });
        }
        const liste = [...bos.entries()].sort((a, b) => b[1].n - a[1].n);
        return (
          <>
            <div className="banner info"><span>🧭</span><div>Sonuç bulunamayan aramalar rehberde hangi konuların sahipsiz kaldığını gösterir. Bu listeyi rehbere alan eklemek için kullanın.</div></div>
            {liste.length === 0 ? <Empty icon="✅" title="Sonuçsuz arama yok" /> : (
              <div className="list">
                {liste.map(([k, v]) => (
                  <div key={k} className="card row" style={{ padding: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="bold ellipsis">{k}</div><div className="tiny muted">{v.mod} · son {fmtDateTime(v.son)}</div></div>
                    <Pill tone="red" plain>{v.n}×</Pill>
                  </div>
                ))}
              </div>
            )}
            <div className="section-title">Son aramalar</div>
            <div className="list">
              {[...rows].sort((a, b) => b.ID - a.ID).slice(0, 15).map((r) => (
                <div key={r.ID} className="row small" style={{ padding: '4px 4px' }}>
                  <span className="ellipsis">{r.Title}</span><span className="spacer" /><span className="tiny muted">{r.Mod}</span><b className="mono">{r.Sonuc}</b>
                </div>
              ))}
            </div>
          </>
        );
      }}
    </Async>
  );
}
