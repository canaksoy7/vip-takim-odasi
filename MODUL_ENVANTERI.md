# VIP Hafıza — Modül Envanteri (Aşama 1)

> Durum: **Son hal (Aşama 6).** Prototip `app/` klasöründe; çalıştırma için `app/README.md`.
> Bu belge liste şemalarından (`Listeler/*/*_sema.xml.txt`) ve görev tanımındaki kurallardan üretildi.
> Ayrı bir `Kodlar/` klasörü yok; kullanıcı, kaynak olarak bu şema dosyalarının esas alınmasını onayladı.
> Bu yüzden sayfa kodundaki olası kural farkları karşılaştırılamadı; 📝 işaretli kurallar görev tanımından uygulandı.

## 0. Kaynak ve işaretler

| İşaret | Anlamı |
|---|---|
| 📄 | Liste şemasından doğrulandı (alan adı, tür, seçenek) |
| 📝 | Görev tanımındaki kuraldan alındı; sayfa koduyla **henüz karşılaştırılmadı** |
| ❓ | Açık soru — kod ya da sizden teyit gerekiyor |

Yüklenen arşiv (`Listeler.rar`) içeriği: 64 liste klasörü, her birinde bir `_sema.xml.txt` ve bir `.xlsx`.
`.xlsx` dosyaları **açılmadı, okunmadı ve çalışma kopyasından silindi** (bkz. `GUVENLIK_NOTLARI.md`).

---

## 1. Modül → liste eşlemesi (özet)

| # | Modül | Okuduğu / yazdığı listeler | Kaynak |
|---|---|---|---|
| 1 | VVIP Altyapı Takip | `VVIP Altyapi Takip`, `VVIPAltyapiEkler` (belge kitaplığı), `VVIPDegisiklikGecmisi`, `VVIPAtamaBildirimLog` | 📄 |
| 2 | Altyapı Talep Metni Oluşturucu | (liste yok; çıktı `VVIP Altyapi Takip` alanlarına karşılık gelir) | 📝 |
| 3 | Altyapı Masası (kişi bazlı) | `VVIP Altyapi Takip` (`Takipci`, `OnayRed`, `ProjeDurumKodu`), `VVIPAtamaBildirimLog` | 📄📝 |
| 4 | VVIP Taahhüt Ekranı | `BakanHatlari` ❓ (taahhüt ana listesi olarak görünüyor), `VVIPTaahhutDegisiklikGecmisi` | 📄 |
| 5 | Taahhüt Alarmı | `VVIPTaahhutAlarmLog`, `TaahhutBildirimLog` | 📄 |
| 6 | Üst Yönetim Hatları + erişim onayı | `UstYonetimHatlari`, `ErisimTalepleri`, `ErisimOnaycilar`, `ErisimLog` | 📄 |
| 7 | Ek İndirim Hesaplama | (liste yok — saf hesaplayıcı) | 📝 |
| 8 | Yönetici Panosu | `VVIP Altyapi Takip`, `ErisimTalepleri`, `OHE_*` özetleri, `VIPTeamMembers.IsManager` | 📄📝 |
| 9 | VIP Talep Takip | `VIPTakipMeta`, `VIPTakipLog` + **ana talep listesi şeması yok** ❓ | 📄❓ |
| 10 | ÖHE Bütçe & Stok | `OHE_Envanter (Cihaz Stok)`, `OHE_EnvanterStok`, `OHE_EnvanterSyncLog`, `OHE_Gundemler`, `OHE_GundemBildirimLog`, `OHE_SAT_Kayitlari (Harcamalar)`, `OHE_TestHatlari`, `OHE_Butce_Tanimlari`, `OHE_Butce_Harcamalar`, `OHE_Master` | 📄 |
| 11 | KADES & Ürün Kodları | `OHE_KadesDefteri` | 📄 |
| 12 | ÖHE Yönlendirme | (liste yok — uygulama içi ilçe koordinat tablosu) | 📝 |
| 13 | Sorumluluk Rehberi | `SorumlulukRehberi`, `RehberAramaKaydi` | 📄 |
| 14 | Kurumsal Hafıza | `KurumsalHafiza`, `KurumsalHafiza (Custom List)` | 📄 |
| 15 | Raporlama & Analiz / Rapor Stüdyosu | `MonitoringRaporlari`, `MonitoringDosyalari` (kitaplık) + diğer listelerin özetleri | 📄📝 |
| 16 | Pusula Motoru | `PusulaBilgi`, `TTPortDuyurular` | 📄 |
| 17 | **Görevler** (görev tanımında yok, şemalarda var) | `VIPGörevler`, `VIPGörevler (ANA LİSTE)`, `VIPAktiviteLog`, `VIPTeamMembers`, `VIPListeler`, `VIPKategoriler` | 📄 |
| 18 | **Takım Odası / Bilgi Bankası** (depodaki `index.html`) | Statik kategori + kayıt kartları (liste kullanmıyor) | depo |

Prototipte kullanılmayacak SharePoint sistem listeleri: `Ana Sayfa Galerisi`, `Banner List`, `Belgeler`, `Bildirimler Listesi`, `Dokümanlar`, `Duyurular`, `Form Şablonları`, `Galeri`, `Görevler` (SP şablonu, boş), `Kısayollar`, `Liste Şablonu Galerisi`, `Mikro Akış`, `Oluşturulan Görünümler`, `Proje İlkesi Öğe Listesi`, `Site Varlıkları`, `Stil Kitaplığı`, `Takvim`, `Tartışma Listesi`, `TaxonomyHiddenList`, `Tema Galerisi`, `Web Bölümü Galerisi`, `appdata`, `appfiles`, `wfpub`, `Çözüm Galerisi`.
(`Banner List` ana sayfa karuseli için kullanılıyorsa prototipte statik "duyuru şeridi" olarak karşılanabilir.)

---

## 2. Modüller

### 2.1 VVIP Altyapı Takip

**Listeler:** `VVIP Altyapi Takip` (ek açık), `VVIPAltyapiEkler` (belge kitaplığı — harita/görsel ekleri), `VVIPDegisiklikGecmisi` (alan bazlı geçmiş), `VVIPAtamaBildirimLog`.

**Kullanılan alanlar 📄:** `Title`, `AnaKategori`, `TalepSahibi`, `ProjeID`, `HPBasiMaliyet`, `AboneBasiMaliyet`, `MaliyetTutari`, `MaliyetSayisal`, `Penetrasyon`, `Asama`, `ProjeDurumKodu`, `ButceTuru`, `OnayRed`, `Aciklama`, `Adres`, `Takipci`, `Sehira` (görünen ad "Sehir"), `HP`, `ProjeTuru`, `CalisanDSL`, `AboneOngoru`, `MevcutAltyapi`, `MevcutHiz`, `FiberMesafesi`, `MaliyetNotu`, `SunulmaTarihi`, `KararTarihi`, `ImalatBaslangic`, `TahminiTamamlanma`, `TamamlanmaTarihi`.

**Ekranlar 📝:**
- Liste: filtre çipleri *Tümü / Beklemede / Üst yönetimde / Onay / Red / Geciken* (sayılarla).
- Ek filtreler: Bütçe (`ButceTuru`), Kategori (`AnaKategori`), Takipçi (`Takipci`), Proje durumu (`ProjeDurumKodu`); "bekleme süresine göre sırala".
- Detay: künye, ekler (SVG harita), değişiklik geçmişi, düzenle, Onay/Red (yalnızca Yönetici).
- Word raporu "VIP Yatırım Değerlendirmesi" (seçili kayıtlar → `.docx`).

**İş kuralları 📝:**
- Durum akışı: `Beklemede` → `Üst Yönetime Sunuldu - Bekliyor` (`SunulmaTarihi` set) → `Onay` / `Red` (`KararTarihi` set). Her geçiş `VVIPDegisiklikGecmisi`'ne yazılır (`Aksiyon`, `DegisilenAlan`, `OncekiDeger`, `YeniDeger`, `DegistireN`, `KayitID`).
- Gecikme rozeti (Beklemede + Üst yönetimde): 4+ gün sarı, 7+ turuncu, 14+ kırmızı. ❓ Gün sayısının başlangıcı: Beklemede için `Created`, Üst yönetimde için `SunulmaTarihi` varsayıldı — kodla teyit edilecek.
- `ProjeTuru` şemada serbest metin (Text); prototipte yalnızca `BF`/`GF`. "Alan Bazlı" girişi dönüştürülür. ❓ Dönüşüm kuralı (hangi koşulda BF, hangisinde GF) kodda görülmeli; kod gelmezse öneri: mevcut altyapı/çalışan DSL varsa **BF**, yoksa **GF**.
- Word başlığı: `ProjeID / Talep — İlçe / İl`; GF projede "altyapımız bulunmamaktadır" cümlesi yazılmaz.

**Şemadan dikkat çeken noktalar 📄:**
- Seçenek değerleri numaralı metin olarak saklanıyor (`"1. Dönüşüm"`, `"3. Toptan"` …). Yalnızca `OnayRed`'deki `"Üst Yönetime Sunuldu - Bekliyor"` numarasız. Prototipte saklanan değer = şemadaki metin; ekranda numara gizlenir.
- `ProjeDurumKodu` seçenekleri: Tamamlandı, İmalat, Toptan, Erişim, Bölge, Red.
- ❓ **VVIP / Toptan kaynak ayrımı** için ayrı bir alan yok. Yalnızca `ProjeDurumKodu = "3. Toptan"` var. Kodda başka bir işaret (ör. `AnaKategori`, `Asama` metni ya da `Title` öneki) kullanılıyor olabilir. Kod gelmezse prototipte `Kaynak` (VVIP/Toptan) ve `ToptanaBildirildi` (Evet/Hayır) alanları eklenecek ve envantere "şemada yok, prototip eki" diye yazılacak.

**Tetikleyiciler 📄📝:** `VVIPAtamaBildirimLog` (Olay, KayitID, Kisi, Durum, Deneme, Tetikleyen, Detay) — atama ve "eksik bilgi" bildirimleri. Açıklamaya göre bir satır silinirse bildirim yeniden gönderilir → çift gönderim kilidi işlevi görüyor. Prototipte: takipçi atanınca / zorunlu alan eksikse bildirim kutusuna mail önizlemesi + log kaydı.

**Dışa aktarım:** Word (.docx). ❓ CSV/Excel varsa kodda görülecek.

**Mobil sadeleştirme:** Liste kartı = Başlık + İl/İlçe + durum rengi + gecikme rozeti; filtreler alttan açılan sayfa (bottom sheet); düzenleme 3 adımlı form (Künye → Maliyet → Durum/Tarihler).

### 2.2 Altyapı Talep Metni Oluşturucu 📝
Liste yazmıyor; yapıştırılan metinden kural tabanlı ayrıştırma ile anlatım + künye üretir.
- Gerekçe: HP başı maliyet > 5,5 K TL → "HP başı maliyet sebebiyle ticari olarak uygun değildir"; ≤ 5,5 K TL → "bölge bütçesi bulunmadığı için uygun görülmemiştir". ❓ Tam 5.500 TL durumu: "üzerindeyse" ifadesine göre `>` kullanıldı.
- Biçimler: `87,2 K TL`, `1,6 M TL`; fiber ≤ 999 m → `mt.`, üstü `km.`; hız sayı + `Mbps`.
- "Proje Bilgileri": Proje ID, türü, HP, HP başı, çalışan DSL, abone başı, toplam, fiber mesafesi, harita.
- Bağlantı: üretilen künye tek dokunuşla yeni `VVIP Altyapi Takip` kaydına dönüştürülebilir (öneri).
- Mobil: tek ekran — yapıştır alanı, "Örnek 1/2/3" çipleri, sonuç kartı + "Kopyala".

### 2.3 Altyapı Masası 📝
- Aynı `VVIP Altyapi Takip` listesini kişi (`Takipci`) bazlı gösterir: Yeni (takipçisi boş) / Mevcut / Onaylı / Reddedilen; VVIP–Toptan ayrımı; "Üstlen" = `Takipci := ben` + geçmiş kaydı + `VVIPAtamaBildirimLog`.
- "Toptan'a bildirildi" işareti yalnızca Toptan kaynaklı taleplerde.
- Toptan taleplerinde imalat süreci (`ImalatBaslangic`, `TahminiTamamlanma`, `TamamlanmaTarihi`) takip edilmez; VVIP talepleri `ProjeDurumKodu = Tamamlandı` olana kadar listede kalır.

### 2.4 VVIP Taahhüt Ekranı
**Listeler 📄:** `BakanHatlari` ❓ — alanları taahhüt kaydına birebir uyuyor: `Ki_x015f_i_x0020__x002d__x0020__` ("Kişi - Ünvan"), `MSISDN`, `KimdenGeldi`, `IndirimOrani`, `TaahhutBaslangic`, `TaahhutBitis`, `Tarife`, `Ekleyen`, `VerilenTip`, `Hediye`, `HediyeNot`. Geçmiş: `VVIPTaahhutDegisiklikGecmisi`.
- 📝 Taahhüt/indirim kayıtları, değişiklik geçmişi, **çakışma tespiti** (aynı MSISDN'de tarih aralığı örtüşen iki kayıt), **ürün tipi ayrımı** (`VerilenTip`: Mobil / İnternet / TV varsayıldı ❓).
- Liste adı "BakanHatlari" olduğundan prototipte ekran adı **"VVIP Taahhütler"** olacak; kişi/ünvan alanları uydurma.
- Mobil: üstte "Süresi geçmiş / 30 gün içinde / İleri tarihli" sekmeleri; numara maskeli.

### 2.5 Taahhüt Alarmı 📄📝
- `TaahhutBildirimLog`: KayitID, Esik, BitisTarihi, KalanGun, MusteriAdi, Durum, Deneme, GonderimZamani, Tetikleyen, Alici, HataDetay — "çift gönderim kilidi".
- `VVIPTaahhutAlarmLog`: yalnızca `Title` (özel alan yok); satır silinirse hatırlatma yeniden gönderilir.
- Eşik (`Esik`) alanı birden fazla eşik olduğunu gösteriyor. ❓ Eşik değerleri kodda; öneri: 30 / 15 / 7 gün.
- "Sayfayı günün ilk açanı tetikler": prototipte uygulama o gün ilk açıldığında çalışır; `(KayitID, Esik)` çifti için log varsa tekrar üretmez; aynı gün ikinci açılışta çalışmaz.

### 2.6 Üst Yönetim Hatları + Erişim Onayı 📄
- `UstYonetimHatlari`: Kategori, HatTipi, HatNumarasi, Aciklama, Ekleyen, Sirket.
- `ErisimTalepleri` ("numara görme / tam numaralı rapor onay talepleri"): TalepTuru, Modul, Kapsam, Sebep, Durum, TalepEdenAd, TalepEdenEposta, OnaylayanAd, KararNotu, KararTarihi, **GecerlilikBitis** (süreli görünürlük).
- `ErisimOnaycilar`: Onayci (User), Aktif.
- `ErisimLog` ("numara görüntüleme, rapor indirme, onay/red kayıtları"): Islem, Modul, Kapsam, KayitId, Sebep, KullaniciAd, TalepId.
- Akış: maskeli liste → "Numarayı göster" / "Tam rapor" → sebep yaz → talep (`Durum=Bekliyor`) → Yönetici rolünde onay/red + not → `GecerlilikBitis`'e kadar açık. Her görüntüleme/indirme/karar `ErisimLog`'a. Günlük ayrı ekranda.
- Maskeleme: `0 5XX *** ** 01` (son 2 hane açık).

### 2.7 Ek İndirim Hesaplama 📝
Liste yok. Mobil / İnternet / TV (Tivibu) satırları: taahhütsüz ücret, taahhütlü ücret, hedef ücret → gereken indirim (₺ ve %), toplam özet.

### 2.8 Yönetici Panosu 📝
KPI: Beklemede, Üst yönetimde, bu ay Onay/Red, geciken (14+), bekleyen erişim talepleri, 30 gün içinde biten taahhüt. Onay bekleyenler listesi + tek dokunuş Onay/Red (Yönetici). `VIPTeamMembers.IsManager` yönetici bayrağını taşıyor 📄.

### 2.9 VIP Talep Takip
**Listeler 📄:** `VIPTakipMeta` (VipFormID, Baslik2, Takipci, SonNot, SonNotTarihi, HatirlatmaTarihi, HatirlatmaNotu, HatirlatmaDurum, HatirlatmaKilit, HatirlatmaAlicilar), `VIPTakipLog` (VipFormID, Ekleyen, Detay). Her iki listede alanlar `…0` sonekiyle **ikişer kez** tanımlı (ör. `VipFormID` ve `VipFormID0`) — muhtemelen yeniden oluşturma artığı; prototipte tekilleştirilecek.
- ❓ **Ana talep listesi (VipForm) şeması arşivde yok.** `RequestSubject`, `Subject`, talep no, hizmet no, kategori, kanal, kaydı giren, durum (Devam/Takip/Ön Başvuru/Kapalı), açılış tarihi alanları görev tanımından alınacak. Meta/Log listeleri bu ana kayda `VipFormID` ile bağlanıyor → ana liste başka bir sitede/uygulamada olabilir.
- Kurallar 📝: açık = Devam + Takip; Ön Başvuru kapalı sayılır. Yaş: 4 gün sarı, 8 gün kırmızı. VVIP sekmesi: başlıkta "VVIP" (Türkçe İ/ı ve büyük/küçük harf duyarsız); 7 günü aşan açık VVIP için uyarı. Tarih filtreleri (7/30/90/Tümü/gün/aralık, açılış tarihine göre). Arama: başlık/müşteri/talep no. CSV indir.
- Hatırlatma (meta): `HatirlatmaTarihi` + `HatirlatmaKilit` → günlük tek gönderim kilidi (bildirim kutusuna).
- Mobil: üstte kişi şeridi (açılışta "ben"), büyük "Açık / Kapalı" anahtarı ve seçili kişi her zaman görünür başlıkta; KPI'lar tek satır çip.

### 2.10 ÖHE Bütçe & Stok 📄
| Sekme | Liste | Alanlar |
|---|---|---|
| Envanter (cihaz, seri no bazlı) | `OHE_Envanter (Cihaz Stok)` | Model, SeriNo, IMEI, Lokasyon [Ankara, İstanbul, İzmir, Bodrum], Zimmet, Durum [Stokta, Verildi], StokGiris, StokCikis, Aciklama |
| Malzeme Kodları / stok özeti | `OHE_EnvanterStok` ❓ | Kategori, Bolum, ToplamAdet, Ankara, Istanbul, Bodrum, Izmir |
| Gündemler | `OHE_Gundemler` | Title, Kategori [Satın Alma, Altyapı, SIM Kart, Test, Diğer], Durum [Bekliyor, Devam Ediyor, Tamamlandı, İptal], SorumluKisi, Tarih, Aciklama |
| SAT | `OHE_SAT_Kayitlari (Harcamalar)` | Donem, Tedarikci, SatNumarasi, Tutar (Currency), FaturaEki |
| Test Hatları | `OHE_TestHatlari` | Title (hat), HatDurumu [Stokta, Kullanımda], Personel, YedekSIM, Aciklama |
| Bütçe | `OHE_Butce_Tanimlari`, `OHE_Butce_Harcamalar` | Tanım: Kategori [Genel, Mobil, Sabit, VIP, Kurumsal], ToplamButce, Donem, Aciklama · Harcama: Kategori [Mobil, Sabit, VIP, Kurumsal], Tutar, Tarih, Donem, Tedarikci, FaturaRef |
| Excel Aktarım | `OHE_EnvanterSyncLog` | SyncTarihi, Eklenen, Guncellenen, Sifirlanan, Hatali, Detay |

- `OHE_Master` (Modul [Envanter, Gundem, SAT, Hat] + birleşik alanlar) **boş** görünüyor; tekli listelere geçiş öncesi ortak tablo olabilir. Prototipte kullanılmayacak ❓.
- Gündem bildirimi: `OHE_GundemBildirimLog` (Olay, GundemId, Durum, Deneme, Tetikleyen, Detay) — yeni kayıt, Tamamlandı'ya geçiş, 1 ayı aşan kayıt.
- Malzeme kaydında onay mekanizması (talep → onay) için şemada alan yok ❓ — prototipte `OnayDurumu` eklenecek.
- Excel Aktarım: Eklenen/Güncellenen/**Sıfırlanan**/Hatalı sayaçları, içe aktarmanın "dosyada olmayan stok adetlerini sıfırla" mantığıyla çalıştığını düşündürüyor ❓.
- Rol: ÖHE Ekibi yalnızca bu modülü + KADES + Yönlendirme görür.

### 2.11 KADES & Ürün Kodları 📄
`OHE_KadesDefteri` ("KADES ve ürün kodu defteri"): Tur (KADES / Ürün Kodu ❓), Ad, Portal, Tutar (atanan), Harcanan, HarcananTarih, Fon, MaliKalem, Muhatap, Durum, IlgiliKades (ürün kodu → KADES bağı), Notlar. Kalan = Tutar − Harcanan; ilerleme çubuğu.

### 2.12 ÖHE Yönlendirme 📝
Ekip konumları: Ankara (2), İstanbul (2), Bodrum (1), İzmir (1) — `OHE_Envanter.Lokasyon` seçenekleriyle uyumlu. Uygulama içi il/ilçe koordinat tablosu; kuş uçuşu (Haversine) × yol katsayısı (~1,3) / ortalama hız → "2–3 saat" aralığı. Mesai dışı uyarısı.

### 2.13 Deneyim Ekipleri Sorumluluk Rehberi 📄
- `SorumlulukRehberi` ("Deneyim Direktörlüğü sorumluluk rehberi"): Title (kişi/ekip), Departman, Rol, Eposta, Alanlar (Note), Anahtar (anahtar kelimeler).
- `RehberAramaKaydi`: Title (arama terimi), Sonuc (sonuç sayısı), Mod (ör. "kelime" / "vaka"), Departmanlar. `Sonuc = 0` → "sonuç bulunamayan aramalar" (boşluk analizi).
- 9 departman, Türkçe karakter duyarsız arama, vaka metni → anahtar kelime eşleşmesi, çakışma notu.

### 2.14 Kurumsal Hafıza 📄
İki sürüm var:
- `KurumsalHafiza`: Kategori, Etiket, EtiketRenk, TalepAciklamasi, Adimlar, Uyari, Kisiler, AktifMi.
- `KurumsalHafiza (Custom List)`: Kategori, Baslik, Aciklama, Keywords, Adimlar, UyariNotu, Kisiler, Durum, Ekleyen, Guncelleyen.
Prototipte ikisinin birleşimi: süreç kartı (başlık, kategori, etiket, açıklama, adım adım liste, uyarı kutusu, ilgili kişiler/ekipler). Depodaki `index.html` (VIP SM Takım Odası) kategori yapısı — Mobil, İnternet, Sosyal Medya, Uyum/Hukuk, VIP Operasyonlar, Kontakt Rehberi, Monitoring — bu modülün kategori iskeleti olarak kullanılabilir (kişi adları ve bağlantılar taşınmadan).

### 2.15 Raporlama & Analiz / Rapor Stüdyosu
- `MonitoringRaporlari` 📄: RaporAdi, Kategori [Aylık Monitoring, Alt Markalar Raporu, Kriz & Alarm, Özel Analiz], AyYil, DosyaURL, DosyaTuru [PDF, PPTX]; dosyalar `MonitoringDosyalari` kitaplığında.
- 📝 Raporlama: modüller arası KPI ve grafikler (altyapı durum dağılımı, il bazlı, taahhüt bitiş takvimi, ÖHE bütçe kullanımı, VIP talep yaşları).
- 📝 Rapor Stüdyosu: şablon seç → kapsam/tarih seç → `.pptx` (pptxgenjs). Üretilen rapor `MonitoringRaporlari` benzeri arşive eklenir.

### 2.16 Pusula Motoru 📄📝
- `PusulaBilgi`: Title, Kategori, Icerik.
- `TTPortDuyurular`: Kaynak [Pusula, Mobil, Serbest, Kampanya, İnternet, PSTN], Gonderen, Segment, YayinTarihi, Ozet, Link, Durum [Yayında, Taslak, Arşiv], Tekillik (çift kayıt kilidi), IcerikHTML.
- Prototip: duyuru akışı (uydurma) + 2–3 konu için karar ağacı (soru → cevap → yönlendirme). Dış bağlantılar (Link) devre dışı/uydurma.

### 2.17 Görevler (envanterde ek modül) 📄
- `VIPGörevler`: Title, Aciklama, AtananKisi, BitisTarihi, Oncelik [Düşük, Normal, Yüksek, Acil], Kategori [Genel, VVIP, Sosyal Medya, Altyapı, Taahhüt, Envanter], Durum [Bekliyor, Devam Ediyor, Tamamlandı, İptal], HatirlatmaAyar, TamamlandiMi.
- `VIPGörevler (ANA LİSTE)` (boş, genişletilmiş sürüm): + AltAdimlar, DosyaEkleri, AktiviteLog, Tekrar, BagimlilikID, sortOrder, YoneticiModu.
- `VIPAktiviteLog` (GörevID, User, Action, Time), `VIPTeamMembers` (Title, Email, Short, Color, IsManager), `VIPListeler` (ListIcon, ListColor, ListItems), `VIPKategoriler` (Title).
- Prototip: ekip görev panosu (Bekliyor/Devam/Tamamlandı), alt adımlar, öncelik rengi, ekip üyesi rozetleri (kısa ad + renk).

---

## 3. Otomatik tetikleyiciler (özet)

| Tetikleyici | Kayıt listesi | Prototip karşılığı |
|---|---|---|
| Taahhüt bitiş hatırlatması (eşikli) | `TaahhutBildirimLog`, `VVIPTaahhutAlarmLog` | Günün ilk açılışında; bildirim kutusu + log |
| Altyapı atama / eksik bilgi | `VVIPAtamaBildirimLog` | Üstlen/atama ve kaydetme anında |
| ÖHE gündem (yeni, tamamlandı, 1 ay+) | `OHE_GundemBildirimLog` | Kayıt anında + günün ilk açılışında (1 ay+) |
| VIP talep hatırlatması | `VIPTakipMeta.Hatirlatma*` | Günün ilk açılışında, `HatirlatmaKilit` ile |
| Erişim talebi kararı | `ErisimTalepleri`, `ErisimLog` | Karar anında |

Ortak desen: log listesi = "gönderildi" kilidi; satır silinince yeniden gönderilir. Prototipte `notification_log` tablosu `(tür, kayıtId, eşik/olay, gün)` benzersiz anahtarıyla aynı işi yapar.

## 4. Dışa aktarımlar
| Modül | Biçim | Kütüphane |
|---|---|---|
| VVIP Altyapı | Word (.docx) | `docx` |
| VIP Talep Takip | CSV | yerel |
| Rapor Stüdyosu | PowerPoint (.pptx) | `pptxgenjs` |
| Üst Yönetim Hatları | Rapor (onaylı) — ❓ biçim kodda; öneri CSV | yerel |
| ÖHE Excel Aktarım | .xlsx **içe** aktarım (önizleme) | `SheetJS` (yalnız cihazda) |

## 5. Modüller arası bağlantılar
- `VVIP Altyapi Takip` → Altyapı Takip, Altyapı Masası, Yönetici Panosu, Talep Metni Oluşturucu, Raporlama aynı kaydı kullanır.
- `ErisimTalepleri` / `ErisimLog` → Üst Yönetim Hatları + Taahhüt (numara maskeleme) + Yönetici Panosu.
- `BakanHatlari` (taahhüt) → Taahhüt Ekranı, Alarm, Ek İndirim Hesaplama (önerilen: kayıttan hesaplayıcıyı açma).
- `OHE_*` + `OHE_KadesDefteri` → ÖHE Bütçe & Stok, KADES, Yönetici Panosu; `Lokasyon` → ÖHE Yönlendirme ekip konumları.
- `VIPTeamMembers` → tüm modüllerdeki "Takipçi / Sorumlu / Atanan" seçicileri ve rol bilgisi.
- Genel arama: Proje ID (`ProjeID`), müşteri (`TalepSahibi`, Kişi-Ünvan, VIP talep müşteri), şehir (`Sehira`), kişi (`Takipci`, `SorumluKisi`, `AtananKisi`, rehber).

---

## 6. Veri modeli (prototip tabloları)

Tüm tablolarda ortak: `ID` (number, artan), `Title` (text), `Created`, `Modified` (ISO tarih), `Author`, `Editor` (kullanıcı kısa adı). Seçenek alanları şemadaki metni saklar.

| Tablo (Dexie) | SP listesi | Alanlar (tür) | İlişki |
|---|---|---|---|
| `altyapi` | VVIP Altyapi Takip | AnaKategori (choice: 1. Dönüşüm, 2. Altyapı, 3. Fiber, 4. Altyapı-Dönüşüm, 5. Omurga Projesi), TalepSahibi (text), ProjeID (number), HPBasiMaliyet, AboneBasiMaliyet, MaliyetTutari, MaliyetSayisal, Penetrasyon, HP, CalisanDSL, AboneOngoru, FiberMesafesi (number), Asama, Aciklama, Adres (note), ProjeDurumKodu (choice: 1. Tamamlandı, 2. İmalat, 3. Toptan, 4. Erişim, 5. Bölge, 6. Red), ButceTuru (choice: 1. VIP, 2. Ticari, 3. Beklemede), OnayRed (choice: 1. Onay, 2. Red, 3. Beklemede, Üst Yönetime Sunuldu - Bekliyor), Takipci, Sehira, ProjeTuru (BF/GF), MevcutAltyapi, MevcutHiz, MaliyetNotu (text), SunulmaTarihi, KararTarihi, ImalatBaslangic, TahminiTamamlanma, TamamlanmaTarihi (date) · *prototip eki:* Ilce, Kaynak (VVIP/Toptan), ToptanaBildirildi (bool) | 1–N `altyapi_ek`, 1–N `gecmis` |
| `altyapi_ek` | VVIPAltyapiEkler | AltyapiID, DosyaAdi, MimeType, Icerik (SVG metni) | N–1 `altyapi` |
| `gecmis` | VVIPDegisiklikGecmisi + VVIPTaahhutDegisiklikGecmisi | Liste (altyapi/taahhut/…), KayitID, Aksiyon, DegisilenAlan, OncekiDeger, YeniDeger, DegistireN | N–1 herhangi kayıt |
| `taahhut` | BakanHatlari | KisiUnvan, MSISDN, KimdenGeldi, IndirimOrani (number), TaahhutBaslangic, TaahhutBitis (date), Tarife, Ekleyen, VerilenTip, Hediye (text), HediyeNot (note) | 1–N `gecmis`, 1–N `taahhut_bildirim` |
| `taahhut_bildirim` | TaahhutBildirimLog + VVIPTaahhutAlarmLog | KayitID, Esik, BitisTarihi, KalanGun, MusteriAdi, Durum, Deneme, GonderimZamani, Tetikleyen, Alici, HataDetay | N–1 `taahhut` |
| `ust_hat` | UstYonetimHatlari | Kategori, HatTipi, HatNumarasi, Sirket, Ekleyen (text), Aciklama (note) | |
| `erisim_talep` | ErisimTalepleri | TalepTuru, Modul, Kapsam, Durum, TalepEdenAd, TalepEdenEposta, OnaylayanAd (text), Sebep, KararNotu (note), KararTarihi, GecerlilikBitis (datetime) | 1–N `erisim_log` |
| `erisim_onayci` | ErisimOnaycilar | Onayci (user), Aktif (bool) | |
| `erisim_log` | ErisimLog | Islem, Modul, Kapsam, KayitId, KullaniciAd, TalepId (text), Sebep (note) | |
| `vip_talep` | **(şema yok — görev tanımından)** | TalepNo, RequestSubject, Subject, Musteri, HizmetNo, Kategori, Kanal, KaydiGiren, Durum (Devam/Takip/Ön Başvuru/Kapalı), AcilisTarihi, KapanisTarihi, OnemliSikayet (bool) | 1–1 `vip_meta`, 1–N `vip_log` |
| `vip_meta` | VIPTakipMeta | VipFormID, Baslik2, Takipci, SonNot, SonNotTarihi, HatirlatmaTarihi, HatirlatmaNotu, HatirlatmaDurum, HatirlatmaKilit, HatirlatmaAlicilar | N–1 `vip_talep` |
| `vip_log` | VIPTakipLog | VipFormID, Ekleyen, Detay | N–1 `vip_talep` |
| `ohe_cihaz` | OHE_Envanter (Cihaz Stok) | Model, SeriNo, IMEI, Lokasyon (choice 4 il), Zimmet, Durum (Stokta/Verildi), StokGiris, StokCikis, Aciklama · *ek:* OnayDurumu | |
| `ohe_stok` | OHE_EnvanterStok | Kategori, Bolum, ToplamAdet, Ankara, Istanbul, Bodrum, Izmir | |
| `ohe_sync_log` | OHE_EnvanterSyncLog | SyncTarihi, Eklenen, Guncellenen, Sifirlanan, Hatali, Detay | |
| `ohe_gundem` | OHE_Gundemler | Kategori (5 seçenek), Durum (4 seçenek), SorumluKisi, Tarih, Aciklama | 1–N `ohe_gundem_log` |
| `ohe_gundem_log` | OHE_GundemBildirimLog | Olay, GundemId, Durum, Deneme, Tetikleyen, Detay | |
| `ohe_sat` | OHE_SAT_Kayitlari | Donem, Tedarikci, SatNumarasi, Tutar (₺), FaturaEki | |
| `ohe_test_hat` | OHE_TestHatlari | HatDurumu (Stokta/Kullanımda), Personel, YedekSIM, Aciklama | |
| `ohe_butce` | OHE_Butce_Tanimlari | Kategori (5), ToplamButce, Donem, Aciklama | 1–N `ohe_harcama` (Kategori+Donem) |
| `ohe_harcama` | OHE_Butce_Harcamalar | Kategori (4), Tutar, Tarih, Donem, Tedarikci, FaturaRef | |
| `kades` | OHE_KadesDefteri | Tur, Ad, Portal, Tutar, Harcanan, HarcananTarih, Fon, MaliKalem, Muhatap, Durum, IlgiliKades, Notlar | ürün kodu → KADES (IlgiliKades) |
| `rehber` | SorumlulukRehberi | Departman, Rol, Eposta, Alanlar, Anahtar | |
| `rehber_arama` | RehberAramaKaydi | Title (terim), Sonuc, Mod, Departmanlar | |
| `hafiza` | KurumsalHafiza (+Custom List) | Kategori, Etiket, EtiketRenk, Aciklama, Keywords, Adimlar, Uyari, Kisiler, Durum/AktifMi | |
| `rapor` | MonitoringRaporlari | RaporAdi, Kategori (4), AyYil, DosyaTuru (PDF/PPTX) | |
| `pusula` | PusulaBilgi + TTPortDuyurular | Kategori, Icerik · Kaynak (6), Gonderen, Segment, YayinTarihi, Ozet, Durum (3), Tekillik | |
| `gorev` | VIPGörevler (+ANA LİSTE) | Aciklama, AtananKisi, BitisTarihi, Oncelik (4), Kategori (6), Durum (4), TamamlandiMi, AltAdimlar, Tekrar | 1–N `gorev_log` |
| `gorev_log` | VIPAktiviteLog | GorevID, User, Action, Time | |
| `ekip` | VIPTeamMembers | Title, Email (uydurma), Short, Color, IsManager | tüm "kişi" alanları |
| `bildirim` | *(prototip)* | Tur, Konu, AliciRolu, Govde, Okundu, KaynakListe, KaynakID | |
| `ayar` | *(prototip)* | anahtar/değer: rol, tema, sonTetiklemeGunu | |

---

## 7. Mobil sadeleştirme önerileri (genel)
1. Her modül: Liste → Detay → İşlem; işlem butonları ekranın altında sabit, büyük.
2. Filtreler çip + alttan açılan sayfa; seçili filtre sayısı başlıkta.
3. Durum renkleri tek sözlükten: Beklemede sarı, Üst yönetimde mavi, Onay yeşil, Red kırmızı.
4. SharePoint'teki sayfa başı sağ menüler → tek dock + "Tümü" ekranı.
5. Uzun formlar 2–3 adım; tarih alanları yerel tarih seçici.
6. Tablolar mobilde kart; masaüstünde tablo görünümü.

## 8. Açık sorular ve alınan kararlar

Kullanıcı "devam et" dedi; aşağıdaki sorular önerilen varsayımlarla kapatıldı:

| # | Karar |
|---|---|
| 1 | Ayrı kod yok; şemalar + görev tanımı esas alındı. |
| 2 | VIP talep ana listesi görev tanımındaki alanlarla modellendi (`vip_talep`). |
| 3 | `BakanHatlari` = VVIP Taahhüt ana listesi (ekran adı "VVIP Taahhütler"). |
| 4 | Prototipe `Kaynak` (VVIP/Toptan) ve `ToptanaBildirildi` alanları eklendi. |
| 5 | "Alan Bazlı" → çalışan DSL ya da mevcut altyapı varsa BF, yoksa GF. Alarm eşikleri 30/15/7 gün. "Geciken" filtresi 7+ gün. |
| 6 | Prototip `app/` klasöründe; depodaki `index.html` değiştirilmedi. |

İlk sorular (kayıt için):
1. **`Kodlar/` klasörü** arşivde yok. Gönderebilir misiniz (tercihen `.xlsx` içermeyen bir zip)? Gönderemezseniz prototipi bu envanter + görev tanımı üzerinden kurarım; koddaki kural farkları yakalanamaz.
2. **VIP Talep Takip ana listesi** (RequestSubject/Subject alanlı) şeması yok. Şeması var mı, yoksa görev tanımındaki alanlarla mı modelleyelim?
3. **`BakanHatlari` = VVIP Taahhüt ana listesi** varsayımı doğru mu?
4. **VVIP/Toptan kaynağı** hangi alandan geliyor? (Şemada yalnızca `ProjeDurumKodu = 3. Toptan` var.)
5. "Alan Bazlı" → BF/GF dönüşüm kuralı ve taahhüt alarm eşikleri (öneri 30/15/7 gün) koddan teyit edilemiyor; öneriler uygun mu?
6. Depodaki `index.html` (VIP SM Takım Odası) prototipe "Kurumsal Hafıza" kategori iskeleti olarak alınsın mı? Prototip, mevcut `index.html`'in **yerine** mi geçsin yoksa ayrı bir klasörde (`app/`) mi dursun? (Öneri: `app/` klasörü, `index.html` dokunulmadan kalır.)

---



## 9. SharePoint ↔ prototip farkları ve canlıya geçiş uç noktaları

### 9.1 Genel farklar

| Konu | SharePoint (TTPort) | Prototip |
|---|---|---|
| Veri | SharePoint listeleri, REST (`odata=verbose`) | IndexedDB (Dexie), tek `repository` katmanı; demo verisi uydurma |
| Navigasyon | Her sayfada ayrı sağ menü | Tek merkezi navigasyon: alt dock (rol bazlı 4 modül + Tümü), "Tümü" ekranı, genel arama |
| Kimlik / yetki | SharePoint kullanıcıları ve grupları | Demo rol seçici (Ekip Üyesi / Yönetici / ÖHE Ekibi) |
| E-posta | Gerçek gönderim + log listeleri (çift gönderim kilidi) | Gönderim yok; Bildirim Kutusu'nda önizleme. Kilit `bildirim_kilit` tablosunda |
| "Günün ilk açanı tetikler" | Sayfa betiği | Uygulama o gün ilk açıldığında çalışır; Ayarlar'da "yeniden çalıştır (demo)" düğmesi |
| Seçenek değerleri | `"1. Onay"` gibi numaralı metin | Aynı metin saklanır, ekranda numara gizlenir |
| Değişiklik geçmişi | `VVIPDegisiklikGecmisi`, `VVIPTaahhutDegisiklikGecmisi` | Tek `gecmis` tablosu (`Liste` alanıyla ayrışır); repository her `update`'te değişen alanı yazar |
| Ekler | `VVIPAltyapiEkler` belge kitaplığı | Uygulama içinde üretilen SVG harita + cihazdan eklenen görsel (data URL) |
| Çevrimdışı | Yok (VPN gerekli) | PWA, tam çevrimdışı. Ayrıca tek dosya `VIP_Hafiza_Demo.html` (sunucusuz) |

### 9.2 Modül bazlı farklar

| Modül | Prototipte farklı olan |
|---|---|
| VVIP Altyapı Takip | `Kaynak` (VVIP/Toptan), `ToptanaBildirildi`, `Ilce` alanları eklendi. "Geciken" = karar bekleyen ve 7+ gün. Üst yönetime sunma, zorunlu alan eksikse engellenir ve "eksik bilgi" bildirimi üretir. Word raporu `docx` ile cihazda üretilir. |
| Talep Metni Oluşturucu | "Anahtar: Değer" satırları ve sekmeli başlık+değer tablosu desteklenir. Künye tek dokunuşla yeni altyapı kaydına dönüşür. |
| Altyapı Masası | Altyapı Takip ile aynı tabloyu kullanır; ayrı liste yok. |
| VVIP Taahhütler | `BakanHatlari` şemasıyla. Çakışma = aynı numarada örtüşen tarih aralığı. Numara maskeli; görmek için erişim onayı gerekir. |
| Taahhüt Alarmı | Eşikler 30/15/7 gün. Her `(kayıt, eşik)` çifti için tek bildirim. |
| Üst Yönetim Hatları | Görünürlük süresi 15 dk. Maskeli CSV her zaman alınabilir; tam numaralı CSV ayrı onay ister. Her işlem `erisim_log`'a yazılır. |
| Ek İndirim Hesaplama | Liste yok; saf hesaplayıcı. |
| Yönetici Panosu | Altyapı onayı, erişim talepleri ve malzeme kayıt onayları tek ekranda. |
| VIP Talep Takip | Ana liste şeması olmadığı için alanlar görev tanımından alındı. Takipçi `vip_meta`'da; notlar `vip_log`'da. Hatırlatma `HatirlatmaKilit` ile günde bir kez. |
| ÖHE Bütçe & Stok | Malzeme kaydında `OnayDurumu` (prototip eki). Excel aktarım `SheetJS` ile yalnızca cihazda; örnek şablon uygulama içinde üretilir. `OHE_Master` kullanılmadı. |
| KADES | `Tur` = KADES / Ürün Kodu; ürün kodu `IlgiliKades` ile bağlanır. |
| ÖHE Yönlendirme | Liste yok; ~150 il/ilçe koordinatı uygulama içinde. Kuş uçuşu × 1,3 ÷ 75 km/sa + 15 dk hazırlık, sonuç aralık olarak. |
| Sorumluluk Rehberi | Arama kaydı yazmadan önce 1 sn bekler (her tuşta kayıt atmaz). Vaka önerisi anahtar kelime puanlamasıyla. |
| Kurumsal Hafıza | İki SharePoint sürümünün alanları birleştirildi. |
| Raporlama / Rapor Stüdyosu | Grafikler uygulama içi; `.pptx` `pptxgenjs` ile cihazda üretilir ve rapor arşivine eklenir. |
| Pusula Motoru | 3 örnek karar ağacı uygulama kodunda; duyurular `TTPortDuyurular` şemasıyla. Dış bağlantı yok. |
| Görevler | `VIPGörevler` + `ANA LİSTE` alanları birleşik; alt adımlar JSON. |

### 9.3 Canlıya geçiş: repository arkasına gelecek API

`src/data/repo.ts` içindeki `DataSource` arayüzü bir `HttpSource` ile değiştirilir; ekranlar değişmez.
Önerilen uç noktalar (SharePoint REST'in önüne konacak ince bir arka uç ya da doğrudan SharePoint REST eşlemesi):

**Genel CRUD** — her tablo için (`{liste}` = tablo adı → SharePoint liste adı eşlemesi aşağıda):

| Metot | Uç nokta | Repository | SharePoint karşılığı |
|---|---|---|---|
| GET | `/api/{liste}?filter=&orderby=&top=` | `list`, `query` | `GET _api/web/lists/getbytitle('…')/items` |
| GET | `/api/{liste}/{id}` | `get` | `…/items({id})` |
| POST | `/api/{liste}` | `create` | `POST …/items` |
| PATCH | `/api/{liste}/{id}` | `update` | `MERGE …/items({id})` + `IF-MATCH` (etag ile, `*` yerine) |
| DELETE | `/api/{liste}/{id}` | `remove` | `DELETE …/items({id})` |
| GET | `/api/gecmis?liste=&kayitId=` | `history` | `VVIPDegisiklikGecmisi` / `VVIPTaahhutDegisiklikGecmisi` |

**İş akışı uç noktaları** (sunucu tarafında yapılması gerekenler — istemciye bırakılmamalı):

| Uç nokta | Amaç | Neden sunucuda |
|---|---|---|
| `POST /api/altyapi/{id}/sun` | Beklemede → Üst yönetim; zorunlu alan kontrolü | Durum geçişi kuralı + geçmiş kaydı atomik olmalı |
| `POST /api/altyapi/{id}/karar` `{onay, not}` | Onay / Red | Yalnızca yönetici yetkisiyle |
| `POST /api/altyapi/{id}/ustlen` | Takipçi atama + atama bildirimi | `VVIPAtamaBildirimLog` kilidi |
| `POST /api/altyapi/rapor/docx` `{ids}` | Word raporu (istemcide de üretilebilir) | İsteğe bağlı |
| `POST /api/erisim/talep` | Numara görme / tam rapor talebi | `ErisimTalepleri` |
| `POST /api/erisim/{id}/karar` | Onay/red + `GecerlilikBitis` | Yalnızca `ErisimOnaycilar` |
| `GET /api/ust-hat/{id}/numara` | Tam numarayı döner, `ErisimLog`'a yazar | **Numara istemciye maskesiz hiç gönderilmemeli**; prototipte maskeleme istemcide |
| `GET /api/ust-hat/rapor?tam=1` | Tam numaralı rapor | Aktif onay kontrolü + günlük |
| `POST /api/tetik/gunluk` | Taahhüt alarmı, gündem 1 ay+, VVIP 7 gün, gecikme | "Günün ilk açanı" yerine zamanlanmış görev (cron) önerilir |
| `POST /api/bildirim/gonder` | Gerçek e-posta | Log listeleri = çift gönderim kilidi |
| `POST /api/ohe/aktarim` | Excel içe aktarım (upsert + sıfırlama) | `OHE_EnvanterSyncLog`; toplu işlem tek işlemde |
| `POST /api/ohe/cihaz/{id}/karar` | Malzeme kaydı onayı | Yönetici yetkisi |
| `POST /api/rehber/arama-kaydi` | Arama kaydı | `RehberAramaKaydi` |
| `GET /api/me` | Kullanıcı, rol, yönetici bayrağı | Demo rol seçicinin yerine; `VIPTeamMembers.IsManager` + SP grupları |

**Tablo → SharePoint listesi eşlemesi:** `altyapi`→VVIP Altyapi Takip · `altyapi_ek`→VVIPAltyapiEkler · `gecmis`→VVIPDegisiklikGecmisi + VVIPTaahhutDegisiklikGecmisi · `taahhut`→BakanHatlari · `taahhut_bildirim`→TaahhutBildirimLog + VVIPTaahhutAlarmLog · `ust_hat`→UstYonetimHatlari · `erisim_talep`→ErisimTalepleri · `erisim_onayci`→ErisimOnaycilar · `erisim_log`→ErisimLog · `vip_talep`→(ana VIP talep listesi — şeması alınmalı) · `vip_meta`→VIPTakipMeta · `vip_log`→VIPTakipLog · `ohe_cihaz`→OHE_Envanter (Cihaz Stok) · `ohe_stok`→OHE_EnvanterStok · `ohe_sync_log`→OHE_EnvanterSyncLog · `ohe_gundem`→OHE_Gundemler · `ohe_gundem_log`→OHE_GundemBildirimLog · `ohe_sat`→OHE_SAT_Kayitlari (Harcamalar) · `ohe_test_hat`→OHE_TestHatlari · `ohe_butce`→OHE_Butce_Tanimlari · `ohe_harcama`→OHE_Butce_Harcamalar · `kades`→OHE_KadesDefteri · `rehber`→SorumlulukRehberi · `rehber_arama`→RehberAramaKaydi · `hafiza`→KurumsalHafiza · `rapor`→MonitoringRaporlari · `pusula`→PusulaBilgi · `duyuru`→TTPortDuyurular · `gorev`→VIPGörevler · `gorev_log`→VIPAktiviteLog · `ekip`→VIPTeamMembers · `bildirim`, `bildirim_kilit`→(prototip; canlıda log listeleri).

**Şemaya eklenmesi gereken alanlar (prototip ekleri):** `VVIP Altyapi Takip`: `Ilce`, `Kaynak`, `ToptanaBildirildi` · `OHE_Envanter (Cihaz Stok)`: `OnayDurumu`.
