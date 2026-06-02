import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '@/lib/user-preferences';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah
 * @param value - number to format
 * @param compact - use compact notation (e.g. 1,2 Jt)
 */
export function formatRupiah(
  value: number,
  compact = false,
  preferences?: Pick<UserPreferences, 'number_format' | 'show_decimal_places'>,
): string {
  const locale = preferences?.number_format ?? DEFAULT_USER_PREFERENCES.number_format;

  if (compact) {
    const decimalSeparator = locale === 'en-US' ? '.' : ',';
    if (Math.abs(value) >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', decimalSeparator)} M`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1).replace('.', decimalSeparator)} Jt`;
    }
    if (Math.abs(value) >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(0)} Rb`;
    }
  }

  const fractionDigits = preferences?.show_decimal_places ? 2 : 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNumber(
  value: number,
  preferences?: Pick<UserPreferences, 'number_format' | 'show_decimal_places'>,
): string {
  const locale = preferences?.number_format ?? DEFAULT_USER_PREFERENCES.number_format;
  const fractionDigits = preferences?.show_decimal_places ? 2 : 0;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function getRupiahSpreadsheetFormat(
  preferences?: Pick<UserPreferences, 'number_format' | 'show_decimal_places'>,
): string {
  const hasDecimal = preferences?.show_decimal_places ?? false;

  if (preferences?.number_format === 'en-US') {
    return hasDecimal
      ? '"Rp"#,##0.00;[Red]-"Rp"#,##0.00'
      : '"Rp"#,##0;[Red]-"Rp"#,##0';
  }

  return hasDecimal
    ? '"Rp"#.##0,00;[Red]-"Rp"#.##0,00'
    : '"Rp"#.##0;[Red]-"Rp"#.##0';
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
export function formatTanggal(
  date: string,
  fmt = 'd MMMM yyyy',
  preferences?: Pick<UserPreferences, 'date_format'>,
): string {
  try {
    const isEnglish = preferences?.date_format === 'en-US';
    return format(parseISO(date), localizeDatePattern(fmt, isEnglish), {
      locale: isEnglish ? enUS : idLocale,
    });
  } catch {
    return date;
  }
}

function localizeDatePattern(fmt: string, isEnglish: boolean) {
  if (!isEnglish) return fmt;

  const patternMap: Record<string, string> = {
    'd MMMM yyyy': 'MMMM d, yyyy',
    'd MMM yyyy': 'MMM d, yyyy',
    'dd MMM yyyy': 'MMM dd, yyyy',
    'dd MMM yy': 'MMM dd, yy',
    'dd MMM': 'MMM dd',
    'EEEE, dd MMM yyyy': 'EEEE, MMM dd, yyyy',
  };

  return patternMap[fmt] ?? fmt;
}

export function normalizeTimeValue(value?: string | null): string {
  if (!value) return '';

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatWaktu(
  value?: string | null,
  preferences?: Pick<UserPreferences, 'time_format'>,
): string {
  const normalized = normalizeTimeValue(value);
  if (!normalized) return '';

  if (preferences?.time_format !== '12h') {
    return normalized;
  }

  const [hoursPart, minutes] = normalized.split(':');
  const hours = Number(hoursPart);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${String(hour12).padStart(2, '0')}:${minutes} ${period}`;
}

export function toTwelveHourTimeParts(value?: string | null) {
  const normalized = normalizeTimeValue(value) || '00:00';
  const [hoursPart, minutes] = normalized.split(':');
  const hours = Number(hoursPart);

  return {
    hour: String(hours % 12 || 12),
    minute: minutes,
    period: hours >= 12 ? 'PM' : 'AM',
  } as const;
}

export function fromTwelveHourTimeParts(
  hour: string,
  minute: string,
  period: 'AM' | 'PM',
): string {
  let hours = Number(hour);
  const minutes = Number(minute);

  if (!Number.isFinite(hours) || hours < 1 || hours > 12) {
    hours = 12;
  }

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function todayISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get current time in HH:mm format
 */
export function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}
