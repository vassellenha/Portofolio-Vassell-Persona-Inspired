// Membuat web/public/cv.pdf placeholder (1 halaman, valid). Ganti dengan CV aslimu.
import { writeFileSync } from "node:fs";

const lines = [
  "CV - Vassell Enha Atthayya (Marcell)",
  "Full Stack Developer | Sistem Informasi, Telkom University",
  "",
  "[PLACEHOLDER] Ganti file web/public/cv.pdf dengan CV aslimu.",
];
const stream = "BT /F1 18 Tf 60 760 Td 22 TL\n" + lines.map((t) => `(${t}) Tj T*`).join("\n") + "\nET";
const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
];
let out = "%PDF-1.4\n";
const off = [];
objs.forEach((o, i) => {
  off.push(Buffer.byteLength(out));
  out += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = Buffer.byteLength(out);
out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
out += off.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(new URL("../public/cv.pdf", import.meta.url), out);
console.log("cv.pdf dibuat");
