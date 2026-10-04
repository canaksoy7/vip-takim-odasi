import type { Altyapi } from '../data/types';
import { repo } from '../data/repo';
import { bildir, bildirAtama, bildirEksikBilgi, eksikAlanlar } from '../data/notify';
import { fmtKM } from '../lib/format';
import { DURUM_ETIKET, beklemeGunu, durumGrup, gecikmeSeviyesi, type DurumGrup } from '../lib/rules';
import { Pill } from '../ui/kit';

export const DURUM_TON: Record<DurumGrup, 'bekle' | 'ust' | 'onay' | 'red'> = { beklemede: 'bekle', ust: 'ust', onay: 'onay', red: 'red' };

export function DurumPill({ r }: { r: Pick<Altyapi, 'OnayRed'> }) {
  const g = durumGrup(r.OnayRed);
  return <Pill tone={DURUM_TON[g]}>{DURUM_ETIKET[g]}</Pill>;
}

export function GecikmeRozet({ r }: { r: Altyapi }) {
  const gun = beklemeGunu(r);
  const s = gecikmeSeviyesi(gun);
  if (s === 'yok') return null;
  const tone = s === 'sari' ? 'bekle' : s === 'turuncu' ? 'turuncu' : 'red';
  return <Pill tone={tone} plain>⏱ {gun} gün</Pill>;
}

export function AltyapiKart({ r, onClick, secili, onSec }: { r: Altyapi; onClick: () => void; secili?: boolean; onSec?: () => void }) {
  const g = durumGrup(r.OnayRed);
  return (
    <div className={`card bar-left st-${DURUM_TON[g]}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12 }}>
      {onSec && (
        <input type="checkbox" checked={!!secili} onChange={onSec} aria-label={`${r.ProjeID} seç`} style={{ width: 22, height: 22, marginTop: 2, flex: 'none' }} />
      )}
      <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 6 }}>
          <span className="tiny bold muted mono">{r.ProjeID}</span>
          <span className="tiny muted">· {r.ProjeTuru} · {r.Kaynak}</span>
          <span className="spacer" />
          <GecikmeRozet r={r} />
        </div>
        <div className="bold ellipsis" style={{ fontSize: 15.5 }}>{r.Title}</div>
        <div className="row small muted" style={{ gap: 6 }}>
          <span className="ellipsis">{r.Ilce} / {r.Sehira}</span>
          <span className="spacer" />
          <span className="mono">{fmtKM(r.MaliyetTutari)}</span>
        </div>
        <div className="row" style={{ marginTop: 6, gap: 6 }}>
          <DurumPill r={r} />
          <span className="tiny muted ellipsis">{r.Takipci ? `👤 ${r.Takipci}` : '👤 atanmamış'}</span>
        </div>
      </button>
    </div>
  );
}

// ── Durum işlemleri (her geçiş repository üzerinden geçmişe yazılır) ──

export async function ustYonetimeSun(r: Altyapi): Promise<string | null> {
  const eksik = eksikAlanlar(r);
  if (eksik.length) {
    await bildirEksikBilgi(r);
    return `Eksik alanlar: ${eksik.join(', ')}. Bölgeye bildirim önizlemesi oluşturuldu.`;
  }
  await repo.update('altyapi', r.ID, { OnayRed: 'Üst Yönetime Sunuldu - Bekliyor', SunulmaTarihi: new Date().toISOString().slice(0, 10), Asama: 'Üst yönetim değerlendirmesinde' }, 'Durum değişikliği');
  await bildir({ tur: 'Onay bekliyor', modul: 'altyapi', kayitId: r.ID, aliciRolu: 'Yönetici', konu: `[VVIP Altyapı] Onayınıza sunuldu: ${r.ProjeID} / ${r.Title}`, govde: `${r.Ilce} / ${r.Sehira} · ${fmtKM(r.MaliyetTutari)}\nUygulamada Yönetici Panosu'ndan onaylayabilirsiniz.` });
  return null;
}

export async function kararVer(r: Altyapi, onay: boolean, not = '') {
  const bugun = new Date().toISOString().slice(0, 10);
  await repo.update('altyapi', r.ID, onay
    ? { OnayRed: '1. Onay', KararTarihi: bugun, ProjeDurumKodu: r.Kaynak === 'Toptan' ? '3. Toptan' : '2. İmalat', ButceTuru: r.ButceTuru === '3. Beklemede' ? '1. VIP' : r.ButceTuru, Asama: 'Onaylandı, imalat planlamasında', ...(not ? { MaliyetNotu: not } : {}) }
    : { OnayRed: '2. Red', KararTarihi: bugun, ProjeDurumKodu: '6. Red', Asama: 'Değerlendirme sonucu reddedildi', ...(not ? { MaliyetNotu: not } : {}) }, 'Karar');
  await bildir({ tur: 'Karar', modul: 'altyapi', kayitId: r.ID, aliciRolu: `Takipçi (${r.Takipci || '—'})`, konu: `[VVIP Altyapı] ${onay ? 'Onaylandı' : 'Reddedildi'}: ${r.ProjeID} / ${r.Title}`, govde: `Karar: ${onay ? 'Onay' : 'Red'}\nNot: ${not || '—'}` });
}

export async function ustlen(r: Altyapi, kisi: string) {
  const g = await repo.update('altyapi', r.ID, { Takipci: kisi }, 'Üstlenildi');
  await bildirAtama(g, kisi);
}

/** VVIP talepleri tamamlanana kadar takipte kalır; Toptan taleplerinde imalat takip edilmez. */
export const takipteMi = (r: Altyapi) => {
  const g = durumGrup(r.OnayRed);
  if (g === 'red') return false;
  if (g === 'onay') return r.Kaynak === 'VVIP' && r.ProjeDurumKodu !== '1. Tamamlandı';
  return true;
};
