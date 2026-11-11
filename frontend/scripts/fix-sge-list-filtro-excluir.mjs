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

function patchList(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes('lst-acao--excluir') && src.includes('form-group')) {
    return { filePath, status: 'skip' };
  }

  const dir = path.dirname(filePath);
  const base = path.basename(filePath).replace('-list.component.ts', '');
  const formPath = path.join(dir, `${base}-form.component.ts`);
  if (!fs.existsSync(formPath)) {
    return { filePath, status: 'no-form' };
  }
  const formSrc = fs.readFileSync(formPath, 'utf8');
  const perm = formSrc.match(/readonly permissionKey = '([^']+)'/);
  if (!perm) return { filePath, status: 'no-perm' };

  const deleteExpr = buildDeleteExpr(src, formSrc);
  if (!deleteExpr) return { filePath, status: 'no-delete' };

  const goEditType = src.match(/goEdit\(item:\s*(\w+)\)/);
  const modelType = goEditType?.[1] ?? 'unknown';

  // Filtro: form-group
  src = src.replace(
    /<div class="lst-filtros__grade">\s*<h3 class="visually-hidden">Filtro<\/h3>\s*(<input[^>]+type="search"[^>]+\/>)/,
    '<div class="lst-filtros__grade">\n                <div class="form-group">\n                $1\n              </div>',
  );

  // Botão excluir antes do editar
  if (!src.includes('lst-acao--excluir')) {
    src = src.replace(
      /<td class="lst-grade__acoes">\s*<button type="button" class="lst-acao lst-acao--editar"/,
      `<td class="lst-grade__acoes">
                    <button *ngIf="podeExcluir" type="button" class="lst-acao lst-acao--excluir" title="Excluir" aria-label="Excluir" (click)="solicitarExclusao(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="trash" [tamanho]="16" />
                    </button>
                    <button type="button" class="lst-acao lst-acao--editar"`,
    );
  }

  // Modal confirmação
  if (!src.includes('app-confirmar-exclusao')) {
    src = src.replace(
      /(\s*<\/div>\s*\n\s*`\s*,\}\)\s*export)/,
      `
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusao()" />
  $1`,
    );
  }

  // Imports
  if (!src.includes('PermissionService')) {
    src = src.replace(
      /import \{ (\w+) \} from '\.\/\1\.model';/,
      (m, name) =>
        `${m}\nimport { PermissionService } from '../../core/services/permission.service';\nimport { ToastService } from '../../core/services/toast.service';\nimport { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';`,
    );
  }

  if (!src.includes('ConfirmarExclusaoComponent')) {
    src = src.replace(
      /imports: \[([^\]]+)\]/,
      (m, inner) => `imports: [${inner}, ConfirmarExclusaoComponent]`,
    );
  }

  // Class fields + constructor + methods
  if (!src.includes('podeExcluir')) {
    const methods = `
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

  confirmarExclusao(): void {
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
      /constructor\(private service: (\w+), private router: Router\) \{\}/,
      `constructor(
    private service: $1,
    private router: Router,
    private permissions: PermissionService,
    private toast: ToastService,
  ) {}${methods}`,
    );

    // fallback constructor with only service
    if (!src.includes('private permissions: PermissionService')) {
      src = src.replace(
        /constructor\(([^)]+)\) \{\}/,
        (m, params) => {
          if (m.includes('permissions')) return m;
          return `constructor(${params}, private permissions: PermissionService, private toast: ToastService) {}${methods}`;
        },
      );
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  return { filePath, status: 'patched' };
}

const files = walkListFiles(featuresDir);
const results = files.map(patchList);
for (const r of results) {
  console.log(`${r.status.padEnd(10)} ${path.relative(featuresDir, r.filePath)}`);
}
const counts = results.reduce((a, r) => {
  a[r.status] = (a[r.status] || 0) + 1;
  return a;
}, {});
console.log(counts);
