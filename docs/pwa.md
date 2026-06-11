# PWA

## Status

Status: Diimplementasikan.

CatatZ memiliki manifest, app icons, iOS metadata, install UX, service worker Serwist, offline fallback, update prompt, dan offline queue transaksi.

## File Terkait

- Manifest: `public/manifest.json`
- Icons: `public/icons/*`
- Source icon: `public/catatz.svg`
- Offline fallback: `public/offline.html`
- Service worker source: `src/app/sw.ts`
- Generated service worker: `public/sw.js`
- Serwist config: `next.config.ts`
- SW registration hook: `src/lib/sw-register.ts`
- PWA components: `src/components/pwa`
- Install hook: `src/hooks/use-pwa-install.ts`
- Voice input hook: `src/hooks/use-voice-input.ts`
- Offline queue: `src/lib/offline-queue.ts`
- Icon generator: `src/scripts/generate-icons.mjs`

## Manifest

`public/manifest.json` berisi:

- `name`: CatatZ
- `short_name`: CatatZ
- `start_url`: `/transaksi`
- `scope`: `/`
- `display`: `standalone`
- `orientation`: `portrait-primary`
- `lang`: `id-ID`
- `categories`: finance, productivity
- Icon any dan maskable dari 32 sampai 512 px.
- Shortcuts untuk tambah transaksi, rekap, dan rekening.

## Metadata App

`src/app/layout.tsx` mengatur:

- `manifest: "/manifest.json"`
- `appleWebApp`
- icons dan apple touch icon
- `mobile-web-app-capable`
- `apple-mobile-web-app-*`
- `theme-color`
- `msapplication-TileImage`
- `viewportFit: "cover"`
- Apple splash screen link tags melalui `AppleSplashScreens`

## Add to Home Screen Behavior

Komponen terkait:

- `InstallBanner`
- `IOSInstallGuide`
- `IOSInstallHeaderButton`
- `UpdatePrompt`
- `PWAComponents`

Behavior:

- Browser yang mendukung `beforeinstallprompt` menyimpan event dan menampilkan install prompt.
- Dismiss install banner disimpan di localStorage key `catatz_pwa_dismissed` dengan cooldown 7 hari.
- iOS Safari memakai guide manual, bukan prompt native.
- Aplikasi mendeteksi mode standalone untuk mengetahui status installed.
- Voice Input di mode Add to Home Screen meminta izin mikrofon melalui `getUserMedia`, memvalidasi audio track masih `live`, menunggu event start/audio start sebelum menandai state mendengar, dan membersihkan stream saat stop/error/end.
- Error mikrofon seperti izin ditolak, audio capture gagal, koneksi speech gagal, atau pembatasan iOS standalone ditampilkan sebagai pesan fallback yang aman.

## Service Worker

Serwist dikonfigurasi di `next.config.ts`:

```ts
swSrc: "src/app/sw.ts"
swDest: "public/sw.js"
disable: process.env.NODE_ENV !== "production"
register: false
```

Registration manual dilakukan oleh `src/lib/sw-register.ts`.

Behavior:

- Production mendaftarkan `/sw.js` melalui `navigator.serviceWorker.register("/sw.js", { scope: "/" })`.
- Serwist hanya aktif saat `NODE_ENV=production`; development dan phase deteksi/config non-production tidak menjalankan plugin webpack Serwist.
- Development tidak mendaftarkan service worker.
- Development mencoba unregister service worker lama untuk origin saat ini dan menghapus cache `serwist-*`/`catatz-*` agar build production lama tidak memicu `bad-precaching-response` saat ngrok/local testing.

## Caching Strategy

`src/app/sw.ts`:

- POST same-origin -> `NetworkOnly`.
- GET `/api/*` same-origin -> `NetworkOnly`.
- App shell assets seperti `/icons/*`, `/_next/static/*`, `/manifest.json`, `/catatz.svg`, dan `/catatz.png` -> `CacheFirst`.
- Fallback document -> `/offline.html`.

Auth-sensitive request yang memiliki header authorization/cookie tidak diarahkan ke cache asset.

## Offline Queue

`src/lib/offline-queue.ts` memakai IndexedDB dengan database `catatz-offline-queue`.

Action yang dapat di-queue:

- `CREATE_TRANSAKSI`
- `UPDATE_TRANSAKSI`
- `DELETE_TRANSAKSI`

Queue diproses saat online oleh UI transaksi.

## Icon Generation

Command:

```bash
npm run generate-icons
```

Script:

```txt
src/scripts/generate-icons.mjs
```

Dependency:

- `sharp` sebagai dev dependency.

## Checklist Implementasi PWA

- [x] Manifest tersedia.
- [x] App icons tersedia.
- [x] Maskable icons tersedia.
- [x] Apple touch icon tersedia.
- [x] iOS metadata tersedia.
- [x] Apple splash screen link tags tersedia.
- [x] Service worker source tersedia.
- [x] Generated service worker ditargetkan ke `public/sw.js`.
- [x] Offline fallback tersedia.
- [x] Install banner tersedia.
- [x] iOS install guide tersedia.
- [x] Update prompt tersedia.
- [x] POST dan `/api/*` tidak di-cache.
- [x] Offline queue transaksi tersedia.
- [x] Voice Input memiliki permission/stream fallback untuk iOS Add to Home Screen.

## Deployment HTTPS

PWA install dan service worker production membutuhkan HTTPS. Vercel production sudah menyediakan HTTPS secara default.

Untuk local development, service worker dinonaktifkan di development mode dan hook registration membersihkan service worker lama. Gunakan build production untuk validasi PWA lengkap.
