export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "password"
  | "textarea"
  | "path"
  | "url"
  | "json"
  | "slo-list"
  | "string-list"
  | "path-list";

export type FieldGroup =
  | "Endpoint"
  | "Load"
  | "Workload"
  | "Publish / SUT"
  | "Timeouts"
  | "Advanced"
  | "Output"
  | "General";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  /** Form state key (camelCase). */
  key: string;
  /** CLI flag without leading dashes, e.g. "num-requests". Empty for positional args. */
  flag: string;
  label: string;
  description?: string;
  type: FieldType;
  group: FieldGroup;
  required?: boolean;
  /** Default value used for form init and optional "include defaults" argv. */
  defaultValue?: string | number | boolean | string[] | SloEntry[];
  options?: FieldOption[];
  /** When true, flag is emitted alone with no value (boolean switches). */
  booleanFlag?: boolean;
  /** Positional argument(s); emitted without a flag. */
  positional?: boolean;
  /** Join array values with this delimiter when emitting a single flag. */
  joinWith?: string;
  /** Hide from argv when value equals defaultValue (unless includeDefaults). */
  omitWhenDefault?: boolean;
  /** Mutually exclusive with these field keys. */
  exclusiveWith?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SloEntry {
  metric: "ttft" | "tpot" | "e2e" | "user_tps";
  value: string;
}

export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | SloEntry[]
  | null
  | undefined;

export type FormValues = Record<string, FieldValue>;

export type BinaryName =
  | "metrum-ai-bench-cli"
  | "metrum-ai-bench-cli-strategic"
  | "metrum-ai-bench-cli-mock-server";

export interface CommandDef {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Binary to invoke. */
  binary: BinaryName;
  /** Subcommand path after the binary, e.g. ["llm"] or ["sut", "init"]. Empty for standalone binaries. */
  subcommand: string[];
  /** When true, insert `--` after subcommand before flags (unified modality dispatcher). */
  useDoubleDash?: boolean;
  /** When true, `--runs` is allowed before the `--` separator. */
  supportsRuns?: boolean;
  fields: FieldDef[];
}

export interface SerializeOptions {
  /** Emit flags even when equal to schema defaultValue. Default false. */
  includeDefaults?: boolean;
  /** Override runs for modality commands that support --runs. */
  runs?: number;
}

export interface ArgvResult {
  binary: BinaryName;
  args: string[];
  /** Full shell-ish preview string. */
  preview: string;
}
