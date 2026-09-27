import { expect, it } from "vitest";
import { extractDocument } from "@/lib/server/extract-document";

const textDocument = (text: string, mimeType = "text/plain") => ({name: "secret.txt", mimeType, bytes: new TextEncoder().encode(text)});
it("extracts trimmed text with server-owned IDs and no invented page", async () => {
  expect(await extractDocument(textDocument(" \n Pay by October 18. \n"))).toEqual({segments: [{id: "source-1", label: "Uploaded text", text: "Pay by October 18."}], warnings: [], requiresConfirmation: false});
});
it.each([" \t\n", "\u0000binary", "a".repeat(100001)])("refuses blank, binary or excessive text", async (text) => {
  await expect(extractDocument(textDocument(text))).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
});
it("does not accept text mislabeled as PDF", async () => {
  await expect(extractDocument(textDocument("not a PDF", "application/pdf"))).rejects.toMatchObject({code: "UPLOAD_INVALID"});
});
it("refuses corrupt signed PDFs", async () => {
  await expect(extractDocument(textDocument("%PDF-1.7\n corrupt", "application/pdf"))).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
}, 35000);
