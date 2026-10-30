'use server';

import { createClient } from '@/configs/supabase/server';
import { parseVoiceTranscript } from '@/lib/voice-parser';
import type { ActionResult } from '@/types/general';
import type { VoiceParseResult } from '@/types/voice-parser';
import { getActionLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';

/**
 * Server Action wrapper for parseVoiceTranscript.
 * Called by VoiceInputButton — keeps the Gemini API key server-side.
 */
export async function processVoiceInput(
  rawTranscript: string,
): Promise<ActionResult<VoiceParseResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return {
      success: false,
      error: dict.actions.voice.loginRequired,
    };
  }
  try {
    const result = await parseVoiceTranscript(rawTranscript);

    // Treat empty parse_summary variants as soft errors
    if (
      result.transactions.length === 0 &&
      (result.parse_summary.startsWith('Gagal') ||
        result.parse_summary.startsWith('Terjadi') ||
        result.parse_summary.startsWith('Layanan'))
    ) {
      return { success: false, error: result.parse_summary };
    }

    return { success: true, data: result };
  } catch {
    return { success: false, error: dict.actions.voice.processError };
  }
}
