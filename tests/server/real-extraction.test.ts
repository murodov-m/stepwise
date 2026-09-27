import { expect, it } from "vitest";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { extractDocument } from "@/lib/server/extract-document";
import { syntheticPdf, syntheticEncryptedPdf } from "./extraction-fixtures";

it("extracts actual PDF text separately by page with accurate page references", async () => {
  const result = await extractDocument({name: "private.pdf", mimeType: "application/pdf", bytes: syntheticPdf(["First notice deadline October 18.", "Second page lists photo identification."])});
  expect(result.segments.map(segment => ({id: segment.id, page: segment.page, text: segment.text}))).toEqual([{id: "source-1", page: 1, text: "First notice deadline October 18."}, {id: "source-2", page: 2, text: "Second page lists photo identification."}]);
  expect(result.requiresConfirmation).toBe(false);
}, 35000);
it.each([{pages: new Array(41).fill("notice")}, {pages: [""]}])("refuses excessive-page or image-only PDFs", async ({pages}) => {
  await expect(extractDocument({name: "private.pdf", mimeType: "application/pdf", bytes: syntheticPdf(pages)})).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
}, 35000);
it("refuses a password-encrypted PDF without requesting credentials", async () => {
  const pdf = new TextDecoder().decode(syntheticPdf(["Private synthetic notice"])).replace("/Root 1 0 R", `/Root 1 0 R /Encrypt << /Filter /Standard /V 1 /R 2 /O <${"00".repeat(32)}> /U <${"00".repeat(32)}> /P -4 >> /ID [<${"00".repeat(16)}> <${"00".repeat(16)}>]`);
  await expect(extractDocument({name: "private.pdf", mimeType: "application/pdf", bytes: new TextEncoder().encode(pdf)})).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
}, 35000);
it("refuses encryption even when the PDF opens without requesting a password", async () => {
  await expect(extractDocument({name: "private.pdf", mimeType: "application/pdf", bytes: syntheticEncryptedPdf()})).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
}, 35000);
it("transcribes a real synthetic PNG using bundled English OCR", async () => {
  const bytes = await readFile(new URL("../fixtures/ocr-notice.png", import.meta.url));
  const result = await extractDocument({name: "private.png", mimeType: "image/png", bytes});
  expect(result.segments[0].text).toContain("Annual review notice");
  expect(result.segments[0].text).toContain("photo identification");
  expect(result.requiresConfirmation).toBe(true);
  expect(result.warnings[0]).toContain("Confirm the transcription");
}, 30000);
it("refuses a decoded image with no usable OCR text", async () => {
  const bytes = await sharp({create: {width: 300, height: 200, channels: 3, background: "white"}}).png().toBuffer();
  await expect(extractDocument({name: "private.png", mimeType: "image/png", bytes})).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
}, 30000);
