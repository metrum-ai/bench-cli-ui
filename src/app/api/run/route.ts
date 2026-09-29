import { spawn } from "node:child_process";
import { NextRequest } from "next/server";
import { isAllowedBinary } from "@/lib/cli/binaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBinary(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn("which", [name]);
    let out = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      out += chunk.toString();
    });
    proc.on("close", (code) => {
      resolve(code === 0 ? out.trim() || null : null);
    });
    proc.on("error", () => resolve(null));
  });
}

export async function POST(req: NextRequest) {
  let body: { binary?: string; args?: string[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400,
    });
  }

  const binary = body.binary;
  const args = body.args ?? [];

  if (!binary || !isAllowedBinary(binary)) {
    return new Response(JSON.stringify({ error: "binary not allowed" }), {
      status: 400,
    });
  }
  if (!Array.isArray(args) || args.some((a) => typeof a !== "string")) {
    return new Response(JSON.stringify({ error: "args must be string[]" }), {
      status: 400,
    });
  }

  const resolved = await resolveBinary(binary);
  if (!resolved) {
    return new Response(
      JSON.stringify({ error: `${binary} not found on PATH` }),
      { status: 404 },
    );
  }

  const encoder = new TextEncoder();
  let child: ReturnType<typeof spawn> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      child = spawn(resolved, args, {
        env: { ...process.env, NO_BANNER: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const onChunk = (buf: Buffer) => {
        const text = buf.toString();
        for (const line of text.split(/\r?\n/)) {
          if (line.length) send("log", { line });
        }
      };

      child.stdout?.on("data", onChunk);
      child.stderr?.on("data", onChunk);

      child.on("error", (err) => {
        send("error", { message: err.message });
        controller.close();
      });

      child.on("close", (code) => {
        send("exit", { code: code ?? 1 });
        controller.close();
      });
    },
    cancel() {
      child?.kill("SIGTERM");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
