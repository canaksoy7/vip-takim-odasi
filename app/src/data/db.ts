import Dexie, { type DexieOptions, type Table } from 'dexie';
import type { Tables, TableName } from './types';

/** Yalnızca repository katmanı bu dosyayı kullanır; ekranlar doğrudan Dexie'ye erişmez. */
export const TABLE_NAMES: TableName[] = [
  'altyapi', 'altyapi_ek', 'gecmis', 'taahhut', 'taahhut_bildirim', 'ust_hat', 'erisim_talep',
  'erisim_onayci', 'erisim_log', 'vip_talep', 'vip_meta', 'vip_log', 'ohe_cihaz', 'ohe_stok',
  'ohe_sync_log', 'ohe_gundem', 'ohe_gundem_log', 'ohe_sat', 'ohe_test_hat', 'ohe_butce',
  'ohe_harcama', 'kades', 'rehber', 'rehber_arama', 'hafiza', 'rapor', 'pusula', 'duyuru',
  'gorev', 'gorev_log', 'ekip', 'bildirim', 'bildirim_kilit',
];

const INDEXES: Partial<Record<TableName, string>> = {
  gecmis: '++ID, KayitID, Liste',
  altyapi_ek: '++ID, AltyapiID',
  vip_meta: '++ID, VipFormID',
  vip_log: '++ID, VipFormID',
  gorev_log: '++ID, GorevID',
  bildirim_kilit: '++ID, &Anahtar',
};

export class VipDb extends Dexie {
  constructor(name = 'vip-hafiza-demo', options?: DexieOptions) {
    super(name, options);
    const schema: Record<string, string> = {};
    for (const t of TABLE_NAMES) schema[t] = INDEXES[t] ?? '++ID';
    schema.meta = 'key';
    this.version(1).stores(schema);
  }
  t<T extends TableName>(name: T): Table<Tables[T], number> {
    return this.table(name);
  }
  get meta(): Table<{ key: string; value: unknown }, string> {
    return this.table('meta');
  }
}
