// Test-only server: one Node process owns Next and all HTTP connections.
// Explicit HTTP teardown avoids Windows shell-tree termination hangs.
import http from "node:http";
import next from "next";

const shutdownToken = process.env.STEPWISE_E2E_SHUTDOWN_TOKEN;
if (!shutdownToken) throw new Error("Start the test server through Playwright so the runner owns its shutdown.");
// Explicit empty values win over inherited settings and Next's .env* loading.
// This affects only this owned test process; production keeps its live settings.
process.env.AI_API_KEY = "";
process.env.AI_MODEL = "";
process.env.AI_BASE_URL = "";
const app = next({ dev: true, hostname: "localhost", port: 3100 });
const handle = app.getRequestHandler();
let stopping = false;
const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/__stepwise_test_shutdown") {
    if (request.headers["x-stepwise-test-token"] !== shutdownToken) {
      response.writeHead(403).end("This runner does not own the server");
      return;
    }
    response.on("finish", () => void stop());
    response.writeHead(200).end("Stopping owned test server");
    return;
  }
  void handle(request, response);
});

async function stop() {
  if (stopping) return;
  stopping = true;
  // Closing Next must not make test teardown unbounded.
  const hardStop = setTimeout(() => process.exit(0), 3_000);
  server.close();
  server.closeAllConnections();
  try { await app.close(); } finally { clearTimeout(hardStop); process.exit(0); }
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
// Also bounds startup failures, interrupted runners, and abandoned sessions.
setTimeout(() => void stop(), 10 * 60_000).unref();
try {
  await app.prepare();
  server.on("upgrade", app.getUpgradeHandler());
  server.on("error", error => { console.error(error); process.exit(1); });
  server.listen(3100, "localhost");
} catch (error) { console.error(error); process.exit(1); }
