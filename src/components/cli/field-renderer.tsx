"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldDef, FieldValue, SloEntry } from "@/lib/cli/types";
import { Plus, Trash2 } from "lucide-react";

interface FieldRendererProps {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: FieldRendererProps) {
  const id = `field-${field.key}`;

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor={id}>{field.label}</Label>
          {field.description ? (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          ) : null}
        </div>
        <Switch
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <span className="text-metrum-pink"> *</span> : null}
      </Label>
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
      {renderControl(field, id, value, onChange, disabled)}
    </div>
  );
}

function renderControl(
  field: FieldDef,
  id: string,
  value: FieldValue,
  onChange: (value: FieldValue) => void,
  disabled?: boolean,
) {
  switch (field.type) {
    case "select": {
      const selectValue =
        value === "" || value === undefined || value === null
          ? "__empty"
          : String(value);
      return (
        <Select
          value={selectValue}
          onValueChange={(v) => onChange(v === "__empty" || v == null ? "" : v)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem
                key={opt.value || "__empty"}
                value={opt.value || "__empty"}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "textarea":
    case "json":
      return (
        <Textarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="min-h-24 font-mono text-sm"
        />
      );
    case "password":
      return (
        <Input
          id={id}
          type="password"
          autoComplete="off"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={value === "" || value === undefined || value === null ? "" : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange("");
              return;
            }
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : raw);
          }}
          placeholder={field.placeholder}
          disabled={disabled}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      );
    case "slo-list":
      return (
        <SloListEditor
          value={(value as SloEntry[]) ?? []}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "string-list":
    case "path-list":
      return (
        <StringListEditor
          value={(value as string[]) ?? []}
          onChange={onChange}
          disabled={disabled}
          placeholder={field.placeholder ?? "path or value"}
        />
      );
    default:
      return (
        <Input
          id={id}
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      );
  }
}

function SloListEditor({
  value,
  onChange,
  disabled,
}: {
  value: SloEntry[];
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
}) {
  const update = (next: SloEntry[]) => onChange(next);
  return (
    <div className="space-y-2">
      {value.map((entry, index) => (
        <div key={index} className="flex gap-2">
          <Select
            value={entry.metric}
            onValueChange={(metric) => {
              const next = [...value];
              next[index] = {
                ...entry,
                metric: (metric ?? "ttft") as SloEntry["metric"],
              };
              update(next);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["ttft", "tpot", "e2e", "user_tps"] as const).map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={entry.value}
            onChange={(e) => {
              const next = [...value];
              next[index] = { ...entry, value: e.target.value };
              update(next);
            }}
            placeholder="250ms or 2s"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => update(value.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => update([...value, { metric: "ttft", value: "" }])}
      >
        <Plus className="size-4" />
        Add SLO
      </Button>
    </div>
  );
}

function StringListEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string[];
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const update = (next: string[]) => onChange(next);
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...value];
              next[index] = e.target.value;
              update(next);
            }}
            placeholder={placeholder}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => update(value.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => update([...value, ""])}
      >
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
}
