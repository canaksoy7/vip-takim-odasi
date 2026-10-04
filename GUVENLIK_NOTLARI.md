# Güvenlik Notları

Bu dosya, prototipe **taşınmayan** gerçek veri ve iç adres bulgularını listeler. Verinin kendisi bu dosyaya yazılmaz.

## Aşama 1 — yüklenen arşiv (`Listeler.rar`)

| Bulgu | Ne yapıldı |
|---|---|
| Her liste klasöründe bir `.xlsx` dışa aktarım dosyası vardı (toplam 64 adet; ör. `VVIP Altyapi Takip`, `UstYonetimHatlari`, `BakanHatlari`, `SorumlulukRehberi`, `OHE_Envanter (Cihaz Stok)` listeleri dahil). | **Açılmadı, okunmadı, kullanılmadı.** Oturumun geçici çalışma kopyasından silindi. Depoya hiçbir zaman eklenmedi. |
| `.csv` veya başka veri dosyası | Yok. |
| Şema dosyaları (`*_sema.xml.txt`) | Yalnızca alan tanımları okundu. E-posta adresi, telefon/hizmet numarası veya kişi adı içeren alan varsayılanı ya da görünüm filtresi bulunmadı (telefon benzeri eşleşmeler SharePoint özellik GUID'leriydi). |
| Şemalarda iç site yolu (`/gruplar/...`) ve liste GUID'leri geçiyor | Prototipe taşınmayacak; envanterde yalnızca liste adlarıyla anıldı. |
| `Kodlar/` klasörü arşivde yok | Sayfa kodlarındaki olası sabit veriler henüz taranamadı; kodlar gelince bu bölüm güncellenecek. |

## Aşama 1 — depodaki mevcut `index.html` (VIP SM Takım Odası)

| Bulgu | Ne yapıldı |
|---|---|
| Sahip/kontakt alanlarında gerçek kişi adları var. | Prototipe taşınmayacak; gerekirse "Ayşe K." gibi uydurma adlar ve ekip adları kullanılacak. |
| Şirket içi portal adresine giden bağlantılar var (25 adet). | Prototipe taşınmayacak. Dosyaya dokunulmadı. |
