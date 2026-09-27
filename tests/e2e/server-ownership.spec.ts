import { expect, test } from "@playwright/test";

test("the owned server ignores inherited live settings for the real route", async ({ request }) => {
  const response = await request.post("/api/analyze", { multipart: { mode: "live", file: { name: "synthetic.txt", mimeType: "text/plain", buffer: Buffer.from("Synthetic renewal notice.") } } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ code: "LIVE_MODE_UNAVAILABLE" });
});

test("an unowned shutdown request cannot stop the browser-test server", async ({ request, page }) => {
  const response = await request.post("/__stepwise_test_shutdown", { headers: { "x-stepwise-test-token": "not-the-owner" } });
  expect(response.status()).toBe(403);
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.locator(".action-card")).toHaveCount(3);
});
