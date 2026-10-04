import { useState } from 'react';
import { useApp } from '../store';
import { useTable } from '../data/hooks';
import { aktifIzin, bekleyenTalep, logla, talepEt, ERISIM_SURE_DK } from '../data/erisim';
import { fmtDateTime, maskNumber } from '../lib/format';
import { Field, Sheet } from './kit';

/** Numara maskeli gösterilir; görmek için yönetici onaylı, süreli izin gerekir. Her görüntüleme günlüğe yazılır. */
export function MaskeliNumara({ value, modul, kayitId }: { value: string; modul: string; kayitId: number }) {
  const { kullanici, showToast } = useApp();
  const talepler = useTable('erisim_talep');
  const [acik, setAcik] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [sebep, setSebep] = useState('');
  const liste = talepler.data ?? [];
  const izin = aktifIzin(liste, kullanici, modul, String(kayitId), 'Numara Görüntüleme');
  const bekleyen = bekleyenTalep(liste, kullanici, modul, String(kayitId), 'Numara Görüntüleme');

  if (acik && izin) {
    return (
      <span className="row" style={{ gap: 6 }}>
        <span className="mono bold">{value}</span>
        <button className="btn ghost small" onClick={() => setAcik(false)}>Gizle</button>
      </span>
    );
  }
  return (
    <span className="row wrap" style={{ gap: 6 }}>
      <span className="mono">{maskNumber(value)}</span>
      {izin ? (
        <button className="btn small" onClick={async () => { await logla('Numara görüntülendi', modul, String(kayitId), String(kayitId), '', String(izin.ID)); setAcik(true); }}>
          Göster
        </button>
      ) : (
        <button className="btn ghost small" onClick={() => setSheet(true)}>{bekleyen ? 'Onay bekliyor' : 'Görmek için talep et'}</button>
      )}
      {izin && <span className="tiny muted">izin {fmtDateTime(izin.GecerlilikBitis)}'e kadar</span>}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Numara görüntüleme talebi">
        {bekleyen ? (
          <div className="stack">
            <div className="banner info"><span>⏳</span><div>Talebiniz {fmtDateTime(bekleyen.Created)} tarihinde oluşturuldu ve yönetici onayı bekliyor. Demo için Ayarlar'dan <b>Yönetici</b> rolüne geçip onaylayabilirsiniz.</div></div>
          </div>
        ) : (
          <div className="stack">
            <p className="small" style={{ margin: 0 }}>Onaylanırsa numara {ERISIM_SURE_DK} dakika boyunca görünür. Talep, karar ve her görüntüleme erişim günlüğüne yazılır.</p>
            <Field label="Sebep *"><textarea className="input" value={sebep} onChange={(e) => setSebep(e.target.value)} placeholder="Ör. arıza kaydı açılacak" /></Field>
            <button className="btn block" disabled={!sebep.trim()} onClick={async () => {
              await talepEt('Numara Görüntüleme', modul, String(kayitId), sebep.trim());
              setSebep(''); setSheet(false); showToast('Talep yöneticiye iletildi');
            }}>Talep gönder</button>
          </div>
        )}
      </Sheet>
    </span>
  );
}
