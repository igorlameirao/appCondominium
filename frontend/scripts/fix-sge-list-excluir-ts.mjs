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
    else if (ent.name.endsWith('-list.component.ts')) out.push(full);
  }
  return [...new Set(out)];
}

function buildDeleteExpr(listSrc, formSrc) {
  const formDel = formSrc.match(/this\.service\.delete\(([^)]+)\)\.subscribe/);
  if (!formDel) return null;
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

function patchTs(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('lst-acao--excluir')) return { filePath, status: 'no-ui' };
  if (src.includes('readonly permissionKey')) return { filePath, status: 'ok' };

  const dir = path.dirname(filePath);
  const base = path.basename(filePath).replace('-list.component.ts', '');
  const formSrc = fs.readFileSync(path.join(dir, `${base}-form.component.ts`), 'utf8');
  const perm = formSrc.match(/readonly permissionKey = '([^']+)'/);
  if (!perm) return { filePath, status: 'no-perm' };

  const deleteExpr = buildDeleteExpr(src, formSrc);
  if (!deleteExpr) return { filePath, status: 'no-delete' };

  const goEditType = src.match(/goEdit\(item:\s*(\w+)\)/);
  const modelType = goEditType?.[1] ?? 'unknown';

  if (!src.includes("ConfirmarExclusaoComponent")) {
    src = src.replace(
      /(import .+ from '\.\/[^']+\.model';)/,
      `$1\nimport { PermissionService } from '../../core/services/permission.service';\nimport { ToastService } from '../../core/services/toast.service';\nimport { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';`,
    );
  }
  if (!src.includes('ConfirmarExclusaoComponent,')) {
    src = src.replace(/imports: \[([^\]]+)\]/, (m, inner) => {
      if (inner.includes('ConfirmarExclusaoComponent')) return m;
      return `imports: [${inner}, ConfirmarExclusaoComponent]`;
    });
  }

  const fieldsAndMethods = `
  readonly permissionKey = '${perm[1]}';
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

  // Evita colisão de nome entre propriedade e método no template
  src = src.replace(/\(confirmar\)="confirmarExclusao\(\)"/g, '(confirmar)="confirmarExclusaoMetodo()"');

  src = src.replace(
    /constructor\((private service: \w+, private router: Router)\) \{\}/,
    `constructor($1, private permissions: PermissionService, private toast: ToastService) {}`,
  );

  src = src.replace(/(\n  constructor\(private service:)/, `${fieldsAndMethods}$1`);

  if (!src.includes('confirmarExclusaoMetodo')) {
    return { filePath, status: 'failed' };
  }

  fs.writeFileSync(filePath, src, 'utf8');
  return { filePath, status: 'patched' };
}

for (const f of walkListFiles(featuresDir)) {
  const r = patchTs(f);
  if (r.status !== 'ok') console.log(r.status, path.relative(featuresDir, r.filePath));
}
