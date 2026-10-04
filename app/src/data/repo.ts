/**
 * Repository katmanı — uygulamadaki tüm veri erişimi buradan geçer.
 *
 * `DataSource` arayüzü bugün IndexedDB (Dexie) ile karşılanıyor. Canlıya geçişte aynı arayüzü
 * uygulayan bir `HttpSource` yazılıp `setDataSource()` ile takılması yeterli; ekranlar değişmez.
 * Uç nokta önerileri MODUL_ENVANTERI.md §9'da.
 */
import { VipDb, TABLE_NAMES } from './db';
import { TRACKED, type BaseRecord, type NewRecord, type TableName, type Tables } from './types';

export interface DataSource {
  list<T extends TableName>(table: T): Promise<Tables[T][]>;
  get<T extends TableName>(table: T, id: number): Promise<Tables[T] | undefined>;
  insert<T extends TableName>(table: T, rec: Omit<Tables[T], 'ID'>): Promise<number>;
  put<T extends TableName>(table: T, rec: Tables[T]): Promise<void>;
  remove(table: TableName, id: number): Promise<void>;
  clearAll(): Promise<void>;
  bulkInsert<T extends TableName>(table: T, recs: Omit<Tables[T], 'ID'>[]): Promise<void>;
  getMeta<V>(key: string): Promise<V | undefined>;
  setMeta(key: string, value: unknown): Promise<void>;
}

export class DexieSource implements DataSource {
  constructor(private db = new VipDb()) {}
  list<T extends TableName>(table: T) { return this.db.t(table).toArray(); }
  get<T extends TableName>(table: T, id: number) { return this.db.t(table).get(id); }
  async insert<T extends TableName>(table: T, rec: Omit<Tables[T], 'ID'>) {
    return (await this.db.t(table).add(rec as Tables[T])) as number;
  }
  async put<T extends TableName>(table: T, rec: Tables[T]) { await this.db.t(table).put(rec); }
  async remove(table: TableName, id: number) { await this.db.t(table).delete(id); }
  async clearAll() {
    await this.db.transaction('rw', [...TABLE_NAMES, 'meta'], async () => {
      for (const t of TABLE_NAMES) await this.db.t(t).clear();
      await this.db.meta.clear();
    });
  }
  async bulkInsert<T extends TableName>(table: T, recs: Omit<Tables[T], 'ID'>[]) {
    await this.db.t(table).bulkAdd(recs as Tables[T][]);
  }
  async getMeta<V>(key: string) { return (await this.db.meta.get(key))?.value as V | undefined; }
  async setMeta(key: string, value: unknown) { await this.db.meta.put({ key, value }); }
}

let source: DataSource | null = null;
let bellekModu = false;
/** Tarayıcı IndexedDB'ye izin vermiyorsa (ör. bazı file:// ya da gizli pencere durumları) bellek içi veritabanına geçer. */
export async function bellekVeritabaninaGec() {
  const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
  source = new DexieSource(new VipDb('vip-hafiza-demo-bellek', { indexedDB, IDBKeyRange }));
  bellekModu = true;
}
export const bellekModundaMi = () => bellekModu;
export function setDataSource(s: DataSource) { source = s; }
function src(): DataSource {
  if (!source) source = new DexieSource();
  return source;
}

// ── Oturum kullanıcısı (Author/Editor alanları için) ──
let currentUser = 'Sistem';
export function setCurrentUser(name: string) { currentUser = name; }
export function getCurrentUser() { return currentUser; }

// ── Değişiklik bildirimi (ekranların yeniden yüklenmesi için) ──
type Listener = (table: TableName | '*') => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function emit(table: TableName | '*') { listeners.forEach((l) => l(table)); }

const nowIso = () => new Date().toISOString();
const show = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'Evet' : 'Hayır') : String(v));

async function writeHistory(table: TableName, kayitId: number, aksiyon: string, alan: string, eski: unknown, yeni: unknown) {
  const liste = TRACKED[table];
  if (!liste) return;
  const ts = nowIso();
  await src().insert('gecmis', {
    Title: `${liste} #${kayitId}`, Created: ts, Modified: ts, Author: currentUser, Editor: currentUser,
    Liste: liste, KayitID: kayitId, Aksiyon: aksiyon, DegisilenAlan: alan,
    OncekiDeger: show(eski), YeniDeger: show(yeni), DegistireN: currentUser,
  });
}

export const repo = {
  async list<T extends TableName>(table: T): Promise<Tables[T][]> {
    return src().list(table);
  },
  async get<T extends TableName>(table: T, id: number) {
    return src().get(table, id);
  },
  async query<T extends TableName>(table: T, pred: (r: Tables[T]) => boolean): Promise<Tables[T][]> {
    return (await src().list(table)).filter(pred);
  },
  async create<T extends TableName>(table: T, data: NewRecord<T>, opts: { silent?: boolean } = {}): Promise<Tables[T]> {
    const ts = nowIso();
    const rec = { Title: '', Created: ts, Modified: ts, Author: currentUser, Editor: currentUser, ...data } as Omit<Tables[T], 'ID'>;
    delete (rec as Partial<BaseRecord>).ID;
    const id = await src().insert(table, rec);
    await writeHistory(table, id, 'Oluşturuldu', '—', '', rec.Title);
    if (!opts.silent) emit(table);
    return { ...rec, ID: id } as Tables[T];
  },
  /** Yalnızca değişen alanları yazar; her değişen alan için geçmişe bir satır ekler. */
  async update<T extends TableName>(table: T, id: number, patch: Partial<Tables[T]>, aksiyon = 'Güncellendi'): Promise<Tables[T]> {
    const cur = await src().get(table, id);
    if (!cur) throw new Error(`Kayıt bulunamadı: ${table} #${id}`);
    const next = { ...cur } as Tables[T];
    const changed: string[] = [];
    for (const k of Object.keys(patch) as (keyof Tables[T])[]) {
      if (k === 'ID' || k === 'Created' || k === 'Author') continue;
      if (JSON.stringify(cur[k]) !== JSON.stringify(patch[k])) {
        changed.push(String(k));
        await writeHistory(table, id, aksiyon, String(k), cur[k], patch[k]);
        next[k] = patch[k] as Tables[T][keyof Tables[T]];
      }
    }
    if (changed.length) {
      next.Modified = nowIso();
      next.Editor = currentUser;
      await src().put(table, next);
      emit(table);
    }
    return next;
  },
  async remove(table: TableName, id: number) {
    const cur = await src().get(table, id);
    await src().remove(table, id);
    if (cur) await writeHistory(table, id, 'Silindi', '—', cur.Title, '');
    emit(table);
  },
  async history(liste: string, kayitId: number) {
    return (await src().list('gecmis')).filter((g) => g.Liste === liste && g.KayitID === kayitId).sort((a, b) => b.ID - a.ID);
  },
  /** Demo verisi yükleme: kayıtlara 1'den başlayan açık ID verilir (ilişkiler seed içinde bu ID'lere dayanır). */
  async bulkLoad<T extends TableName>(table: T, recs: Omit<Tables[T], 'ID'>[]) {
    await src().bulkInsert(table, recs.map((r, i) => ({ ...r, ID: i + 1 })) as Omit<Tables[T], 'ID'>[]);
  },
  async clearAll() {
    await src().clearAll();
  },
  getMeta<V>(key: string) { return src().getMeta<V>(key); },
  setMeta(key: string, v: unknown) { return src().setMeta(key, v); },
  notifyAll() { emit('*'); },
};
