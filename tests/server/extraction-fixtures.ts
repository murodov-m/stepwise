import { createHash } from "node:crypto";
// Minimal synthetic PDF builder: no real administrative or personal data.
export function syntheticPdf(pages: string[]): Uint8Array {
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${4+index*2} 0 R`).join(" ")}] >>`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  pages.forEach((text, index) => {
    const content = text ? `BT /F1 18 Tf 30 100 Td (${text.replace(/[\\()]/g, "\\$&")}) Tj ET` : "";
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 300] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5+index*2} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => {offsets.push(Buffer.byteLength(pdf)); pdf += `${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

// Standard PDF R2 encryption with an empty user password. A reader can open it
// without asking for a password, but StepWise must still refuse encrypted inputs.
export function syntheticEncryptedPdf(): Uint8Array {
  const padding = Buffer.from("28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a", "hex");
  const md5 = (input: Buffer) => createHash("md5").update(input).digest();
  const rc4 = (key: Buffer, input: Buffer) => {
    const state = Array.from({length: 256}, (_, index) => index);
    let j = 0;
    for (let i=0;i<256;i++) {j=(j+state[i]+key[i%key.length])%256; [state[i],state[j]]=[state[j],state[i]];}
    let i=0; j=0;
    return Buffer.from(input.map(byte => {i=(i+1)%256; j=(j+state[i])%256; [state[i],state[j]]=[state[j],state[i]]; return byte^state[(state[i]+state[j])%256];}));
  };
  const ownerPassword = Buffer.concat([Buffer.from("owner"), padding]).subarray(0,32);
  const owner = rc4(md5(ownerPassword).subarray(0,5), padding);
  const permissions = Buffer.alloc(4); permissions.writeInt32LE(-4);
  const id = Buffer.alloc(16);
  const key = md5(Buffer.concat([padding, owner, permissions, id])).subarray(0,5);
  const user = rc4(key, padding);
  const objectKey = md5(Buffer.concat([key, Buffer.from([5,0,0,0,0])])).subarray(0,10);
  const content = rc4(objectKey, Buffer.from("BT /F1 18 Tf 30 100 Td (Synthetic encrypted notice.) Tj ET"));
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Count 1 /Kids [4 0 R] >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 300] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content.toString("latin1")}\nendstream`,
    `<< /Filter /Standard /V 1 /R 2 /Length 40 /O <${owner.toString("hex")}> /U <${user.toString("hex")}> /P -4 >>`,
  ];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object,index) => {offsets.push(Buffer.byteLength(pdf,"latin1")); pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref = Buffer.byteLength(pdf,"latin1");
  pdf += `xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size 7 /Root 1 0 R /Encrypt 6 0 R /ID [<${id.toString("hex")}> <${id.toString("hex")}>] >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf,"latin1"));
}
