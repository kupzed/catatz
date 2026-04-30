'use server';

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);

export type ParsedTransaksi = {
  tipe: 'income' | 'expense' | 'transfer';
  nominal: number;
  kategori_hint: string;
  rekening_hint: string;
  catatan: string;
};

const SYSTEM_INSTRUCTION = `
Anda adalah asisten pencatatan keuangan pribadi bernama CatatZ.
Tugas SATU-SATUNYA Anda adalah menganalisis teks input pengguna dan mengekstrak data transaksi keuangan dalam format JSON terstruktur.

ATURAN PENTING:
1. Kembalikan HANYA objek JSON mentah. Tanpa markdown, tanpa blok kode, tanpa penjelasan.
2. JSON harus mengikuti skema berikut TEPAT:
{
  "tipe": "(string) Salah satu dari: 'income', 'expense', atau 'transfer'",
  "nominal": "(number) Nilai nominal transaksi. Konversikan 'rb' = ribu, 'jt' = juta. Contoh: '150rb' = 150000. HANYA angka murni.",
  "kategori_hint": "(string) Petunjuk kategori berdasarkan konteks. Contoh: 'Makan & Minum', 'Transportasi', 'Gaji', dll.",
  "rekening_hint": "(string) Nama rekening/bank yang disebutkan. Contoh: 'Mandiri', 'GoPay', 'BCA', 'Tunai'. Kosongkan jika tidak disebutkan.",
  "catatan": "(string) Ringkasan singkat transaksi apa adanya dari input pengguna. Maksimal 100 karakter."
}

3. Tentukan 'tipe':
   - 'income': pemasukan (terima, dapat, gajian, transfer masuk, dll.)
   - 'expense': pengeluaran (beli, bayar, makan, nongkrong, dll.)
   - 'transfer': perpindahan dana antar rekening sendiri

4. JANGAN tambahkan kunci lain di luar skema. Gunakan string kosong "" jika data tidak ada.
`;

/**
 * Parse natural language input into a structured transaction object.
 * Mirrors the PHP AIDocumentExtractionService pattern.
 * 
 * @example
 * parseTransaksiFromText("Beli nasi padang 25rb pakai GoPay")
 * // => { tipe: 'expense', nominal: 25000, kategori_hint: 'Makan & Minum', rekening_hint: 'GoPay', catatan: 'Beli nasi padang 25rb pakai GoPay' }
 */
export async function parseTransaksiFromText(input: string): Promise<ParsedTransaksi> {
  const modelName = process.env.AI_MODEL ?? 'gemini-2.5-flash-lite';

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          tipe:           { type: SchemaType.STRING },
          nominal:        { type: SchemaType.NUMBER },
          kategori_hint:  { type: SchemaType.STRING },
          rekening_hint:  { type: SchemaType.STRING },
          catatan:        { type: SchemaType.STRING },
        },
        required: ['tipe', 'nominal', 'kategori_hint', 'rekening_hint', 'catatan'],
      },
    },
  });

  const result = await model.generateContent(input);
  const rawText = result.response.text();

  // Clean markdown code fences if any (defensive, since we use JSON mime type)
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned) as ParsedTransaksi;

  // Sanitize tipe
  if (!['income', 'expense', 'transfer'].includes(parsed.tipe)) {
    parsed.tipe = 'expense';
  }

  // Ensure nominal is a positive number
  parsed.nominal = Math.abs(Number(parsed.nominal) || 0);

  return parsed;
}
