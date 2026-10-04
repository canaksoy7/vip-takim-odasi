/**
 * Veri modeli. Her tablo bir SharePoint listesine karşılık gelir (bkz. MODUL_ENVANTERI.md §6).
 * Seçenek alanları SharePoint şemasındaki metni (ör. "1. Onay") birebir saklar.
 */

export interface BaseRecord {
  ID: number;
  Title: string;
  Created: string; // ISO
  Modified: string; // ISO
  Author: string;
  Editor: string;
}

// ── VVIP Altyapı Takip ─────────────────────────────────────────────
export const ANA_KATEGORI = ['1. Dönüşüm', '2. Altyapı', '3. Fiber', '4. Altyapı-Dönüşüm', '5. Omurga Projesi'] as const;
export const PROJE_DURUM = ['1. Tamamlandı', '2. İmalat', '3. Toptan', '4. Erişim', '5. Bölge', '6. Red'] as const;
export const BUTCE_TURU = ['1. VIP', '2. Ticari', '3. Beklemede'] as const;
export const ONAY_RED = ['3. Beklemede', 'Üst Yönetime Sunuldu - Bekliyor', '1. Onay', '2. Red'] as const;
export type OnayRed = (typeof ONAY_RED)[number];

export interface Altyapi extends BaseRecord {
  AnaKategori: (typeof ANA_KATEGORI)[number];
  TalepSahibi: string;
  ProjeID: number;
  HPBasiMaliyet: number;
  AboneBasiMaliyet: number;
  MaliyetTutari: number;
  MaliyetSayisal: number;
  Penetrasyon: number;
  Asama: string;
  ProjeDurumKodu: (typeof PROJE_DURUM)[number] | '';
  ButceTuru: (typeof BUTCE_TURU)[number];
  OnayRed: OnayRed;
  Aciklama: string;
  Adres: string;
  Takipci: string;
  Sehira: string;
  HP: number;
  ProjeTuru: 'BF' | 'GF';
  CalisanDSL: number;
  AboneOngoru: number;
  MevcutAltyapi: string;
  MevcutHiz: string;
  FiberMesafesi: number;
  MaliyetNotu: string;
  SunulmaTarihi: string | null;
  KararTarihi: string | null;
  ImalatBaslangic: string | null;
  TahminiTamamlanma: string | null;
  TamamlanmaTarihi: string | null;
  // Prototip ekleri (şemada yok)
  Ilce: string;
  Kaynak: 'VVIP' | 'Toptan';
  ToptanaBildirildi: boolean;
}

export interface AltyapiEk extends BaseRecord {
  AltyapiID: number;
  MimeType: string;
  Icerik: string; // SVG metni
}

// ── Değişiklik geçmişi (VVIPDegisiklikGecmisi + VVIPTaahhutDegisiklikGecmisi + diğerleri) ──
export interface Gecmis extends BaseRecord {
  Liste: string;
  KayitID: number;
  Aksiyon: string;
  DegisilenAlan: string;
  OncekiDeger: string;
  YeniDeger: string;
  DegistireN: string;
}

// ── VVIP Taahhüt (BakanHatlari) ─────────────────────────────────
export const VERILEN_TIP = ['Mobil', 'İnternet', 'TV (Tivibu)'] as const;
export interface Taahhut extends BaseRecord {
  KisiUnvan: string;
  MSISDN: string;
  KimdenGeldi: string;
  IndirimOrani: number;
  TaahhutBaslangic: string;
  TaahhutBitis: string;
  Tarife: string;
  Ekleyen: string;
  VerilenTip: (typeof VERILEN_TIP)[number];
  Hediye: string;
  HediyeNot: string;
}

export interface TaahhutBildirim extends BaseRecord {
  KayitID: number;
  Esik: number;
  BitisTarihi: string;
  KalanGun: number;
  MusteriAdi: string;
  Durum: string;
  Deneme: number;
  GonderimZamani: string;
  Tetikleyen: string;
  Alici: string;
  HataDetay: string;
}

// ── Üst Yönetim Hatları + erişim ──────────────────────────────────
export interface UstHat extends BaseRecord {
  Kategori: string;
  HatTipi: string;
  HatNumarasi: string;
  Aciklama: string;
  Ekleyen: string;
  Sirket: string;
}

export type ErisimTalepTuru = 'Numara Görüntüleme' | 'Tam Numaralı Rapor';
export type ErisimDurum = 'Bekliyor' | 'Onaylandı' | 'Reddedildi';
export interface ErisimTalep extends BaseRecord {
  TalepTuru: ErisimTalepTuru;
  Modul: string;
  Kapsam: string; // kayıt ID'si ya da "Tümü"
  Sebep: string;
  Durum: ErisimDurum;
  TalepEdenAd: string;
  TalepEdenEposta: string;
  OnaylayanAd: string;
  KararNotu: string;
  KararTarihi: string | null;
  GecerlilikBitis: string | null;
}

export interface ErisimOnayci extends BaseRecord {
  Onayci: string;
  Aktif: boolean;
}

export interface ErisimLog extends BaseRecord {
  Islem: string;
  Modul: string;
  Kapsam: string;
  KayitId: string;
  Sebep: string;
  KullaniciAd: string;
  TalepId: string;
}

// ── VIP Talep Takip ────────────────────────────────────────────
export const VIP_DURUM = ['Devam', 'Takip', 'Ön Başvuru', 'Kapalı'] as const;
export type VipDurum = (typeof VIP_DURUM)[number];
export interface VipTalep extends BaseRecord {
  TalepNo: string;
  RequestSubject: string; // mail başlığı
  Subject: string; // talep içeriği
  Musteri: string;
  HizmetNo: string;
  Kategori: string;
  Kanal: string;
  KaydiGiren: string;
  Durum: VipDurum;
  AcilisTarihi: string;
  KapanisTarihi: string | null;
  OnemliSikayet: boolean;
}
export interface VipMeta extends BaseRecord {
  VipFormID: number;
  Baslik2: string;
  Takipci: string;
  SonNot: string;
  SonNotTarihi: string | null;
  HatirlatmaTarihi: string | null;
  HatirlatmaNotu: string;
  HatirlatmaDurum: string;
  HatirlatmaKilit: string;
  HatirlatmaAlicilar: string;
}
export interface VipLog extends BaseRecord {
  VipFormID: number;
  Ekleyen: string;
  Detay: string;
}

// ── ÖHE ──────────────────────────────────────────────────
export const OHE_LOKASYON = ['1. Ankara', '2. İstanbul', '3. İzmir', '4. Bodrum'] as const;
export type MalzemeOnay = 'Onay Bekliyor' | 'Onaylandı' | 'Reddedildi';
export interface OheCihaz extends BaseRecord {
  Model: string;
  SeriNo: string;
  IMEI: string;
  Lokasyon: (typeof OHE_LOKASYON)[number];
  Zimmet: string;
  Durum: '1. Stokta' | '2. Verildi';
  StokGiris: string | null;
  StokCikis: string | null;
  Aciklama: string;
  OnayDurumu: MalzemeOnay; // prototip eki
}
export interface OheStok extends BaseRecord {
  Kategori: string;
  Bolum: string;
  ToplamAdet: number;
  Ankara: number;
  Istanbul: number;
  Bodrum: number;
  Izmir: number;
}
export interface OheSyncLog extends BaseRecord {
  SyncTarihi: string;
  Eklenen: number;
  Guncellenen: number;
  Sifirlanan: number;
  Hatali: number;
  Detay: string;
}
export const GUNDEM_KATEGORI = ['1. Satın Alma', '2. Altyapı', '3. SIM Kart', '4. Test', '5. Diğer'] as const;
export const GUNDEM_DURUM = ['1. Bekliyor', '2. Devam Ediyor', '3. Tamamlandı', '4. İptal'] as const;
export interface OheGundem extends BaseRecord {
  Kategori: (typeof GUNDEM_KATEGORI)[number];
  Durum: (typeof GUNDEM_DURUM)[number];
  SorumluKisi: string;
  Tarih: string;
  Aciklama: string;
}
export interface OheGundemLog extends BaseRecord {
  Olay: string;
  GundemId: number;
  Durum: string;
  Deneme: number;
  Tetikleyen: string;
  Detay: string;
}
export interface OheSat extends BaseRecord {
  Donem: string;
  Tedarikci: string;
  SatNumarasi: string;
  Tutar: number;
  FaturaEki: string;
}
export interface OheTestHat extends BaseRecord {
  HatDurumu: '1. Stokta' | '2. Kullanımda';
  Personel: string;
  YedekSIM: string;
  Aciklama: string;
}
export const BUTCE_KATEGORI = ['1. Genel', '2. Mobil', '3. Sabit', '4. VIP', '5. Kurumsal'] as const;
export interface OheButce extends BaseRecord {
  Kategori: (typeof BUTCE_KATEGORI)[number];
  ToplamButce: number;
  Donem: string;
  Aciklama: string;
}
export const HARCAMA_KATEGORI = ['1. Mobil', '2. Sabit', '3. VIP', '4. Kurumsal'] as const;
export interface OheHarcama extends BaseRecord {
  Kategori: (typeof HARCAMA_KATEGORI)[number];
  Tutar: number;
  Tarih: string;
  Donem: string;
  Tedarikci: string;
  FaturaRef: string;
}
export interface Kades extends BaseRecord {
  Tur: 'KADES' | 'Ürün Kodu';
  Ad: string;
  Portal: string;
  Tutar: number;
  Harcanan: number;
  HarcananTarih: string | null;
  Fon: string;
  MaliKalem: string;
  Muhatap: string;
  Durum: string;
  IlgiliKades: string;
  Notlar: string;
}

// ── Rehber / Hafıza / Rapor / Pusula / Görev ──────────────────────
export const DEPARTMANLAR = [
  'Bireysel Sabit',
  'Dijital',
  'Kanal',
  'Kurumsal Segment',
  'Mobil',
  'Resmi Kanallar',
  'TV Müşteri Deneyimi',
  'Müşteri Yönetim Sistemleri',
  'Tümleşik Yönetim Sistemleri',
] as const;
export interface Rehber extends BaseRecord {
  Departman: (typeof DEPARTMANLAR)[number];
  Rol: string;
  Eposta: string;
  Alanlar: string;
  Anahtar: string;
}
export interface RehberArama extends BaseRecord {
  Sonuc: number;
  Mod: 'Kelime' | 'Vaka';
  Departmanlar: string;
}
export interface Hafiza extends BaseRecord {
  Kategori: string;
  Etiket: string;
  EtiketRenk: string;
  Aciklama: string;
  Keywords: string;
  Adimlar: string; // satır satır
  Uyari: string;
  Kisiler: string;
  AktifMi: boolean;
}
export const RAPOR_KATEGORI = ['1. Aylık Monitoring', '2. Alt Markalar Raporu', '3. Kriz & Alarm', '4. Özel Analiz'] as const;
export interface Rapor extends BaseRecord {
  RaporAdi: string;
  Kategori: (typeof RAPOR_KATEGORI)[number];
  AyYil: string;
  DosyaTuru: '1. PDF' | '2. PPTX';
}
export interface PusulaBilgi extends BaseRecord {
  Kategori: string;
  Icerik: string;
}
export const DUYURU_KAYNAK = ['1. Pusula', '2. Mobil', '3. Serbest', '4. Kampanya', '5. İnternet', '6. PSTN'] as const;
export interface Duyuru extends BaseRecord {
  Kaynak: (typeof DUYURU_KAYNAK)[number];
  Gonderen: string;
  Segment: string;
  YayinTarihi: string;
  Ozet: string;
  Durum: '1. Yayında' | '2. Taslak' | '3. Arşiv';
}
export const GOREV_ONCELIK = ['1. Düşük', '2. Normal', '3. Yüksek', '4. Acil'] as const;
export const GOREV_KATEGORI = ['1. Genel', '2. VVIP', '3. Sosyal Medya', '4. Altyapı', '5. Taahhüt', '6. Envanter'] as const;
export interface Gorev extends BaseRecord {
  Aciklama: string;
  AtananKisi: string;
  BitisTarihi: string | null;
  Oncelik: (typeof GOREV_ONCELIK)[number];
  Kategori: (typeof GOREV_KATEGORI)[number];
  Durum: (typeof GUNDEM_DURUM)[number];
  TamamlandiMi: boolean;
  AltAdimlar: string; // JSON: {t:string, ok:boolean}[]
}
export interface GorevLog extends BaseRecord {
  GorevID: number;
  User: string;
  Action: string;
  Time: string;
}
export interface Ekip extends BaseRecord {
  Email: string;
  Short: string;
  Color: string;
  IsManager: boolean;
  Rol: Rol;
}

// ── Prototip tabloları ───────────────────────────────────────────
export type Rol = 'Ekip Üyesi' | 'Yönetici' | 'ÖHE Ekibi';
export interface Bildirim extends BaseRecord {
  Tur: string;
  AliciRolu: string;
  Govde: string;
  Okundu: boolean;
  KaynakModul: string;
  KaynakID: number | null;
}
/** Çift gönderim kilidi: (tür, kayıt, eşik/olay) anahtarı bir kez yazılır. */
export interface BildirimKilit extends BaseRecord {
  Anahtar: string;
}

export interface Tables {
  altyapi: Altyapi;
  altyapi_ek: AltyapiEk;
  gecmis: Gecmis;
  taahhut: Taahhut;
  taahhut_bildirim: TaahhutBildirim;
  ust_hat: UstHat;
  erisim_talep: ErisimTalep;
  erisim_onayci: ErisimOnayci;
  erisim_log: ErisimLog;
  vip_talep: VipTalep;
  vip_meta: VipMeta;
  vip_log: VipLog;
  ohe_cihaz: OheCihaz;
  ohe_stok: OheStok;
  ohe_sync_log: OheSyncLog;
  ohe_gundem: OheGundem;
  ohe_gundem_log: OheGundemLog;
  ohe_sat: OheSat;
  ohe_test_hat: OheTestHat;
  ohe_butce: OheButce;
  ohe_harcama: OheHarcama;
  kades: Kades;
  rehber: Rehber;
  rehber_arama: RehberArama;
  hafiza: Hafiza;
  rapor: Rapor;
  pusula: PusulaBilgi;
  duyuru: Duyuru;
  gorev: Gorev;
  gorev_log: GorevLog;
  ekip: Ekip;
  bildirim: Bildirim;
  bildirim_kilit: BildirimKilit;
}
export type TableName = keyof Tables;
export type NewRecord<T extends TableName> = Omit<Tables[T], keyof BaseRecord> & Partial<BaseRecord>;

/** Değişiklik geçmişi tutulan tablolar ve geçmişte görünen liste adları. */
export const TRACKED: Partial<Record<TableName, string>> = {
  altyapi: 'VVIP Altyapı Takip',
  taahhut: 'VVIP Taahhüt',
  ust_hat: 'Üst Yönetim Hatları',
  vip_talep: 'VIP Talep Takip',
  ohe_cihaz: 'ÖHE Envanter',
  ohe_gundem: 'ÖHE Gündem',
  kades: 'KADES',
  gorev: 'Görevler',
  erisim_talep: 'Erişim Talepleri',
};
