import { repo } from '../data/repo';
import { useData } from '../data/hooks';
import { choiceLabel, fmtDateTime } from '../lib/format';
import { Async, Empty } from './kit';

/** Bir kaydın alan bazlı değişiklik geçmişi: kim, ne zaman, eski → yeni. */
export function GecmisListe({ liste, kayitId }: { liste: string; kayitId: number }) {
  const q = useData(() => repo.history(liste, kayitId), ['gecmis', '*'], [liste, kayitId]);
  return (
    <Async q={q}>
      {(rows) => rows.length === 0 ? <Empty icon="🕘" title="Geçmiş yok" /> : (
        <ol className="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {rows.map((g) => (
            <li key={g.ID} className="card flat" style={{ padding: 10 }}>
              <div className="row tiny muted"><span>{fmtDateTime(g.Created)}</span><span className="spacer" /><span>{g.DegistireN}</span></div>
              <div className="small"><b>{g.Aksiyon}</b>{g.DegisilenAlan !== '—' && <> · {g.DegisilenAlan}</>}</div>
              {g.DegisilenAlan !== '—' && (
                <div className="small"><span className="muted" style={{ textDecoration: 'line-through' }}>{choiceLabel(g.OncekiDeger) || '∅'}</span> → <b>{choiceLabel(g.YeniDeger) || '∅'}</b></div>
              )}
            </li>
          ))}
        </ol>
      )}
    </Async>
  );
}
