import { expect, test, type Page } from "@playwright/test";
import { sampleResult } from "../../lib/domain/sample-fixture";

type ObservedWindow = Window & { __sentDocuments?: File[] };
async function observeSentDocuments(page: Page) {
  await page.addInitScript(() => {
    const files: File[] = [];
    (window as ObservedWindow).__sentDocuments = files;
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input === "/api/analyze" && init?.body instanceof FormData) {
        const file = init.body.get("file");
        if (file instanceof File) files.push(file);
      }
      // Observe the submitted File without replacing the actual API or signal.
      return original(input, init);
    };
  });
}
async function sentDocuments(page: Page) {
  return page.evaluate(async () => Promise.all(((window as ObservedWindow).__sentDocuments ?? []).map(async file => ({ name: file.name, text: await file.text() }))));
}

async function openSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.locator(".action-card")).toHaveCount(3);
}

test("meeting-deadline priority chooses the submitting action", async ({ page }) => {
  await openSample(page);
  await page.getByRole("button", { name: "Meeting the deadline", exact: true }).click();
  await expect(page.locator(".action-card").first().getByRole("heading", { level: 2 })).toHaveText("Review the renewal before submitting");
});

test("real sample prioritizes each option, advances completion, and clears the session", async ({ page }) => {
  await openSample(page);
  await page.getByRole("button", { name: "Gathering documents", exact: true }).click();
  await expect(page.locator(".action-card").first().getByRole("heading", { level: 2 })).toHaveText("Gather the two required documents");
  await expect(page.getByText("Sample plan", { exact: true })).toBeVisible();
  await expect(page.locator(".facts-panel")).toContainText("October 18, 2026");
  await expect(page.locator(".facts-panel")).toContainText("Needs confirmation");
  await expect(page.locator(".action-card").first()).toContainText("Proof of income");
  await expect(page.locator(".action-card").first()).toContainText("Current photo identification");
  await expect(page.locator(".start-panel h2")).toHaveText("Gather the two required documents");
  await page.getByRole("button", { name: "Meeting the deadline", exact: true }).click();
  await expect(page.locator(".action-card").first().getByRole("heading", { level: 2 })).toHaveText("Review the renewal before submitting");
  await expect(page.getByRole("button", { name: "Meeting the deadline" })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".action-card").first().getByRole("button", { name: "Mark complete", exact: true }).click();
  await expect(page.locator(".start-panel h2")).toHaveText("Check your details");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2 actions left.");
  await page.getByRole("button", { name: "Mark complete", exact: true }).first().click();
  await page.getByRole("button", { name: "Mark complete", exact: true }).first().click();
  await expect(page.locator(".start-panel h2")).toHaveText("All actions complete");
  await page.getByRole("button", { name: "Reset session" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know what to do next.");
  await expect(page.getByLabel("Paste document text")).toHaveValue("");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.locator(".start-panel h2")).toHaveText("Check your details");
  await expect(page.getByRole("button", { name: "Meeting the deadline" })).toHaveAttribute("aria-pressed", "false");
});

test("real sample keeps independent readiness and address answers", async ({ page }) => {
  await openSample(page);
  const address = page.getByRole("group", { name: "Did your address change?" });
  const ready = page.getByRole("group", { name: "Are the two required documents ready?" });
  await address.getByRole("button", { name: "Yes", exact: true }).click();
  await ready.getByRole("button", { name: "Partly", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("confirm the update with the issuing office");
  await expect(page.locator(".action-list")).toContainText("Gather the remaining documents");
  await expect(address.getByRole("button", { name: "Yes", exact: true })).toHaveAttribute("aria-pressed", "true");
  await ready.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("neither document is ready");
  await ready.getByRole("button", { name: "Not sure", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("Confirm which required documents you already have");
  await ready.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("check their dates before submitting");
  await address.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("address is unchanged");
  await address.getByRole("button", { name: "Not sure", exact: true }).click();
  await expect(page.locator(".action-list")).toContainText("Confirm whether the address on the notice is current");
});

test("every real sample source quote opens a native modal with keyboard containment and restoration", async ({ page }) => {
  await openSample(page);
  const quotes = [
    "Please review the information below and contact the office if anything is incorrect.",
    "1. Proof of income dated within the last 60 days.",
    "2. A current photo identification document.",
    "Your annual review must be completed by October 18, 2026.",
    "Your annual review must be completed by October 18, 2026.",
    "1. Proof of income dated within the last 60 days.",
    "2. A current photo identification document.",
    "The phone number is not visible in this copy.",
    "Please review the information below and contact the office if anything is incorrect.",
  ];
  const links = page.getByRole("button", { name: /Show source/ });
  await expect(links).toHaveCount(9);
  for (let index = 0; index < quotes.length; index++) {
    await links.nth(index).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("blockquote")).toHaveText(quotes[index]);
    await expect(dialog).toHaveJSProperty("tagName", "DIALOG");
    await expect(page.getByRole("button", { name: "Close evidence" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close evidence" })).toBeFocused();
    await page.getByRole("button", { name: "Reset session" }).evaluate((button: HTMLButtonElement) => button.focus());
    await expect(page.getByRole("button", { name: "Close evidence" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(links.nth(index)).toBeFocused();
  }
  await links.first().click();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(links.first()).toBeFocused();
});

test("live file submission explains privacy, preserves retry, and allows invalid replacement", async ({ page }) => {
  await observeSentDocuments(page);
  await page.goto("/");
  await page.locator("#document-upload").setInputFiles({ name: "notice.exe", mimeType: "application/octet-stream", buffer: Buffer.from("notice") });
  await expect(page.getByTestId("error-message")).toContainText("Use a PDF");
  expect(await sentDocuments(page)).toHaveLength(0);
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await page.getByRole("button", { name: "Choose another document" }).click();
  await page.locator("#document-upload").setInputFiles({ name: "notice.txt", mimeType: "text/plain", buffer: Buffer.from("Your renewal notice is due October 18, 2026.") });
  await expect(page.getByText(/extracted text.*configured analysis service/i)).toBeVisible();
  await expect(page.getByText(/retention.*provider/i)).toBeVisible();
  await page.getByRole("button", { name: "Analyze document", exact: true }).click();
  await expect(page.getByTestId("error-message")).toContainText("Live mode is not configured");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("error-message")).toContainText("Live mode is not configured");
  expect(await sentDocuments(page)).toEqual([
    { name: "notice.txt", text: "Your renewal notice is due October 18, 2026." },
    { name: "notice.txt", text: "Your renewal notice is due October 18, 2026." },
  ]);
  await page.getByRole("button", { name: "Use the sample" }).click();
  await expect(page.locator(".action-card")).toHaveCount(3);
  await page.getByRole("button", { name: "New document" }).click();
  await expect(page.getByLabel("Paste document text")).toHaveValue("");
  expect(await page.locator("#document-upload").evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
});

test("pasted text uses the real live path and empty text stays local", async ({ page }) => {
  await observeSentDocuments(page);
  await page.goto("/");
  await page.getByLabel("Paste document text").fill("   ");
  await page.getByRole("button", { name: "Analyze pasted text" }).click();
  await expect(page.getByTestId("error-message")).toContainText("Paste nonempty document text");
  expect(await sentDocuments(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Choose another document" }).click();
  await page.getByLabel("Paste document text").fill("This review requires proof of income by October 18, 2026.");
  await page.getByRole("button", { name: "Analyze pasted text" }).click();
  await expect(page.getByTestId("error-message")).toContainText("Live mode is not configured");
  expect(await sentDocuments(page)).toEqual([{ name: "pasted-document.txt", text: "This review requires proof of income by October 18, 2026." }]);
});

test("cancel and client timeout recover without letting late responses overwrite a new session", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    let calls = 0;
    window.fetch = async (input, init) => {
      if (input === "/api/analyze" && ++calls <= 2) {
        // Deliberately ignores abort: the component must invalidate stale results too.
        return new Promise<Response>((resolve) => window.setTimeout(() => resolve(new Response(JSON.stringify({ code: "LATE", message: "Old request" }), { status: 503 })), 120_000));
      }
      return original(input, init);
    };
  });
  await page.goto("/");
  await page.clock.install();
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
  await page.clock.fastForward(5_000);
  await expect(page.locator(".stage-list")).not.toContainText("✓");
  await page.getByRole("button", { name: "Cancel analysis" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know what to do next.");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await page.clock.fastForward(100_001);
  await expect(page.getByTestId("error-message")).toContainText("took too long");
  await page.getByRole("button", { name: "Use the sample" }).click();
  await expect(page.locator(".action-card")).toHaveCount(3);
  await page.clock.fastForward(120_001);
  await expect(page.locator(".action-card")).toHaveCount(3);
});

test("variable result honors completion, all drafts, confirmation, and segment-only sources", async ({ page }) => {
  await page.route("**/api/analyze", route => route.fulfill({ json: {
    ...sampleResult,
    actions: [{ ...sampleResult.actions[1], status: "completed", evidenceStatus: "needs_confirmation", dueKind: "suggested", dueDate: "2026-10-11" }],
    questions: [],
    evidence: [{ id: "source-1", label: "OCR text", text: sampleResult.evidence[0].text }],
    drafts: [...sampleResult.drafts, { ...sampleResult.drafts[0], id: "second-draft", title: "Second message" }],
    warnings: ["OCR transcription may contain errors. Confirm against the original image."],
  } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("0 actions left.");
  await expect(page.locator(".start-panel h2")).toHaveText("All actions complete");
  await expect(page.locator(".action-card")).toContainText("Needs confirmation");
  await expect(page.locator(".due-label")).toContainText("Suggested: October 11, 2026");
  await expect(page.getByRole("heading", { name: "Second message" })).toBeVisible();
  await expect(page.getByText(/OCR transcription may contain errors/)).toBeVisible();
  await page.getByRole("button", { name: /Show source/ }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Segment source-1");
  await expect(page.getByRole("dialog")).not.toContainText("Page 1");
});

test("clipboard rejection leaves a visible manual copy recovery", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("Denied")) } }));
  await openSample(page);
  await page.getByRole("button", { name: "Copy draft", exact: true }).click();
  await expect(page.getByText("Copy was unavailable. Select the draft text and copy it manually.")).toBeVisible();
  await expect(page.getByLabel("Draft message to the benefits office")).toHaveValue(/Hello, I am reviewing/);
});

test("375px reduced-motion flow has reachable controls and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openSample(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/mobile-plan.png", fullPage: true });
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Gathering documents", exact: true }).focus();
  await expect(page.getByRole("button", { name: "Gathering documents", exact: true })).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator(".start-panel h2")).toHaveText("Gather the two required documents");
  await page.getByRole("button", { name: /Show source/ }).first().click();
  expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: "test-results/mobile-evidence.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "New document" }).click();
  await page.keyboard.press("Tab");
  await page.locator("#document-upload").focus();
  await expect(page.locator('label[for="document-upload"]')).toHaveCSS("outline-style", "solid");
});

