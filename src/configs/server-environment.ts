import "server-only";

const DEFAULT_AI_MODEL = "gemini-2.5-flash-lite";

function requiredServerEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export const serverEnvironment = {
  aiApiKey: requiredServerEnv("AI_API_KEY"),
  aiModel: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
};
