import fs from 'fs';
import path from 'path';

const features = path.resolve('src/app/features');

function walkLists(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkLists(full, acc);
    else if (name.endsWith('-list.component.ts')) acc.push(full);
  }
  return acc;
}

const IMPORTS = `import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
`;

const APLICAR = `
  aplicarTamanhoPagina(novo: number): void {
    const ctx = {
      pagina: this.page,
      total: this.totalCount,
      tamanhoPagina: this.pageSize,
      itens: this.paged?.items ?? [],
      carregar: () => this.loadPage(this.page),
    };
    ajustarTamanhoPaginaLista(ctx, novo);
    this.page = ctx.pagina;
    this.pageSize = ctx.tamanhoPagina;
  }
`;

const CLEAR = `
  clearFilter(): void {
    this.filterText = '';
    this.page = 1;
    this.loadPage(1);
  }
`;

for (const file of walkLists(features)) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('lst-wrapper') || !src.includes('lstSgeViewport')) continue;

  let changed = false;

  if (!src.includes("from '../../shared/lista-sge/lista-sge-viewport.directive'")) {
    const anchor = src.match(/^import .+;\r?\n/m);
    if (anchor) {
      src = src.replace(anchor[0], anchor[0] + IMPORTS);
      changed = true;
    }
  }

  if (!src.includes('filtrosRecolhidos = false')) {
    src = src.replace(/pageSize = 20;/, 'pageSize = TAMANHO_PAGINA_LISTA_PADRAO;\n  filtrosRecolhidos = false;');
    src = src.replace(/pageSize = TAMANHO_PAGINA_LISTA_PADRAO;\r?\n  filtrosRecolhidos = false;\r?\n  filtrosRecolhidos = false;/,
      'pageSize = TAMANHO_PAGINA_LISTA_PADRAO;\n  filtrosRecolhidos = false;');
    changed = true;
  }

  if (!src.includes('aplicarTamanhoPagina(novo')) {
    src = src.replace(/\n  goNovo\(\)/, APLICAR + '\n  goNovo()');
    changed = true;
  }

  if (src.includes('clearFilter()') && !src.includes('clearFilter(): void')) {
    src = src.replace(
      /applyFilter\(\): void \{ this\.page = 1; this\.loadPage\(1\); \}/,
      `applyFilter(): void { this.page = 1; this.loadPage(1); }${CLEAR}`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, src);
    console.log('fixed', path.basename(file));
  }
}