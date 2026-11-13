import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const featuresDir = path.join(__dirname, '../src/app/features');

function walkListFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkListFiles(full));
    else if (ent.name.endsWith('-list.component.ts') || ent.name.endsWith('-lista.component.ts')) out.push(full);
  }
  return out;
}

function patch(src) {
  let next = src;
  next = next.replace(
    /(<td class="lst-grade__acoes[^"]*">)\n<div class="lst-acoes"/g,
    '$1\n                    <div class="lst-acoes"',
  );
  next = next.replace(/\n<\/div>\n                  <\/td>/g, '\n                    </div>\n                  </td>');
  return next;
}

let n = 0;
for (const filePath of walkListFiles(featuresDir)) {
  const src = fs.readFileSync(filePath, 'utf8');
  const next = patch(src);
  if (next !== src) {
    fs.writeFileSync(filePath, next, 'utf8');
    n++;
  }
}
console.log(`Indented ${n} file(s).`);
