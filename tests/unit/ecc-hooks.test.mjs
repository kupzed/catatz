import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createSessionMetadata,
  evaluatePreToolUse,
  findContentWarnings,
  handleHook,
  pruneSessions,
  shouldRunQuickVerification,
} from "../../.ecc/hooks/core.mjs";

const temporaryDirectories = [];
const syntheticSecret = ["sk", "live", "example", "value"].join("-");
const syntheticGoogleKey = `AI${"za"}123456789012345678901234`;
const syntheticPrivateKeyMarker = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function createTemporaryRepository(verifyExitCode = 0) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "catatz-ecc-hooks-"));
  temporaryDirectories.push(directory);
  fs.writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      name: "hook-fixture",
      private: true,
      scripts: {
        "verify:quick": `node -e \"process.exit(${verifyExitCode})\"`,
      },
    }),
  );
  fs.mkdirSync(path.join(directory, "src"));
  fs.writeFileSync(path.join(directory, "src", "index.ts"), "export const value = 1;\n");
  execFileSync("git", ["init", "-q"], { cwd: directory });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: directory,
  });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: directory });
  execFileSync("git", ["add", "."], { cwd: directory });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: directory });
  return directory;
}

describe("ECC hook policy", () => {
  it("blocks destructive Git and database commands", () => {
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "git reset --hard HEAD~1" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "supabase db reset --linked" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "psql $DATABASE_URL -c 'DROP TABLE transaksi'" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "git clean -fd" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "git checkout -- ." },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "find src -type f -delete" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "supabase migration up --linked" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "supabase link --project-ref production" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "vercel env add TOKEN production" },
      }),
    ).toMatchObject({ blocked: true });
  });

  it("blocks secret file edits but allows the committed example", () => {
    expect(
      evaluatePreToolUse({
        tool_name: "apply_patch",
        tool_input: {
          command: "*** Update File: .env.local\n+AI_API_KEY=secret",
        },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "apply_patch",
        tool_input: {
          command: "*** Update File: .env.example\n+AI_API_KEY=your-key-here",
        },
      }),
    ).toEqual({ blocked: false });
  });

  it("allows read-only development commands", () => {
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "git status --short && npm run lint" },
      }),
    ).toEqual({ blocked: false });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "rm -rf .next coverage" },
      }),
    ).toEqual({ blocked: false });
    expect(evaluatePreToolUse({ tool_name: "Read", tool_input: {} })).toEqual({
      blocked: false,
    });
  });

  it("blocks unsafe deletion, env writes, and inline credentials", () => {
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "rm -rf src" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "rm -r -f docs" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "rm --recursive --force public" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "echo secret > .env.local" },
      }),
    ).toMatchObject({ blocked: true });
    expect(
      evaluatePreToolUse({
        tool_name: "Bash",
        tool_input: { command: "AI_API_KEY=literal-secret npm run dev" },
      }),
    ).toMatchObject({ blocked: true });
  });

  it("detects likely secrets and debug logs without retaining content", () => {
    expect(
      findContentWarnings([
        {
          path: "src/example.ts",
          content: `const token = "${syntheticSecret}"; console.log(token);`,
        },
      ]),
    ).toEqual([
      "Possible hardcoded secret in src/example.ts",
      "Debug console.log found in src/example.ts",
    ]);
    expect(
      findContentWarnings([
        { path: "one.ts", content: `const key = '${syntheticGoogleKey}';` },
        { path: "two.ts", content: syntheticPrivateKeyMarker },
        { path: "three.ts", content: "export const ok = true;" },
      ]),
    ).toEqual([
      "Possible hardcoded secret in one.ts",
      "Possible hardcoded secret in two.ts",
    ]);
  });

  it("stores metadata only even when hook input contains sensitive text", () => {
    const metadata = createSessionMetadata({
      harness: "codex",
      sessionId: "session-123",
      changedFiles: ["src/lib/utils.ts"],
      verification: { status: "passed", command: "npm run verify:quick" },
      unsafeInput: {
        prompt: "transfer user 998877 with sk-secret-value",
        tool_input: { command: "cat .env" },
      },
      now: new Date("2026-06-11T12:00:00.000Z"),
    });
    const serialized = JSON.stringify(metadata);

    expect(metadata).toMatchObject({
      harness: "codex",
      changedFiles: ["src/lib/utils.ts"],
      verification: { status: "passed", command: "npm run verify:quick" },
    });
    expect(serialized).not.toContain("transfer user");
    expect(serialized).not.toContain("sk-secret-value");
    expect(serialized).not.toContain("cat .env");
    expect(serialized).not.toContain("session-123");
  });

  it("normalizes invalid verification metadata", () => {
    const metadata = createSessionMetadata({
      harness: "unknown",
      sessionId: "session",
      changedFiles: ["./src/a.ts", "src/a.ts", ".env.local"],
      verification: { status: "unexpected" },
      now: new Date("2026-06-11T12:00:00.000Z"),
    });

    expect(metadata.harness).toBe("codex");
    expect(metadata.changedFiles).toEqual(["src/a.ts"]);
    expect(metadata.verification.status).toBe("failed");
  });

  it("runs quick verification only for relevant source and config changes", () => {
    expect(shouldRunQuickVerification(["src/lib/utils.ts"])).toBe(true);
    expect(shouldRunQuickVerification(["package.json"])).toBe(true);
    expect(shouldRunQuickVerification(["docs/architecture.md"])).toBe(false);
    expect(shouldRunQuickVerification([".ecc/runtime/session.json"])).toBe(false);
  });

  it("scans changed files and persists metadata without sensitive content", () => {
    const repository = createTemporaryRepository();
    fs.writeFileSync(
      path.join(repository, "src", "index.ts"),
      `export const token = "${syntheticSecret}"; console.log(token);\n`,
    );

    const result = handleHook({
      harness: "codex",
      projectRoot: repository,
      input: {
        session_id: "raw-session-id",
        hook_event_name: "PostToolUse",
        prompt: "private financial prompt",
      },
    });

    expect(result.warnings).toEqual([
      "Possible hardcoded secret in src/index.ts",
      "Debug console.log found in src/index.ts",
    ]);
    const sessionDirectory = path.join(repository, ".ecc", "runtime", "sessions");
    const sessionFile = path.join(sessionDirectory, fs.readdirSync(sessionDirectory)[0]);
    const stored = fs.readFileSync(sessionFile, "utf8");
    expect(stored).toContain("src/index.ts");
    expect(stored).not.toContain("raw-session-id");
    expect(stored).not.toContain("private financial prompt");
    expect(stored).not.toContain(syntheticSecret);
  });

  it("runs quick verification once per changed fingerprint", () => {
    const repository = createTemporaryRepository();
    fs.writeFileSync(path.join(repository, "src", "index.ts"), "export const value = 2;\n");

    const first = handleHook({
      harness: "claude",
      projectRoot: repository,
      input: { session_id: "verify-session", hook_event_name: "Stop" },
    });
    const second = handleHook({
      harness: "claude",
      projectRoot: repository,
      input: { session_id: "verify-session", hook_event_name: "Stop" },
    });

    expect(first.verification).toMatchObject({ status: "passed", exitCode: 0 });
    expect(second.verification).toMatchObject({ status: "passed", exitCode: 0 });
    const sessionDirectory = path.join(repository, ".ecc", "runtime", "sessions");
    const metadata = JSON.parse(
      fs.readFileSync(path.join(sessionDirectory, fs.readdirSync(sessionDirectory)[0]), "utf8"),
    );
    expect(metadata.lastVerifiedFingerprint).toBe(metadata.changeFingerprint);
  }, 15_000);

  it("records failed verification as a warning-only result", () => {
    const repository = createTemporaryRepository(1);
    fs.writeFileSync(path.join(repository, "src", "index.ts"), "export const value = 3;\n");

    const result = handleHook({
      harness: "codex",
      projectRoot: repository,
      input: { session_id: "failed-session", hook_event_name: "SessionEnd" },
    });

    expect(result.verification).toMatchObject({ status: "failed", exitCode: 1 });
  }, 15_000);

  it("prunes expired sessions and keeps the newest 100 files", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "catatz-ecc-retention-"));
    temporaryDirectories.push(directory);
    const now = new Date("2026-06-11T12:00:00.000Z");

    for (let index = 0; index < 102; index += 1) {
      const filePath = path.join(directory, `session-${index}.json`);
      fs.writeFileSync(filePath, "{}\n");
      const modifiedAt = new Date(now.getTime() - index * 1000);
      fs.utimesSync(filePath, modifiedAt, modifiedAt);
    }
    const expiredPath = path.join(directory, "expired.json");
    fs.writeFileSync(expiredPath, "{}\n");
    const expiredAt = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(expiredPath, expiredAt, expiredAt);

    pruneSessions(directory, now);

    expect(fs.readdirSync(directory)).toHaveLength(100);
    expect(fs.existsSync(expiredPath)).toBe(false);
  });
});
