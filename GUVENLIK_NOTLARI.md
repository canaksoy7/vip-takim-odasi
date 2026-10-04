# Güvenlik Notları

Bu dosya, prototipe **taşınmayan** gerçek veri ve iç adres bulgularını listeler. Verinin kendisi bu dosyaya yazılmaz.

## Aşama 1 — yüklenen arşiv (`Listeler.rar`)

| Bulgu | Ne yapıldı |
|---|---|
| Her liste klasöründe bir `.xlsx` dışa aktarım dosyası vardı (toplam 64 adet; ör. `VVIP Altyapi Takip`, `UstYonetimHatlari`, `BakanHatlari`, `SorumlulukRehberi`, `OHE_Envanter (Cihaz Stok)` listeleri dahil). | **Açılmadı, okunmadı, kullanılmadı.** Oturumun geçici çalışma kopyasından silindi. Depoya hiçbir zaman eklenmedi. |
| `.csv` veya başka veri dosyası | Yok. |
| Şema dosyaları (`*_sema.xml.txt`) | Yalnızca alan tanımları okundu. E-posta adresi, telefon/hizmet numarası veya kişi adı içeren alan varsayılanı ya da görünüm filtresi bulunmadı (telefon benzeri eşleşmeler SharePoint özellik GUID'leriydi). |
| Şemalarda iç site yolu (`/gruplar/...`) ve liste GUID'leri geçiyor | Prototipe taşınmayacak; envanterde yalnızca liste adlarıyla anıldı. |
| `Kodlar/` klasörü arşivde yok | Kullanıcı ayrı kod olmadığını, şema dosyalarının esas alınacağını teyit etti. Taranacak başka kod dosyası yok. |

## Aşama 1 — depodaki mevcut `index.html` (VIP SM Takım Odası)

| Bulgu | Ne yapıldı |
|---|---|
| Sahip/kontakt alanlarında gerçek kişi adları var. | Prototipe taşınmayacak; gerekirse "Ayşe K." gibi uydurma adlar ve ekip adları kullanılacak. |
| Şirket içi portal adresine giden bağlantılar var (25 adet). | Prototipe taşınmayacak. Dosyaya dokunulmadı. |

## Aşama 2–6 — prototip

| Kontrol | Sonuç |
|---|---|
| Uygulamadaki veriler | Tamamı `app/src/data/seed.ts` tarafından üretilen uydurma veridir. Kişi adları "Ayşe K." biçiminde uydurmadır; numaralar `0 5XX 000 BB NN` biçimindedir (testle zorunlu tutulur); e-postalar `@demo.invalid` (RFC 2606 ayrılmış alan). |
| `index.html` (Takım Odası) içeriği | Prototipe taşınmadı. Kurumsal Hafıza'da yalnızca genel konu başlıkları kullanıldı; kişi adları ve bağlantılar alınmadı. |
| Şirket adresleri | `npm run check:urls` → `dist/` ve `dist-single/` içinde `turktelekom`, `ttport`, `pusulayeni`, `_api`, `_vti_bin`, `.svc`, `TTGroup.Modules`, `odata=verbose` için **0 eşleşme**. |
| Dış istekler | Tarayıcı akış testinde (PWA ve `file://` tek dosya) uygulama dışına **hiç istek yapılmadı**. Pakette görünen `schemas.openxmlformats.org`, `w3.org` vb. adresler Office XML ad alanlarıdır; ağ isteği değildir. |
| Harici font / CDN / analitik | Yok. Sistem fontları kullanılır. |
| Veri saklama | Yalnızca cihazda (IndexedDB). IndexedDB kapalıysa bellek içi yedek; sayfa kapanınca silinir. |
| Dosya işleme | Excel içe aktarma, Word/PPTX/CSV üretimi yalnızca cihazda; hiçbir dosya yüklenmez. |

### Bağımlılık uyarıları (`npm audit`)

| Paket | Bulgu | Değerlendirme |
|---|---|---|
| `xlsx@0.18.5` (SheetJS) | Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS (GHSA-5pgg-2g8v-p4x9) | Düzeltilmiş sürümler (0.20.x) yalnızca `cdn.sheetjs.com` üzerinden dağıtılıyor; bu ortamın ağ politikası o adresi engelledi. Risk, kötü niyetli hazırlanmış bir `.xlsx` dosyasının açılmasıdır. Prototipte dosyayı kullanıcı kendi cihazından seçer ve veri cihazdan çıkmaz. **Canlıya geçişte `xlsx` 0.20.3+ sürümüne yükseltilmeli.** |
| `image-size` (`pptxgenjs` bağımlılığı) | JXL/HEIF/ICNS ayrıştırıcıda DoS | Prototip sunumlara görsel eklemiyor; bu kod yolu kullanılmıyor. |
| `braces` / `micromatch` (`vite-plugin-singlefile` bağımlılığı) | Derin iç içe desenlerde DoS | Yalnızca derleme sırasında, kendi yapılandırmamızla çalışır; uygulama paketine girmez. |
