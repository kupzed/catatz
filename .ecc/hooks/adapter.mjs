import { handleHook } from "./core.mjs";

async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

export async function runAdapter(harness) {
  const input = await readInput();
  const result = handleHook({ harness, input });
  const eventName = String(input.hook_event_name ?? "");

  if (eventName === "PreToolUse" && result.blocked) {
    writeJson({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: result.reason,
      },
    });
    return;
  }

  if (eventName === "PostToolUse" && result.warnings?.length) {
    const message = result.warnings.join("\n");
    writeJson({
      systemMessage: message,
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: message,
      },
    });
    return;
  }

  if (eventName === "Stop") {
    const verificationFailed = result.verification?.status === "failed";
    writeJson({
      continue: true,
      ...(verificationFailed
        ? {
            systemMessage:
              "CatatZ quick verification failed. Review npm run verify:quick before finishing.",
          }
        : {}),
    });
  }
}
