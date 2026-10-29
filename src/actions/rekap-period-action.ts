'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { RekapSettings, CustomPeriod } from '@/types/rekap';
import {
  DEFAULT_REKAP_SETTINGS,
  getRekapSettingsSchema,
  getCustomPeriodSchema,
  type RekapSettingsSchema,
  type CustomPeriodSchema,
} from '@/validations/rekap-validation';
import { getActionLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Dictionary } from '@/i18n/types';

function handleDbError(
  error: { code?: string; message?: string } | null | undefined,
  dict?: Dictionary,
): string {
  if (!error) return dict?.actions.rekap.dbError ?? 'Terjadi kesalahan pada database';

  const code = error.code ?? '';
  const message = error.message ?? '';
  const lower = message.toLowerCase();

  // Postgres 42P01: undefined_table, PostgREST PGRST205: table not found
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    lower.includes('does not exist') ||
    lower.includes('relation') ||
    lower.includes('could not find the table')
  ) {
    return (
      dict?.actions.rekap.migrationRequired ??
      'Tabel rekap belum tersedia di database. Pastikan migrasi database (014-rekap-periode.sql) sudah dijalankan.'
    );
  }

  return message || (dict?.actions.rekap.dbError ?? 'Terjadi kesalahan pada database');
}

export async function getRekapSettings(): Promise<ActionResult<RekapSettings>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('cutoff_day, akumulasi_saldo')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: {
            cutoff_day: DEFAULT_REKAP_SETTINGS.cutoff_day,
            akumulasi_saldo: DEFAULT_REKAP_SETTINGS.akumulasi_saldo,
          },
        };
      }
      return { success: false, error: handleDbError(error, dict) };
    }

    if (!data) {
      return {
        success: true,
        data: {
          cutoff_day: DEFAULT_REKAP_SETTINGS.cutoff_day,
          akumulasi_saldo: DEFAULT_REKAP_SETTINGS.akumulasi_saldo,
        },
      };
    }

    return {
      success: true,
      data: {
        cutoff_day: data.cutoff_day ?? DEFAULT_REKAP_SETTINGS.cutoff_day,
        akumulasi_saldo: data.akumulasi_saldo ?? DEFAULT_REKAP_SETTINGS.akumulasi_saldo,
      },
    };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error ? err.message : dict.actions.rekap.loadSettingsError;
    return { success: false, error: message };
  }
}

export async function updateRekapSettings(
  values: RekapSettingsSchema,
): Promise<ActionResult<RekapSettings>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    const validation = getRekapSettingsSchema(dict).safeParse(values);
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message ??
          dict.actions.rekap.invalidSettingsData,
      };
    }

    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      cutoff_day: validation.data.cutoff_day,
      akumulasi_saldo: validation.data.akumulasi_saldo,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('cutoff_day, akumulasi_saldo')
      .single();

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    revalidatePath('/reports');
    revalidatePath('/settings');

    return {
      success: true,
      data: {
        cutoff_day: data.cutoff_day,
        akumulasi_saldo: data.akumulasi_saldo,
      },
    };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error ? err.message : dict.actions.rekap.saveSettingsError;
    return { success: false, error: message };
  }
}

export async function listCustomPeriods(): Promise<ActionResult<CustomPeriod[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    const { data, error } = await supabase
      .from('rekap_periode_custom')
      .select('id, user_id, nama, tanggal_mulai, tanggal_selesai, created_at, updated_at')
      .eq('user_id', user.id)
      .order('tanggal_mulai', { ascending: false });

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    return {
      success: true,
      data: data ?? [],
    };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.loadCustomPeriodsError;
    return { success: false, error: message };
  }
}

export async function getCustomPeriod(id: string): Promise<ActionResult<CustomPeriod>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: dict.actions.rekap.invalidCustomPeriodId };
    }

    const { data, error } = await supabase
      .from('rekap_periode_custom')
      .select('id, user_id, nama, tanggal_mulai, tanggal_selesai, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    if (!data) {
      return { success: false, error: dict.actions.rekap.customPeriodNotFound };
    }

    return { success: true, data };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.loadCustomPeriodsError;
    return { success: false, error: message };
  }
}

export async function createCustomPeriod(
  values: CustomPeriodSchema,
): Promise<ActionResult<CustomPeriod>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    const validation = getCustomPeriodSchema(dict).safeParse(values);
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message ??
          dict.actions.rekap.invalidCustomPeriodData,
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('rekap_periode_custom')
      .insert({
        user_id: user.id,
        nama: validation.data.nama,
        tanggal_mulai: validation.data.tanggal_mulai,
        tanggal_selesai: validation.data.tanggal_selesai,
        created_at: now,
        updated_at: now,
      })
      .select('id, user_id, nama, tanggal_mulai, tanggal_selesai, created_at, updated_at')
      .single();

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    revalidatePath('/reports');

    return { success: true, data };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.createCustomPeriodError;
    return { success: false, error: message };
  }
}

export async function updateCustomPeriod(
  id: string,
  values: CustomPeriodSchema,
): Promise<ActionResult<CustomPeriod>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: dict.actions.rekap.invalidCustomPeriodId };
    }

    const validation = getCustomPeriodSchema(dict).safeParse(values);
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message ??
          dict.actions.rekap.invalidCustomPeriodData,
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('rekap_periode_custom')
      .update({
        nama: validation.data.nama,
        tanggal_mulai: validation.data.tanggal_mulai,
        tanggal_selesai: validation.data.tanggal_selesai,
        updated_at: now,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, nama, tanggal_mulai, tanggal_selesai, created_at, updated_at')
      .maybeSingle();

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    if (!data) {
      return {
        success: false,
        error: dict.actions.rekap.customPeriodNotFoundOrUnauthorized,
      };
    }

    revalidatePath('/reports');

    return { success: true, data };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.updateCustomPeriodError;
    return { success: false, error: message };
  }
}

export async function deleteCustomPeriod(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: dict.actions.rekap.invalidCustomPeriodId };
    }

    const { data, error } = await supabase
      .from('rekap_periode_custom')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return { success: false, error: handleDbError(error, dict) };
    }

    if (!data) {
      return {
        success: false,
        error: dict.actions.rekap.customPeriodNotFoundOrUnauthorized,
      };
    }

    revalidatePath('/reports');

    return { success: true, data: { id: data.id } };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.deleteCustomPeriodError;
    return { success: false, error: message };
  }
}
