import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PagedResult } from '../../core/models/paged-result';
import { BancoService } from './banco.service';
import { Banco } from './banco.model';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';
import { mascaraCnpj } from '../../core/utils/documento-validator';
import { LstSituacaoCadastralComponent } from '../../shared/lst-situacao-cadastral/lst-situacao-cadastral.component';

@Component({
  selector: 'app-banco-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao, ConfirmarExclusaoComponent, LstSituacaoCadastralComponent],
    template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Banco</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Banco</h1>
              <p class="lst-subtitulo">Visualize e gerencie os bancos cadastrados no AppCondominium</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Novo Banco</button>
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
                <input type="search" aria-label="Buscar por código, nome ou ISPB" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" minlength="3" placeholder="Código, nome ou ISPB (mín. 3 caracteres)" />
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
              <thead><tr><th scope="col">Código</th><th scope="col" class="lst-col--conteudo">Nome</th><th scope="col">ISPB</th><th scope="col">CNPJ</th><th scope="col" class="lst-col--situacao">Situação</th><th scope="col" class="lst-grade__acoes">Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td>{{ item.codigoBanco }}</td><td class="lst-col--conteudo">{{ item.nome }}</td><td>{{ item.ispb }}</td><td>{{ cnpjExibicao(item.cnpj) }}</td>
                  <td class="lst-col--situacao"><app-lst-situacao-cadastral [valor]="item.ativo" /></td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações da linha">
<button *ngIf="podeExcluir" type="button" class="lst-acao lst-acao--excluir" title="Excluir" aria-label="Excluir" (click)="solicitarExclusao(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="trash" [tamanho]="16" />
                    </button>
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
            <app-paginacao modo="sge" rotulo="bancos" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusaoMetodo()" />
  
    </div>
  `,})
export class BancoListComponent implements OnInit {
  paged: PagedResult<Banco> | null = null;
  loading = false;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get totalPages(): number { return this.paged?.totalPages ?? 0; }

  readonly permissionKey = 'BANCO';
  confirmarExclusao = false;
  excluindo = false;
  itemExcluir: Banco | null = null;

  get podeExcluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Excluir');
  }

  solicitarExclusao(item: Banco): void {
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
    this.service.delete(item.idBanco!).subscribe({
      next: () => {
        this.excluindo = false;
        this.confirmarExclusao = false;
        this.itemExcluir = null;
        this.loadPage(this.page);
      },
      error: (e: unknown) => {
        this.excluindo = false;
        const err = (e as any)?.error;
        this.toast.showError(typeof err === 'string' && err ? err : 'Não foi possível excluir. Tente novamente.');
      },
    });
  }

  cnpjExibicao(cnpj: string | null | undefined): string {
    return cnpj ? mascaraCnpj(cnpj) : '';
  }

  constructor(private service: BancoService, private router: Router, private permissions: PermissionService, private toast: ToastService) {}

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

  goNovo(): void { this.router.navigate(['/banco', 'novo']); }
  goEdit(item: Banco): void {
    this.router.navigate(['/banco', item.idBanco]);
  }
}
