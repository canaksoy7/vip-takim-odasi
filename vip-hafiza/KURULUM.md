# VIP Hafıza: Talep Metni v2.2 ve Atama Bildirimi kurulumu

## Dosyalar

| Dosya | Nereye |
|---|---|
| `talep_metni.html` | Talep Metni Oluşturucu sayfasındaki Betik Düzenleyicisi'ne (eskisinin yerine, tamamı). Atama Bildirimi bloğu içinde gelir. |
| `altyapi_atama_bildirimi.html` | **VVIP Altyapı Takip** sayfasına, ayrı bir Betik Düzenleyicisi web bölümü olarak. Mevcut Altyapı koduna dokunulmaz. |

## İlk kurulum (bir kez, yönetici hesabıyla)

1. İki sayfayı da güncelleyin.
2. Altyapı Takip sayfasında sol alttaki **soluk mavi noktaya** tıklayın. Nokta Taahhüt alarmının ve ÖHE noktasının yanındadır.
3. **Kur / Onar**'a basın. Bu adım şunları yapar:
   - `VVIPAtamaBildirimLog` listesini oluşturur.
   - Ekibi siteye tanıtır; SharePoint yalnızca tanıdığı kişilere mail atabilir.
   - Başlangıç anını kaydeder. **Bu andan önce açılmış kayıtlar için mail gitmez.**
4. **Test (bana)** ile örnek maile bakın. **Önizle** ile kime ne gideceğini görün.

## Ayarlar

Ayarlar `altyapi_atama_bildirimi.html` → `CFG` içindedir. Talep ekranındaki kopyada da aynısını değiştirin.

- `EKIP`: takipçi adı ve e-postası. Talep ekranındaki sorumlu listesi de buradan okunur. **Tarık = tarik.ozden** olarak eşlendi, kontrol edin.
- `HATIRLATMA_GUN: 3`: eksikler tamamlanmazsa bir kez hatırlatma gider. `0` yapılırsa hatırlatma kapanır.
- `BILGI: []`: her maile CC olarak eklenecek adresler.
- `KENDINE_DE: false`: kendinize atadığınız kayıt için mail gitmez.

## Nasıl çalışır

- Beklemede durumundaki bir kayda takipçi atanınca mail gider. Kayıt Talep ekranından ya da elle açılmış olabilir.
- Aynı kişiye giden talepler **tek mailde** toplanır. Her talebin eksik bilgileri ayrıca listelenir.
- Eksik bilgi kuralları:
  - Altyapı ekranının "künye eksik" kuralıyla aynıdır: Proje Türü, Proje ID, HP, Toplam Maliyet, Fiber Mesafesi, Adres; BF ise Çalışan DSL ve Mevcut Hız.
  - Bunlara talep yazısı (Aşama) ve harita görseli eklenir.
- Gönderimi sayfayı açık tutan herhangi bir ekip üyesinin tarayıcısı yapar. Log ve kilit sayesinde aynı mail iki kez gitmez.
- Maildeki Proje ID'ye tıklanınca Altyapı Takip `?kayit=<Id>` adresiyle açılır ve o kaydın formu kendiliğinden gelir.
- Üst yönetime sunulmuş kayıtlar (`Üst Yönetime Sunuldu - Bekliyor`) bildirilmez.
- **Tamamla** (Talep ekranı → İşlerim / Yönetim) ve maildeki Proje ID bağlantısı Altyapı Takip'te kaydı açar. Tamamlanması gereken alanlar kırmızı daire (!) ve kırmızı çerçeveyle işaretlenir; formun üstünde eksiklerin listesi çıkar. Bir alan doldurulunca o alanın işareti kalkar.
- Altyapı sayfasının adresini blok kendisi öğrenir: blok Altyapı sayfasında bir kez çalıştıktan sonra Tamamla düğmeleri oraya gider. O zamana kadar SharePoint formu açılır. Beklemek istemezseniz Talep ekranındaki `ALTYAPI_SAYFA` ayarına sayfanın tam `.aspx` adresini yazın.

## Toptan görüşü (değişti)

Toptan'ın cevabı artık **karar olarak yazılmaz**. Görüş proje proje okunur ve yalnızca kayda not edilir: Ticari değerlendirme alanına (listede varsa) ve değişiklik geçmişine. `OnayRed` ve Karar Tarihi değişmez; kararı Altyapı Takip'teki "Üst yönetime sun → Onay/Red" akışı belirler.
