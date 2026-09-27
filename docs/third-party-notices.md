# Third-party code, data, and assets

Application source is MIT licensed under the root [LICENSE](../LICENSE). Dependency licenses remain their authors' own; installing with npm includes their license files. Resolved packages and integrity hashes are in `package-lock.json`.

## Runtime dependencies

| Dependency | Resolved version | Package license | Upstream |
| --- | --- | --- | --- |
| Next.js | 16.3.6 | MIT | [vercel/next.js](https://github.com/vercel/next.js) |
| React / React DOM | 19.3.0 | MIT | [react/react](https://github.com/react/react) |
| Zod | 4.6.5 | MIT | [colinhacks/zod](https://github.com/colinhacks/zod) |
| PDF.js / pdfjs-dist | 5.4.296 | Apache-2.0 | [mozilla/pdf.js](https://github.com/mozilla/pdf.js) |
| Tesseract.js | 7.0.0 | Apache-2.0 | [naptha/tesseract.js](https://github.com/naptha/tesseract.js) |
| Bundled English OCR package | @tesseract.js-data/eng 1.0.0 | MIT (package metadata) | [naptha/tessdata](https://github.com/naptha/tessdata) |
| sharp | 0.35.4 | Apache-2.0 | [lovell/sharp](https://github.com/lovell/sharp) |

OCR also uses Tesseract's WebAssembly core and upstream trained-language data; their upstream notices and licensing travel with the installed packages. PDF.js and sharp have their own native/optional transitive dependencies. The lockfile records these dependencies; do not treat the app's MIT license as relicensing them.

## Development and planning

TypeScript, ESLint/Next ESLint config, Vitest, Vite React plugin, and Playwright are test/build tools. Their installed packages contain their own notices.

The official [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics) provided the `devpost/` planning templates; `skills-lock.json` records its sources and hashes. Superpowers and Codex assisted planning, coding and review.

## Project-created material

`public/sample/benefits-renewal-notice.txt` is a fictional notice for this demonstration, not a real agency document or personal record. Application styling, the standalone code map, test fixtures and the sample screenshot are project-created.

Optional live service access is supplied by the user; that provider's terms, retention, and costs apply separately. No provider keys are included in public source.
