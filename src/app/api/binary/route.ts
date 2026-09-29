import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { isAllowedBinary } from "@/lib/cli/binaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "";
  if (!isAllowedBinary(name)) {
    return NextResponse.json({ available: false, error: "not allowed" });
  }

  const available = await new Promise<boolean>((resolve) => {
    const proc = spawn("which", [name]);
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });

  return NextResponse.json({ available, name });
}
