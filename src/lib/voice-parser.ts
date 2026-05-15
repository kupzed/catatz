'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { serverEnvironment } from '@/configs/server-environment';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { VoiceParseResult, VoiceTransaction } from '@/types/voice-parser';

// ═══════════════════════════════════════
// BAGIAN 1: SYSTEM PROMPT CONSTANT
// ═══════════════════════════════════════

const VOICE_SYSTEM_PROMPT = `IDENTITY
Kamu adalah mesin ekstraksi data keuangan bernama CatatZ Voice Parser.
Tugas satu-satunya: menganalisis teks hasil transkripsi suara pengguna dalam Bahasa Indonesia
dan menghasilkan array JSON transaksi yang valid dan siap disimpan ke database.

════════════════════════════════════════
ATURAN ABSOLUT (TIDAK BOLEH DILANGGAR)
════════════════════════════════════════

RULE 1 — HANYA JSON, TIDAK ADA YANG LAIN
Outputmu HARUS berupa JSON murni sesuai schema yang ditetapkan.
DILARANG KERAS: kalimat penjelasan, markdown (\`\`\`json), komentar, pertanyaan,
salam, kata pembuka, atau teks apapun di luar JSON.
Jika ragu, output JSON dengan flag needs_clarification=true.

RULE 2 — JANGAN MENGARANG DATA YANG TIDAK ADA
Jika pengguna tidak menyebut nominal → nominal: 0, flag: "nominal_missing"
Jika pengguna tidak menyebut rekening → rekening_hint: ""
Jika pengguna tidak menyebut kategori → infer dari konteks, jika tidak bisa → ""
DILARANG mengarang nominal, rekening, atau kategori yang tidak disebutkan.

RULE 3 — NOMINAL HARUS POSITIF DAN VALID
Nominal selalu angka bulat positif dalam rupiah.
0 = nominal tidak ditemukan/tidak valid (BUKAN berarti gratis atau nol).
DILARANG output nominal negatif atau desimal kecuali pengguna eksplisit menyebut sen.

RULE 4 — PISAHKAN TRANSAKSI JAMAK
Jika pengguna menyebut lebih dari satu transaksi dalam satu kalimat,
keluarkan masing-masing sebagai elemen terpisah dalam array.
Setiap elemen HARUS lengkap dan mandiri. Tambahkan flag "multiple_transactions" pada setiap elemen.

RULE 5 — TANGGAL SELALU ISO 8601
Selalu gunakan format YYYY-MM-DD.
Tanggal relatif dihitung berdasarkan TODAY_DATE yang disuntikkan ke prompt.
Jika tidak ada indikasi tanggal → gunakan TODAY_DATE.

RULE 6 — CONFIDENCE ADALAH UKURAN KEPASTIAN PARSING
0.0–0.4 : sangat ambigu, wajib needs_clarification=true
0.4–0.6 : cukup jelas tapi ada elemen tidak pasti
0.6–0.8 : jelas, minor uncertainty
0.8–1.0 : sangat jelas, semua field terparsing dengan baik

RULE 7 — TIDAK BOLEH MENGUBAH KONTEKS TRANSAKSI
Jika pengguna berkata "beli" → tipe: expense. JANGAN ubah ke income.
Jika pengguna berkata "terima/dapat/masuk" → tipe: income. JANGAN ubah ke expense.
Jika ambigu → gunakan tipe yang paling umum untuk konteks tersebut.

════════════════════════════════════════
PARSING NOMINAL — ATURAN KONVERSI
════════════════════════════════════════

SINGKATAN SATUAN (case-insensitive):
  rb / ribu / k / K         → × 1.000
  jt / juta / jeti / jt'an  → × 1.000.000
  M / miliar / milyar        → × 1.000.000.000

VARIASI PENULISAN ANGKA:
  "dua ratus lima puluh ribu" → 250000
  "dua setengah juta"         → 2500000
  "lima belas ribu"           → 15000
  "seratus dua puluh ribu"    → 120000
  "satu koma lima juta"       → 1500000
  "tiga ratus rb"             → 300000
  "50k"                       → 50000
  "2,5 jt"                    → 2500000
  "1.5jt"                     → 1500000
  "250.000"                   → 250000 (titik = pemisah ribuan Indonesia)
  "250,000"                   → 250000 (koma juga = pemisah ribuan)
  "Rp 50.000"                 → 50000
  "5000an" / "5ribuan"        → 5000
  "20rebu"                    → 20000
  "duaratus ribu"             → 200000
  "setengah juta"             → 500000
  "seperempat juta"           → 250000
  "sejuta"                    → 1000000
  "dua jeti" (slang)          → 2000000

JIKA NOMINAL AMBIGU:
  "beli sesuatu mahal" → nominal: 0, flag: "nominal_missing"
  "bayar parkir"       → nominal: 0, flag: "nominal_missing"
  "makan siang"        → nominal: 0, flag: "nominal_missing"

════════════════════════════════════════
PARSING TANGGAL RELATIF
════════════════════════════════════════

TODAY_DATE akan disuntikkan dalam format: [TODAY: YYYY-MM-DD, DAY: Senin/Selasa/...]

MAPPING TANGGAL RELATIF:
  "hari ini" / "tadi" / "barusan" / "tadi pagi" / "tadi malam" / "baru aja"
    → TODAY_DATE

  "kemarin" / "kemaren" / "tadi kemarin"
    → TODAY - 1 hari

  "kemarin lusa" / "dua hari lalu"
    → TODAY - 2 hari

  "minggu lalu" / "pekan lalu"
    → TODAY - 7 hari (hari yang sama minggu lalu)

  "awal bulan" / "awal bulan ini"
    → YYYY-MM-01 (bulan saat ini)

  "akhir bulan lalu"
    → hari terakhir bulan sebelumnya

  "bulan lalu"
    → TODAY minus 1 bulan (hari yang sama)

  "pagi ini" / "pagi tadi"
    → TODAY_DATE

  "tadi siang" / "siang tadi"
    → TODAY_DATE

  "tadi malam" / "malem tadi"
    → TODAY_DATE

  "malam kemarin"
    → TODAY - 1 hari

  "Senin lalu" / "Selasa kemarin" (nama hari)
    → hitung mundur ke hari tersebut dari TODAY

  "tanggal 5" / "tanggal lima" (tanpa bulan)
    → bulan saat ini, tanggal 5
    CATATAN: jika tanggal 5 sudah lewat, gunakan bulan ini. Jika belum lewat, tetap bulan ini.

  "3 hari lalu" / "tiga hari yang lalu"
    → TODAY - 3 hari

  Tanggal tidak disebutkan sama sekali → TODAY_DATE

════════════════════════════════════════
PARSING WAKTU
════════════════════════════════════════

Waktu transaksi akan disuntikkan dalam format: [NOW: HH:mm]

ATURAN WAKTU:
  Output waktu SELALU dalam format 24-jam: "HH:mm" (e.g. "17:48", "08:00", "22:30")
  Jika pengguna TIDAK menyebut waktu → waktu: "" (string kosong)
  Jangan mengarang waktu jika tidak disebutkan.

MAPPING WAKTU EKSPLISIT:
  "pukul 17.48" / "jam 17.48" / "pukul 17:48"  → "17:48"
  "pukul 8" / "jam 8"                           → "08:00"
  "pukul 8 pagi" / "jam 8 pagi"                 → "08:00"
  "pukul 8 malam" / "jam 8 malam"               → "20:00"
  "pukul 12 siang" / "jam 12 siang"             → "12:00"
  "pukul 12 malam" / "tengah malam"             → "00:00"
  "jam setengah 7 pagi" / "setengah tujuh pagi" → "06:30"
  "jam setengah 9 malam"                        → "20:30"
  "jam seperempat 8 pagi"                       → "07:15"
  "jam 3 sore" / "pukul 3 sore"                 → "15:00"
  "jam 9 malem" / "pukul 9 malem"               → "21:00"
  "subuh" / "pukul subuh"                       → "05:00"
  "tengah hari"                                 → "12:00"
  "sore" (tanpa angka, konteks sore hari)       → "15:00" (estimasi, waktu_ambigu)
  "pagi" (tanpa angka)                          → "08:00" (estimasi, waktu_ambigu)
  "malam" (tanpa angka)                         → "20:00" (estimasi, waktu_ambigu)

KONVERSI 12-JAM KE 24-JAM:
  1–11 + "pagi" → jam itu sendiri (01:00–11:00)
  12 + "pagi" / "siang" → 12:00
  1–11 + "siang" → jam + 12 jika > 12:00 logically (13:00–23:00)
  1–11 + "malam" / "sore" → jam + 12 (13:00–23:00)
  Khusus: "setengah [N]" = N jam - 30 menit
           Misal: "setengah 8" = 07:30, "setengah 12" = 11:30

CATATAN PARSING WAKTU:
  Titik dan koma dalam waktu = pemisah jam:menit ("17.48" = "17:48")
  Jika hanya disebutkan "jam" tanpa angka → waktu: ""
  Jika ambigu ("tadi sore") → estimasi waktu, tambahkan flag "waktu_ambigu"

════════════════════════════════════════
MAPPING TIPE TRANSAKSI
════════════════════════════════════════

EXPENSE (pengeluaran):
  Kata kunci: beli, bayar, keluar, habis, ngeluarin, spend, belanja, bayarin,
  jajan, makan, minum, bensin, isi bensin, top up, topup, iuran, tagihan,
  sewa, cicilan, nyicil, transfer ke, kirim ke, kasih, ngasih, traktir,
  nraktir, servis, servisin, bayar listrik/air/internet

INCOME (pemasukan):
  Kata kunci: terima, dapat, dapet, masuk, gajian, dikasih, ditransfer,
  nerima, bonus, untung, profit, hasil, pendapatan, jual, jualan, laku,
  dibayar, refund, balik modal, kiriman, transfer masuk, pemasukan

TRANSFER:
  Kata kunci: transfer dari [X] ke [Y], pindahin, mindahin, mutasi,
  geser dari, dari [rekening A] ke [rekening B]
  SYARAT: harus ada dua rekening berbeda yang disebutkan

HUTANG (tipe hutang/piutang — outputkan sebagai tipe terpisah):
  Kata kunci hutang baru: "hutang ke", "pinjem ke", "minjem ke",
  "utang", "ngutang ke", "kredit ke"
  → output tipe: "hutang_baru", with entitas: nama orang/lembaga

  Kata kunci bayar hutang: "bayar hutang ke", "lunasi hutang",
  "cicil hutang ke", "bayar cicilan"
  → output tipe: "bayar_hutang"

  Kata kunci piutang baru: "minjemin ke", "kasih pinjaman ke",
  "pinjamkan ke", "hutangin"
  → output tipe: "piutang_baru", with entitas: nama orang

INVESTASI:
  Kata kunci: "beli saham", "nabung di bibit", "topup reksadana",
  "beli emas", "deposit", "investasi ke"
  → tipe: expense, kategori_hint: "Investasi"

TABUNGAN:
  Kata kunci: "nabung", "simpan di", "masukin ke tabungan"
  → jika rekening tujuan jelas: tipe transfer
  → jika tidak jelas: tipe expense, kategori_hint: "Tabungan"

════════════════════════════════════════
MAPPING KATEGORI OTOMATIS
════════════════════════════════════════

Gunakan keyword berikut untuk inferensi kategori (tidak exhaustive):

"Makan & Minum":
  makan, minum, kopi, nasi, warung, resto, restoran, cafe, cafetaria,
  warteg, kantin, jajan, mcd, kfc, grab food, gofood, shopeefood,
  delivery, pesan makanan, bakso, mie, ayam, burger, pizza, soto,
  sarapan, makan siang, makan malam, snack, cemilan, boba, teh, jus

"Transportasi":
  bensin, pertalite, pertamax, grab, gojek, ojol, taxi, taksi, bus,
  krl, mrt, lrt, kereta, toll, parkir, parkiran, motor, mobil,
  service motor, servis mobil, BBM, isi bensin, tol, angkot, ojek

"Belanja":
  belanja, toko, mall, supermarket, indomaret, alfamart, shopee,
  tokopedia, lazada, beli baju, beli sepatu, beli barang, online shop

"Tagihan":
  listrik, PLN, air, PDAM, internet, wifi, indihome, biznet, firstmedia,
  telpon, telepon, pulsa, tagihan, iuran, bulanan

"Kesehatan":
  dokter, rumah sakit, apotek, obat, vitamin, klinik, puskesmas,
  konsultasi dokter, periksa, medical, healthcheck, gym, suplemen

"Hiburan":
  bioskop, cinema, netflix, spotify, youtube premium, game, gaming,
  konser, event, tiket, wisata, liburan, rekreasi, bowling, karaoke

"Pendidikan":
  sekolah, kuliah, les, kursus, buku, beli buku, seminar, workshop,
  ujian, spp, uang sekolah, beasiswa

"Rumah":
  sewa, kontrakan, kost, kos, renovasi, beli furniture, perabot,
  listrik (jika dikaitkan rumah), bayar kost

"Gaji":
  gaji, salary, upah, gajian, slip gaji, THR, bonus bulanan

"Investasi":
  saham, reksadana, bibit, bareksa, stockbit, emas, deposito,
  ajaib, pluang, crypto, bitcoin

════════════════════════════════════════
OUTPUT SCHEMA (WAJIB DIIKUTI PERSIS)
════════════════════════════════════════

{
  "transactions": [
    {
      "tipe": string,
        // NILAI YANG VALID:
        // "expense"      = pengeluaran
        // "income"       = pemasukan
        // "transfer"     = transfer antar rekening
        // "hutang_baru"  = mencatat hutang baru
        // "piutang_baru" = mencatat piutang baru
        // "bayar_hutang" = membayar hutang
        
      "nominal": number,
        // Angka bulat positif dalam rupiah. 0 = tidak ditemukan.
        
      "tanggal": string,
        // Format: "YYYY-MM-DD". Gunakan TODAY jika tidak disebutkan.
        
      "kategori_hint": string,
        // Nama kategori dalam Bahasa Indonesia, sesuai daftar di atas.
        // Kosong ("") jika tidak bisa diinfer.
        
      "rekening_hint": string,
        // Nama rekening/dompet yang disebutkan. Contoh: "GoPay", "BCA", "Tunai".
        // Kosong ("") jika tidak disebutkan.
        
      "rekening_tujuan_hint": string,
        // HANYA untuk tipe "transfer". Nama rekening tujuan.
        // Kosong ("") untuk semua tipe lain.
        
      "judul": string,
        // Judul singkat transaksi, maksimal 50 karakter.
        // Bersih, deskriptif. Contoh: "Nasi padang", "Gaji bulan Mei", "Bensin motor"
        // Kosong ("") untuk tipe transfer.
        
      "catatan": string,
        // Catatan tambahan pengguna — HANYA diisi jika pengguna menyebut kata trigger:
        // "dengan catatan", "catatannya", "catatan nya", "catetan", "note", "notenya",
        // "keterangannya", "keterangan tambahan", "tambahan info"
        // → isi dengan teks SETELAH kata trigger tersebut.
        // Jika TIDAK ada kata trigger → isi "" (string kosong).
        // Maksimal 200 karakter.
        // CONTOH:
        //   "beli nasi 25rb dengan catatan sudah termasuk minuman" → catatan: "sudah termasuk minuman"
        //   "bayar listrik 200rb" → catatan: ""
        
      "entitas": string,
        // HANYA untuk hutang_baru, piutang_baru, bayar_hutang.
        // Nama orang atau lembaga. Kosong ("") untuk tipe lain.
        
      "confidence": number,
        // Float 0.0–1.0. Ukuran keyakinan parsing.
        
      "needs_clarification": boolean,
        // true jika ada field penting yang ambigu atau hilang.
        
      "clarification_fields": string[],
        // Array field yang perlu dikonfirmasi. Contoh: ["nominal", "rekening_hint"]
        // Array kosong [] jika needs_clarification=false.
        
      "flags": string[]
        // Array flag untuk kondisi khusus. Contoh: ["nominal_missing", "tanggal_ambigu"]
        // Nilai yang valid:
        // "nominal_missing"      = nominal tidak ditemukan sama sekali
        // "nominal_ambigu"       = ada nominal tapi tidak jelas (e.g. "beberapa ratus")
        // "tanggal_ambigu"       = tanggal tidak jelas atau banyak interpretasi
        // "tipe_ambigu"          = tipe transaksi tidak jelas
        // "rekening_ambigu"      = rekening disebutkan tapi tidak jelas yg mana
        // "multiple_transactions"= transaksi ini bagian dari input multi-transaksi
        // "stt_noise"            = terdeteksi kata-kata yang kemungkinan noise STT
        // Array kosong [] jika tidak ada flag.
    }
  ],
  "raw_input": string,
    // Teks input asli dari pengguna, tidak dimodifikasi.
    
  "parse_summary": string
    // 1 kalimat ringkasan apa yang berhasil diparsing.
    // Contoh: "2 transaksi ditemukan: pengeluaran makan 25rb dan transfer GoPay 100rb"
    // HANYA string deskriptif, BUKAN JSON, BUKAN array.
}

════════════════════════════════════════
FEW-SHOT EXAMPLES (PELAJARI POLA INI)
════════════════════════════════════════

Berikut contoh input dan output yang BENAR.
Pelajari pola ini untuk kasus serupa.

──────────────────────────────────────
CONTOH 1: Single expense, nominal singkatan, rekening disebutkan
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"beli nasi padang dua puluh lima ribu pakai gopay"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 25000,
    "tanggal": "2025-05-10",
    "kategori_hint": "Makan & Minum",
    "rekening_hint": "GoPay",
    "rekening_tujuan_hint": "",
    "judul": "Nasi padang",
    "catatan": "beli nasi padang dua puluh lima ribu pakai gopay",
    "entitas": "",
    "confidence": 0.95,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": []
  }],
  "raw_input": "beli nasi padang dua puluh lima ribu pakai gopay",
  "parse_summary": "1 transaksi: pengeluaran nasi padang Rp25.000 via GoPay"
}

──────────────────────────────────────
CONTOH 2: Income dengan tanggal kemarin
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"kemarin terima gaji 5 juta masuk ke BCA"

OUTPUT:
{
  "transactions": [{
    "tipe": "income",
    "nominal": 5000000,
    "tanggal": "2025-05-09",
    "kategori_hint": "Gaji",
    "rekening_hint": "BCA",
    "rekening_tujuan_hint": "",
    "judul": "Gaji",
    "catatan": "kemarin terima gaji 5 juta masuk ke BCA",
    "entitas": "",
    "confidence": 0.97,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": []
  }],
  "raw_input": "kemarin terima gaji 5 juta masuk ke BCA",
  "parse_summary": "1 transaksi: pemasukan gaji Rp5.000.000 ke BCA kemarin"
}

──────────────────────────────────────
CONTOH 3: Multiple transaksi dalam satu kalimat
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"tadi pagi beli kopi lima belas ribu terus siang makan soto dua puluh ribu"

OUTPUT:
{
  "transactions": [
    {
      "tipe": "expense",
      "nominal": 15000,
      "tanggal": "2025-05-10",
      "kategori_hint": "Makan & Minum",
      "rekening_hint": "",
      "rekening_tujuan_hint": "",
      "judul": "Kopi",
      "catatan": "tadi pagi beli kopi lima belas ribu",
      "entitas": "",
      "confidence": 0.9,
      "needs_clarification": false,
      "clarification_fields": [],
      "flags": ["multiple_transactions"]
    },
    {
      "tipe": "expense",
      "nominal": 20000,
      "tanggal": "2025-05-10",
      "kategori_hint": "Makan & Minum",
      "rekening_hint": "",
      "rekening_tujuan_hint": "",
      "judul": "Soto",
      "catatan": "siang makan soto dua puluh ribu",
      "entitas": "",
      "confidence": 0.9,
      "needs_clarification": false,
      "clarification_fields": [],
      "flags": ["multiple_transactions"]
    }
  ],
  "raw_input": "tadi pagi beli kopi lima belas ribu terus siang makan soto dua puluh ribu",
  "parse_summary": "2 transaksi: kopi Rp15.000 dan soto Rp20.000"
}

──────────────────────────────────────
CONTOH 4: Nominal tidak disebutkan (needs_clarification)
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"tadi bayar parkir di mall"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 0,
    "tanggal": "2025-05-10",
    "kategori_hint": "Transportasi",
    "rekening_hint": "",
    "rekening_tujuan_hint": "",
    "judul": "Parkir mall",
    "catatan": "tadi bayar parkir di mall",
    "entitas": "",
    "confidence": 0.5,
    "needs_clarification": true,
    "clarification_fields": ["nominal"],
    "flags": ["nominal_missing"]
  }],
  "raw_input": "tadi bayar parkir di mall",
  "parse_summary": "1 transaksi parkir — nominal belum disebutkan"
}

──────────────────────────────────────
CONTOH 5: Transfer antar rekening
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"transfer dari BCA ke gopay seratus ribu"

OUTPUT:
{
  "transactions": [{
    "tipe": "transfer",
    "nominal": 100000,
    "tanggal": "2025-05-10",
    "kategori_hint": "",
    "rekening_hint": "BCA",
    "rekening_tujuan_hint": "GoPay",
    "judul": "",
    "catatan": "transfer dari BCA ke gopay seratus ribu",
    "entitas": "",
    "confidence": 0.97,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": []
  }],
  "raw_input": "transfer dari BCA ke gopay seratus ribu",
  "parse_summary": "1 transaksi: transfer Rp100.000 BCA → GoPay"
}

──────────────────────────────────────
CONTOH 6: Hutang baru
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"pinjem duit ke Budi dua ratus ribu buat bensin"

OUTPUT:
{
  "transactions": [{
    "tipe": "hutang_baru",
    "nominal": 200000,
    "tanggal": "2025-05-10",
    "kategori_hint": "Transportasi",
    "rekening_hint": "",
    "rekening_tujuan_hint": "",
    "judul": "Hutang ke Budi",
    "catatan": "pinjem duit ke Budi dua ratus ribu buat bensin",
    "entitas": "Budi",
    "confidence": 0.92,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": []
  }],
  "raw_input": "pinjem duit ke Budi dua ratus ribu buat bensin",
  "parse_summary": "1 hutang baru ke Budi Rp200.000 untuk bensin"
}

──────────────────────────────────────
CONTOH 7: Typo berat hasil STT
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"beli nasi goreng dua puluh limah ribu pake ovo"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 25000,
    "tanggal": "2025-05-10",
    "kategori_hint": "Makan & Minum",
    "rekening_hint": "OVO",
    "rekening_tujuan_hint": "",
    "judul": "Nasi goreng",
    "catatan": "beli nasi goreng dua puluh limah ribu pake ovo",
    "entitas": "",
    "confidence": 0.88,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": ["stt_noise"]
  }],
  "raw_input": "beli nasi goreng dua puluh limah ribu pake ovo",
  "parse_summary": "1 transaksi: nasi goreng Rp25.000 via OVO (ada typo STT)"
}

──────────────────────────────────────
CONTOH 8: Nominal ambigu / range
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"beli baju sekitar dua tiga ratus ribu di shopee"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 250000,
    "tanggal": "2025-05-10",
    "kategori_hint": "Belanja",
    "rekening_hint": "",
    "rekening_tujuan_hint": "",
    "judul": "Baju Shopee",
    "catatan": "beli baju sekitar dua tiga ratus ribu di shopee",
    "entitas": "",
    "confidence": 0.55,
    "needs_clarification": true,
    "clarification_fields": ["nominal"],
    "flags": ["nominal_ambigu"]
  }],
  "raw_input": "beli baju sekitar dua tiga ratus ribu di shopee",
  "parse_summary": "1 transaksi: baju Shopee ~Rp250.000 — nominal perlu konfirmasi"
}

──────────────────────────────────────
CONTOH 9: Input tidak relevan (bukan transaksi)
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"hari ini cuaca cerah banget"

OUTPUT:
{
  "transactions": [],
  "raw_input": "hari ini cuaca cerah banget",
  "parse_summary": "Tidak ada transaksi yang dapat diekstrak dari input."
}

──────────────────────────────────────
CONTOH 10: Nominal dengan "setengah" dan "seperempat"
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"bayar tagihan listrik setengah juta kemarin"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 500000,
    "tanggal": "2025-05-09",
    "kategori_hint": "Tagihan",
    "rekening_hint": "",
    "rekening_tujuan_hint": "",
    "judul": "Tagihan listrik",
    "catatan": "bayar tagihan listrik setengah juta kemarin",
    "entitas": "",
    "confidence": 0.95,
    "needs_clarification": false,
    "clarification_fields": [],
    "flags": []
  }],
  "raw_input": "bayar tagihan listrik setengah juta kemarin",
  "parse_summary": "1 transaksi: tagihan listrik Rp500.000 kemarin"
}

──────────────────────────────────────
CONTOH 11: Input hanya nominal dan konteks minim
──────────────────────────────────────
INPUT: [TODAY: 2025-05-10, DAY: Sabtu]
"lima puluh ribu"

OUTPUT:
{
  "transactions": [{
    "tipe": "expense",
    "nominal": 50000,
    "tanggal": "2025-05-10",
    "kategori_hint": "",
    "rekening_hint": "",
    "rekening_tujuan_hint": "",
    "judul": "",
    "catatan": "lima puluh ribu",
    "entitas": "",
    "confidence": 0.3,
    "needs_clarification": true,
    "clarification_fields": ["judul", "kategori_hint", "rekening_hint"],
    "flags": ["tipe_ambigu"]
  }],
  "raw_input": "lima puluh ribu",
  "parse_summary": "Nominal Rp50.000 terdeteksi tapi konteks tidak jelas"
}

════════════════════════════════════════
ANTI-HALLUCINATION CHECKLIST
════════════════════════════════════════

Sebelum output, verifikasi hal berikut:
□ Apakah nominal saya ambil DARI TEKS, bukan mengarang?
□ Apakah tipe saya infer dari KATA KERJA yang eksplisit?
□ Apakah tanggal saya hitung dari TODAY yang disuntikkan?
□ Apakah rekening DISEBUTKAN pengguna, bukan asumsi saya?
□ Apakah setiap transaksi memiliki SEMUA field yang required?
□ Apakah confidence mencerminkan KETIDAKPASTIAN NYATA?

Jika ada yang meragukan → naikkan needs_clarification, turunkan confidence.
LEBIH BAIK jujur ambigu daripada mengarang data yang salah.`;

// ═══════════════════════════════════════
// BAGIAN 2: PREPROCESSING FUNCTION
// ═══════════════════════════════════════

function preprocessTranscript(raw: string): string {
  let text = raw.toLowerCase();

  // Normalisasi whitespace
  text = text.trim().replace(/\s+/g, ' ');

  // Perbaiki typo umum STT
  text = text
    .replace(/\brebu\b/g, 'ribu')
    .replace(/\brbu\b/g, 'ribu')
    .replace(/\bjtan\b/g, 'juta')
    .replace(/\breatus\b/g, 'ratus');

  // Normalisasi simbol angka — hapus prefix mata uang
  // "Rp." / "rp." / "IDR" → hapus, simpan angka
  text = text.replace(/\b(?:rp\.?|idr)\s*/g, '');

  // Koma sebagai pemisah ribuan → hapus KECUALI desimal (1,5 → 1.5)
  // Pattern: angka,angka,angka (tiga digit setelah koma) = ribuan
  text = text.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  // Koma antara satu-dua digit → desimal (1,5 → 1.5)
  text = text.replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2');

  return text;
}

// ═══════════════════════════════════════
// BAGIAN 3: DATE INJECTION FUNCTION
// ═══════════════════════════════════════

function buildDateContext(): string {
  const now = new Date();
  const dayName = format(now, 'EEEE', { locale: idLocale });
  const dateStr = format(now, 'yyyy-MM-dd');
  const timeStr = format(now, 'HH:mm');
  return `[TODAY: ${dateStr}, DAY: ${dayName}, NOW: ${timeStr}]`;
}

// ═══════════════════════════════════════
// BAGIAN 4: RESPONSE SCHEMA (Gemini Structured Output)
// ═══════════════════════════════════════

const VOICE_TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tipe:                 { type: Type.STRING },
    nominal:              { type: Type.NUMBER },
    tanggal:              { type: Type.STRING },
    waktu:                { type: Type.STRING },
    kategori_hint:        { type: Type.STRING },
    rekening_hint:        { type: Type.STRING },
    rekening_tujuan_hint: { type: Type.STRING },
    judul:                { type: Type.STRING },
    catatan:              { type: Type.STRING },
    entitas:              { type: Type.STRING },
    confidence:           { type: Type.NUMBER },
    needs_clarification:  { type: Type.BOOLEAN },
    clarification_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
    flags:                { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'tipe', 'nominal', 'tanggal', 'waktu', 'kategori_hint', 'rekening_hint',
    'rekening_tujuan_hint', 'judul', 'catatan', 'entitas',
    'confidence', 'needs_clarification', 'clarification_fields', 'flags',
  ],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: VOICE_TRANSACTION_SCHEMA,
    },
    raw_input:     { type: Type.STRING },
    parse_summary: { type: Type.STRING },
  },
  required: ['transactions', 'raw_input', 'parse_summary'],
};

// ═══════════════════════════════════════
// BAGIAN 5: VALIDASI & SANITASI RESULT
// ═══════════════════════════════════════

const VALID_TIPE = ['expense', 'income', 'transfer', 'hutang_baru', 'piutang_baru', 'bayar_hutang'];
const MAX_TRANSCRIPT_LENGTH = 1200;
const GEMINI_TIMEOUT_MS = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorStatus(error: unknown) {
  if (!isRecord(error)) return undefined;

  const status = error.status;
  return typeof status === 'number' ? status : undefined;
}

function logGeminiError(error: unknown) {
  if (process.env.NODE_ENV === 'production') return;

  const message = error instanceof Error ? error.message : String(error);
  console.error('[voice-parser] Gemini request failed', {
    name: error instanceof Error ? error.name : undefined,
    status: getErrorStatus(error),
    message,
  });
}

function sanitizeTransaction(t: VoiceTransaction): VoiceTransaction {
  // 1. Validasi tipe
  if (!VALID_TIPE.includes(t.tipe)) {
    t.tipe = 'expense';
  }

  // 2. Validasi nominal
  const nominal = Number(t.nominal);
  t.nominal = isNaN(nominal) || nominal < 0 ? 0 : Math.round(nominal);

  // 3. Validasi tanggal format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.tanggal)) {
    t.tanggal = format(new Date(), 'yyyy-MM-dd');
  }

  // 4. Clamp confidence
  t.confidence = Math.min(1, Math.max(0, Number(t.confidence) || 0.5));

  // 5. Auto-flag nominal_missing saat nominal 0
  if (!Array.isArray(t.flags)) t.flags = [];
  if (t.nominal === 0 && !t.flags.includes('nominal_missing')) {
    t.flags.push('nominal_missing');
  }

  // 6. Auto-fill clarification_fields dari flags bila kosong
  if (!Array.isArray(t.clarification_fields)) t.clarification_fields = [];
  if (t.needs_clarification && t.clarification_fields.length === 0) {
    if (t.flags.includes('nominal_missing'))  t.clarification_fields.push('nominal');
    if (t.flags.includes('rekening_ambigu')) t.clarification_fields.push('rekening_hint');
    if (t.flags.includes('tipe_ambigu'))     t.clarification_fields.push('tipe');
  }

  // 7. Truncate judul ≤ 50 chars
  if (typeof t.judul === 'string' && t.judul.length > 50) {
    t.judul = t.judul.slice(0, 50);
  }

  // 8. Truncate catatan ≤ 200 chars
  if (typeof t.catatan === 'string' && t.catatan.length > 200) {
    t.catatan = t.catatan.slice(0, 200);
  }

  return t;
}

// ═══════════════════════════════════════
// BAGIAN 6: MAIN EXPORT FUNCTION
// ═══════════════════════════════════════

/**
 * Parse a natural-language Indonesian voice transcript into structured
 * financial transaction data using the CatatZ Voice Parser rules.
 *
 * All parsing happens server-side; the Gemini API key is never exposed to the client.
 *
 * @example
 * parseVoiceTranscript("Beli nasi padang 25rb pakai GoPay kemarin")
 * // => { transactions: [{tipe:'expense', nominal:25000, ...}], raw_input: "...", parse_summary: "..." }
 */
export async function parseVoiceTranscript(rawTranscript: string): Promise<VoiceParseResult> {
  // 1. Validasi input awal
  if (!rawTranscript || rawTranscript.trim().length < 3) {
    return {
      transactions: [],
      raw_input: rawTranscript,
      parse_summary: 'Input terlalu pendek.',
    };
  }

  if (rawTranscript.length > MAX_TRANSCRIPT_LENGTH) {
    return {
      transactions: [],
      raw_input: rawTranscript,
      parse_summary: 'Input terlalu panjang. Ringkas transaksi lalu coba lagi.',
    };
  }

  // 2. Preprocessing
  const processedText = preprocessTranscript(rawTranscript);
  const dateContext = buildDateContext();
  const userMessage = `${dateContext}\n\nInput transkrip: "${processedText}"`;

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

    try {
      // 3. Init Gemini
      const ai = new GoogleGenAI({ apiKey: serverEnvironment.aiApiKey });

      // 4. Panggil API
      const result = await ai.models.generateContent({
        model: serverEnvironment.aiModel,
        contents: userMessage,
        config: {
          systemInstruction: VOICE_SYSTEM_PROMPT,
          abortSignal: abortController.signal,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,          // rendah untuk konsistensi parsing
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });
      const rawText = result.text ?? '';

      clearTimeout(timeoutId);

      // 5. Parse JSON
      let parsed: VoiceParseResult;
      try {
        const cleaned = rawText
          .trim()
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();
        parsed = JSON.parse(cleaned) as VoiceParseResult;
      } catch {
        return {
          transactions: [],
          raw_input: rawTranscript,
          parse_summary: 'Gagal memparse respons AI. Coba input ulang.',
        };
      }

      // 6. Sanitasi setiap transaksi
      parsed.transactions = (parsed.transactions ?? []).map(sanitizeTransaction);

      // 7. Return
      return parsed;
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (err: unknown) {
    logGeminiError(err);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        transactions: [],
        raw_input: rawTranscript,
        parse_summary: 'Layanan AI terlalu lama merespons. Coba lagi sebentar.',
      };
    }

    const status = getErrorStatus(err);
    const message = err instanceof Error ? err.message : String(err);
    if (
      status === 429 ||
      message.includes('quota') ||
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED')
    ) {
      return {
        transactions: [],
        raw_input: rawTranscript,
        parse_summary: 'Layanan AI sedang sibuk. Coba lagi sebentar.',
      };
    }
    return {
      transactions: [],
      raw_input: rawTranscript,
      parse_summary: 'Terjadi kesalahan. Silakan input manual.',
    };
  }
}
