import { type NextRequest } from "next/server";
import { environment } from "@/configs/environment";

function isLocalhost(host: string): boolean {
  const cleanHost = host.toLowerCase().trim();
  const hostname = cleanHost.startsWith("[")
    ? cleanHost.slice(1, cleanHost.indexOf("]"))
    : cleanHost.split(":")[0];

  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("127.") ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

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
      const isLocal = isLocalhost(host);
      const proto = isLocal ? "http" : forwardedProto;
      return `${proto}://${host}`;
    }
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return environment.appUrl;
  }
}
