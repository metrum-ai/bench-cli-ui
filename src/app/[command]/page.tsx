import { CommandWorkbench } from "@/components/cli/command-workbench";
import { getCommand } from "@/lib/cli/registry";
import { notFound } from "next/navigation";

export default async function CommandPage({
  params,
}: {
  params: Promise<{ command: string }>;
}) {
  const { command: slug } = await params;
  const id = slug === "sut" ? "sut-init" : slug === "mock-server" ? "mock-server" : slug;
  const command = getCommand(id);
  if (!command) notFound();
  return <CommandWorkbench command={command} />;
}
