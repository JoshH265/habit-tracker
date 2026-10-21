import type { FieldDefinition } from "./types";

export const RATING_DEFAULT_MIN = 1;
export const RATING_DEFAULT_MAX = 10;

export function ratingRange(def: FieldDefinition): {
  min: number;
  max: number;
} {
  return {
    min: def.min ?? RATING_DEFAULT_MIN,
    max: def.max ?? RATING_DEFAULT_MAX,
  };
}

export function ratingOptions(def: FieldDefinition): number[] {
  const { min, max } = ratingRange(def);
  const options: number[] = [];
  for (let i = min; i <= max; i += 1) options.push(i);
  return options;
}

export function fieldLabel(def: FieldDefinition): string {
  return def.unit ? `${def.label} (${def.unit})` : def.label;
}

export function formatValue(
  value: number | string,
  def: FieldDefinition
): string {
  if (typeof value === "number") {
    const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return def.unit ? `${rounded} ${def.unit}` : rounded;
  }
  return value;
}

export function formatValues(
  values: Record<string, number | string>,
  fieldDefinitions: FieldDefinition[]
): string {
  return fieldDefinitions
    .filter((def) => values[def.key] !== undefined && values[def.key] !== "")
    .map((def) => formatValue(values[def.key], def))
    .join(" · ");
}
