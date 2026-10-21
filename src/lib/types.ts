export type FieldType = "number" | "rating" | "text";

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface Habit {
  id: string;
  name: string;
  slug: string;
  field_definitions: FieldDefinition[];
}

export interface Entry {
  id: string;
  habit_id: string;
  date: string;
  values: Record<string, number | string>;
  notes: string | null;
  done: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DayCell {
  done: boolean;
  values: Record<string, number | string>;
}