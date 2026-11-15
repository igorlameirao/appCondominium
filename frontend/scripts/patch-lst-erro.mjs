import fs from 'fs';
import path from 'path';

const features = path.resolve('src/app/features');

const LST_EMPTY_OLD = `<ng-template #lstEmpty>
              <p class="lst-vazio" *ngIf="loading">Carregando...</p>
              <p class="lst-vazio" *ngIf="!loading">Nenhum registro encontrado.</p>
            </ng-template>`;

const LST_EMPTY_NEW = `<ng-template #lstEmpty>
              <p class="lst-vazio" *ngIf="loading">Carregando...</p>
              <div class="lst-vazio lst-vazio--bloco lst-vazio--erro" *ngIf="!loading && erroCarregamento" role="alert">
                <app-icone nome="alert-circle" [tamanho]="28" />
                <p class="lst-vazio__titulo">Falha ao carregar</p>
                <p class="lst-vazio__texto">{{ erroCarregamento }}</p>
              </div>
              <p class="lst-vazio" *ngIf="!loading && !erroCarregamento">Nenhum registro encontrado.</p>
            </ng-template>`;

const ERROR_BLOCK_OLD = /error: \(\) => \{\s*this\.paged = \{ items: \[\], totalCount: 0, page: 1, pageSize: this\.pageSize, totalPages: 0, hasPreviousPage: false, hasNextPage: false \};\s*this\.loading = false;\s*\}/g;

const ERROR_BLOCK_NEW = `error: (e) => finalizarCarregamentoListaErro(this, e)`;

const LOADING_START = /(loadPage\(p: number\): void \{\s*this\.page = p;\s*)this\.loading = true;/g;
const LOADING_REPLACE = `$1iniciarCarregamentoLista(this);`;

const SUCCESS_OLD = /next: \(r\) => \{ this\.paged = r; this\.loading = false; \}/g;
const SUCCESS_OLD2 = /next: \(r\) => \{ this\.paged = r; this\.loading = false; \},/g;
const SUCCESS_NEW = `next: (r) => { this.paged = r; finalizarCarregamentoListaSucesso(this); }`;

const TABLE_IF_OLD = '*ngIf="paged?.items?.length; else lstEmpty"';
const TABLE_IF_NEW = '*ngIf="paged?.items?.length && !erroCarregamento; else lstEmpty"';

function walkLists(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkLists(full, acc);
    else if (name.endsWith('-list.component.ts')) acc.push(full);
  }
  return acc;
}

function patchFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('lst-wrapper')) return false;
  if (src.includes('erroCarregamento')) return false;

  if (!src.includes(LST_EMPTY_OLD) && src.includes('Nenhum registro encontrado')) {
    src = src.replace(
      /<p class="lst-vazio" \*ngIf="!loading">Nenhum registro encontrado\.<\/p>/,
      `<div class="lst-vazio lst-vazio--bloco lst-vazio--erro" *ngIf="!loading && erroCarregamento" role="alert">
                <app-icone nome="alert-circle" [tamanho]="28" />
                <p class="lst-vazio__titulo">Falha ao carregar</p>
                <p class="lst-vazio__texto">{{ erroCarregamento }}</p>
              </div>
              <p class="lst-vazio" *ngIf="!loading && !erroCarregamento">Nenhum registro encontrado.</p>`
    );
  } else if (src.includes(LST_EMPTY_OLD)) {
    src = src.replace(LST_EMPTY_OLD, LST_EMPTY_NEW);
  }

  if (src.includes(TABLE_IF_OLD)) {
    src = src.replaceAll(TABLE_IF_OLD, TABLE_IF_NEW);
  }

  if (!src.includes('lista-sge-erro.util')) {
    src = src.replace(
      /(import { TAMANHO_PAGINA_LISTA_PADRAO[^\n]+\n)/,
      `$1import {\n  iniciarCarregamentoLista,\n  finalizarCarregamentoListaSucesso,\n  finalizarCarregamentoListaErro,\n} from '../../shared/lista-sge/lista-sge-erro.util';\n`
    );
    if (!src.includes('lista-sge-erro.util')) {
      src = src.replace(
        /(import { ListaSgeViewport }[^\n]+\n)/,
        `$1import {\n  iniciarCarregamentoLista,\n  finalizarCarregamentoListaSucesso,\n  finalizarCarregamentoListaErro,\n} from '../../shared/lista-sge/lista-sge-erro.util';\n`
      );
    }
  }

  if (!src.includes('erroCarregamento: string | null = null')) {
    src = src.replace(
      /(loading = false;\n)/,
      `$1  erroCarregamento: string | null = null;\n`
    );
  }

  if (src.match(ERROR_BLOCK_OLD)) {
    src = src.replace(ERROR_BLOCK_OLD, ERROR_BLOCK_NEW);
  }

  if (src.match(LOADING_START)) {
    src = src.replace(LOADING_START, LOADING_REPLACE);
  } else {
    src = src.replace(
      /(loadPage\(p: number\): void \{[\s\S]*?)this\.loading = true;/,
      (m, prefix) => {
        if (prefix.includes('iniciarCarregamentoLista')) return m;
        return `${prefix}iniciarCarregamentoLista(this);`;
      }
    );
  }

  src = src.replace(SUCCESS_OLD, SUCCESS_NEW);
  src = src.replace(/next: r => \{ this\.paged = r; this\.loading = false; \}/g, SUCCESS_NEW.replace('(r)', 'r'));

  fs.writeFileSync(file, src);
  return true;
}

const files = walkLists(features);
let n = 0;
for (const file of files) {
  if (patchFile(file)) {
    console.log('patched', path.basename(file));
    n++;
  }
}
console.log('total', n);