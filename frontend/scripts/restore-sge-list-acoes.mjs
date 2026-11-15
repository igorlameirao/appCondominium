/**
 * Restaura ações de listagem lst-* removidas por migrate-sge-lists.mjs.
 * Referência: commit 6f516c6 (antes da regressão de migração em massa).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const featuresDir = path.join(__dirname, '../src/app/features');
const BASELINE = '6f516c6';

const SKIP_FILES = new Set([
  'fila-email/fila-email-list.component.ts',
  'convite/convite-list.component.ts',
  'pessoas/pessoas-list.component.ts',
  'permissoes/permissoes-perfil-lista.component.ts',
  'permissoes/permissoes-pessoa-lista.component.ts',
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

function baselineHadExcluir(rel) {
  const old = gitShow(rel);
  return old?.includes('lst-acao--excluir') ?? false;
}

function extractBaselineDeleteExpr(rel) {
  const old = gitShow(rel);
  if (!old) return null;
  const m = old.match(/(\s+)this\.service\.delete\(([^)]+)\)\.subscribe/);
  if (!m) return null;
  return `this.service.delete(${m[2].trim()})`;
}

function buildDeleteExpr(listSrc, formSrc, rel) {
  const baseline = extractBaselineDeleteExpr(rel);
  if (baseline) return baseline;

  const formDel = formSrc.match(/this\.service\.delete\(([^)]+)\)\.subscribe/);
  if (formDel) {
    let args = formDel[1].trim();
    if (args === 'id') {
      const m = listSrc.match(/goEdit\(item:\s*\w+\)[^{]*\{[^}]*navigate\(\[([^\]]+)\]/s);
      if (!m) return null;
      const tokens = [...m[1].matchAll(/item\.(\w+)/g)].map((x) => `item.${x[1]}`);
      if (!tokens.length) return null;
      return `this.service.delete(${tokens.join(', ')})`;
    }
    args = args.replace(/this\.model\.(\w+)!/g, 'item.$1!');
    args = args.replace(/this\.model\.(\w+)/g, 'item.$1');
    return `this.service.delete(${args})`;
  }
  return null;
}

function patchActionsCell(src) {
  if (src.includes('lst-acao--excluir')) return src;

  const cellRe =
    /(<td class="lst-grade__acoes">\s*)(?:(?:<div class="lst-acoes"[^>]*>\s*)?)?(<button type="button" class="lst-acao lst-acao--editar"[\s\S]*?<\/button>)(\s*(?:<\/div>\s*)?<\/td>)/g;

  return src.replace(cellRe, (_, tdOpen, editBtn, tdClose) => {
    const excluirBtn = `<button *ngIf="podeExcluir" type="button" class="lst-acao lst-acao--excluir" title="Excluir" aria-label="Excluir" (click)="solicitarExclusao(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="trash" [tamanho]="16" />
                    </button>
                    `;
    return `${tdOpen}<div class="lst-acoes" role="group" aria-label="Ações">
                    ${excluirBtn}${editBtn}
                    </div>${tdClose}`;
  });
}

function patchModal(src) {
  if (src.includes('app-confirmar-exclusao')) return src;
  return src.replace(
    /(\s*<\/div>\s*\n\s*`\s*,\}\)\s*export)/,
    `
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusaoMetodo()" />
  $1`,
  );
}

function ensureImports(src) {
  if (!src.includes('PermissionService')) {
    src = src.replace(
      /(import \{ \w+ \} from '\.\/[^']+\.model';)/,
      `$1
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';`,
    );
  }
  if (!/imports:\s*\[[^\]]*ConfirmarExclusaoComponent/.test(src)) {
    src = src.replace(/imports: \[([^\]]+)\]/, (m, inner) => `imports: [${inner}, ConfirmarExclusaoComponent]`);
  }
  return src;
}

function patchClass(src, permissionKey, modelType, deleteExpr) {
  if (src.includes('get podeExcluir():')) return src;

  const block = `
  readonly permissionKey = '${permissionKey}';
  confirmarExclusao = false;
  excluindo = false;
  itemExcluir: ${modelType} | null = null;

  get podeExcluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Excluir');
  }

  solicitarExclusao(item: ${modelType}): void {
    this.itemExcluir = item;
    this.confirmarExclusao = true;
  }

  cancelarExclusao(): void {
    if (this.excluindo) return;
    this.confirmarExclusao = false;
    this.itemExcluir = null;
  }

  confirmarExclusaoMetodo(): void {
    const item = this.itemExcluir;
    if (this.excluindo || !item) return;
    this.excluindo = true;
    ${deleteExpr}.subscribe({
      next: () => {
        this.excluindo = false;
        this.confirmarExclusao = false;
        this.itemExcluir = null;
        this.loadPage(this.page);
      },
      error: () => {
        this.excluindo = false;
        this.toast.showError('Não foi possível excluir. Tente novamente.');
      },
    });
  }
`;

  src = src.replace(
    /constructor\((private service: \w+Service, private router: Router)\)\s*\{\}/,
    `constructor($1, private permissions: PermissionService, private toast: ToastService) {}${block}`,
  );
  if (!src.includes('get podeExcluir():')) {
    src = src.replace(
      /constructor\(([^)]+)\)\s*\{\}/,
      (m, params) => {
        if (params.includes('permissions') || !params.includes('service')) return m;
        return `constructor(${params}, private permissions: PermissionService, private toast: ToastService) {}${block}`;
      },
    );
  }
  if (!src.includes('get podeExcluir():')) {
    src = src.replace(/(export class \w+[^{]+\{)/, `$1${block}`);
  }
  return src;
}

function patchFile(filePath) {
  const rel = relFromRepo(filePath);
  const relFeature = path.relative(featuresDir, filePath).replace(/\\/g, '/');
  if (SKIP_FILES.has(relFeature)) return { rel: relFeature, status: 'skip-custom' };
  if (!fs.readFileSync(filePath, 'utf8').includes('lst-wrapper')) return { rel: relFeature, status: 'skip-no-lst' };

  const shouldExcluir = baselineHadExcluir(rel);
  if (!shouldExcluir) return { rel: relFeature, status: 'skip-no-baseline-excluir' };

  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes('lst-acao--excluir') && src.includes('get podeExcluir():')) {
    return { rel: relFeature, status: 'ok' };
  }

  const dir = path.dirname(filePath);
  const base = path.basename(filePath).replace('-list.component.ts', '');
  const formPath = path.join(dir, `${base}-form.component.ts`);
  const formSrc = fs.existsSync(formPath) ? fs.readFileSync(formPath, 'utf8') : '';
  const perm = formSrc.match(/readonly permissionKey = '([^']+)'/);
  const permissionKey = perm?.[1] ?? gitShow(rel)?.match(/readonly permissionKey = '([^']+)'/)?.[1];
  if (!permissionKey) return { rel: relFeature, status: 'no-perm' };

  const deleteExpr = buildDeleteExpr(src, formSrc, rel);
  if (!deleteExpr) return { rel: relFeature, status: 'no-delete-expr' };

  const goEditType = src.match(/goEdit\(item:\s*(\w+)\)/);
  const modelType = goEditType?.[1] ?? 'unknown';

  src = patchActionsCell(src);
  src = patchModal(src);
  src = ensureImports(src);
  src = patchClass(src, permissionKey, modelType, deleteExpr);

  if (!src.includes('lst-acao--excluir') || !src.includes('get podeExcluir():')) {
    return { rel: relFeature, status: 'failed' };
  }

  fs.writeFileSync(filePath, src, 'utf8');
  return { rel: relFeature, status: 'patched' };
}

const results = walkListFiles(featuresDir).map(patchFile);
for (const r of results.filter((x) => x.status !== 'skip-no-lst' && x.status !== 'skip-no-baseline-excluir')) {
  console.log(`${r.status.padEnd(22)} ${r.rel}`);
}
const counts = results.reduce((a, r) => {
  a[r.status] = (a[r.status] || 0) + 1;
  return a;
}, {});
console.log('---');
console.log(counts);