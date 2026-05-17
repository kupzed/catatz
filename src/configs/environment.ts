const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isDevelopment = nodeEnv === "development";

function requiredPublicEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

function publicEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function appUrlEnv(): string {
  if (isProduction) {
    return process.env.NEXT_PUBLIC_APP_URL || requiredPublicEnv("NEXT_PUBLIC_APP_URL");
  }

  return process.env.NEXT_PUBLIC_APP_URL || publicEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
}

function normalizeUrl(name: string, value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Invalid URL in environment variable ${name}: ${value}`);
  }
}

const appUrl = normalizeUrl(
  "NEXT_PUBLIC_APP_URL",
  appUrlEnv(),
);

function createAllowedDevOrigins() {
  if (!isDevelopment) {
    return [];
  }

  return Array.from(
    new Set([
      new URL(appUrl).host,
      ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ??
        []),
    ]),
  ).filter(Boolean);
}

export const environment = {
  // Supabase public browser-safe configuration
  supabaseUrl: normalizeUrl(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL || requiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
  ),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || requiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // App public browser-safe configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || publicEnv("NEXT_PUBLIC_APP_NAME", "CatatZ"),
  appUrl,
  allowedDevOrigins: createAllowedDevOrigins(),

  // Node Env
  nodeEnv,
  isProduction,
  isDevelopment,
};
