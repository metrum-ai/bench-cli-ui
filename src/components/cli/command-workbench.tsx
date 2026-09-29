"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldRenderer } from "@/components/cli/field-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  defaultFormValues,
  serializeCommand,
  validateRequired,
} from "@/lib/cli/argv";
import type { CommandDef, FieldGroup, FieldValue, FormValues } from "@/lib/cli/types";
import { Check, Copy, Play, Square } from "lucide-react";

const GROUP_ORDER: FieldGroup[] = [
  "Endpoint",
  "Workload",
  "Load",
  "Publish / SUT",
  "Timeouts",
  "Output",
  "Advanced",
  "General",
];

interface CommandWorkbenchProps {
  command: CommandDef;
}

export function CommandWorkbench({ command }: CommandWorkbenchProps) {
  const [values, setValues] = useState<FormValues>(() =>
    defaultFormValues(command),
  );
  const [includeDefaults, setIncludeDefaults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [binaryAvailable, setBinaryAvailable] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    setValues(defaultFormValues(command));
    setLogs([]);
    setExitCode(null);
  }, [command.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/binary?name=${encodeURIComponent(command.binary)}`)
      .then((r) => r.json())
      .then((data: { available: boolean }) => {
        if (!cancelled) setBinaryAvailable(Boolean(data.available));
      })
      .catch(() => {
        if (!cancelled) setBinaryAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [command.binary]);

  const serialized = useMemo(
    () => serializeCommand(command, values, { includeDefaults }),
    [command, values, includeDefaults],
  );

  const errors = useMemo(
    () => validateRequired(command, values),
    [command, values],
  );

  const groups = useMemo(() => {
    const map = new Map<FieldGroup, typeof command.fields>();
    for (const field of command.fields) {
      const list = map.get(field.group) ?? [];
      list.push(field);
      map.set(field.group, list);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      fields: map.get(g)!,
    }));
  }, [command.fields]);

  const setField = (key: string, value: FieldValue) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Normalize empty select sentinel
      if (value === "__empty") next[key] = "";
      return next;
    });
  };

  const copyPreview = async () => {
    await navigator.clipboard.writeText(serialized.preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const stopRun = () => {
    abortController?.abort();
    setAbortController(null);
    setRunning(false);
  };

  const runCommand = async () => {
    if (errors.length || !binaryAvailable) return;
    const ac = new AbortController();
    setAbortController(ac);
    setRunning(true);
    setLogs([]);
    setExitCode(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          binary: serialized.binary,
          args: serialized.args,
        }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        setLogs([`error: ${text || res.statusText}`]);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          try {
            const payload = JSON.parse(data) as {
              line?: string;
              code?: number;
              message?: string;
            };
            if (event === "log" && payload.line !== undefined) {
              setLogs((prev) => [...prev, payload.line!]);
            } else if (event === "exit") {
              setExitCode(payload.code ?? null);
            } else if (event === "error") {
              setLogs((prev) => [
                ...prev,
                `error: ${payload.message ?? "unknown"}`,
              ]);
            }
          } catch {
            setLogs((prev) => [...prev, data]);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setLogs((prev) => [...prev, `error: ${(err as Error).message}`]);
      }
    } finally {
      setRunning(false);
      setAbortController(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{command.title}</h1>
          <Badge variant="secondary" className="font-mono text-xs">
            {command.binary}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{command.description}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="space-y-4">
          {groups.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No options</CardTitle>
                <CardDescription>
                  This command takes no flags. Use Run or copy the preview.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            groups.map(({ group, fields }) => (
              <Card key={group}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className={
                        field.type === "textarea" ||
                        field.type === "json" ||
                        field.type === "slo-list" ||
                        field.type === "string-list" ||
                        field.type === "path-list"
                          ? "sm:col-span-2"
                          : undefined
                      }
                    >
                      <FieldRenderer
                        field={field}
                        value={values[field.key]}
                        onChange={(v) => setField(field.key, v)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Command preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-defaults"
                    checked={includeDefaults}
                    onCheckedChange={setIncludeDefaults}
                  />
                  <Label htmlFor="include-defaults" className="text-xs">
                    Include defaults
                  </Label>
                </div>
              </div>
              <CardDescription>
                Empty optionals are omitted. API keys stay in the local process only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="max-h-64 overflow-auto rounded-lg bg-black/60 p-3 font-mono text-xs leading-relaxed text-zinc-100">
                {serialized.preview}
              </pre>
              {errors.length > 0 ? (
                <ul className="space-y-1 text-xs text-metrum-pink">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyPreview}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {running ? (
                  <Button type="button" variant="destructive" onClick={stopRun}>
                    <Square className="size-4" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={runCommand}
                    disabled={
                      errors.length > 0 ||
                      binaryAvailable === false ||
                      binaryAvailable === null
                    }
                  >
                    <Play className="size-4" />
                    Run
                  </Button>
                )}
              </div>
              {binaryAvailable === false ? (
                <p className="text-xs text-muted-foreground">
                  `{command.binary}` not found on PATH. Preview and copy still work.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Run output</CardTitle>
              {exitCode !== null ? (
                <CardDescription>Exit code {exitCode}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded-lg bg-black/60 p-3 font-mono text-xs leading-relaxed text-zinc-300">
                {logs.length ? logs.join("\n") : "No output yet."}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
      <Separator />
    </div>
  );
}
