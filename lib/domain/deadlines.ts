import { isCalendarDate, type Action } from "@/lib/domain/schema";
export function getActionDueLabel(action: Action, today?: string): string {
  if (!action.dueDate || action.dueKind === "none") return action.dueKind === "suggested" && !action.dueLabel.startsWith("Suggested:") ? `Suggested: ${action.dueLabel}` : action.dueLabel;
  const now = new Date();
  const localToday = today ?? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  if (!isCalendarDate(action.dueDate) || !isCalendarDate(localToday)) throw new Error("Invalid calendar date");
  const calendar = (date: string) => {
    const value = new Date(0);
    const [year, month, day] = date.split("-").map(Number);
    value.setUTCFullYear(year, month - 1, day);
    return value;
  };
  const date = calendar(action.dueDate);
  const difference = Math.round((date.getTime() - calendar(localToday).getTime())/86400000);
  const formatted = new Intl.DateTimeFormat("en-US", {month: "long", day: "numeric", year: "numeric", timeZone: "UTC"}).format(date);
  const days = `${Math.abs(difference)} day${Math.abs(difference) === 1 ? "" : "s"}`;
  if (action.dueKind === "suggested") return `Suggested: ${formatted}${difference === 0 ? " · today" : difference < 0 ? ` · ${days} ago` : ` · in ${days}`}`;
  return difference < 0 ? `Overdue by ${days} · ${formatted}` : difference === 0 ? `Due today · ${formatted}` : difference === 1 ? `Due tomorrow · ${formatted}` : `Due ${formatted} · in ${days}`;
}
