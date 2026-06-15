import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(
  npmCommand,
  ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3100"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55431",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "catatz-e2e-anon-key",
      AI_API_KEY: "catatz-e2e-ai-key",
      NEXT_DIST_DIR: ".next-e2e",
    },
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
