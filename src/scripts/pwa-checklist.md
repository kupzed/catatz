# CatatZ PWA Audit Checklist

## Pre-deployment checklist
- [ ] Lighthouse PWA score >= 90 (jalankan di Chrome DevTools)
- [ ] manifest.json valid (validasi di https://manifest-validator.appspot.com)
- [ ] Icons semua ukuran ada dan bisa diakses
- [ ] Service Worker terdaftar dan aktif
- [ ] HTTPS di production
- [ ] App bisa di-install di Chrome Android
- [ ] App bisa di-A2HS di Safari iOS 16.4+

## iOS Testing
- [ ] Tambahkan ke Home Screen -> launch dalam standalone mode
- [ ] Navigasi antar halaman tanpa browser chrome
- [ ] Back swipe gesture berfungsi
- [ ] Status bar warna sesuai (black-translucent)
- [ ] Safe area inset tidak terpotong (notch/home indicator)
- [ ] Keyboard tidak mendorong layout secara aneh
- [ ] Font size tidak auto-zoom saat focus input

## Offline Testing
- [ ] Matikan wifi -> buka app -> app shell tampil
- [ ] Navigasi antar cached page
- [ ] Tambah transaksi offline -> tersimpan di queue
- [ ] Nyalakan wifi -> transaksi sync otomatis
- [ ] /offline page tampil dengan benar

## Performance
- [ ] LCP < 2.5s (First Contentful Paint)
- [ ] FID/INP < 200ms
- [ ] CLS < 0.1
- [ ] Bundle size JS < 300KB (gzipped)
