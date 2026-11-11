import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PagedResult } from '../../core/models/paged-result';
import { DespesaService } from './despesa.service';
import { Despesa } from './despesa.model';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';

@Component({
  selector: 'app-despesa-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao, ConfirmarExclusaoComponent],
    template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Despesa</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Despesa</h1>
              <p class="lst-subtitulo">Visualize e gerencie os despesas cadastrados no AppCondominium</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Novo Despesa</button>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-painel">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            
            <div class="lst-filtros__corpo" id="lst-filtros-painel" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade">
                <div class="form-group">
                <input type="search" aria-label="Filtro" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" minlength="3" placeholder="Digite pelo menos 3 caracteres" />
              </div>
              </div>
              <div class="lst-filtros__acoes">
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="clearFilter()">Limpar</button>
              </div>
            </div>
          </div>
          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length; else lstEmpty">
              <thead><tr><th scope="col">IdFornecedor</th><th scope="col" class="lst-col--conteudo">Id Concorrência</th><th scope="col">idTipoDespesa</th><th scope="col">DataDespesa</th><th scope="col" class="lst-col--conteudo">Descricao</th><th scope="col">DataLancamento</th><th scope="col" class="lst-grade__acoes">Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td>{{ item.idFornecedor }}</td><td class="lst-col--conteudo">{{ item.idConcorrencia }}</td><td>{{ item.idTipoDespesa }}</td><td>{{ item.dataDespesa }}</td><td class="lst-col--conteudo">{{ item.descricao }}</td><td>{{ item.dataLancamento }}</td>
                  <td class="lst-grade__acoes">
                    <button *ngIf="podeExcluir" type="button" class="lst-acao lst-acao--excluir" title="Excluir" aria-label="Excluir" (click)="solicitarExclusao(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="trash" [tamanho]="16" />
                    </button>
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
            <app-paginacao modo="sge" rotulo="despesas" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusaoMetodo()" />
  
    </div>
  `,})
export class DespesaListComponent implements OnInit {
  paged: PagedResult<Despesa> | null = null;
  loading = false;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get totalPages(): number { return this.paged?.totalPages ?? 0; }

  readonly permissionKey = 'DESPESA';
  confirmarExclusao = false;
  excluindo = false;
  itemExcluir: Despesa | null = null;

  get podeExcluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Excluir');
  }

  solicitarExclusao(item: Despesa): void {
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
    this.service.delete(item.idDespesa!).subscribe({
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

  constructor(private service: DespesaService, private router: Router, private permissions: PermissionService, private toast: ToastService) {}

  ngOnInit(): void { this.loadPage(1); }

  applyFilter(): void { this.page = 1; this.loadPage(1); }

  clearFilter(): void { this.filterText = ''; this.applyFilter(); }

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

  goNovo(): void { this.router.navigate(['/despesa', 'novo']); }
  goEdit(item: Despesa): void {
    this.router.navigate(['/despesa', item.idDespesa]);
  }
}
