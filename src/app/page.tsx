import Link from "next/link";
import { COMMANDS, NAV_GROUPS } from "@/lib/cli/registry";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-metrum-pink">
          Metrum AI Bench
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Operator console for{" "}
          <span className="bg-gradient-to-r from-[#FF3132] via-[#EE0089] to-[#465CDA] bg-clip-text text-transparent">
            bench-cli
          </span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Configure every metrum-ai-bench-cli 1.5.1 command with typed defaults,
          live argv preview, and optional local Run when the binary is on PATH.
          Serve this UI with{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            npm run dev
          </code>{" "}
          on{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            0.0.0.0:23456
          </code>
          .
        </p>
      </section>

      {NAV_GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {group.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.ids.map((id) => {
              const cmd = COMMANDS.find((c) => c.id === id);
              if (!cmd) return null;
              return (
                <Link key={cmd.id} href={cmd.href}>
                  <Card className="h-full transition hover:border-white/25 hover:bg-white/[0.03]">
                    <CardHeader>
                      <CardTitle className="text-base">{cmd.title}</CardTitle>
                      <CardDescription>{cmd.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
