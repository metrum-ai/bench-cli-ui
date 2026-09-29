import type {
  ArgvResult,
  CommandDef,
  FieldDef,
  FieldValue,
  FormValues,
  SerializeOptions,
  SloEntry,
} from "./types";

function isEmpty(value: FieldValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function valuesEqual(a: FieldValue, b: FieldValue | undefined): boolean {
  if (b === undefined) return false;
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function shellQuote(arg: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

function emitFlag(flag: string, value: string): string[] {
  if (!flag) return [value];
  return [`--${flag}`, value];
}

function serializeField(
  field: FieldDef,
  value: FieldValue,
  includeDefaults: boolean,
): string[] {
  if (field.type === "boolean" || field.booleanFlag) {
    const on = Boolean(value);
    if (!on) return [];
    if (
      !includeDefaults &&
      field.omitWhenDefault !== false &&
      field.defaultValue === true
    ) {
      return [];
    }
    return [`--${field.flag}`];
  }

  if (isEmpty(value)) return [];

  if (
    !includeDefaults &&
    field.omitWhenDefault !== false &&
    field.defaultValue !== undefined &&
    valuesEqual(value, field.defaultValue)
  ) {
    return [];
  }

  if (field.type === "slo-list") {
    const entries = (value as SloEntry[]).filter(
      (e) => e && e.metric && String(e.value).trim(),
    );
    return entries.flatMap((e) => [
      `--${field.flag}`,
      `${e.metric}=${String(e.value).trim()}`,
    ]);
  }

  if (field.type === "string-list" || field.type === "path-list") {
    const items = (value as string[]).map((s) => String(s).trim()).filter(Boolean);
    if (items.length === 0) return [];
    if (field.joinWith) {
      return emitFlag(field.flag, items.join(field.joinWith));
    }
    if (field.positional) {
      return items;
    }
    return items.flatMap((item) => emitFlag(field.flag, item));
  }

  const stringValue =
    typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : String(value).trim();

  if (!stringValue) return [];

  if (field.positional) {
    return [stringValue];
  }

  return emitFlag(field.flag, stringValue);
}

/** Keys suppressed because a mutually exclusive sibling is set (schema order wins). */
function suppressedKeys(command: CommandDef, values: FormValues): Set<string> {
  const suppressed = new Set<string>();
  for (const field of command.fields) {
    if (suppressed.has(field.key)) continue;
    const value = values[field.key];
    const empty =
      field.type === "boolean" || field.booleanFlag
        ? !Boolean(value)
        : isEmpty(value);
    if (empty) continue;
    for (const other of field.exclusiveWith ?? []) {
      suppressed.add(other);
    }
  }
  return suppressed;
}

export function serializeCommand(
  command: CommandDef,
  values: FormValues,
  options: SerializeOptions = {},
): ArgvResult {
  const includeDefaults = options.includeDefaults ?? false;
  const suppressed = suppressedKeys(command, values);
  const args: string[] = [];

  if (command.subcommand.length > 0) {
    args.push(...command.subcommand);
  }

  if (command.supportsRuns) {
    const runsRaw = options.runs ?? values.runs ?? 1;
    const runs = Number(runsRaw);
    if (Number.isFinite(runs) && runs >= 1) {
      if (includeDefaults || runs !== 1) {
        args.push("--runs", String(runs));
      }
    }
  }

  if (command.useDoubleDash) {
    args.push("--");
  }

  for (const field of command.fields) {
    if (field.key === "runs") continue;
    if (suppressed.has(field.key)) continue;
    args.push(...serializeField(field, values[field.key], includeDefaults));
  }

  const preview = [command.binary, ...args.map(shellQuote)].join(" ");

  return {
    binary: command.binary,
    args,
    preview,
  };
}

export function defaultFormValues(command: CommandDef): FormValues {
  const values: FormValues = {};
  for (const field of command.fields) {
    if (field.defaultValue !== undefined) {
      values[field.key] = structuredClone(field.defaultValue) as FieldValue;
    } else if (field.type === "boolean") {
      values[field.key] = false;
    } else if (
      field.type === "slo-list" ||
      field.type === "string-list" ||
      field.type === "path-list"
    ) {
      values[field.key] = [];
    } else {
      values[field.key] = "";
    }
  }
  if (command.supportsRuns && values.runs === undefined) {
    values.runs = 1;
  }
  return values;
}

export function validateRequired(
  command: CommandDef,
  values: FormValues,
): string[] {
  const errors: string[] = [];
  const suppressed = suppressedKeys(command, values);

  // Exclusive groups: require at least one of the group
  const seenGroups = new Set<string>();
  for (const field of command.fields) {
    if (!field.required || !field.exclusiveWith?.length) continue;
    const groupKey = [field.key, ...field.exclusiveWith].sort().join("|");
    if (seenGroups.has(groupKey)) continue;
    seenGroups.add(groupKey);
    const keys = [field.key, ...field.exclusiveWith];
    const anyFilled = keys.some((k) => {
      const f = command.fields.find((x) => x.key === k);
      if (!f) return !isEmpty(values[k]);
      if (f.type === "boolean" || f.booleanFlag) return Boolean(values[k]);
      return !isEmpty(values[k]);
    });
    if (!anyFilled) {
      errors.push(`${field.label} (or alternative) is required`);
    }
  }

  for (const field of command.fields) {
    if (!field.required) continue;
    if (field.exclusiveWith?.length) continue;
    if (suppressed.has(field.key)) continue;
    if (field.type === "boolean") continue;
    if (isEmpty(values[field.key])) {
      errors.push(`${field.label} is required`);
    }
  }

  if (command.id === "imagegen") {
    if (isEmpty(values.prompt) && isEmpty(values.prompts)) {
      errors.push("Prompt or Prompts file is required");
    }
  }

  return errors;
}

export { isEmpty };
