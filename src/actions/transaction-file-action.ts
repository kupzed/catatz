"use server";

import { createClient } from "@/configs/supabase/server";
import {
  parseTransactionFile,
  validateTransactionFile,
} from "@/lib/transaction-file-parser";
import type { ActionResult } from "@/types/general";
import type { FileAutoFillResult } from "@/types/transaction-parser";
import { getActionLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";

function isSoftParserError(message: string) {
  return (
    message.startsWith("Gagal") ||
    message.startsWith("Terjadi") ||
    message.startsWith("Layanan")
  );
}

export async function processTransactionFile(
  formData: FormData,
): Promise<ActionResult<FileAutoFillResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { success: false, error: dict.errors.unauthenticated };
  }

  const value = formData.get("file");
  if (!(value instanceof File)) {
    return { success: false, error: dict.actions.profile.fileNotFound };
  }

  try {
    const bytes = new Uint8Array(await value.arrayBuffer());
    const validation = validateTransactionFile(value, bytes);

    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const result = await parseTransactionFile(
      value.name,
      bytes,
      validation.mimeType,
    );

    if (
      result.transactions.length === 0 &&
      isSoftParserError(result.parse_summary)
    ) {
      return { success: false, error: result.parse_summary };
    }

    return { success: true, data: result };
  } catch {
    return {
      success: false,
      error: dict.actions.file.processError,
    };
  }
}
