import { describe, expect, it } from "vitest";
import {
  currentMonth,
  formatAvg,
  isValidISODate,
  leadingBlanksFor,
  monthDays,
  monthLabel,
  shiftMonth,
} from "./month";

describe("shiftMonth", () => {
  it("moves forward and backward", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10");
    expect(shiftMonth("2026-09", -1)).toBe("2026-08");
  });

  it("crosses year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("monthDays", () => {
  it("lists every day of the month", () => {
    const days = monthDays("2026-09");
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("2026-09-01");
    expect(days.at(-1)).toBe("2026-09-30");
  });

  it("handles leap years", () => {
    expect(monthDays("2024-02")).toHaveLength(29);
    expect(monthDays("2023-02")).toHaveLength(28);
  });
});

describe("leadingBlanksFor", () => {
  it("offsets a month starting on Tuesday by one Monday-first blank", () => {
    expect(leadingBlanksFor("2026-09")).toBe(1);
  });

  it("offsets a month starting on Monday by zero blanks", () => {
    expect(leadingBlanksFor("2026-06")).toBe(0);
  });

  it("offsets a month starting on Sunday by six blanks", () => {
    expect(leadingBlanksFor("2026-11")).toBe(6);
  });
});

describe("monthLabel", () => {
  it("formats the month and year", () => {
    expect(monthLabel("2026-09")).toBe("September 2026");
  });
});

describe("formatAvg", () => {
  it("renders a dash for missing data", () => {
    expect(formatAvg(null)).toBe("—");
  });

  it("keeps whole numbers whole", () => {
    expect(formatAvg(8)).toBe("8");
  });

  it("rounds to one decimal", () => {
    expect(formatAvg(7.5)).toBe("7.5");
  });
});

describe("isValidISODate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidISODate("2026-09-01")).toBe(true);
    expect(isValidISODate("2024-02-29")).toBe(true);
  });

  it("rejects malformed shapes", () => {
    expect(isValidISODate("2026-9-1")).toBe(false);
    expect(isValidISODate("")).toBe(false);
    expect(isValidISODate("not-a-date")).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2023-02-29")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
  });
});

describe("currentMonth", () => {
  it("returns a YYYY-MM string", () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
