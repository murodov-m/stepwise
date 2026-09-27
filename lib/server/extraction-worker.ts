// This script runs in a synchronously owned Node process so timeout can stop parsing
// even when a library performs CPU-heavy work or has not finished initialization.
// Uploaded content is passed only through workerData, never interpolated into code.
const extractionScript = String.raw`
const failure = reason => parentPort.postMessage({ok: false, reason});
(async () => {
  if (workerData.kind === "pdf") {
    const {getDocument} = await import(workerData.moduleUrl);
    const task = getDocument({data: new Uint8Array(workerData.bytes), verbosity: 0, isEvalSupported: false, stopAtErrors: true, useWorkerFetch: false, disableAutoFetch: true, disableStream: true, maxImageSize: 16000000});
    try {
      const pdf = await task.promise;
      if (await pdf.getPermissions() !== null) {failure("pdf_unreadable"); return;}
      if (pdf.numPages > 40) {failure("pdf_pages"); return;}
      const segments = []; let total = 0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        try {
          const content = await page.getTextContent();
          const text = content.items.map(item => "str" in item ? item.str+(item.hasEOL ? "\n" : " ") : "").join("").trim();
          if (!text) {failure("pdf_no_text"); return;}
          total += text.length;
          if (total > 100000) {failure("pdf_length"); return;}
          segments.push({id: "source-"+pageNumber, label: "PDF page "+pageNumber, page: pageNumber, text});
        } finally {page.cleanup();}
      }
      parentPort.postMessage({ok: true, result: segments});
    } catch {failure("pdf_unreadable");}
    finally {await task.destroy().catch(() => {});}
    return;
  }
  const {createWorker} = require(workerData.modulePath);
  let worker;
  try {
    worker = await createWorker("eng", 1, {langPath: workerData.langPath, gzip: true, cacheMethod: "none", logger: () => {}, errorHandler: () => {}});
    await worker.setParameters({user_defined_dpi: "300"});
    const {data} = await worker.recognize(Buffer.from(workerData.image));
    if (data.text.length > 100000) {failure(); return;}
    parentPort.postMessage({ok: true, result: {text: data.text, confidence: data.confidence}});
  } catch {failure();}
  finally {if (worker) await worker.terminate().catch(() => {});}
})().catch(() => failure()).finally(() => {
  if (typeof process.disconnect === "function" && process.connected) process.disconnect();
});
`;

// Process exit/termination closes all nested Tesseract threads, even during initialization.
// A process also avoids Windows native-canvas teardown failures inside a Worker thread.
export const extractionProcessScript = 'process.once("message", workerData => { const parentPort = {postMessage(value) {process.send(value);}};\n' + extractionScript + '\n});';
