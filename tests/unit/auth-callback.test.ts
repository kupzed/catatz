import { describe, expect, it } from "vitest";
import { getCallbackOrigin } from "@/lib/auth-callback";
import { NextRequest } from "next/server";

describe("getCallbackOrigin", () => {
  it("resolves origin from x-forwarded-host and x-forwarded-proto when host is allowed", () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?code=xyz", {
      headers: {
        "x-forwarded-host": "catatz-dev.zed.ai.id",
        "x-forwarded-proto": "https",
      },
    });

    const origin = getCallbackOrigin(request, ["catatz-dev.zed.ai.id"]);
    expect(origin).toBe("https://catatz-dev.zed.ai.id");
  });

  it("resolves http://localhost:3000 when accessing locally", () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?code=xyz", {
      headers: {
        host: "localhost:3000",
      },
    });

    const origin = getCallbackOrigin(request, ["localhost:3000"]);
    expect(origin).toBe("http://localhost:3000");
  });

  it("handles host with comma separated x-forwarded-host values", () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?code=xyz", {
      headers: {
        "x-forwarded-host": "catatz-dev.zed.ai.id, 10.0.0.1",
        "x-forwarded-proto": "https",
      },
    });

    const origin = getCallbackOrigin(request, ["catatz-dev.zed.ai.id"]);
    expect(origin).toBe("https://catatz-dev.zed.ai.id");
  });

  it("falls back to request url origin when host is not in allowed origins", () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?code=xyz", {
      headers: {
        "x-forwarded-host": "malicious-site.com",
        "x-forwarded-proto": "https",
      },
    });

    const origin = getCallbackOrigin(request, ["localhost:3000"]);
    expect(origin).toBe("http://localhost:3000");
  });
});
