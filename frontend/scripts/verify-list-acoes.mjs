/**
 * Compara ações de listagem com o baseline Git (antes da regressão lst-*).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const featuresDir = path.join(__dirname, '../src/app/features');
const BASELINE = '6f516c6';

const CUSTOM_LISTS = new Set([
  'fila-email/fila-email-list.component.ts',
  'convite/convite-list.component.ts',
  'pessoas/pessoas-list.component.ts',
]);

function walkListFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkListFiles(full));
    else if (ent.name.endsWith('-list.component.ts')) out.push(full);
  }
  return out;
}

function relFromRepo(abs) {
  return path.relative(repoRoot, abs).replace(/\\/g, '/');
}

function gitShow(filePath) {
  try {
    return execSync(`git -C "${repoRoot}" show ${BASELINE}:${filePath}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

function detectActions(src) {
  const actions = new Set();
  if (src.includes('lst-acao--editar') || src.match(/lst-acao[^>]*title="Editar"/)) actions.add('editar');
  if (src.includes('lst-acao--excluir') || src.includes('nome="trash"')) actions.add('excluir');
  if (src.includes('lst-acao--visualizar') || src.includes('nome="eye"')) actions.add('visualizar');
  if (src.includes('Revogar')) actions.add('revogar');
  if (src.includes('Reenviar') || src.includes('reprocessar')) actions.add('reenviar');
  if (src.includes('podeExcluir')) actions.add('perm-excluir');
  if (src.includes('lst-acoes')) actions.add('wrapper-lst-acoes');
  return [...actions].sort();
}

function expectedForFile(rel, relFeature) {
  if (CUSTOM_LISTS.has(relFeature)) {
    const cur = fs.readFileSync(path.join(featuresDir, ...relFeature.split('/')), 'utf8');
    return { expected: detectActions(cur), note: 'lista customizada (espelho do atual como contrato)' };
  }
  const baseline = gitShow(rel);
  if (!baseline) return { expected: ['editar'], note: 'sem baseline hug' };
  return { expected: detectActions(baseline), note: `baseline ${BASELINE}` };
}

const rows = [];
let failures = 0;

for (const file of walkListFiles(featuresDir)) {
  const rel = relFromRepo(file);
  const relFeature = path.relative(featuresDir, file).replace(/\\/g, '/');
  const current = fs.readFileSync(file, 'utf8');
  const found = detectActions(current);
  const { expected, note } = expectedForFile(rel, relFeature);

  const missing = expected.filter((a) => !found.includes(a) && !['perm-excluir', 'wrapper-lst-acoes'].includes(a));
  const extra = found.filter((a) => !expected.includes(a) && !['perm-excluir', 'wrapper-lst-acoes'].includes(a));

  const ok = missing.length === 0;
  if (!ok) failures++;

  const restored = expected.includes('excluir') && found.includes('excluir');
  rows.push({
    cadastro: relFeature.replace('-list.component.ts', ''),
    antes: expected.join(', ') || '—',
    atual: found.join(', ') || '—',
    restaurado: restored ? 'sim' : expected.includes('excluir') ? 'não' : 'n/a',
    indisponivel: !expected.includes('excluir') ? (expected.includes('editar') ? 'sem excluir no baseline' : note) : '',
    ok: ok ? 'OK' : `falta: ${missing.join(', ')}${extra.length ? `; extra: ${extra.join(', ')}` : ''}`,
  });
}

console.log('| Cadastro | Antes (baseline) | Atual | Restaurado excluir | Observação | Teste |');
console.log('|----------|------------------|-------|----------------------|------------|-------|');
for (const r of rows.sort((a, b) => a.cadastro.localeCompare(b.cadastro))) {
  console.log(
    `| ${r.cadastro} | ${r.antes} | ${r.atual} | ${r.restaurado} | ${r.indisponivel || '—'} | ${r.ok} |`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} listagem(ns) com ações ausentes.`);
  process.exit(1);
}
console.log('\nTodas as listagens conferem com o baseline de ações.');