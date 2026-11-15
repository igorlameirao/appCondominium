import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista, agendarPrimeiraCargaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import {
  iniciarCarregamentoLista,
  finalizarCarregamentoListaSucesso,
  finalizarCarregamentoListaErro,
} from '../../shared/lista-sge/lista-sge-erro.util';
import { PermissionService } from '../../core/services/permission.service';
import { PessoaConsultaService, PessoaListagemItem } from '../../core/services/pessoa-consulta.service';
import { PagedResult } from '../../core/models/paged-result';

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page lst-page--pessoas">
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
                <div class="form-group">
                  <label for="pessoas-filtro-texto">Nome, CPF ou CNPJ</label>
                  <input id="pessoas-filtro-texto" type="search" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" placeholder="Mín. 3 caracteres" />
                </div>
                <div class="form-group">
                  <label for="pessoas-filtro-tipo">Tipo</label>
                  <select id="pessoas-filtro-tipo" [(ngModel)]="filtroTipo" (change)="applyFilter()">
                    <option value="">Todos</option>
                    <option value="PF">Pessoa física</option>
                    <option value="PJ">Pessoa jurídica</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="pessoas-filtro-situacao">Situação</label>
                  <select id="pessoas-filtro-situacao" [(ngModel)]="filtroSituacao" (change)="applyFilter()">
                    <option value="">Todas</option>
                    <option value="ativo">Com vínculo ativo</option>
                    <option value="encerrado">Somente histórico</option>
                  </select>
                </div>
                <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="clearFilter()">Limpar</button>
              </div>
            </div>
          </div>

          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length && !erroCarregamento; else lstEmpty">
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
                  <td><span class="lst-badge lst-badge--neutro">{{ item.tipo }}</span></td>
                  <td class="lst-col--conteudo">{{ item.nome }}</td>
                  <td>{{ item.cpfcnpj ?? '—' }}</td>
                  <td class="lst-col--resumo" [title]="item.complemento || ''">{{ item.complemento ?? '—' }}</td>
                  <td>
                    <span class="lst-status" [ngClass]="classeSituacaoVinculo(item.situacaoVinculo)">{{ item.situacaoVinculo }}</span>
                  </td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" [attr.aria-label]="'Ações de ' + item.nome">
                      <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar" (click)="abrir(item)" (dblclick)="$event.stopPropagation()">
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
              <div class="lst-vazio lst-vazio--bloco" *ngIf="!loading && !erroCarregamento">
                <app-icone nome="users" [tamanho]="28" />
                <p class="lst-vazio__titulo">{{ consultaComFiltro ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa cadastrada' }}</p>
                <p class="lst-vazio__texto">{{ consultaComFiltro ? 'Ajuste os filtros ou limpe a busca para ver outros registros.' : 'As pessoas com vínculo no condomínio aparecerão nesta lista.' }}</p>
              </div>
            </ng-template>
          </div>

          <div class="lst-rodape">
            <app-paginacao modo="sge" rotulo="pessoas" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `,
})
export class PessoasListComponent implements OnInit {
  paged: PagedResult<PessoaListagemItem> | null = null;
  loading = false;
  erroCarregamento: string | null = null;
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

  get consultaComFiltro(): boolean {
    return !!(this.filterText.trim() || this.filtroTipo || this.filtroSituacao);
  }

  ngOnInit(): void { agendarPrimeiraCargaLista(() => this.loadPage(1)); }

  classeSituacaoVinculo(situacao: string): string {
    return situacao === 'Ativo' ? 'ativo' : 'inativo';
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
    iniciarCarregamentoLista(this);
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.consulta.listar(this.page, this.pageSize, f, this.filtroTipo, this.filtroSituacao).subscribe({
      next: r => { this.paged = r; finalizarCarregamentoListaSucesso(this); },
      error: (e) => finalizarCarregamentoListaErro(this, e)
    });
  }

  abrir(item: PessoaListagemItem): void {
    const tipo = item.tipo === 'PJ' ? 'PJ' : 'PF';
    void this.router.navigate(['/pessoas', item.idPessoa], { queryParams: { tipo } });
  }

  novaPf(): void { void this.router.navigate(['/pessoafisica', 'novo'], { queryParams: { retorno: '/pessoas' } }); }
  novaPj(): void { void this.router.navigate(['/pessoajuridica', 'novo'], { queryParams: { retorno: '/pessoas' } }); }
}