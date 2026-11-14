import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PagedResult } from '../../core/models/paged-result';
import { AutorizacaoAcessoTemporarioService } from './autorizacaoacessotemporario.service';
import { AutorizacaoAcessoTemporario } from './autorizacaoacessotemporario.model';

@Component({
  selector: 'app-autorizacaoacessotemporario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Autorizações temporárias</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Autorizações temporárias</h1>
              <p class="lst-subtitulo">Visitas, entregas e acessos temporários autorizados por unidade</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Nova autorização</button>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-auth">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            <div class="lst-filtros__corpo" id="lst-filtros-auth" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade">
                <input type="search" aria-label="Filtro" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" placeholder="Digite pelo menos 3 caracteres" />
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
                  <th scope="col" class="lst-col--conteudo">Nome visitante</th>
                  <th scope="col">Documento</th>
                  <th scope="col">Unidade</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Situação</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td class="lst-col--conteudo">{{ item.nomeVisitante ?? '—' }}</td>
                  <td>{{ item.documentoVisitante ?? '—' }}</td>
                  <td>{{ item.idUnidade ?? '—' }}</td>
                  <td>{{ item.dataHoraInicio }}</td>
                  <td>{{ item.dataHoraFim }}</td>
                  <td>{{ situacao(item) }}</td>
                  <td class="lst-grade__acoes">
                    <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar" (click)="goEdit(item)" (dblclick)="$event.stopPropagation()">
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
            <app-paginacao modo="sge" rotulo="autorizações" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `
})
export class AutorizacaoAcessoTemporarioListComponent implements OnInit {
  paged: PagedResult<AutorizacaoAcessoTemporario> | null = null;
  loading = false;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }

  constructor(private service: AutorizacaoAcessoTemporarioService, private router: Router) {}

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
    this.page = 1;
    this.loadPage(1);
  }

  loadPage(p: number): void {
    this.page = p;
    this.loading = true;
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.service.getPaged(this.page, this.pageSize, f).subscribe({
      next: (r) => { this.paged = r; this.loading = false; },
      error: () => {
        this.paged = { items: [], totalCount: 0, page: 1, pageSize: this.pageSize, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
        this.loading = false;
      }
    });
  }

  goNovo(): void { this.router.navigate(['/autorizacaoacessotemporario', 'novo']); }
  goEdit(item: AutorizacaoAcessoTemporario): void {
    this.router.navigate(['/autorizacaoacessotemporario', item.idAutorizacao]);
  }

  situacao(item: AutorizacaoAcessoTemporario): string {
    const now = new Date().toISOString();
    if (item.dataHoraFim && item.dataHoraFim < now) return 'Encerrada';
    if (item.dataHoraInicio && item.dataHoraInicio > now) return 'Futura';
    return 'Vigente';
  }
}