import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { Paginacao } from '../../shared/paginacao';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista, agendarPrimeiraCargaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { finalizarCarregamentoListaErro, finalizarCarregamentoListaSucesso, iniciarCarregamentoLista } from '../../shared/lista-sge/lista-sge-erro.util';
import { PagedResult } from '../../core/models/paged-result';
import { PermissionService } from '../../core/services/permission.service';
import { FuncaoColaborador } from './funcaocolaborador.model';
import { FuncaoColaboradorService } from './funcaocolaborador.service';

@Component({
  selector: 'app-funcaocolaborador-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Funções de colaborador</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Funções de colaborador</h1>
              <p class="lst-subtitulo">Catálogo global usado nos dados profissionais</p>
            </div>
            <button type="button" class="btn-novo" *ngIf="podeIncluir" (click)="goNovo()">Nova função</button>
          </div>
        </header>
        <section class="lst-card lst-painel">
          <div class="lst-filtros">
            <div class="lst-filtros__corpo">
              <div class="lst-filtros__grade">
                <div class="form-group">
                  <label for="fn-filtro">Descrição</label>
                  <input id="fn-filtro" type="search" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" />
                </div>
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
              </div>
            </div>
          </div>
          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length; else vazio">
              <thead><tr><th>Descrição</th><th class="lst-grade__acoes">Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td>{{ item.descricao }}</td>
                  <td class="lst-grade__acoes">
                    <button type="button" class="lst-acao lst-acao--editar" (click)="goEdit(item)"><app-icone nome="pencil" [tamanho]="16" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #vazio><p class="lst-vazio">{{ loading ? 'Carregando...' : 'Nenhuma função cadastrada' }}</p></ng-template>
          </div>
          <div class="lst-rodape">
            <app-paginacao modo="sge" rotulo="funções" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `
})
export class FuncaoColaboradorListComponent implements OnInit {
  paged: PagedResult<FuncaoColaborador> | null = null;
  loading = false;
  erroCarregamento: string | null = null;
  filterText = '';
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;

  constructor(private api: FuncaoColaboradorService, private router: Router, private permissions: PermissionService) {}

  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get podeIncluir(): boolean { return this.permissions.can('FUNCAOCOLABORADOR', 'Incluir'); }

  ngOnInit(): void { agendarPrimeiraCargaLista(() => this.loadPage(1)); }

  aplicarTamanhoPagina(novo: number): void {
    const ctx = { pagina: this.page, total: this.totalCount, tamanhoPagina: this.pageSize, itens: this.paged?.items ?? [], carregar: () => this.loadPage(this.page) };
    ajustarTamanhoPaginaLista(ctx, novo);
    this.page = ctx.pagina;
    this.pageSize = ctx.tamanhoPagina;
  }

  applyFilter(): void { this.loadPage(1); }

  loadPage(p: number): void {
    this.page = p;
    iniciarCarregamentoLista(this);
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.api.getPaged(this.page, this.pageSize, f).subscribe({
      next: r => { this.paged = r; finalizarCarregamentoListaSucesso(this); },
      error: e => finalizarCarregamentoListaErro(this, e)
    });
  }

  goNovo(): void { void this.router.navigate(['/funcaocolaborador', 'novo']); }
  goEdit(item: FuncaoColaborador): void { void this.router.navigate(['/funcaocolaborador', item.idFuncaoColaborador]); }
}
