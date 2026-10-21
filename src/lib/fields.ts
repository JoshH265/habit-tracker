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
