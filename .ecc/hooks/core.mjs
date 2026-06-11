import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MAX_SESSION_FILES = 100;
const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SCANNED_FILE_SIZE = 256 * 1024;
const QUICK_VERIFY_TIMEOUT_MS = 60_000;
const GENERATED_DELETE_TARGETS = new Set([
  ".next",
  "coverage",
  "playwright-report",
  "test-results",
  "node_modules/.cache",
]);

function textFromToolInput(input) {
  const toolInput = input?.tool_input;
  if (!toolInput || typeof toolInput !== "object") return "";

  return [toolInput.command, toolInput.patch, toolInput.file_path, toolInput.path]
    .filter((value) => typeof value === "string")
    .join("\n");
}

function mentionsProtectedEnv(text) {
  const withoutExample = text.replaceAll(".env.example", "");
  return /(^|[\s/"'])\.env(?:\.[A-Za-z0-9_-]+)?(?=$|[\s/"'])/m.test(
    withoutExample,
  );
}

function isEnvironmentWrite(command) {
  if (!mentionsProtectedEnv(command)) return false;

  return [
    /(?:^|\s)(?:rm|mv|cp|touch)\b[^\n;&|]*\.env/im,
    /(?:>|>>)\s*["']?[^\s"']*\.env/im,
    /(?:^|\s)tee\b[^\n;&|]*\.env/im,
    /(?:^|\s)sed\s+-[^\n;&|]*i[^\n;&|]*\.env/im,
  ].some((pattern) => pattern.test(command));
}

function isUnsafeRecursiveDelete(command) {
  return command.split(/[;&|]+/).some((segment) => {
    const tokens = segment.trim().split(/\s+/);
    const rmIndex = tokens.findIndex((token) => token === "rm");
    if (rmIndex < 0) return false;

    const argumentsAfterRm = tokens.slice(rmIndex + 1);
    const flags = argumentsAfterRm.filter((token) => token.startsWith("-"));
    const hasRecursive = flags.some(
      (flag) => flag === "--recursive" || /^-[^-]*r/.test(flag),
    );
    const hasForce = flags.some(
      (flag) => flag === "--force" || /^-[^-]*f/.test(flag),
    );
    if (!hasRecursive || !hasForce) return false;

    const targets = argumentsAfterRm
      .filter((token) => !token.startsWith("-"))
      .map((target) => target.replace(/^['"]|['"]$/g, "").replace(/\/$/, ""));

    return targets.length === 0 || targets.some(
      (target) => !GENERATED_DELETE_TARGETS.has(target),
    );
  });
}

export function evaluatePreToolUse(input) {
  const toolName = String(input?.tool_name ?? "");
  const text = textFromToolInput(input);

  if (/^(?:apply_patch|Edit|Write|MultiEdit)$/i.test(toolName) && mentionsProtectedEnv(text)) {
    return {
      blocked: true,
      reason: "Editing local .env files is blocked. Update .env.example with placeholders instead.",
    };
  }

  if (!/^Bash$/i.test(toolName)) return { blocked: false };

  const checks = [
    {
      pattern: /\bgit\s+reset\s+--hard\b/i,
      reason: "Destructive git reset is blocked by the CatatZ repository policy.",
    },
    {
      pattern: /\bgit\s+clean\s+-[^\s]*f/i,
      reason: "Destructive git clean is blocked by the CatatZ repository policy.",
    },
    {
      pattern: /\bgit\s+(?:checkout|restore)\b[^\n;&|]*--\s+(?:\.|\*|['"]?\/)/i,
      reason: "Bulk git restore/checkout is blocked. Restore an explicit reviewed file instead.",
    },
    {
      pattern: /\bfind\b[^\n;&|]*\s-delete\b/i,
      reason: "Mass deletion through find -delete is blocked.",
    },
    {
      pattern: /\bsupabase\s+db\s+(?:reset|push)\b/i,
      reason: "Linked Supabase database mutation is blocked. Use a reviewed migration against a test project.",
    },
    {
      pattern: /\bsupabase\s+migration\s+(?:up|repair)\b[^\n;&|]*--linked/i,
      reason: "Linked Supabase migration execution is blocked by the project hook.",
    },
    {
      pattern: /\b(?:DROP\s+(?:DATABASE|SCHEMA|TABLE)|TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM\s+[^;]+(?:;|$))/i,
      reason: "Potentially destructive SQL is blocked. Apply reviewed migrations only to a dedicated test database.",
    },
    {
      pattern: /\bvercel\s+env\b[^\n;&|]*\bproduction\b/i,
      reason: "Production credential changes are blocked from agent hooks.",
    },
    {
      pattern: /\bsupabase\s+link\b/i,
      reason: "Supabase project linking requires explicit manual review.",
    },
  ];

  for (const check of checks) {
    if (check.pattern.test(text)) {
      return { blocked: true, reason: check.reason };
    }
  }

  if (isUnsafeRecursiveDelete(text)) {
    return {
      blocked: true,
      reason: "Recursive forced deletion is limited to known generated directories.",
    };
  }

  if (isEnvironmentWrite(text)) {
    return {
      blocked: true,
      reason: "Writing or deleting local .env files is blocked.",
    };
  }

  if (
    /\b(?:SUPABASE_SERVICE_ROLE_KEY|AI_API_KEY|DATABASE_URL)\s*=\s*(?!\$|['"]?\$\{)[^\s;&|]+/i.test(
      text,
    )
  ) {
    return {
      blocked: true,
      reason: "Passing production-style credentials inline is blocked. Use the local secret store manually.",
    };
  }

  return { blocked: false };
}

export function findContentWarnings(entries) {
  const warnings = [];

  for (const entry of entries) {
    const content = String(entry.content ?? "");
    const filePath = String(entry.path ?? "unknown");
    const hasLikelySecret = [
      /\bsk-(?:(?:live|prod|test|proj)-)?[-_A-Za-z0-9]{10,}\b/,
      /\bAIza[0-9A-Za-z_-]{20,}\b/,
      /\bsb_secret_[0-9A-Za-z_-]{12,}\b/,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?(?!your|example|placeholder|\$\{)[^\s"']+/i,
    ].some((pattern) => pattern.test(content));

    if (hasLikelySecret) {
      warnings.push(`Possible hardcoded secret in ${filePath}`);
    }

    if (/\bconsole\.log\s*\(/.test(content)) {
      warnings.push(`Debug console.log found in ${filePath}`);
    }
  }

  return Array.from(new Set(warnings));
}

function hashSessionId(sessionId) {
  return createHash("sha256")
    .update(String(sessionId || "unknown-session"))
    .digest("hex")
    .slice(0, 16);
}

function sanitizeChangedFiles(files) {
  return Array.from(
    new Set(
      (files ?? [])
        .filter((file) => typeof file === "string")
        .map((file) => file.replaceAll("\\", "/").replace(/^\.\//, ""))
        .filter(
          (file) =>
            file &&
            !file.startsWith(".ecc/runtime/") &&
            !mentionsProtectedEnv(file),
        ),
    ),
  ).sort();
}

export function createSessionMetadata({
  harness,
  sessionId,
  changedFiles = [],
  verification,
  now = new Date(),
  startedAt,
  changeFingerprint,
  lastVerifiedFingerprint,
}) {
  const timestamp = now.toISOString();
  const safeVerification = verification
    ? {
        status: ["passed", "failed", "skipped"].includes(verification.status)
          ? verification.status
          : "failed",
        command: "npm run verify:quick",
        checkedAt: verification.checkedAt ?? timestamp,
        ...(Number.isInteger(verification.exitCode)
          ? { exitCode: verification.exitCode }
          : {}),
      }
    : undefined;

  return {
    version: 1,
    sessionKey: hashSessionId(sessionId),
    harness: harness === "claude" ? "claude" : "codex",
    startedAt: startedAt ?? timestamp,
    updatedAt: timestamp,
    changedFiles: sanitizeChangedFiles(changedFiles),
    ...(safeVerification ? { verification: safeVerification } : {}),
    ...(changeFingerprint ? { changeFingerprint } : {}),
    ...(lastVerifiedFingerprint ? { lastVerifiedFingerprint } : {}),
  };
}

export function shouldRunQuickVerification(files) {
  return sanitizeChangedFiles(files).some((file) =>
    /^(?:src\/|tests\/|\.ecc\/hooks\/|\.codex\/|\.claude\/|package(?:-lock)?\.json$|tsconfig\.json$|eslint\.config\.|next\.config\.|vitest\.config\.|playwright\.config\.)/.test(
      file,
    ),
  );
}

function resolveProjectRoot(input, fallbackRoot) {
  const candidates = [
    fallbackRoot,
    process.env.CODEX_PROJECT_ROOT,
    process.env.CLAUDE_PROJECT_DIR,
    input?.cwd,
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(path.join(candidate, ".git"))) {
      return path.resolve(candidate);
    }
  }

  return path.resolve(fallbackRoot || process.cwd());
}

function getChangedFiles(projectRoot) {
  const result = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: projectRoot, encoding: "utf8", timeout: 10_000 },
  );
  if (result.status !== 0) return [];

  return sanitizeChangedFiles(
    result.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3))
      .map((file) => file.split(" -> ").at(-1)),
  );
}

function scanChangedFiles(projectRoot, changedFiles) {
  const entries = [];
  const scannable = /\.(?:[cm]?[jt]sx?|json|ya?ml|toml|md)$/i;

  for (const relativePath of changedFiles) {
    if (
      !scannable.test(relativePath) ||
      relativePath === "public/sw.js" ||
      relativePath.startsWith(".ecc/runtime/")
    ) {
      continue;
    }

    const absolutePath = path.resolve(projectRoot, relativePath);
    if (!absolutePath.startsWith(`${projectRoot}${path.sep}`)) continue;

    try {
      const stats = fs.statSync(absolutePath);
      if (!stats.isFile() || stats.size > MAX_SCANNED_FILE_SIZE) continue;
      entries.push({ path: relativePath, content: fs.readFileSync(absolutePath, "utf8") });
    } catch {
      // Deleted or inaccessible files do not need content scanning.
    }
  }

  return findContentWarnings(entries);
}

function getChangeFingerprint(projectRoot, changedFiles) {
  const hash = createHash("sha256");
  for (const relativePath of sanitizeChangedFiles(changedFiles)) {
    hash.update(relativePath);
    try {
      const stats = fs.statSync(path.resolve(projectRoot, relativePath));
      hash.update(`${stats.size}:${stats.mtimeMs}`);
    } catch {
      hash.update("deleted");
    }
  }
  return hash.digest("hex").slice(0, 20);
}

function sessionFilePath(projectRoot, harness, sessionId) {
  return path.join(
    projectRoot,
    ".ecc",
    "runtime",
    "sessions",
    `${harness}-${hashSessionId(sessionId)}.json`,
  );
}

function readSession(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function pruneSessions(directory, now) {
  let files = [];
  try {
    files = fs
      .readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const absolutePath = path.join(directory, file);
        return { absolutePath, mtimeMs: fs.statSync(absolutePath).mtimeMs };
      })
      .sort((left, right) => right.mtimeMs - left.mtimeMs);
  } catch {
    return;
  }

  for (const [index, file] of files.entries()) {
    if (index >= MAX_SESSION_FILES || now.getTime() - file.mtimeMs > MAX_SESSION_AGE_MS) {
      try {
        fs.unlinkSync(file.absolutePath);
      } catch {
        // Retention cleanup is best effort and must not block development.
      }
    }
  }
}

function writeSession(filePath, metadata, now) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(metadata, null, 2)}\n`, {
    mode: 0o600,
  });
  pruneSessions(directory, now);
}

function runQuickVerification(projectRoot, now) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", "verify:quick"], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: QUICK_VERIFY_TIMEOUT_MS,
    env: process.env,
  });

  return {
    status: result.status === 0 ? "passed" : "failed",
    command: "npm run verify:quick",
    checkedAt: now.toISOString(),
    exitCode: Number.isInteger(result.status) ? result.status : 1,
  };
}

export function handleHook({ harness, input, projectRoot: fallbackRoot }) {
  const projectRoot = resolveProjectRoot(input, fallbackRoot);
  const eventName = String(input?.hook_event_name ?? "");
  const sessionId = String(input?.session_id ?? "unknown-session");
  const now = new Date();

  if (eventName === "PreToolUse") {
    return evaluatePreToolUse(input);
  }

  const filePath = sessionFilePath(projectRoot, harness, sessionId);
  const previous = readSession(filePath);
  const changedFiles = getChangedFiles(projectRoot);
  const changeFingerprint = getChangeFingerprint(projectRoot, changedFiles);
  let verification = previous?.verification;
  let lastVerifiedFingerprint = previous?.lastVerifiedFingerprint;
  const warnings =
    eventName === "PostToolUse" ? scanChangedFiles(projectRoot, changedFiles) : [];

  if (
    (eventName === "Stop" || eventName === "SessionEnd") &&
    shouldRunQuickVerification(changedFiles) &&
    lastVerifiedFingerprint !== changeFingerprint
  ) {
    verification = runQuickVerification(projectRoot, now);
    lastVerifiedFingerprint = changeFingerprint;
  }

  const metadata = createSessionMetadata({
    harness,
    sessionId,
    changedFiles,
    verification,
    now,
    startedAt: previous?.startedAt,
    changeFingerprint,
    lastVerifiedFingerprint,
  });
  writeSession(filePath, metadata, now);

  return { blocked: false, warnings, verification };
}
