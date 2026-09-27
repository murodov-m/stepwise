import type { NextConfig } from "next";

// These packages are loaded inside a separate Node process; the bundler cannot
// discover its runtime require/import calls. Keep their files in deployment traces.
const extractionRuntimePackages = [
  "tesseract.js", "tesseract.js-core", "wasm-feature-detect", "node-fetch",
  "whatwg-url", "webidl-conversions", "tr46", "is-url", "zlibjs", "bmp-js",
  "@napi-rs/canvas", "@napi-rs/canvas-*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "tesseract.js", "@tesseract.js-data/eng"],
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./node_modules/@tesseract.js-data/eng/index.js",
      "./node_modules/@tesseract.js-data/eng/package.json",
      "./node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz",
      "./node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfjs-dist/legacy/build/*.mjs",
      ...extractionRuntimePackages.map(name => `./node_modules/${name}/**/*`),
    ],
  },
};

export default nextConfig;
