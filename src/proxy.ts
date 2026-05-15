import { type NextRequest } from "next/server";
import { updateSession } from "@/configs/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets and PWA files
     */
    "/((?!_next|api|favicon.ico|manifest\\.json|offline\\.html|sw\\.js|swe-worker.*\\.js|icons/|catatz\\.(?:svg|png)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|html|js|webmanifest)$).*)",
  ],
};
