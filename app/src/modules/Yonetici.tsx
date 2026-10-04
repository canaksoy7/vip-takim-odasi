import type { Route } from '../router';
import { nav } from '../router';
import { useApp } from '../store';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { daysBetween, fmtKM } from '../lib/format';
import { beklemeGunu, durumGrup, isAcik } from '../lib/rules';
import { Async, Empty, Kpi, PageHead } from '../ui/kit';
import { DurumPill, GecikmeRozet, kararVer } from './altyapiShared';
import { Talepler } from './UstHat';

export default function Yonetici(_p: { route: Route }) {
  const { rol, showToast } = useApp();
  const q = useData(async () => ({
    altyapi: await repo.list('altyapi'), erisim: await repo.list('erisim_talep'), taahhut: await repo.list('taahhut'),
    vip: await repo.list('vip_talep'), cihaz: await repo.list('ohe_cihaz'),
  }), ['altyapi', 'erisim_talep', 'taahhut', 'vip_talep', 'ohe_cihaz']);
  return (
    <Async q={q}>
      {(d) => {
        const ay = new Date().toISOString().slice(0, 7);
        const ust = d.altyapi.filter((a) => durumGrup(a.OnayRed) === 'ust').sort((a, b) => (beklemeGunu(b) ?? 0) - (beklemeGunu(a) ?? 0));
        const kararAy = d.altyapi.filter((a) => a.KararTarihi?.startsWith(ay));
        const malzeme = d.cihaz.filter((c) => c.OnayDurumu === 'Onay Bekliyor');
        const yakinTaahhut = d.taahhut.filter((t) => { const k = daysBetween(new Date().toISOString(), new Date(t.TaahhutBitis)); return k >= 0 && k <= 30; }).length;
        return (
          <div className="stack">
            <PageHead title="Yönetici panosu" sub="Onay bekleyenler ve özet göstergeler" />
            <div className="kpis">
              <Kpi v={ust.length} l="Onayınızı bekleyen altyapı" onClick={() => nav('/altyapi')} tone="st-ust" />
              <Kpi v={d.altyapi.filter((a) => durumGrup(a.OnayRed) === 'beklemede').length} l="Beklemede (sunulmamış)" tone="st-bekle" />
              <Kpi v={d.altyapi.filter((a) => (beklemeGunu(a) ?? 0) >= 14).length} l="14+ gün geciken" tone="st-red" />
              <Kpi v={`${kararAy.filter((a) => a.OnayRed === '1. Onay').length} / ${kararAy.filter((a) => a.OnayRed === '2. Red').length}`} l="Bu ay onay / red" />
              <Kpi v={d.erisim.filter((e) => e.Durum === 'Bekliyor').length} l="Bekleyen erişim talebi" onClick={() => nav('/ust-hat?sekme=talepler')} />
              <Kpi v={yakinTaahhut} l="30 gün içinde biten taahhüt" onClick={() => nav('/taahhut')} />
              <Kpi v={d.vip.filter((v) => isAcik(v.Durum)).length} l="Açık VIP talep" onClick={() => nav('/vip-talep')} />
              <Kpi v={malzeme.length} l="Malzeme onayı bekleyen" onClick={() => nav('/ohe?sekme=envanter')} />
            </div>
            {rol !== 'Yönetici' && <div className="banner info"><span>ℹ️</span><div>Onay/red düğmeleri yalnızca Yönetici rolünde etkindir.</div></div>}

            <div className="section-title">Onay bekleyen altyapı talepleri · {ust.length}</div>
            {ust.length === 0 ? <Empty icon="✅" title="Onay bekleyen talep yok" /> : (
              <div className="list">
                {ust.map((a) => (
                  <div key={a.ID} className="card bar-left st-ust" style={{ padding: 12 }}>
                    <button style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }} onClick={() => nav(`/altyapi/${a.ID}`)}>
                      <div className="row"><span className="tiny bold muted mono">{a.ProjeID}</span><span className="spacer" /><GecikmeRozet r={a} /><DurumPill r={a} /></div>
                      <div className="bold ellipsis">{a.Title}</div>
                      <div className="small muted">{a.Ilce} / {a.Sehira} · {a.ProjeTuru} · {fmtKM(a.MaliyetTutari)} · HP başı {fmtKM(a.HPBasiMaliyet)}</div>
                    </button>
                    <div className="btn-bar" style={{ marginTop: 10 }}>
                      <button className="btn red small" disabled={rol !== 'Yönetici'} onClick={async () => { await kararVer(a, false); showToast(`${a.ProjeID} reddedildi`); }}>Red</button>
                      <button className="btn green small" disabled={rol !== 'Yönetici'} onClick={async () => { await kararVer(a, true); showToast(`${a.ProjeID} onaylandı`); }}>Onay</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="section-title">Erişim talepleri</div>
            <Talepler talepler={d.erisim} kompakt />

            <div className="section-title">Malzeme kayıt onayları · {malzeme.length}</div>
            {malzeme.length === 0 ? <Empty icon="📦" title="Bekleyen malzeme kaydı yok" /> : (
              <div className="list">
                {malzeme.map((c) => (
                  <div key={c.ID} className="card row" style={{ padding: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="bold ellipsis">{c.Model}</div><div className="tiny muted mono">{c.SeriNo} · {c.Lokasyon.slice(3)}</div></div>
                    <button className="btn red small" disabled={rol !== 'Yönetici'} onClick={async () => { await repo.update('ohe_cihaz', c.ID, { OnayDurumu: 'Reddedildi' }, 'Karar'); showToast('Reddedildi'); }}>Red</button>
                    <button className="btn green small" disabled={rol !== 'Yönetici'} onClick={async () => { await repo.update('ohe_cihaz', c.ID, { OnayDurumu: 'Onaylandı' }, 'Karar'); showToast('Onaylandı'); }}>Onay</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </Async>
  );
}
