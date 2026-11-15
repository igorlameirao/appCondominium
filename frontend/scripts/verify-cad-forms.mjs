/**
 * Falha o CI se algum *-form.component.ts perder o shell cad-* aprovado.
 * Exceções: formulários legados explicitamente listados em LEGACY_FORMS.
 */
import fs from 'fs';
import path from 'path';

const LEGACY_FORMS = new Set([]);

function walkForms(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkForms(full, acc);
    else if (name.endsWith('-form.component.ts')) acc.push(full);
  }
  return acc;
}

const root = path.resolve('src/app/features');
const bad = [];

for (const file of walkForms(root)) {
  const key = path.basename(file);
  if (LEGACY_FORMS.has(key)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('cad-wrapper')) {
    bad.push(path.relative(root, file));
  }
  if (src.includes('class="form-layout"')) {
    bad.push(`${path.relative(root, file)} (form-layout legado)`);
  }
}

if (bad.length) {
  console.error('Formulários fora do padrão cad-*:\n' + bad.map(b => `  - ${b}`).join('\n'));
  process.exit(1);
}
console.log('OK: todos os formulários usam cad-wrapper.');