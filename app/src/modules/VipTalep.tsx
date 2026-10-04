import { useMemo, useState } from 'react';
import type { Route } from '../router';
import { useApp } from '../store';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { EKIP } from '../data/seed';
import { VIP_DURUM, type VipDurum, type VipMeta, type VipTalep as T } from '../data/types';
import { daysBetween, fmtDate, fmtDateTime, todayKey, trNorm } from '../lib/format';
import { VVIP_UYARI_GUN, isAcik, isVvipBaslik, yasRengi } from '../lib/rules';
import { Async, Avatar, Chips, Empty, Field, Kv, PageHead, Pill, Tabs, csv, indir } from '../ui/kit';

type Acik = 'acik' | 'kapali' | 'tumu';
type Sekme = 'tumu' | 'vvip' | 'onemli';
type Tarih = '7' | '30' | '90' | 'tumu' | 'gun' | 'aralik';
const KISILER = EKIP.filter((e) => e.rol !== 'ÖHE Ekibi').map((e) => e.ad);
const DURUM_TON: Record<VipDurum, 'ust' | 'turuncu' | 'gri' | 'onay'> = { Devam: 'ust', Takip: 'turuncu', 'Ön Başvuru': 'gri', Kapalı: 'onay' };

export default function VipTalep({ route }: { route: Route }) {
  const id = route.path[1] ? Number(route.path[1]) : null;
  const q = useData(async () => ({ talepler: await repo.list('vip_talep'), meta: await repo.list('vip_meta') }), ['vip_talep', 'vip_meta']);
  return <Async q={q}>{(d) => id ? <TekKayit t={d.talepler.find((x) => x.ID === id)} meta={d.meta} /> : <Liste {...d} />}</Async>;
}

function TekKayit({ t, meta }: { t?: T; meta: VipMeta[] }) {
  if (!t) return <Empty icon="🔎" title="Talep bulunamadı" />;
  return <div className="stack"><SatirKart t={t} m={meta.find((m) => m.VipFormID === t.ID)} acikBaslangic /></div>;
}

function Liste({ talepler, meta }: { talepler: T[]; meta: VipMeta[] }) {
  const kullanici = useApp((s) => s.kullanici);
  const [kisi, setKisi] = useState<string>(KISILER.includes(kullanici) ? kullanici : 'tumu');
  const [acik, setAcik] = useState<Acik>('acik');
  const [durum, setDurum] = useState<VipDurum | null>(null);
  const [sekme, setSekme] = useState<Sekme>('tumu');
  const [tarih, setTarih] = useState<Tarih>('tumu');
  const [gun, setGun] = useState(todayKey());
  const [aralik, setAralik] = useState({ bas: todayKey(new Date(Date.now() - 14 * 864e5)), bit: todayKey() });
  const [ara, setAra] = useState('');
  const [acikId, setAcikId] = useState<number | null>(null);

  const metaMap = useMemo(() => new Map(meta.map((m) => [m.VipFormID, m])), [meta]);

  // Kişi + tarih + arama + sekme filtreleri (açık/kapalı ve durum hariç) → KPI sayıları bunun üzerinden
  const taban = useMemo(() => {
    const n = trNorm(ara);
    const now = new Date();
    return talepler.filter((t) => {
      const m = metaMap.get(t.ID);
      if (kisi !== 'tumu' && m?.Takipci !== kisi) return false;
      const yas = daysBetween(t.AcilisTarihi, now);
      if (tarih === '7' || tarih === '30' || tarih === '90') { if (yas > Number(tarih)) return false; }
      if (tarih === 'gun' && todayKey(new Date(t.AcilisTarihi)) !== gun) return false;
      if (tarih === 'aralik') { const k = todayKey(new Date(t.AcilisTarihi)); if (k < aralik.bas || k > aralik.bit) return false; }
      if (sekme === 'vvip' && !isVvipBaslik(t.RequestSubject)) return false;
      if (sekme === 'onemli' && !t.OnemliSikayet) return false;
      if (n && !trNorm(`${t.RequestSubject} ${t.Subject} ${t.Musteri} ${t.TalepNo}`).includes(n)) return false;
      return true;
    });
  }, [talepler, metaMap, kisi, tarih, gun, aralik, sekme, ara]);

  const say = (d: VipDurum) => taban.filter((t) => t.Durum === d).length;
  const acikSay = taban.filter((t) => isAcik(t.Durum)).length;
  const liste = taban
    .filter((t) => (acik === 'acik' ? isAcik(t.Durum) : acik === 'kapali' ? !isAcik(t.Durum) : true))
    .filter((t) => !durum || t.Durum === durum)
    .sort((a, b) => a.AcilisTarihi.localeCompare(b.AcilisTarihi) * (acik === 'acik' ? 1 : -1));
  const vvipGeciken = taban.filter((t) => isAcik(t.Durum) && isVvipBaslik(t.RequestSubject) && daysBetween(t.AcilisTarihi) > VVIP_UYARI_GUN);
  const tarihEtiket = { '7': 'Son 7 gün', '30': 'Son 30 gün', '90': 'Son 90 gün', tumu: 'Tüm tarihler', gun: fmtDate(gun), aralik: `${fmtDate(aralik.bas)} – ${fmtDate(aralik.bit)}` }[tarih];

  return (
    <div className="stack">
      <PageHead title="VIP talepleri" sub="Açık = Devam + Takip · Ön Başvuru kapalı sayılır" right={
        <button className="btn ghost small" onClick={() => indir(csv([
          ['Talep No', 'Mail başlığı', 'Talep içeriği', 'Müşteri', 'Hizmet No', 'Kategori', 'Kanal', 'Kaydı giren', 'Takipçi', 'Durum', 'Açılış'],
          ...liste.map((t) => [t.TalepNo, t.RequestSubject, t.Subject, t.Musteri, t.HizmetNo, t.Kategori, t.Kanal, t.KaydiGiren, metaMap.get(t.ID)?.Takipci, t.Durum, fmtDate(t.AcilisTarihi)]),
        ]), 'vip-talepler-demo.csv')}>CSV</button>
      } />

      {/* Seçili kişi + açık/kapalı her an görünür */}
      <div className="card" style={{ padding: 10, position: 'sticky', top: 'calc(var(--header-h, 120px) + 6px)', zIndex: 15 }}>
        <div className="row small" style={{ marginBottom: 8 }}>
          {kisi !== 'tumu' && <Avatar name={kisi} size={24} />}
          <b>{kisi === 'tumu' ? 'Tüm ekip' : kisi === kullanici ? `${kisi} (ben)` : kisi}</b>
          <span className="muted">· {tarihEtiket}{durum ? ` · ${durum}` : ''}</span>
        </div>
        <Tabs<Acik> value={acik} onChange={(v) => { setAcik(v); setDurum(null); }} items={[
          { id: 'acik', label: `Açık (${acikSay})` }, { id: 'kapali', label: `Kapalı (${taban.length - acikSay})` }, { id: 'tumu', label: `Tümü (${taban.length})` },
        ]} />
      </div>

      <div className="chips" aria-label="Takipçi">
        <button className={`chip${kisi === 'tumu' ? ' on' : ''}`} onClick={() => setKisi('tumu')}>Tüm ekip</button>
        {KISILER.map((p) => (
          <button key={p} className={`chip person-chip${p === kisi ? ' on' : ''}`} onClick={() => setKisi(p)}><Avatar name={p} size={28} />{p === kullanici ? 'Ben' : p}</button>
        ))}
      </div>

      <div className="kpis">
        {VIP_DURUM.map((d) => (
          <button key={d} className={`kpi${durum === d ? ' on' : ''}`} aria-pressed={durum === d} onClick={() => { setDurum(durum === d ? null : d); setAcik(isAcik(d) ? 'acik' : 'kapali'); }}>
            <div className="v">{say(d)}</div>
            <div className="l">{d} <span className="tiny">· {isAcik(d) ? 'açık' : 'kapalı'}</span></div>
          </button>
        ))}
      </div>

      <Chips<Sekme> value={sekme} onChange={setSekme} label="Kırılım" items={[
        { id: 'tumu', label: 'Tümü' }, { id: 'vvip', label: 'VVIP', n: talepler.filter((t) => isVvipBaslik(t.RequestSubject)).length },
        { id: 'onemli', label: 'Önemli Şikâyet', n: talepler.filter((t) => t.OnemliSikayet).length },
      ]} />

      {vvipGeciken.length > 0 && (
        <button className="banner danger" style={{ border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => { setSekme('vvip'); setAcik('acik'); setDurum(null); }}>
          <span>🚨</span><div><b>{vvipGeciken.length} açık VVIP talebi {VVIP_UYARI_GUN} günü aştı.</b> Görmek için dokunun.</div>
        </button>
      )}

      <div className="grid2">
        <select className="input" value={tarih} onChange={(e) => setTarih(e.target.value as Tarih)} aria-label="Tarih filtresi (açılış tarihine göre)">
          <option value="7">Son 7 gün</option><option value="30">Son 30 gün</option><option value="90">Son 90 gün</option>
          <option value="tumu">Tümü</option><option value="gun">Tek gün</option><option value="aralik">Tarih aralığı</option>
        </select>
        <input className="input" type="search" placeholder="Başlık, müşteri, talep no" value={ara} onChange={(e) => setAra(e.target.value)} aria-label="Ara" />
      </div>
      {tarih === 'gun' && <Field label="Açılış günü"><input className="input" type="date" value={gun} onChange={(e) => setGun(e.target.value)} /></Field>}
      {tarih === 'aralik' && (
        <div className="grid2">
          <Field label="Başlangıç"><input className="input" type="date" value={aralik.bas} onChange={(e) => setAralik({ ...aralik, bas: e.target.value })} /></Field>
          <Field label="Bitiş"><input className="input" type="date" value={aralik.bit} onChange={(e) => setAralik({ ...aralik, bit: e.target.value })} /></Field>
        </div>
      )}
      <div className="row tiny muted"><span>🟨 4+ gün</span><span>🟥 8+ gün (açık talepler)</span><span className="spacer" /><span>{liste.length} talep</span></div>

      {liste.length === 0 ? <Empty icon="📭" title="Bu filtrede talep yok" text="Kişi, tarih ya da açık/kapalı seçimini değiştirin." /> : (
        <div className="list">
          {liste.map((t) => <SatirKart key={t.ID} t={t} m={metaMap.get(t.ID)} acik={acikId === t.ID} onToggle={() => setAcikId(acikId === t.ID ? null : t.ID)} />)}
        </div>
      )}
    </div>
  );
}

function SatirKart({ t, m, acik, onToggle, acikBaslangic }: { t: T; m?: VipMeta; acik?: boolean; onToggle?: () => void; acikBaslangic?: boolean }) {
  const { showToast, kullanici } = useApp();
  const yas = daysBetween(t.AcilisTarihi);
  const renk = yasRengi(yas, isAcik(t.Durum));
  const goster = acik || acikBaslangic;
  const [not, setNot] = useState('');
  const loglar = useData(() => repo.query('vip_log', (l) => l.VipFormID === t.ID), ['vip_log'], [t.ID]);
  const bar = renk === 'kirmizi' ? 'st-red' : renk === 'sari' ? 'st-bekle' : '';
  return (
    <div className={`card bar-left ${bar}`} style={{ padding: 12 }}>
      <button onClick={onToggle} style={{ all: 'unset', cursor: onToggle ? 'pointer' : 'default', display: 'block', width: '100%' }} aria-expanded={goster}>
        <div className="row" style={{ gap: 6 }}>
          <span className="tiny muted mono">{t.TalepNo}</span>
          {isVvipBaslik(t.RequestSubject) && <Pill tone="red" plain>VVIP</Pill>}
          {t.OnemliSikayet && <Pill tone="turuncu" plain>Önemli</Pill>}
          <span className="spacer" />
          <Pill tone={DURUM_TON[t.Durum]}>{t.Durum}</Pill>
        </div>
        <div className="bold" style={{ marginTop: 4 }}>{t.RequestSubject}</div>
        <div className="row small muted" style={{ gap: 6 }}>
          <span className="ellipsis">{t.Musteri} · {m?.Takipci ?? '—'}</span><span className="spacer" />
          <span className={renk === 'kirmizi' ? 'pill st-red plain' : renk === 'sari' ? 'pill st-bekle plain' : 'tiny'}>{yas} gün</span>
        </div>
      </button>
      {goster && (
        <div className="stack" style={{ marginTop: 10, gap: 10 }}>
          <Kv rows={[
            ['Talep içeriği', t.Subject], ['Hizmet no', <span className="mono">{t.HizmetNo}</span>], ['Kategori', t.Kategori], ['Kanal', t.Kanal],
            ['Kaydı giren', t.KaydiGiren], ['Takipçi', m?.Takipci], ['Açılış', fmtDateTime(t.AcilisTarihi)], ['Kapanış', fmtDate(t.KapanisTarihi)],
            ['Son not', m?.SonNot], ['Hatırlatma', m?.HatirlatmaTarihi ? `${fmtDate(m.HatirlatmaTarihi)} · ${m.HatirlatmaDurum}` : ''],
          ]} />
          <Field label="Durum">
            <select className="input" value={t.Durum} onChange={async (e) => {
              const d = e.target.value as VipDurum;
              await repo.update('vip_talep', t.ID, { Durum: d, KapanisTarihi: isAcik(d) ? null : new Date().toISOString() }, 'Durum değişikliği');
              await repo.create('vip_log', { Title: 'Durum', VipFormID: t.ID, Ekleyen: kullanici, Detay: `Durum: ${t.Durum} → ${d}` });
              showToast(`Durum: ${d}`);
            }}>{VIP_DURUM.map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
          {m && (
            <Field label="Hatırlatma tarihi">
              <input className="input" type="date" value={m.HatirlatmaTarihi?.slice(0, 10) ?? ''} onChange={async (e) => {
                await repo.update('vip_meta', m.ID, { HatirlatmaTarihi: e.target.value || null, HatirlatmaDurum: 'Bekliyor', HatirlatmaKilit: '' });
                showToast('Hatırlatma kaydedildi');
              }} />
            </Field>
          )}
          <div className="stack" style={{ gap: 6 }}>
            <div className="section-title" style={{ margin: 0 }}>Notlar</div>
            {(loglar.data ?? []).sort((a, b) => b.ID - a.ID).map((l) => <div key={l.ID} className="small"><span className="muted">{fmtDateTime(l.Created)} · {l.Ekleyen}:</span> {l.Detay}</div>)}
            <div className="row">
              <input className="input" placeholder="Not ekle…" value={not} onChange={(e) => setNot(e.target.value)} />
              <button className="btn small" disabled={!not.trim()} onClick={async () => {
                await repo.create('vip_log', { Title: 'Not', VipFormID: t.ID, Ekleyen: kullanici, Detay: not.trim() });
                if (m) await repo.update('vip_meta', m.ID, { SonNot: not.trim(), SonNotTarihi: new Date().toISOString() });
                setNot('');
              }}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
