import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah
 * @param value - number to format
 * @param compact - use compact notation (e.g. 1,2 Jt)
 */
export function formatRupiah(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
    }
    if (Math.abs(value) >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(0)} Rb`;
    }
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse a string like "1.500.000" or "1500000" to a number
 */
export function parseNominal(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Format date string (ISO or YYYY-MM-DD) to a readable Indonesian format
 */
export function formatTanggal(date: string, fmt = 'd MMMM yyyy'): string {
  try {
    return format(parseISO(date), fmt, { locale: idLocale });
  } catch {
    return date;
  }
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function todayISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}

/**
 * Generate WhatsApp reminder URL for hutang
 */
export function waReminderUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const intl = cleaned.startsWith('0') ? `62${cleaned.slice(1)}` : cleaned;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
