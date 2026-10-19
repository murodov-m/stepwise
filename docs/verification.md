# Verification

Application verification was refreshed on 19 October 2026 after moving the optional questions before the suggested first step. The original fresh-install Windows source copy uses Node 24.16.0 and npm 11.13.0; hosted checks use Ubuntu and Node 24.

| Check | Result |
| --- | --- |
| Fresh `npm ci` | Passed without copied dependencies or build output |
| Lint | Passed |
| Typecheck | Passed, including generated Next route validation |
| Unit/server/domain tests | 72 tests in 14 files passed |
| Production build | Passed with Next 16.3.6 |
| Chromium browser tests | 14 passed, including stable priority controls at desktop and mobile widths; owned test server shut down |
| Manual production inspection | Sample, priority/readiness answers, sources, completion, reset, keyboard focus and 375px layout inspected |
| Independent technical review | Approved after corrective regressions and focused re-review |

The [workflow](../.github/workflows/ci.yml) runs fresh installation, lint, typecheck, unit tests, build and browser tests on pushes and pull requests. [Hosted run results](https://github.com/murodov-m/stepwise/actions/workflows/ci.yml) are available on GitHub. Repeatable commands are in [README](../README.md#verify).

Actual text, text-bearing PDF and English-image extraction were checked using synthetic fixtures. Controlled provider responses test the request contract, source validation, cancellation, timeouts and resource cleanup. Generic questions require an effect for every offered answer; browser tests isolate live-provider settings.

## Limits of this evidence

- Real-model accuracy, availability, costs and retention have not been evaluated with credentials.
- Quote matching establishes source provenance, not interpretation, completeness, professional correctness or eligibility.
- Local full-install Node operation is supported. Hosted application operation, standalone/serverless deployment and hosts that prohibit child processes are not verified.
- Browser automation covers Chromium; manual inspection does not establish a complete physical-device or cross-browser matrix.
