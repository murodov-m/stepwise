import { describe, expect, it, vi } from "vitest";
import { processSample } from "@/lib/server/sample-processor";

describe("sample processor", () => {
  it("returns a validated benefits-renewal plan", () => {
    expect(processSample("benefits-renewal").evidence[0].id).toBe("source-1");
  });

  it.each([
    ["2026-10-19", "2026-11-02", "November 2, 2026"],
    ["2026-12-25", "2027-01-08", "January 8, 2027"],
    ["2028-02-20", "2028-03-05", "March 5, 2028"],
    ["2026-03-01", "2026-03-15", "March 15, 2026"],
  ])("sets one consistent fictional deadline 14 calendar days after %s", (today, dueDate, label) => {
    const result = processSample("benefits-renewal", today);
    const action = result.actions.find(action => action.id === "submit-review")!;
    const quote = `Your annual review must be completed by ${label}.`;
    expect(action.dueDate).toBe(dueDate);
    expect(action.dueLabel).toBe(`Due ${label}`);
    expect(result.summary).toContain(label);
    expect(result.findings.find(finding => finding.id === "deadline")?.value).toBe(label);
    expect(action.evidence[0].quote).toBe(quote);
    expect(result.findings[0].evidence[0].quote).toBe(quote);
    expect(result.evidence[0].text).toContain(quote);
  });

  it("uses the current calendar day for sample requests without a supplied date", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 9, 19, 12));
      expect(processSample("benefits-renewal").actions[2].dueDate).toBe("2026-11-02");
    } finally { vi.useRealTimers(); }
  });

  it("creates independent sessions without changing a previously returned deadline", () => {
    const first = processSample("benefits-renewal", "2026-10-19");
    const second = processSample("benefits-renewal", "2026-10-20");
    expect(first.actions[2].dueDate).toBe("2026-11-02");
    expect(second.actions[2].dueDate).toBe("2026-11-03");
  });
});
