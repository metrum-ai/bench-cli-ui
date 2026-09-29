import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock child_process.spawn so we never actually fork a process.
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { spawn } from "node:child_process";
import { POST } from "@/app/api/run/route";

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

function makeRequestThrowing(): NextRequest {
  return {
    json: async () => {
      throw new Error("not json");
    },
  } as unknown as NextRequest;
}

describe("POST /api/run allowlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid JSON bodies with 400", async () => {
    const res = await POST(makeRequestThrowing());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid JSON");
  });

  it("rejects missing binary with 400", async () => {
    const res = await POST(makeRequest({ args: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects empty binary with 400", async () => {
    const res = await POST(makeRequest({ binary: "", args: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects unknown binaries with 400", async () => {
    const res = await POST(makeRequest({ binary: "sh", args: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects lookalike binaries with 400", async () => {
    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli-evil", args: [] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects shell-injection style binary names with 400", async () => {
    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli; rm -rf /", args: [] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects path-style binary names with 400", async () => {
    const res = await POST(
      makeRequest({ binary: "/usr/bin/metrum-ai-bench-cli", args: [] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("binary not allowed");
  });

  it("rejects non-string args with 400", async () => {
    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli", args: [1, 2] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("args must be string[]");
  });

  it("rejects non-array args with 400", async () => {
    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli", args: "selftest" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("args must be string[]");
  });

  it("returns 404 when the allowlisted binary is not on PATH", async () => {
    // Simulate `which` exiting non-zero (binary not found).
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stdout: { on: vi.fn() },
      on: (event: string, cb: (code: number) => void) => {
        if (event === "close") cb(1);
      },
    });

    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli", args: ["selftest"] }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found on PATH");
  });

  it("accepts allowlisted binaries and streams SSE", async () => {
    // First call: `which` resolves successfully.
    // Second call: the actual child process.
    let callCount = 0;
    (spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // `which` succeeds
        return {
          stdout: {
            on: (event: string, cb: (chunk: Buffer) => void) => {
              if (event === "data") cb(Buffer.from("/usr/local/bin/metrum-ai-bench-cli\n"));
            },
          },
          on: (event: string, cb: (code: number) => void) => {
            if (event === "close") setTimeout(() => cb(0), 0);
          },
        };
      }
      // Child process mock
      const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
      return {
        stdout: {
          on: (event: string, cb: (chunk: Buffer) => void) => {
            if (event === "data") setTimeout(() => cb(Buffer.from("ok\n")), 0);
          },
        },
        stderr: { on: vi.fn() },
        on: (event: string, cb: (...args: unknown[]) => void) => {
          handlers[event] = handlers[event] ?? [];
          handlers[event].push(cb);
          if (event === "close") setTimeout(() => cb(0), 5);
        },
        kill: vi.fn(),
      };
    });

    const res = await POST(
      makeRequest({ binary: "metrum-ai-bench-cli", args: ["selftest"] }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    // Read the stream to verify SSE format
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      text += decoder.decode(value);
    }
    expect(text).toContain("event: log");
    expect(text).toContain("event: exit");
  });

  it("accepts all three allowlisted binaries", async () => {
    for (const binary of [
      "metrum-ai-bench-cli",
      "metrum-ai-bench-cli-strategic",
      "metrum-ai-bench-cli-mock-server",
    ]) {
      vi.clearAllMocks();
      let callCount = 0;
      (spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return {
            stdout: {
              on: (event: string, cb: (chunk: Buffer) => void) => {
                if (event === "data") cb(Buffer.from(`/usr/local/bin/${binary}\n`));
              },
            },
            on: (event: string, cb: (code: number) => void) => {
              if (event === "close") setTimeout(() => cb(0), 0);
            },
          };
        }
        return {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: (event: string, cb: (...args: unknown[]) => void) => {
            if (event === "close") setTimeout(() => cb(0), 0);
          },
          kill: vi.fn(),
        };
      });

      const res = await POST(makeRequest({ binary, args: [] }));
      expect(res.status).toBe(200);
    }
  });
});