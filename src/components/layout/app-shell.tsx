"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMANDS, NAV_GROUPS } from "@/lib/cli/registry";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="metrum-gradient-bar" aria-hidden />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/metrum_logo_white_new.png"
              alt="Metrum AI"
              width={140}
              height={32}
              className="h-7 w-auto"
              priority
            />
            <span className="hidden text-sm font-medium text-zinc-300 sm:inline">
              Bench CLI
            </span>
          </Link>
          <a
            href="https://github.com/metrum-ai/bench-cli"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 transition hover:text-white"
          >
            bench-cli docs
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-0 md:gap-6">
        <aside className="hidden w-56 shrink-0 border-r border-white/10 md:block">
          <nav className="sticky top-14 max-h-[calc(100vh-3.5rem)] space-y-6 overflow-y-auto p-4">
            <Link
              href="/"
              className={cn(
                "block rounded-md px-2 py-1.5 text-sm transition",
                pathname === "/"
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              Overview
            </Link>
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.title}
                </p>
                {group.ids.map((id) => {
                  const cmd = COMMANDS.find((c) => c.id === id);
                  if (!cmd) return null;
                  const active = pathname === cmd.href;
                  return (
                    <Link
                      key={cmd.id}
                      href={cmd.href}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-sm transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {cmd.title}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 md:px-6">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {COMMANDS.map((cmd) => (
              <Link
                key={cmd.id}
                href={cmd.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs",
                  pathname === cmd.href
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 text-zinc-400",
                )}
              >
                {cmd.title}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
