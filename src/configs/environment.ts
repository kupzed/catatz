export const environment = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // AI - Gemini
  aiDriver: process.env.AI_DRIVER || "",
  aiBaseUrl: process.env.AI_BASE_URL || "",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "",

  // App
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CatatZ",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  allowedDevOrigins: Array.from(
    new Set([
      new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host,
      ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ??
        []),
    ])
  ).filter(Boolean),

  // Node Env
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
