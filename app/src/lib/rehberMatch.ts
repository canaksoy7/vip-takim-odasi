/** Sorumluluk Rehberi: Türkçe karakter duyarsız arama ve vaka metninden sorumlu önerisi. */
import type { Rehber } from '../data/types';
import { trNorm } from './format';

export function rehberAra(list: Rehber[], q: string): Rehber[] {
  const n = trNorm(q).trim();
  if (!n) return list;
  const terms = n.split(/\s+/);
  return list.filter((r) => {
    const hay = trNorm([r.Title, r.Departman, r.Rol, r.Alanlar, r.Anahtar].join(' '));
    return terms.every((t) => hay.includes(t));
  });
}

export const anahtarlar = (r: Rehber) =>
  [...r.Anahtar.split(','), ...r.Alanlar.split(',')].map((s) => trNorm(s).trim()).filter((s) => s.length >= 3);

export interface Oneri { kayit: Rehber; puan: number; eslesen: string[] }
export interface VakaSonuc { oneriler: Oneri[]; cakisma: string | null }

export function vakaOner(list: Rehber[], vaka: string, limit = 3): VakaSonuc {
  const metin = ` ${trNorm(vaka).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `;
  const scored: Oneri[] = list
    .map((kayit) => {
      const eslesen = [...new Set(anahtarlar(kayit).filter((k) => metin.includes(` ${k}`)))];
      return { kayit, puan: eslesen.reduce((s, k) => s + (k.includes(' ') ? 2 : 1), 0), eslesen };
    })
    .filter((o) => o.puan > 0)
    .sort((a, b) => b.puan - a.puan || a.kayit.Departman.localeCompare(b.kayit.Departman, 'tr'));
  const oneriler = scored.slice(0, limit);
  let cakisma: string | null = null;
  if (oneriler.length >= 2 && oneriler[0].kayit.Departman !== oneriler[1].kayit.Departman && oneriler[0].puan - oneriler[1].puan <= 1) {
    cakisma = `Vaka hem ${oneriler[0].kayit.Departman} hem ${oneriler[1].kayit.Departman} alanına giriyor. Önce ${oneriler[0].kayit.Departman} ekibine yönlendirin; ${oneriler[1].kayit.Departman} ekibini bilgiye ekleyin.`;
  }
  return { oneriler, cakisma };
}
