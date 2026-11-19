import { Component, OnInit } from '@angular/core';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista, agendarPrimeiraCargaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import {
  iniciarCarregamentoLista,
  finalizarCarregamentoListaSucesso,
  finalizarCarregamentoListaErro,
} from '../../shared/lista-sge/lista-sge-erro.util';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PagedResult } from '../../core/models/paged-result';
import { ConfiguracaoCondominioService } from './configuracaocondominio.service';
import { ConfiguracaoCondominio } from './configuracaocondominio.model';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';
import { LookupService } from '../../core/services/lookup.service';
import { parseCorHex } from '../../shared/cor-hex/cor-hex.util';
import { forkJoin, of, map, catchError } from 'rxjs';

@Component({
  selector: 'app-configuracaocondominio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao, ConfirmarExclusaoComponent],
  styles: [
    `
      .lst-config-cor {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .lst-config-cor__amostra {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        box-sizing: border-box;
      }
      .lst-config-cor__hex {
        font-size: 0.875rem;
        color: #334155;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Configuração do Condomínio</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Configuração do Condomínio</h1>
              <p class="lst-subtitulo">Visualize e gerencie as configurações do condomínio no AppCondominium</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Nova configuração</button>
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
                  <label for="lst-filtro-texto">Busca</label>
                  <input id="lst-filtro-texto" type="search" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" placeholder="Nome do condomínio (mín. 3 caracteres)" />
                </div>
              </div>
              <div class="lst-filtros__acoes">
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="clearFilter()">Limpar</button>
              </div>
            </div>
          </div>
          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length && !erroCarregamento; else lstEmpty">
              <thead>
                <tr>
                  <th scope="col" class="lst-col--conteudo">Condomínio</th>
                  <th scope="col">Cor padrão</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td class="lst-col--conteudo">{{ nomeCondominio(item) }}</td>
                  <td>
                    <span class="lst-config-cor" *ngIf="corHex(item); else semCor">
                      <span class="lst-config-cor__amostra" [style.background]="corHex(item)" [attr.aria-label]="'Cor ' + corHex(item)"></span>
                      <span class="lst-config-cor__hex">{{ corHex(item) }}</span>
                    </span>
                    <ng-template #semCor>—</ng-template>
                  </td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações">
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
              <div class="lst-vazio lst-vazio--bloco lst-vazio--erro" *ngIf="!loading && erroCarregamento" role="alert">
                <app-icone nome="alert-circle" [tamanho]="28" />
                <p class="lst-vazio__titulo">Falha ao carregar</p>
                <p class="lst-vazio__texto">{{ erroCarregamento }}</p>
              </div>
              <p class="lst-vazio" *ngIf="!loading && !erroCarregamento">Nenhum registro encontrado.</p>
            </ng-template>
          </div>
          <div class="lst-rodape">
            <app-paginacao modo="sge" rotulo="configurações" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    <app-confirmar-exclusao [aberto]="confirmarExclusao" [excluindo]="excluindo" (cancelar)="cancelarExclusao()" (confirmar)="confirmarExclusaoMetodo()" />

    </div>
  `,
})
export class ConfiguracaoCondominioListComponent implements OnInit {
  paged: PagedResult<ConfiguracaoCondominio> | null = null;
  loading = false;
  erroCarregamento: string | null = null;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  private nomesCondominio = new Map<number, string>();

  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get totalPages(): number { return this.paged?.totalPages ?? 0; }

  constructor(
    private service: ConfiguracaoCondominioService,
    private router: Router,
    private permissions: PermissionService,
    private toast: ToastService,
    private lookup: LookupService
  ) {}
  readonly permissionKey = 'CONFIGURACAOCONDOMINIO';
  confirmarExclusao = false;
  excluindo = false;
  itemExcluir: ConfiguracaoCondominio | null = null;

  get podeExcluir(): boolean {
    return this.permissions.can(this.permissionKey, 'Excluir');
  }

  nomeCondominio(item: ConfiguracaoCondominio): string {
    const id = item.idCondominio;
    if (id == null) return '—';
    return item.nomeCondominio || this.nomesCondominio.get(Number(id)) || '—';
  }

  corHex(item: ConfiguracaoCondominio): string | null {
    return parseCorHex(item.corPadrao);
  }

  solicitarExclusao(item: ConfiguracaoCondominio): void {
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
    this.service.delete(item.idConfiguracao!).subscribe({
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

  ngOnInit(): void { agendarPrimeiraCargaLista(() => this.loadPage(1)); }

  applyFilter(): void { this.page = 1; this.loadPage(1); }
  clearFilter(): void {
    this.filterText = '';
    this.page = 1;
    this.loadPage(1);
  }

  loadPage(p: number): void {
    this.page = p;
    iniciarCarregamentoLista(this);
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.service.getPaged(this.page, this.pageSize, f).subscribe({
      next: r => {
        this.enriquecerNomesCondominio(r.items ?? []).subscribe({
          next: items => {
            this.paged = { ...r, items };
            finalizarCarregamentoListaSucesso(this);
          },
          error: () => {
            this.paged = r;
            finalizarCarregamentoListaSucesso(this);
          },
        });
      },
      error: (e) => finalizarCarregamentoListaErro(this, e),
    });
  }

  private enriquecerNomesCondominio(items: ConfiguracaoCondominio[]) {
    const ids = [...new Set(items.map(i => i.idCondominio).filter((id): id is number => id != null))];
    if (!ids.length) return of(items);

    return forkJoin(
      ids.map(id =>
        this.lookup.condominioResumo(id).pipe(
          map(r => ({ id, nome: r.nome ?? '' })),
          catchError(() => of({ id, nome: '' }))
        )
      )
    ).pipe(
      map(resumos => {
        resumos.forEach(r => {
          if (r.nome) this.nomesCondominio.set(Number(r.id), r.nome);
        });
        return items.map(item => {
          const id = item.idCondominio;
          const nome = id != null ? this.nomesCondominio.get(Number(id)) : undefined;
          return nome ? { ...item, nomeCondominio: nome } : item;
        });
      })
    );
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

  goNovo(): void { this.router.navigate(['/configuracaocondominio', 'novo']); }
  goEdit(item: ConfiguracaoCondominio): void {
    this.router.navigate(['/configuracaocondominio', item.idConfiguracao]);
  }
}