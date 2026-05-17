import { createClient } from "@/configs/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/transaksi";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Smart profile sync for Google OAuth
      const user = data.user;
      const metadata = user.user_metadata;
      
      if (metadata) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          const updatePayload: Record<string, string> = {};
          
          // Only update if field is empty (to respect manual user changes)
          if (!profile.name && (metadata.full_name || metadata.name)) {
            updatePayload.name = metadata.full_name || metadata.name;
          }
          if (!profile.avatar_url && (metadata.avatar_url || metadata.picture)) {
            updatePayload.avatar_url = metadata.avatar_url || metadata.picture;
          }
          
          if (Object.keys(updatePayload).length > 0) {
            await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', user.id);
          }
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?message=auth-callback-failed", requestUrl.origin),
  );
}
