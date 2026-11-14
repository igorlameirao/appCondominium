import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PermissionService } from '../../core/services/permission.service';
import { PessoaConsultaService, PessoaListagemItem } from '../../core/services/pessoa-consulta.service';
import { PagedResult } from '../../core/models/paged-result';

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Pessoas</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Pessoas</h1>
              <p class="lst-subtitulo">Hub de pessoas físicas e jurídicas com vínculos no condomínio</p>
            </div>
            <div class="lst-cabecalho__acoes" *ngIf="canPf || canPj">
              <button type="button" class="btn-novo" *ngIf="canPf" (click)="novaPf()">Nova PF</button>
              <button type="button" class="btn-novo" *ngIf="canPj" (click)="novaPj()">Nova PJ</button>
            </div>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-pessoas">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            <div class="lst-filtros__corpo" id="lst-filtros-pessoas" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade lst-filtros__grade--pessoas">
                <input type="search" aria-label="Filtro por nome ou documento" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" placeholder="Nome, CPF ou CNPJ (mín. 3)" />
                <select aria-label="Tipo de pessoa" [(ngModel)]="filtroTipo" (change)="applyFilter()">
                  <option value="">Tipo: todos</option>
                  <option value="PF">Pessoa física</option>
                  <option value="PJ">Pessoa jurídica</option>
                </select>
                <select aria-label="Situação do vínculo" [(ngModel)]="filtroSituacao" (change)="applyFilter()">
                  <option value="">Situação: todas</option>
                  <option value="ativo">Com vínculo ativo</option>
                  <option value="encerrado">Somente histórico</option>
                </select>
              </div>
              <div class="lst-filtros__acoes">
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="clearFilter()">Limpar</button>
              </div>
            </div>
          </div>

          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length; else lstEmpty">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col" class="lst-col--conteudo">Nome</th>
                  <th scope="col">CPF/CNPJ</th>
                  <th scope="col">Complemento</th>
                  <th scope="col">Situação</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="abrir(item)">
                  <td>{{ item.tipo }}</td>
                  <td class="lst-col--conteudo">{{ item.nome }}</td>
                  <td>{{ item.cpfcnpj ?? '—' }}</td>
                  <td>{{ item.complemento ?? '—' }}</td>
                  <td><span [class.lst-situacao--inativa]="item.situacaoVinculo !== 'Ativo'">{{ item.situacaoVinculo }}</span></td>
                  <td class="lst-grade__acoes">
                    <button type="button" class="lst-acao lst-acao--editar" title="Abrir detalhe" aria-label="Abrir detalhe" (click)="abrir(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="pencil" [tamanho]="16" />
                    </button>
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
            <app-paginacao modo="sge" rotulo="pessoas" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `.lst-filtros__grade--pessoas { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; }`,
    `@media (max-width: 720px) { .lst-filtros__grade--pessoas { grid-template-columns: 1fr; } }`,
    `.lst-cabecalho__acoes { display: flex; gap: 8px; flex-wrap: wrap; }`
  ]
})
export class PessoasListComponent implements OnInit {
  paged: PagedResult<PessoaListagemItem> | null = null;
  loading = false;
  filterText = '';
  filtroTipo: '' | 'PF' | 'PJ' = '';
  filtroSituacao: '' | 'ativo' | 'encerrado' = '';
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;

  constructor(
    private consulta: PessoaConsultaService,
    private router: Router,
    private permissions: PermissionService
  ) {}

  get canPf(): boolean { return this.permissions.can('PESSOAFISICA', 'Incluir'); }
  get canPj(): boolean { return this.permissions.can('PESSOAJURIDICA', 'Incluir'); }
  get totalCount(): number { return this.paged?.totalCount ?? 0; }

  ngOnInit(): void { this.loadPage(1); }

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

  applyFilter(): void { this.page = 1; this.loadPage(1); }

  clearFilter(): void {
    this.filterText = '';
    this.filtroTipo = '';
    this.filtroSituacao = '';
    this.page = 1;
    this.loadPage(1);
  }

  loadPage(p: number): void {
    this.page = p;
    this.loading = true;
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.consulta.listar(this.page, this.pageSize, f, this.filtroTipo, this.filtroSituacao).subscribe({
      next: r => { this.paged = r; this.loading = false; },
      error: () => {
        this.paged = { items: [], totalCount: 0, page: 1, pageSize: this.pageSize, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
        this.loading = false;
      }
    });
  }

  abrir(item: PessoaListagemItem): void {
    const tipo = item.tipo === 'PJ' ? 'PJ' : 'PF';
    void this.router.navigate(['/pessoas', item.idPessoa], { queryParams: { tipo } });
  }

  novaPf(): void { void this.router.navigate(['/pessoafisica', 'novo'], { queryParams: { retorno: '/pessoas' } }); }
  novaPj(): void { void this.router.navigate(['/pessoajuridica', 'novo'], { queryParams: { retorno: '/pessoas' } }); }
}