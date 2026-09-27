import { expect, it } from "vitest";
import { getActionDueLabel } from "@/lib/domain/deadlines";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { prioritizeActions } from "@/lib/domain/personalize";

it("labels source dates across due, tomorrow and overdue calendar boundaries", () => {
  const action = sampleResult.actions[2];
  expect(getActionDueLabel(action, "2026-10-17")).toBe("Due tomorrow · October 18, 2026");
  expect(getActionDueLabel(action, "2026-10-18")).toBe("Due today · October 18, 2026");
  expect(getActionDueLabel(action, "2026-10-19")).toBe("Overdue by 1 day · October 18, 2026");
  expect(getActionDueLabel({...action, dueDate: "2028-02-29"}, "2028-03-01")).toBe("Overdue by 1 day · February 29, 2028");
});
it("keeps suggestions explicit and avoids fabricated sample dates", () => {
  expect(getActionDueLabel({...sampleResult.actions[0], dueDate: "2026-10-18"}, "2026-10-19")).toBe("Suggested: October 18, 2026 · 1 day ago");
  expect(sampleResult.actions[0].dueDate).toBeUndefined();
  expect(sampleResult.actions.flatMap((action) => action.requiredDocuments)).toEqual(["Proof of income", "Current photo identification"]);
});
it("readiness answers change actionable instructions without changing evidence or completion", () => {
  const ready = prioritizeActions(sampleResult.actions, sampleResult.questions, {"documents-ready": "Yes"});
  const partly = prioritizeActions(sampleResult.actions, sampleResult.questions, {"documents-ready": "Partly"});
  const uncertain = prioritizeActions(sampleResult.actions, sampleResult.questions, {"documents-ready": "Not sure"});
  expect(ready[0].id).toBe("submit-review");
  expect(ready.find((a) => a.id === "gather-documents")?.reason).toContain("ready");
  expect(partly[0].reason).toContain("remaining");
  expect(uncertain[0].reason).toContain("Confirm");
  expect(partly[0].evidence).toEqual(sampleResult.actions[1].evidence);
  expect(partly[0].status).toBe("pending");
});
it("address responses distinguish changed, unchanged and uncertain instructions", () => {
  const reason = (answer: string) => prioritizeActions(sampleResult.actions, sampleResult.questions, {address: answer}).find(a => a.id === "check-details")?.reason;
  expect(reason("Yes")).toContain("changed");
  expect(reason("No")).toContain("unchanged");
  expect(reason("Not sure")).toContain("Confirm");
});
