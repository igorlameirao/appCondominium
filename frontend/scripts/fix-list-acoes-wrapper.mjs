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
  return [...new Set(out)];
}

const tdAcoesRe =
  /(<td class="lst-grade__acoes[^"]*">)\s*((?:\s*<button[\s\S]*?<\/button>\s*)+)\s*(<\/td>)/g;

function wrapAcoes(src) {
  return src.replace(tdAcoesRe, (full, open, buttons, close) => {
    if (/<div class="lst-acoes"/.test(buttons)) return full;
    const lines = buttons.split('\n');
    const indent = (lines.find((l) => l.includes('<button'))?.match(/^(\s*)/) ?? ['', '                    '])[1];
    const inner = buttons.trimEnd();
    return `${open}\n${indent}<div class="lst-acoes" role="group" aria-label="Ações da linha">\n${inner}\n${indent}</div>\n                  ${close.trim()}`;
  });
}

const files = walkListFiles(featuresDir);
let changed = 0;
for (const filePath of files) {
  const src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('lst-grade__acoes')) continue;
  const next = wrapAcoes(src);
  if (next !== src) {
    fs.writeFileSync(filePath, next, 'utf8');
    changed++;
    console.log('updated:', path.relative(featuresDir, filePath));
  }
}

const migratePath = path.join(__dirname, 'migrate-sge-lists.mjs');
let migrate = fs.readFileSync(migratePath, 'utf8');
const oldSnippet = `<td class="lst-grade__acoes">
                    <button type="button" class="lst-acao lst-acao--editar"`;
const newSnippet = `<td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações da linha">
                    <button type="button" class="lst-acao lst-acao--editar"`;
if (migrate.includes(oldSnippet) && !migrate.includes('<div class="lst-acoes"')) {
  migrate = migrate.replace(
    /<td class="lst-grade__acoes">\s*\n\s*<button type="button" class="lst-acao lst-acao--editar"[\s\S]*?<\/button>\s*\n\s*<\/td>/,
    `<td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações da linha">
                    <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar" (click)="goEdit(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="pencil" [tamanho]="16" />
                    </button>
                    </div>
                  </td>`,
  );
  fs.writeFileSync(migratePath, migrate, 'utf8');
  console.log('updated: migrate-sge-lists.mjs');
}

console.log(`Done. ${changed} component(s) updated.`);
