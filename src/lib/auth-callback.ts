import { type NextRequest } from "next/server";
import { environment } from "@/configs/environment";

export function getCallbackOrigin(
  request: NextRequest,
  allowedOrigins: string[] = environment.allowedDevOrigins,
): string {
  if (environment.isProduction) {
    return environment.appUrl;
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host =
    forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (host) {
    let appUrlHost = "";
    try {
      appUrlHost = new URL(environment.appUrl).host;
    } catch {
      // ignore
    }

    const allowedHosts = new Set(
      [appUrlHost, ...allowedOrigins]
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
    );

    if (allowedHosts.has(host.toLowerCase())) {
      const isLocalhost = host.toLowerCase().startsWith("localhost");
      const proto = isLocalhost ? "http" : forwardedProto;
      return `${proto}://${host}`;
    }
  }

  try {
    const appUrlHost = new URL(environment.appUrl).host;
    if (appUrlHost && !appUrlHost.startsWith("localhost")) {
      return environment.appUrl;
    }
  } catch {
    // ignore
  }

  return new URL(request.url).origin;
}
