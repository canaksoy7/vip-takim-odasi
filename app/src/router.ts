import { useEffect, useState } from 'react';

/** Hash tabanlı basit yönlendirme: "#/altyapi/12?sekme=gecmis" → { path: ['altyapi','12'], query } */
export interface Route { path: string[]; query: URLSearchParams }

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [p, q] = h.split('?');
  return { path: p ? p.split('/').map(decodeURIComponent) : [], query: new URLSearchParams(q ?? '') };
}

export function nav(path: string) {
  const target = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}
export function back(fallback: string) {
  if (window.history.length > 1) window.history.back();
  else nav(fallback);
}

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => { setR(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
