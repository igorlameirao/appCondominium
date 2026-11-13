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

function routeFromFile(file) {
  const folder = path.basename(path.dirname(file)).replace(/-/g, '');
  // folder is like municipio, banco — route uses kebab from dirname
  return '/' + path.basename(path.dirname(file));
}

function extractTitle(src) {
  const m = src.match(/<h2>([^<]+)<\/h2>/);
  return m ? m[1].trim() : 'Registros';
}

function extractColumns(src) {
  const head = src.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/);
  if (!head) return [];
  const ths = [...head[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => m[1].trim());
  const body = src.match(/<tr \*ngFor="let item of paged\?\.items"[^>]*>[\s\S]*?<\/tr>/);
  if (!body) return ths.map((h, i) => ({ header: h, cell: '', contentCol: i === 1 }));
  const tds = [...body[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].trim());
  return ths.map((header, i) => ({
    header,
    cell: tds[i] ?? '',
    contentCol: i === 1 || /nome|descri/i.test(header),
  }));
}

function pluralize(title) {
  const t = title.toLowerCase();
  if (t.endsWith('ão')) return t.slice(0, -2) + 'ões';
  if (t.endsWith('m')) return t + 's';
  return t + 's';
}

function buildTemplate(entityRoute, title, columns) {
  const plural = pluralize(title);
  const colHeaders = columns.map(c => {
    const cls = c.contentCol ? ' class="lst-col--conteudo"' : '';
    return `<th scope="col"${cls}>${c.header}</th>`;
  }).join('');
  const colCells = columns.map(c => {
    const cls = c.contentCol ? ' class="lst-col--conteudo"' : '';
    return `<td${cls}>${c.cell}</td>`;
  }).join('');

  return `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">${title}</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">${title}</h1>
              <p class="lst-subtitulo">Visualize e gerencie os ${plural} cadastrados no AppCondominium</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Novo ${title}</button>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-painel">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            <motion *ngIf="!filtrosRecolhidos" />
          </div>
          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length; else lstEmpty">
              <thead><tr>${colHeaders}<th scope="col" class="lst-grade__acoes">Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  ${colCells}
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações da linha">
                    <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar" (click)="goEdit(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="pencil" [tamanho]="16" />
                    </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #lstEmpty>
              <p class="lst-vazio" *ngIf="loading">Carregando...</p>
              <p class="lst-vazio" *ngIf="!loading">Nenhum registro encontrado.</p>
            </ng-template>
          </div>
          <div class="lst-rodape">
            <app-paginacao modo="sge" rotulo="${plural}" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `.replace('<motion *ngIf="!filtrosRecolhidos" />', `
            <div class="lst-filtros__corpo" id="lst-filtros-painel" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade">
                <h3 class="visually-hidden">Filtro</h3>
                <input type="search" aria-label="Filtro" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" minlength="3" placeholder="Digite pelo menos 3 caracteres" />
              </div>
              <div class="lst-filtros__acoes">
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="clearFilter()">Limpar</button>
              </div>
            </div>`);
}

function patchTs(src, entityRoute) {
  src = src.replace(/\r\n/g, '\n');
  if (!src.includes('RouterLink')) {
    src = src.replace(
      "import { Router } from '@angular/router';",
      "import { Router, RouterLink } from '@angular/router';"
    );
  }
  if (!src.includes('Icone')) {
    src = src.replace(
      "import { CommonModule } from '@angular/common';",
      "import { CommonModule } from '@angular/common';\nimport { Icone } from '../../shared/icone';"
    );
  }
  if (!src.includes('ListaSgeViewport')) {
    src = src.replace(
      /import { LIST_CARD_HUG_LAYOUT_STYLES }[^\n]+\n/,
      "import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';\nimport { Paginacao } from '../../shared/paginacao';\nimport { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';\n"
    );
  }
  src = src.replace(/import { PaginationComponent }[^\n]+\n/, '');
  src = src.replace(/import { ListLoadingModalComponent }[^\n]+\n/, '');
  src = src.replace(/styles: \[LIST_CARD_HUG_LAYOUT_STYLES\],\n/, '');
  src = src.replace(
    /imports: \[CommonModule, FormsModule, PaginationComponent, ListLoadingModalComponent\]/,
    'imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao]'
  );
  if (!src.includes('filtrosRecolhidos')) {
    src = src.replace('pageSize = 20;', 'pageSize = TAMANHO_PAGINA_LISTA_PADRAO;\n  filtrosRecolhidos = false;');
  }
  if (!src.includes('aplicarTamanhoPagina')) {
    const insert = `
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
    src = src.replace(/\n  goNovo\(\)/, insert + '\n  goNovo()');
  }
  // remove row-click only navigation - already in template
  return src.replace(/\n/g, '\r\n');
}

const files = walkLists(features);
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const route = routeFromFile(file);
  const title = extractTitle(src);
  const cols = extractColumns(src);
  if (!cols.length) {
    console.error('skip columns', file);
    continue;
  }
  const template = buildTemplate(route, title, cols);
  if (!src.includes('lst-wrapper')) {
    src = src.replace(/template:\s*`[\s\S]*?`\s*,?/m, `template: \`${template}\`,`);
  }
  src = patchTs(src, route);
  fs.writeFileSync(file, src);
  console.log('ok', path.basename(file));
}
