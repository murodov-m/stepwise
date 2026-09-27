# Verification record

Status: final technical checks, independent project review, public repository audit and hosted CI passed on 27 September 2026. Public video upload and the learner's Devpost entry remain pending.

Baseline review found an evidence-ownership defect, dropped question answers, fixed next-action copy, incomplete session reset, inaccessible evidence focus, and a localhost mismatch in browser tests. Corrective regressions must reproduce failures before fixes.

Fresh source installation used Node24.16.0/npm11.13.0 on Windows and a separate source-only copy, with no copied node_modules or build output. `npm ci` passed. Eight inherited lock entries lacked download/integrity fields; exact-version registry metadata was added, with all490 package entries otherwise unchanged. Generated Next route validation is included in `npm run typecheck`; it passed from absent `.next` and `next-env.d.ts`. A deliberately invalid route failed the corrected command.

| Check | Actual result |
| --- | --- |
| Lint | Passed |
| Typecheck including Next typegen | Passed from clean generated-output state |
| Unit/server/domain suite | 72 tests in 14 files passed, 6.41 seconds |
| Production build | Passed, Next16.3.6; root and analysis routes generated |
| Chromium browser suite | 12 tests passed, 29.7 seconds; owned test server shut down |
| Manual production inspection | Real sample, both priorities, address/readiness guidance, all completion states, reset, keyboard modal focus,375px layout |
| Offline app map | 22 local links and24 anchors across15 files checked; browser layout/native details inspected |
| Recorded demonstration | Actual fictional sample UI,118.083 seconds,VP8/WebM; idle gaps shortened, browser playback ended without media error |
| Processing and client task reviews | Independently approved |
| Final project review | Approved after focused fixes; no new breakage identified |
| Public source audit | Anonymous fresh clone matched all 75 audited files, including media; clean noreply history; MIT license detected |
| Hosted GitHub workflow | Fresh Ubuntu/Node24 install, lint, typecheck, unit suite, build and 12 browser tests passed; [verified run](https://github.com/murodov-m/stepwise/actions/runs/36313217468) |

All nine files corrected after the final review match the tested clean copy. Generic questions now require an action effect for every offered choice; reserved address/readiness guidance permits only the supported choices and an existing target. Browser tests isolate provider settings from the process and local environment files. Regression failures reproduced both defects before the fixes. The canonical sample, recorded media, dependency versions and lock remain unchanged. Verification/publication notes change documentation only.

Actual production text/PDF/English-image extraction and synthetic-provider contract checks passed during processing verification. Controlled provider responses establish contract behavior; real-model accuracy and retention have not been evaluated with credentials. Quote matching proves source provenance, not professional interpretation or eligibility. Manual inspection does not claim full cross-browser/physical-device testing or learner hands-on completion. Public YouTube upload, entrant declarations and Devpost submission remain user actions.
