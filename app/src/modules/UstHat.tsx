import { useState } from 'react';
const SEKMELER = ['hatlar', 'talepler', 'gunluk'] as const;
import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { aktifIzin, bekleyenTalep, kararVer, logla, talepEt, ERISIM_SURE_DK } from '../data/erisim';
import type { ErisimTalep } from '../data/types';
import { fmtDateTime, maskNumber } from '../lib/format';
import { Async, Empty, Field, PageHead, Pill, Sheet, Tabs, csv, indir } from '../ui/kit';
import { MaskeliNumara } from '../ui/MaskeliNumara';

type Sekme = 'hatlar' | 'talepler' | 'gunluk';
const MODUL = 'Üst Yönetim Hatları';

export default function UstHat({ route }: { route: Route }) {
  const q0 = route.query.get('sekme') as Sekme | null;
  const sekme: Sekme = q0 && SEKMELER.includes(q0) ? q0 : 'hatlar';
  const q = useData(async () => ({ hatlar: await repo.list('ust_hat'), talepler: await repo.list('erisim_talep'), log: await repo.list('erisim_log') }), ['ust_hat', 'erisim_talep', 'erisim_log']);
  return (
    <Async q={q}>
      {(d) => {
        const bekleyen = d.talepler.filter((t) => t.Durum === 'Bekliyor').length;
        return (
          <div className="stack">
            <PageHead title="Üst yönetim hatları" sub={`Numaralar maskelidir. Görmek ya da tam rapor almak için yönetici onayı gerekir (${ERISIM_SURE_DK} dk geçerli).`} />
            <Tabs value={sekme} onChange={(s) => nav(`/ust-hat?sekme=${s}`)} items={[
              { id: 'hatlar', label: `Hatlar (${d.hatlar.length})` }, { id: 'talepler', label: `Erişim talepleri${bekleyen ? ` (${bekleyen})` : ''}` }, { id: 'gunluk', label: 'Erişim günlüğü' },
            ]} />
            {sekme === 'hatlar' && <Hatlar hatlar={d.hatlar} talepler={d.talepler} />}
            {sekme === 'talepler' && <Talepler talepler={d.talepler} />}
            {sekme === 'gunluk' && <Gunluk log={d.log} />}
          </div>
        );
      }}
    </Async>
  );
}

function Hatlar({ hatlar, talepler }: { hatlar: { ID: number; Title: string; Kategori: string; HatTipi: string; HatNumarasi: string; Sirket: string; Aciklama: string }[]; talepler: ErisimTalep[] }) {
  const { kullanici, showToast } = useApp();
  const [sheet, setSheet] = useState(false);
  const [sebep, setSebep] = useState('');
  const izin = aktifIzin(talepler, kullanici, MODUL, 'Tümü', 'Tam Numaralı Rapor');
  const bekleyen = bekleyenTalep(talepler, kullanici, MODUL, 'Tümü', 'Tam Numaralı Rapor');
  const rapor = async (tam: boolean) => {
    indir(csv([['Hat', 'Kategori', 'Tip', 'Numara', 'Şirket', 'Açıklama'], ...hatlar.map((h) => [h.Title, h.Kategori, h.HatTipi, tam ? h.HatNumarasi : maskNumber(h.HatNumarasi), h.Sirket, h.Aciklama])]), tam ? 'ust-yonetim-hatlari-TAM-demo.csv' : 'ust-yonetim-hatlari-maskeli-demo.csv');
    await logla(tam ? 'Tam numaralı rapor indirildi' : 'Maskeli rapor indirildi', MODUL, 'Tümü', '', '', izin ? String(izin.ID) : '');
    showToast('Rapor indirildi ve günlüğe yazıldı');
  };
  return (
    <>
      <div className="row wrap">
        <button className="btn ghost small" onClick={() => rapor(false)}>Maskeli rapor (CSV)</button>
        {izin ? <button className="btn small" onClick={() => rapor(true)}>Tam numaralı rapor</button>
          : <button className="btn ghost small" onClick={() => setSheet(true)}>{bekleyen ? 'Tam rapor: onay bekliyor' : 'Tam rapor talep et'}</button>}
      </div>
      {hatlar.length === 0 ? <Empty title="Hat yok" /> : (
        <div className="list">
          {hatlar.map((h) => (
            <div key={h.ID} className="card stack" style={{ gap: 4, padding: 12 }}>
              <div className="row"><span className="bold ellipsis">{h.Title}</span><span className="spacer" /><Pill tone="ust" plain>{h.HatTipi}</Pill></div>
              <MaskeliNumara value={h.HatNumarasi} modul={MODUL} kayitId={h.ID} />
              <div className="tiny muted">{h.Sirket} · {h.Aciklama}</div>
            </div>
          ))}
        </div>
      )}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Tam numaralı rapor talebi">
        {bekleyen ? <div className="banner info"><span>⏳</span><div>Talebiniz yönetici onayı bekliyor.</div></div> : (
          <div className="stack">
            <Field label="Sebep *"><textarea className="input" value={sebep} onChange={(e) => setSebep(e.target.value)} /></Field>
            <button className="btn block" disabled={!sebep.trim()} onClick={async () => { await talepEt('Tam Numaralı Rapor', MODUL, 'Tümü', sebep.trim()); setSheet(false); setSebep(''); showToast('Talep iletildi'); }}>Talep gönder</button>
          </div>
        )}
      </Sheet>
    </>
  );
}

export function Talepler({ talepler, kompakt }: { talepler: ErisimTalep[]; kompakt?: boolean }) {
  const { rol, showToast } = useApp();
  const [karar, setKarar] = useState<{ t: ErisimTalep; onay: boolean } | null>(null);
  const [not, setNot] = useState('');
  const liste = [...talepler].filter((t) => !kompakt || t.Durum === 'Bekliyor').sort((a, b) => (a.Durum === 'Bekliyor' ? -1 : 0) - (b.Durum === 'Bekliyor' ? -1 : 0) || b.ID - a.ID);
  if (!liste.length) return <Empty icon="✅" title="Bekleyen erişim talebi yok" />;
  return (
    <div className="list">
      {rol !== 'Yönetici' && !kompakt && <div className="banner info"><span>ℹ️</span><div>Onay/red yalnızca <b>Yönetici</b> rolünde görünür.</div></div>}
      {liste.map((t) => (
        <div key={t.ID} className="card stack" style={{ gap: 6, padding: 12 }}>
          <div className="row"><b className="ellipsis">{t.TalepEdenAd}</b><span className="spacer" /><Pill tone={t.Durum === 'Bekliyor' ? 'bekle' : t.Durum === 'Onaylandı' ? 'onay' : 'red'}>{t.Durum}</Pill></div>
          <div className="small">{t.TalepTuru} · {t.Modul} · kapsam {t.Kapsam === 'Tümü' ? 'tüm hatlar' : `#${t.Kapsam}`}</div>
          <div className="small muted">Sebep: {t.Sebep}</div>
          <div className="tiny muted">{fmtDateTime(t.Created)}{t.KararTarihi ? ` · karar ${fmtDateTime(t.KararTarihi)} (${t.OnaylayanAd})` : ''}{t.GecerlilikBitis ? ` · geçerli ${fmtDateTime(t.GecerlilikBitis)}'e kadar` : ''}</div>
          {t.Durum === 'Bekliyor' && rol === 'Yönetici' && (
            <div className="btn-bar">
              <button className="btn red small" onClick={() => setKarar({ t, onay: false })}>Reddet</button>
              <button className="btn green small" onClick={() => setKarar({ t, onay: true })}>Onayla</button>
            </div>
          )}
        </div>
      ))}
      <Sheet open={!!karar} onClose={() => setKarar(null)} title={karar?.onay ? 'Erişimi onayla' : 'Erişimi reddet'}>
        <div className="stack">
          {karar?.onay && <p className="small" style={{ margin: 0 }}>Onaylanınca {ERISIM_SURE_DK} dakika geçerli olur.</p>}
          <Field label="Karar notu"><input className="input" value={not} onChange={(e) => setNot(e.target.value)} /></Field>
          <button className={`btn block ${karar?.onay ? 'green' : 'red'}`} onClick={async () => { if (!karar) return; await kararVer(karar.t.ID, karar.onay, not); setKarar(null); setNot(''); showToast('Karar kaydedildi'); }}>Kaydet</button>
        </div>
      </Sheet>
    </div>
  );
}

function Gunluk({ log }: { log: { ID: number; Created: string; Islem: string; Modul: string; Kapsam: string; KullaniciAd: string; Sebep: string; TalepId: string }[] }) {
  if (!log.length) return <Empty icon="📜" title="Günlük boş" />;
  return (
    <div className="card scroll-x">
      <table className="tbl">
        <thead><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th><th>Kapsam</th></tr></thead>
        <tbody>
          {[...log].sort((a, b) => b.ID - a.ID).map((l) => (
            <tr key={l.ID}>
              <td className="tiny mono">{fmtDateTime(l.Created)}</td>
              <td className="small">{l.KullaniciAd}</td>
              <td className="small">{l.Islem}<div className="tiny muted">{l.Modul}{l.Sebep ? ` · ${l.Sebep}` : ''}</div></td>
              <td className="small">{l.Kapsam === 'Tümü' ? 'Tümü' : `#${l.Kapsam}`}{l.TalepId ? <div className="tiny muted">talep #{l.TalepId}</div> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
