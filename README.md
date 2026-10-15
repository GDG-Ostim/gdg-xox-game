# GDG on Campus OSTİM Teknik — XOX

Basit, şık ve mobil uyumlu bir XOX (Tic-Tac-Toe) oyunu. GDG renk paleti ve maskotuyla tasarlandı.

## Özellikler
- İki kişilik mod (yerel, aynı ekrandan)
- Yapay zekâya karşı mod (basit kural tabanlı AI: kazanma/blok/merkez/köşe)
- Zar atma mini oyunu ile ilk hamleyi kimin yapacağının belirlenmesi
- Kazanan animasyonlu/konfetili ekranda gösterilir
- Full responsive, mobil öncelikli tasarım

## Yerelde Çalıştırma
Herhangi bir derleme adımı gerekmez, saf HTML/CSS/JS.
```
npx serve .
```
veya `index.html` dosyasını doğrudan tarayıcıda açabilirsiniz.

## Vercel'e Deploy
1. Bu klasörü bir GitHub reposuna yükleyin (ya da doğrudan Vercel CLI ile).
2. Vercel CLI ile:
```
npm i -g vercel
vercel
```
3. Framework olarak "Other" / statik site seçilmesi yeterli — build komutu veya output dizini belirtmenize gerek yok (`index.html` kökte).

## Dosyalar
- `index.html` — sayfa yapısı / ekranlar
- `style.css` — tüm görsel tasarım, GDG renk paleti, responsive kurallar
- `script.js` — oyun mantığı, zar mini oyunu, basit AI
- `assets/mascot.png` — maskot görseli

## Revizyon Notları
Bu ilk sürüm. Renk, animasyon hızı, AI zorluğu, metinler kolayca düzenlenebilir — `style.css` üstündeki `:root` değişkenlerinden renkleri, `script.js` içindeki `aiMove()` fonksiyonundan AI davranışını değiştirebilirsiniz.
