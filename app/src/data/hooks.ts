import { useEffect, useState, useCallback, useRef } from 'react';
import { repo, subscribe } from './repo';
import type { TableName, Tables } from './types';

export interface QueryState<V> { data: V | undefined; loading: boolean; error: Error | null; reload: () => void }

/** Bir veya birden çok tabloya bağlı veri yükler; tablolar değişince yeniden çalışır. */
export function useData<V>(load: () => Promise<V>, tables: (TableName | '*')[], deps: unknown[] = []): QueryState<V> {
  const [data, setData] = useState<V>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const run = useCallback(() => {
    let alive = true;
    loadRef.current()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  useEffect(
    () => subscribe((t) => { if (t === '*' || tables.includes(t) || tables.includes('*')) run(); }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, tables.join(',')],
  );
  return { data, loading, error, reload: run };
}

export function useTable<T extends TableName>(table: T): QueryState<Tables[T][]> {
  return useData(() => repo.list(table), [table], [table]);
}
