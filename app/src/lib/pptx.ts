/** Rapor Stüdyosu: demo verisinden .pptx üretir (pptxgenjs, yalnızca cihazda). */
import type { Altyapi, OheButce, OheHarcama, Taahhut, VipTalep } from '../data/types';
import { fmtDate, fmtKM } from './format';
import { altyapiDurum, butceKullanim, ilBazli, taahhutTakvim, vipYas } from './raporVeri';
import { raporBasligi } from './altyapiMetin';
import { beklemeGunu, durumGrup } from './rules';

import type { SlaytId } from './raporVeri';
export type { SlaytId };

export interface StudyoVeri { altyapi: Altyapi[]; taahhut: Taahhut[]; vip: VipTalep[]; butce: OheButce[]; harcama: OheHarcama[] }

const NAVY = '0B2A4A', MUTED = '5B6B82', ACCENT = '2563EB';

export async function sunumUret(baslik: string, secili: SlaytId[], v: StudyoVeri): Promise<Blob> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const p = new PptxGenJS();
  p.layout = 'LAYOUT_WIDE';
  p.title = baslik;
  p.company = 'VIP Hafıza (demo)';
  const demo = (s: ReturnType<typeof p.addSlide>) => s.addText('DEMO · Örnek veri', { x: 10.6, y: 0.15, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'B45309', align: 'right' });
  const baslikEkle = (s: ReturnType<typeof p.addSlide>, t: string) => { s.addText(t, { x: 0.5, y: 0.35, w: 10, h: 0.6, fontSize: 24, bold: true, color: NAVY }); demo(s); };

  const kapak = p.addSlide();
  kapak.background = { color: NAVY };
  kapak.addText(baslik, { x: 0.8, y: 2.4, w: 11.5, h: 1.2, fontSize: 38, bold: true, color: 'FFFFFF' });
  kapak.addText(`VIP Hafıza · ${fmtDate(new Date().toISOString())} · uydurma demo verisiyle üretilmiştir`, { x: 0.8, y: 3.6, w: 11.5, h: 0.5, fontSize: 14, color: 'C9D6E8' });

  for (const id of secili) {
    const s = p.addSlide();
    if (id === 'ozet') {
      baslikEkle(s, 'Yönetici özeti');
      const kpi: [string, string][] = [
        ['Altyapı talebi', String(v.altyapi.length)],
        ['Üst yönetimde', String(v.altyapi.filter((a) => durumGrup(a.OnayRed) === 'ust').length)],
        ['Onaylanan yatırım', fmtKM(v.altyapi.filter((a) => a.OnayRed === '1. Onay').reduce((x, a) => x + a.MaliyetTutari, 0))],
        ['Açık VIP talep', String(v.vip.filter((t) => t.Durum === 'Devam' || t.Durum === 'Takip').length)],
      ];
      kpi.forEach(([l, val], i) => {
        const x = 0.5 + i * 3.15;
        s.addShape(p.ShapeType.roundRect, { x, y: 1.5, w: 2.9, h: 1.7, fill: { color: 'F1F5F9' }, line: { color: 'DDE4EE' }, rectRadius: 0.1 });
        s.addText(val, { x, y: 1.7, w: 2.9, h: 0.8, fontSize: 30, bold: true, color: NAVY, align: 'center' });
        s.addText(l, { x, y: 2.5, w: 2.9, h: 0.5, fontSize: 13, color: MUTED, align: 'center' });
      });
    } else if (id === 'altyapi') {
      baslikEkle(s, 'Altyapı talepleri');
      const d = altyapiDurum(v.altyapi);
      s.addChart(p.ChartType.bar, [{ name: 'Talep', labels: d.map((x) => x.label), values: d.map((x) => x.value) }], { x: 0.5, y: 1.3, w: 6, h: 4.8, barDir: 'bar', chartColors: [ACCENT], showValue: true, catAxisLabelFontSize: 12, valAxisHidden: true, valGridLine: { style: 'none' }, showTitle: true, title: 'Duruma göre', titleFontSize: 14 });
      const il = ilBazli(v.altyapi);
      s.addChart(p.ChartType.bar, [{ name: 'Talep', labels: il.map((x) => x.label), values: il.map((x) => x.value) }], { x: 6.8, y: 1.3, w: 6, h: 4.8, barDir: 'bar', chartColors: [NAVY], showValue: true, catAxisLabelFontSize: 12, valAxisHidden: true, valGridLine: { style: 'none' }, showTitle: true, title: 'İl bazında (ilk 8)', titleFontSize: 14 });
    } else if (id === 'bekleyen') {
      baslikEkle(s, 'Onay bekleyen talepler');
      const rows = v.altyapi.filter((a) => durumGrup(a.OnayRed) === 'ust').sort((a, b) => (beklemeGunu(b) ?? 0) - (beklemeGunu(a) ?? 0)).slice(0, 10);
      const head = ['Talep', 'Tür', 'Maliyet', 'HP başı', 'Bekleme'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY } } }));
      s.addTable([head, ...rows.map((a) => [raporBasligi(a), a.ProjeTuru, fmtKM(a.MaliyetTutari), fmtKM(a.HPBasiMaliyet), `${beklemeGunu(a)} gün`].map((t) => ({ text: t })))], { x: 0.5, y: 1.3, w: 12.3, fontSize: 11, border: { type: 'solid', color: 'DDE4EE', pt: 0.5 }, colW: [6.3, 1, 1.8, 1.6, 1.6] });
    } else if (id === 'taahhut') {
      baslikEkle(s, 'Taahhüt bitiş takvimi');
      const t = taahhutTakvim(v.taahhut);
      s.addChart(p.ChartType.bar, [{ name: 'Biten taahhüt', labels: t.map((x) => x.label), values: t.map((x) => x.value) }], { x: 0.5, y: 1.3, w: 12.3, h: 5, chartColors: [ACCENT], showValue: true, valAxisHidden: true, valGridLine: { style: 'none' } });
    } else if (id === 'vip') {
      baslikEkle(s, 'Açık VIP talepleri · yaş');
      const y = vipYas(v.vip);
      s.addChart(p.ChartType.bar, [{ name: 'Talep', labels: y.map((x) => x.label), values: y.map((x) => x.value) }], { x: 0.5, y: 1.3, w: 8, h: 5, chartColors: [NAVY], showValue: true, valAxisHidden: true, valGridLine: { style: 'none' } });
      s.addText('4+ gün sarı, 8+ gün kırmızı kuralıyla izlenir. Ön Başvuru kapalı sayılır.', { x: 8.8, y: 2, w: 4, h: 2, fontSize: 14, color: MUTED });
    } else if (id === 'ohe') {
      baslikEkle(s, 'ÖHE bütçe kullanımı');
      const b = butceKullanim(v.butce, v.harcama);
      s.addChart(p.ChartType.bar, [{ name: 'Kullanım %', labels: b.map((x) => x.label), values: b.map((x) => x.oran) }], { x: 0.5, y: 1.3, w: 7.5, h: 5, barDir: 'bar', chartColors: [ACCENT], showValue: true, valAxisHidden: true, valGridLine: { style: 'none' } });
      s.addTable([[{ text: 'Kategori', options: { bold: true } }, { text: 'Bütçe', options: { bold: true } }, { text: 'Harcanan', options: { bold: true } }], ...b.map((x) => [{ text: x.label }, { text: fmtKM(x.butce) }, { text: fmtKM(x.harcanan) }])], { x: 8.3, y: 1.5, w: 4.5, fontSize: 12, border: { type: 'solid', color: 'DDE4EE', pt: 0.5 } });
    }
  }
  return (await p.write({ outputType: 'blob' })) as Blob;
}
