/** Seçili altyapı kayıtlarından "VIP Yatırım Değerlendirmesi" .docx üretir (yalnızca cihazda). */
import type { Altyapi } from '../data/types';
import { choiceLabel, fmtDate, fmtKM, fmtMesafe } from './format';
import { raporBasligi, yatirimMetni } from './altyapiMetin';

export async function yatirimRaporu(kayitlar: Altyapi[]): Promise<Blob> {
  const d = await import('docx');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = d;
  const hucre = (t: string, bold = false) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4EE' }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold, size: 18, color: bold ? '0B2A4A' : '334155' })] })],
  });
  const govde = kayitlar.flatMap((r) => [
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: raporBasligi(r), color: '0B2A4A' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: yatirimMetni(r), size: 21 })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: ([
        ['Proje türü', r.ProjeTuru], ['HP', r.HP.toLocaleString('tr-TR')], ['Toplam maliyet', fmtKM(r.MaliyetTutari)],
        ['HP başı', fmtKM(r.HPBasiMaliyet)], ['Fiber mesafesi', fmtMesafe(r.FiberMesafesi)], ['Durum', choiceLabel(r.OnayRed)],
      ] as [string, string][]).map(([k, v]) => new TableRow({ children: [hucre(k, true), hucre(v)] })),
    }),
  ]);
  const doc = new Document({
    creator: 'VIP Hafıza (demo)',
    title: 'VIP Yatırım Değerlendirmesi',
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      children: [
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'DEMO · Örnek veri — gerçek kayıt değildir', size: 16, color: 'B45309', bold: true })] }),
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'VIP Yatırım Değerlendirmesi', color: '0B2A4A' })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `${fmtDate(new Date().toISOString())} · ${kayitlar.length} talep`, color: '64748B', size: 18 })] }),
        ...govde,
      ],
    }],
  });
  return Packer.toBlob(doc);
}
