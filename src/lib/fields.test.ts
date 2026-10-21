import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "./types";
import {
  fieldLabel,
  formatValue,
  formatValues,
  ratingOptions,
  ratingRange,
} from "./fields";

const hours: FieldDefinition = {
  key: "hours",
  label: "Hours slept",
  type: "number",
  min: 0,
  max: 24,
  step: 0.5,
};

const quality: FieldDefinition = {
  key: "quality",
  label: "Quality",
  type: "rating",
  min: 1,
  max: 10,
};

const weight: FieldDefinition = {
  key: "weight",
  label: "Weight",
  type: "number",
  min: 0,
  max: 500,
  step: 0.1,
  unit: "kg",
};

describe("ratingRange", () => {
  it("uses the definition's own range", () => {
    expect(ratingRange(quality)).toEqual({ min: 1, max: 10 });
  });

  it("falls back to a 1-10 scale", () => {
    expect(ratingRange({ key: "k", label: "K", type: "rating" })).toEqual({
      min: 1,
      max: 10,
    });
  });
});

describe("ratingOptions", () => {
  it("produces every step of the range", () => {
    const options = ratingOptions(quality);
    expect(options).toHaveLength(10);
    expect(options[0]).toBe(1);
    expect(options.at(-1)).toBe(10);
  });
});

describe("fieldLabel", () => {
  it("appends the unit", () => {
    expect(fieldLabel(weight)).toBe("Weight (kg)");
  });

  it("leaves unitless fields alone", () => {
    expect(fieldLabel(hours)).toBe("Hours slept");
  });
});

describe("formatValue", () => {
  it("keeps whole numbers whole and adds the unit", () => {
    expect(formatValue(78, weight)).toBe("78 kg");
  });

  it("keeps one decimal", () => {
    expect(formatValue(78.2, weight)).toBe("78.2 kg");
    expect(formatValue(7.5, hours)).toBe("7.5");
  });
});

describe("formatValues", () => {
  it("summarises every logged field", () => {
    expect(formatValues({ hours: 7.5, quality: 9 }, [hours, quality])).toBe(
      "7.5 · 9"
    );
  });

  it("skips fields with no value", () => {
    expect(formatValues({ hours: 7.5 }, [hours, quality])).toBe("7.5");
  });

  it("returns an empty string for an empty entry", () => {
    expect(formatValues({}, [hours, quality])).toBe("");
  });
});
