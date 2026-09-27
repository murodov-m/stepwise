export default async function teardown() {
  try {
    const response = await fetch("http://localhost:3100/__stepwise_test_shutdown", {
      method: "POST",
      headers: { "x-stepwise-test-token": process.env.STEPWISE_E2E_SHUTDOWN_TOKEN ?? "" },
      signal: AbortSignal.timeout(5_000),
    });
    // A server already on this port belongs to another runner or application.
    if (!response.ok) return;
  } catch {
    // Startup can fail before a server exists; webServer still owns its process.
    return;
  }
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    try { await fetch("http://localhost:3100", { signal: AbortSignal.timeout(500) }); }
    catch { return; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("The owned browser-test server did not stop within five seconds.");
}
