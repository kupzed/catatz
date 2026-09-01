import { createClient } from "@/configs/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { createSessionRecord } from "@/actions/session-action";
import type { UserIdentity } from "@supabase/supabase-js";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/transactions";
  }

  return value;
}

function redirectWithMessage(path: string, origin: string, message: string) {
  const url = new URL(path, origin);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

function getIdentityEmail(identity: UserIdentity): string | null {
  const identityDataEmail =
    typeof identity.identity_data?.email === "string"
      ? identity.identity_data.email
      : null;
  return identityDataEmail ? identityDataEmail.toLowerCase() : null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const isGoogleLinkFlow = requestUrl.searchParams.get("flow") === "link_google";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      if (isGoogleLinkFlow) {
        const { data: identitiesData, error: identitiesError } =
          await supabase.auth.getUserIdentities();

        if (identitiesError) {
          return redirectWithMessage(next, requestUrl.origin, "google-link-failed");
        }

        const googleIdentity = identitiesData.identities.find(
          (identity) => identity.provider === "google",
        );
        const userEmail = user.email?.toLowerCase() ?? null;
        const googleEmail = googleIdentity
          ? getIdentityEmail(googleIdentity)
          : null;

        if (!googleIdentity || !userEmail || !googleEmail) {
          return redirectWithMessage(next, requestUrl.origin, "google-link-failed");
        }

        if (googleEmail !== userEmail) {
          const { error: unlinkError } =
            await supabase.auth.unlinkIdentity(googleIdentity);
          const message = unlinkError
            ? "google-link-cleanup-failed"
            : "google-link-email-mismatch";

          return redirectWithMessage(next, requestUrl.origin, message);
        }
      }

      // Smart profile sync for Google OAuth
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
      
      // Record session tracking
      await createSessionRecord(user.id);

      if (isGoogleLinkFlow) {
        return redirectWithMessage(next, requestUrl.origin, "google-linked");
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  if (isGoogleLinkFlow) {
    return redirectWithMessage(next, requestUrl.origin, "google-link-failed");
  }

  return NextResponse.redirect(
    new URL("/login?message=auth-callback-failed", requestUrl.origin),
  );
}
