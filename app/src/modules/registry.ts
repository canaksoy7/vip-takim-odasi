import type { Rol } from '../data/types';

export interface ModulTanim { id: string; ad: string; kisa: string; ikon: string; aciklama: string; roller: Rol[]; grup: string }

const HERKES: Rol[] = ['Ekip Üyesi', 'Yönetici', 'ÖHE Ekibi'];
const EKIP: Rol[] = ['Ekip Üyesi', 'Yönetici'];

export const MODULLER: ModulTanim[] = [
  { id: 'yonetici', ad: 'Yönetici Panosu', kisa: 'Pano', ikon: '📊', aciklama: 'Özet KPI ve tek dokunuşla onay/red', roller: ['Yönetici'], grup: 'Yönetim' },
  { id: 'altyapi', ad: 'VVIP Altyapı Takip', kisa: 'Altyapı', ikon: '🏗️', aciklama: 'Altyapı talepleri, karar akışı, Word raporu', roller: EKIP, grup: 'Altyapı' },
  { id: 'masa', ad: 'Altyapı Masası', kisa: 'Masa', ikon: '🧑‍💼', aciklama: 'Kişi bazlı takip, üstlen', roller: EKIP, grup: 'Altyapı' },
  { id: 'talep-metni', ad: 'Talep Metni Oluşturucu', kisa: 'Metin', ikon: '📝', aciklama: 'Bölge metninden anlatım + künye', roller: EKIP, grup: 'Altyapı' },
  { id: 'vip-talep', ad: 'VIP Talep Takip', kisa: 'Talepler', ikon: '📨', aciklama: 'Açık/kapalı talepler, takipçi, yaş renkleri', roller: EKIP, grup: 'Talep' },
  { id: 'taahhut', ad: 'VVIP Taahhütler', kisa: 'Taahhüt', ikon: '🔄', aciklama: 'Taahhüt/indirim kayıtları ve alarmlar', roller: EKIP, grup: 'Taahhüt' },
  { id: 'ust-hat', ad: 'Üst Yönetim Hatları', kisa: 'Hatlar', ikon: '🔒', aciklama: 'Maskeli numaralar, onaylı görünürlük, erişim günlüğü', roller: EKIP, grup: 'Taahhüt' },
  { id: 'indirim', ad: 'Ek İndirim Hesaplama', kisa: 'İndirim', ikon: '🧮', aciklama: 'Hedef ücrete inmek için gereken indirim', roller: EKIP, grup: 'Taahhüt' },
  { id: 'ohe', ad: 'ÖHE Bütçe & Stok', kisa: 'ÖHE', ikon: '📦', aciklama: 'Envanter, gündem, SAT, test hatları, bütçe', roller: HERKES, grup: 'ÖHE' },
  { id: 'kades', ad: 'KADES & Ürün Kodları', kisa: 'KADES', ikon: '💳', aciklama: 'Atanan, harcanan ve kalan bütçe', roller: HERKES, grup: 'ÖHE' },
  { id: 'ohe-yon', ad: 'ÖHE Yönlendirme', kisa: 'Yönlendir', ikon: '🧭', aciklama: 'En yakın ekip ve tahmini ulaşım', roller: HERKES, grup: 'ÖHE' },
  { id: 'rehber', ad: 'Sorumluluk Rehberi', kisa: 'Rehber', ikon: '📇', aciklama: '9 departman, vaka → sorumlu önerisi', roller: EKIP, grup: 'Bilgi' },
  { id: 'hafiza', ad: 'Kurumsal Hafıza', kisa: 'Hafıza', ikon: '🧠', aciklama: 'Süreç kartları ve adım adım akışlar', roller: EKIP, grup: 'Bilgi' },
  { id: 'pusula', ad: 'Pusula Motoru', kisa: 'Pusula', ikon: '🧩', aciklama: 'Karar ağaçları ve duyurular', roller: EKIP, grup: 'Bilgi' },
  { id: 'rapor', ad: 'Raporlama & Analiz', kisa: 'Rapor', ikon: '📈', aciklama: 'Modüller arası göstergeler', roller: EKIP, grup: 'Rapor' },
  { id: 'studyo', ad: 'Rapor Stüdyosu', kisa: 'Stüdyo', ikon: '🎞️', aciklama: 'Demo verisinden PowerPoint üret', roller: EKIP, grup: 'Rapor' },
  { id: 'gorev', ad: 'Görevler', kisa: 'Görev', ikon: '✅', aciklama: 'Ekip görev panosu', roller: EKIP, grup: 'Ekip' },
  { id: 'bildirim', ad: 'Bildirim Kutusu', kisa: 'Bildirim', ikon: '📬', aciklama: 'Gönderilecek mail önizlemeleri', roller: HERKES, grup: 'Ekip' },
];

export const DOCK: Record<Rol, string[]> = {
  'Ekip Üyesi': ['altyapi', 'vip-talep', 'taahhut', 'rehber'],
  Yönetici: ['yonetici', 'altyapi', 'vip-talep', 'taahhut'],
  'ÖHE Ekibi': ['ohe', 'kades', 'ohe-yon', 'bildirim'],
};

export const erisebilir = (rol: Rol, id: string) => {
  const m = MODULLER.find((x) => x.id === id);
  return !m || m.roller.includes(rol);
};
export const modul = (id: string) => MODULLER.find((m) => m.id === id);
