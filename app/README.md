# VIP Hafıza — Mobil Demo (PWA prototipi)

SharePoint (TTPort) üzerindeki **VIP Hafıza** operasyon platformunun ekranlarını tek bir mobil uygulamada toplayan **gösterim prototipi**.

- Yalnızca **uydurma demo verisi** içerir. Kişi adları, numaralar (`0 5XX 000 …`), kurumlar ve tutarlar gerçek değildir.
- SharePoint'e, TTPort'a ya da başka bir şirket adresine **istek atmaz**. VPN gerekmez.
- Analitik, telemetri, harici font, CDN ya da harita servisi **yoktur**. Her şey paketin içindedir.
- Veriler yalnızca cihazda (IndexedDB) tutulur. E-postalar gönderilmez; **Bildirim Kutusu**'nda önizleme olarak görünür.

## Çalıştırma

Node.js 20+ gerekir.

```bash
cd app
npm install
npm run dev            # http://localhost:5173
```

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | PWA derlemesi → `dist/` (manifest + service worker, tam çevrimdışı) |
| `npm run build:single` | Tek dosya derlemesi → `dist-single/VIP_Hafiza_Demo.html` (sunucusuz açılır) |
| `npm run build:all` | İki derleme + yasaklı adres taraması |
| `npm run preview` | `dist/`'i yerelde sunar (http://localhost:4173) |
| `npm test` | Vitest testleri |
| `npm run check:urls` | `dist/` ve `dist-single/` içinde `turktelekom`, `ttport`, `_api`, `_vti_bin`, `.svc`… arar |

## Telefonda denemek

**1. Aynı Wi-Fi ağından (en hızlısı)**

```bash
npm run dev -- --host
```

Terminalde yazan `Network: http://192.168.x.x:5173` adresini telefonun tarayıcısında açın.
Not: Service worker ve "Ana ekrana ekle" yalnızca HTTPS ya da `localhost` altında tam çalışır; ağ adresinden açınca uygulama çalışır ama çevrimdışı önbellek devreye girmeyebilir.

**2. Statik barındırma (kurulabilir PWA)**

`npm run build` sonrası `dist/` klasörünü herhangi bir HTTPS statik barındırmaya (GitHub Pages, iç web sunucusu vb.) koyun.
`base: './'` ayarlı olduğu için alt klasörde de çalışır. Telefonda açıp **Ana ekrana ekle** deyin; sonrasında uçak modunda da açılır.

**3. Tek dosya (sunucusuz)**

`VIP_Hafiza_Demo.html` dosyasını e-postayla ya da paylaşım klasörüyle iletin ve çift tıklayarak açın (Chrome / Edge önerilir).

- Word, PowerPoint ve Excel üreticileri dahil her şey dosyanın içindedir; internet gerekmez.
- `file://` altında service worker çalışmadığından bu sürüm "Ana ekrana ekle" ile kurulamaz. Kurulabilir sürüm için 2. yöntemi kullanın.
- Tarayıcı yerel veritabanına izin vermezse (bazı gizli pencere ya da `file://` kısıtları) uygulama yine açılır. Üstte bir uyarı çıkar ve değişiklikler sekme kapanınca silinir.

## Demo verisini sıfırlama

**Ayarlar (⚙️) → Demo verisini sıfırla**. Tüm kayıtlar, geçmiş ve bildirimler silinir; başlangıç verisi yeniden yüklenir.
Veri sabit tohumlu bir üreteçle (`src/data/seed.ts`, `SEED`) üretilir. Tarihler "bugün"e göre görelidir; böylece gecikme rozetleri ve alarm eşikleri her gün anlamlı görünür.

## Roller (demo)

Ayarlar ekranından değiştirilir. Oturum kişisi role göre değişir.

| Rol | Kişi | Görür |
|---|---|---|
| Ekip Üyesi | Ayşe K. | Yönetici Panosu dışındaki her şey. Onay/red yetkisi yok. |
| Yönetici | Murat T. | Her şey + onay/red, erişim talebi kararları, malzeme onayları |
| ÖHE Ekibi | Deniz Ç. | Yalnızca ÖHE Bütçe & Stok, KADES, ÖHE Yönlendirme, Bildirim Kutusu |

## Mimari

```
src/
  data/
    types.ts     SharePoint listelerine karşılık gelen tablolar (bkz. MODUL_ENVANTERI.md §6)
    repo.ts      Repository katmanı: list/get/create/update/remove/query + değişiklik geçmişi
    db.ts        Dexie (IndexedDB) şeması — yalnızca repo.ts kullanır
    seed.ts      Tohumlu demo veri üretici
    notify.ts    Bildirim kutusu + günlük tetikleyiciler (taahhüt alarmı, gündem, VVIP, gecikme)
    erisim.ts    Maskeli numara için onaylı, süreli görünürlük + erişim günlüğü
  lib/           Saf iş kuralları ve biçimlendirme (Vitest ile test edilir)
  modules/       Her modül bir ekran (liste → detay → işlem)
  ui/            Ortak bileşenler
```

Ekranlar Dexie'ye doğrudan erişmez. Canlıya geçişte `DataSource` arayüzünü uygulayan bir HTTP kaynağı yazılıp `setDataSource()` ile takılır. Gereken uç noktalar `../MODUL_ENVANTERI.md` §9'dadır.
