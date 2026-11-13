import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PagedResult } from '../../core/models/paged-result';
import { UnidadeService } from './unidade.service';
import { Unidade } from './unidade.model';
import { HidrometroService } from '../hidrometro/hidrometro.service';
import { TipoUnidadeService } from '../tipounidade/tipounidade.service';
import { BlocoService } from '../bloco/bloco.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';

@Component({
  selector: 'app-unidade-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao, ConfirmarExclusaoComponent],
  styles: [`
    .lst-lote-menu { position: relative; }
    .lst-lote-menu__trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .lst-lote-menu__painel {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      min-width: 11rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
      z-index: 30;
      padding: 4px;
    }
    .lst-lote-menu__item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }
    .lst-lote-menu__item:hover,
    .lst-lote-menu__item:focus-visible {
      background: #f1f5f9;
      outline: none;
    }
  `],
    template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Unidade</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Unidade</h1>
              <p class="lst-subtitulo">Visualize e gerencie os unidades cadastrados no AppCondominium</p>
            </div>
            <div class="lst-cabecalho__acoes">
              <div class="lst-lote-menu" *ngIf="podeIncluir">
                <button
                  type="button"
                  class="btn-secondary lst-lote-menu__trigger"
                  (click)="alternarMenuLote($event)"
                  [attr.aria-expanded]="menuLoteAberto"
                  aria-haspopup="menu">
                  Incluir em Lote
                  <app-icone nome="chevron-down" [tamanho]="16" />
                </button>
                <div class="lst-lote-menu__painel" *ngIf="menuLoteAberto" role="menu" (click)="$event.stopPropagation()">
                  <button type="button" class="lst-lote-menu__item" role="menuitem" (click)="goLoteUnidades()">Unidades</button>
                  <button type="button" class="lst-lote-menu__item" role="menuitem" (click)="goCopiarBloco()">Copiar Bloco</button>
                </div>
              </div>
              <button type="button" class="btn-novo" *ngIf="podeIncluir" (click)="goNovo()">Nova Unidade</button>
            </div>
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
              <thead><tr><th scope="col">Id Unidade</th><th scope="col" class="lst-col--conteudo">Bloco</th><th scope="col">Número</th><th scope="col">Tipo da Unidade</th><th scope="col">Hidrômetro</th><th scope="col" class="lst-grade__acoes">Ações</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td>{{ item.idUnidade }}</td><td class="lst-col--conteudo">{{ descricaoBloco(item.idBloco) }}</td><td>{{ item.numero }}</td><td>{{ descricaoTipoUnidade(item.idTipoUnidade) }}</td><td>{{ numeroSerieHidrometro(item.idHidrometro) }}</td>
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
            <app-paginacao modo="sge" rotulo="unidades" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusaoMetodo()" />
  
    </div>
  `,})
export class UnidadeListComponent implements OnInit {
  paged: PagedResult<Unidade> | null = null;
  loading = false;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get totalPages(): number { return this.paged?.totalPages ?? 0; }

  readonly permissionKey = 'UNIDADE';
  confirmarExclusao = false;
  excluindo = false;
  itemExcluir: Unidade | null = null;
  menuLoteAberto = false;
  private readonly numeroSeriePorHidrometro = new Map<number, string>();
  private readonly descricaoPorTipoUnidade = new Map<number, string>();
  private readonly descricaoPorBloco = new Map<number, string>();

  get podeExcluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Excluir');
  }

  get podeIncluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Incluir');
  }

  solicitarExclusao(item: Unidade): void {
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
    this.service.delete(item.idUnidade!).subscribe({
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

  constructor(
    private service: UnidadeService,
    private hidrometroService: HidrometroService,
    private tipoUnidadeService: TipoUnidadeService,
    private blocoService: BlocoService,
    private router: Router,
    private permissions: PermissionService,
    private toast: ToastService,
  ) {}

  numeroSerieHidrometro(idHidrometro?: number): string {
    if (idHidrometro == null) return '';
    return this.numeroSeriePorHidrometro.get(idHidrometro) ?? '';
  }

  descricaoTipoUnidade(idTipoUnidade?: number): string {
    if (idTipoUnidade == null) return '';
    return this.descricaoPorTipoUnidade.get(idTipoUnidade) ?? '';
  }

  descricaoBloco(idBloco?: number): string {
    if (idBloco == null) return '';
    return this.descricaoPorBloco.get(idBloco) ?? '';
  }

  ngOnInit(): void {
    this.blocoService.getPaged(1, 500).subscribe({
      next: (r) => {
        for (const b of r.items) {
          if (b.idBloco != null && b.descricao) {
            this.descricaoPorBloco.set(b.idBloco, b.descricao);
          }
        }
      },
    });
    this.tipoUnidadeService.getPaged(1, 500).subscribe({
      next: (r) => {
        for (const t of r.items) {
          if (t.idTipoUnidade != null && t.descricao) {
            this.descricaoPorTipoUnidade.set(t.idTipoUnidade, t.descricao);
          }
        }
      },
    });
    this.hidrometroService.getPaged(1, 500).subscribe({
      next: (r) => {
        for (const h of r.items) {
          if (h.idHidrometro != null && h.numeroSerie) {
            this.numeroSeriePorHidrometro.set(h.idHidrometro, h.numeroSerie);
          }
        }
      },
    });
    this.loadPage(1);
  }

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

  @HostListener('document:click')
  fecharMenuLote(): void {
    this.menuLoteAberto = false;
  }

  alternarMenuLote(event: MouseEvent): void {
    event.stopPropagation();
    this.menuLoteAberto = !this.menuLoteAberto;
  }

  goNovo(): void { this.router.navigate(['/unidade', 'novo']); }

  goLoteUnidades(): void {
    this.menuLoteAberto = false;
    this.router.navigate(['/unidade', 'lote']);
  }

  goCopiarBloco(): void {
    this.menuLoteAberto = false;
    this.router.navigate(['/unidade', 'copiar-bloco']);
  }
  goEdit(item: Unidade): void {
    this.router.navigate(['/unidade', item.idUnidade]);
  }
}
