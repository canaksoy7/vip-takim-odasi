import type { Route } from '../router';
import { nav } from '../router';
import { useData } from '../data/hooks';
import { repo } from '../data/repo';
import { choiceLabel, fmtDate, fmtKM } from '../lib/format';
import { altyapiDurum, butceKullanim, ilBazli, taahhutTakvim, vipYas } from '../lib/raporVeri';
import { isAcik } from '../lib/rules';
import { Async, Kpi, PageHead, Pill } from '../ui/kit';
import { BarList } from '../ui/BarList';

const DURUM_RENK = { beklemede: 'var(--st-bekle)', ust: 'var(--st-ust)', onay: 'var(--st-onay)', red: 'var(--st-red)' } as const;

export default function Rapor(_p: { route: Route }) {
  const q = useData(async () => ({
    altyapi: await repo.list('altyapi'), taahhut: await repo.list('taahhut'), vip: await repo.list('vip_talep'),
    butce: await repo.list('ohe_butce'), harcama: await repo.list('ohe_harcama'), rapor: await repo.list('rapor'),
  }), ['*']);
  return (
    <Async q={q}>
      {(d) => {
        const onay = d.altyapi.filter((a) => a.OnayRed === '1. Onay');
        return (
          <div className="stack">
            <PageHead title="Raporlama & analiz" sub="Modüller arası göstergeler · demo verisi" right={<button className="btn small" onClick={() => nav('/studyo')}>PPTX üret</button>} />
            <div className="kpis">
              <Kpi v={d.altyapi.length} l="Altyapı talebi" />
              <Kpi v={fmtKM(onay.reduce((a, r) => a + r.MaliyetTutari, 0))} l="Onaylanan yatırım" />
              <Kpi v={d.vip.filter((v) => isAcik(v.Durum)).length} l="Açık VIP talep" />
              <Kpi v={d.taahhut.length} l="Taahhüt kaydı" />
            </div>
            <div className="two-col stack">
              <BarList title="Altyapı talepleri · durum" rows={altyapiDurum(d.altyapi).map((x) => ({ label: x.label, value: x.value, color: DURUM_RENK[x.grup] }))} />
              <BarList title="Altyapı talepleri · il (ilk 8)" rows={ilBazli(d.altyapi)} />
              <BarList title="Taahhüt bitişleri · önümüzdeki 6 ay" rows={taahhutTakvim(d.taahhut)} />
              <BarList title="Açık VIP talepleri · yaş" rows={vipYas(d.vip).map((x, i) => ({ ...x, color: ['var(--st-onay)', 'var(--st-bekle)', 'var(--st-red)'][i] }))} />
              <BarList title="ÖHE bütçe kullanımı (%)" rows={butceKullanim(d.butce, d.harcama).map((x) => ({ label: x.label, value: x.oran, note: `${fmtKM(x.harcanan)} / ${fmtKM(x.butce)}` }))} fmt={(n) => `%${n}`} />
            </div>
            <div className="section-title">Monitoring rapor arşivi</div>
            <div className="list">
              {[...d.rapor].sort((a, b) => b.AyYil.localeCompare(a.AyYil)).map((r) => (
                <div key={r.ID} className="card row" style={{ padding: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="bold ellipsis">{r.RaporAdi}</div><div className="tiny muted">{choiceLabel(r.Kategori)} · {fmtDate(r.AyYil)}</div></div>
                  <Pill tone="gri" plain>{choiceLabel(r.DosyaTuru)}</Pill>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </Async>
  );
}
