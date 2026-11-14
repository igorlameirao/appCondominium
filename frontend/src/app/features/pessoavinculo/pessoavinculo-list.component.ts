import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { Paginacao } from '../../shared/paginacao';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarTamanhoPaginaLista } from '../../shared/lista-sge/lista-sge-pagina.util';
import { PagedResult } from '../../core/models/paged-result';
import { PessoaVinculoService } from './pessoavinculo.service';
import { PessoaVinculo } from './pessoavinculo.model';
import { PapelVinculoService } from '../papelvinculo/papelvinculo.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { UnidadeService } from '../unidade/unidade.service';

@Component({
  selector: 'app-pessoavinculo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, ListaSgeViewport, Paginacao],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="pageSize" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="totalCount" [itensNaPagina]="paged?.items?.length ?? 0" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Vínculos</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Vínculos</h1>
              <p class="lst-subtitulo">Vínculos de pessoas com papéis, unidades e vigência no condomínio</p>
            </div>
            <button type="button" class="btn-novo" (click)="goNovo()">Novo vínculo</button>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-vinculo">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            <div class="lst-filtros__corpo" id="lst-filtros-vinculo" *ngIf="!filtrosRecolhidos">
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
                  <th scope="col" class="lst-col--conteudo">Pessoa</th>
                  <th scope="col">Papel</th>
                  <th scope="col">Unidade</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Situação</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="goEdit(item)">
                  <td class="lst-col--conteudo">{{ pessoaLabel(item.idPessoa) }}</td>
                  <td>{{ papelLabel(item.codigoPapelVinculo) }}</td>
                  <td>{{ unidadeLabel(item.idUnidade) }}</td>
                  <td>{{ item.dataInicio }}</td>
                  <td>{{ item.dataFim ?? '—' }}</td>
                  <td><span [class.lst-situacao--inativa]="situacao(item) !== 'Ativo'">{{ situacao(item) }}</span></td>
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
            <app-paginacao modo="sge" rotulo="vínculos" [pagina]="page" [total]="totalCount" [tamanho]="pageSize" (paginaChange)="loadPage($event)" />
          </div>
        </section>
      </div>
    </div>
  `
})
export class PessoaVinculoListComponent implements OnInit {
  paged: PagedResult<PessoaVinculo> | null = null;
  loading = false;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }

  private papeis = new Map<number, string>();
  private pessoas = new Map<number, string>();
  private unidades = new Map<number, string>();

  constructor(
    private service: PessoaVinculoService,
    private router: Router,
    private papelService: PapelVinculoService,
    private pfService: PessoafisicaService,
    private unidadeService: UnidadeService
  ) {}

  ngOnInit(): void {
    this.papelService.getPaged(1, 200).subscribe(r => {
      for (const p of r.items ?? []) {
        if (p.codigoPapelVinculo != null && p.descricao) this.papeis.set(p.codigoPapelVinculo, p.descricao);
      }
    });
    this.pfService.getPaged(1, 500).subscribe(r => {
      for (const x of r.items ?? []) {
        if (x.idPessoa != null) {
          const row = x as { nome?: string; descricao?: string };
          this.pessoas.set(x.idPessoa, String(row.nome ?? row.descricao ?? x.email ?? x.idPessoa));
        }
      }
    });
    this.unidadeService.getPaged(1, 500).subscribe(r => {
      for (const u of r.items ?? []) {
        if (u.idUnidade != null) {
          this.unidades.set(u.idUnidade, u.numero != null ? `Unidade ${u.numero}` : String(u.idUnidade));
        }
      }
    });
    this.loadPage(1);
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

  situacao(v: PessoaVinculo): string {
    const hoje = new Date().toISOString().slice(0, 10);
    if (v.dataInicio && v.dataInicio > hoje) return 'Futuro';
    if (v.dataFim && v.dataFim < hoje) return 'Encerrado';
    return 'Ativo';
  }

  papelLabel(cod?: number): string {
    if (cod == null) return '—';
    return this.papeis.get(cod) ?? String(cod);
  }

  pessoaLabel(id?: number): string {
    if (id == null) return '—';
    return this.pessoas.get(id) ?? String(id);
  }

  unidadeLabel(id?: number): string {
    if (id == null) return '—';
    return this.unidades.get(id) ?? String(id);
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

  goNovo(): void { this.router.navigate(['/pessoavinculo', 'novo']); }
  goEdit(item: PessoaVinculo): void {
    this.router.navigate(['/pessoavinculo', item.idVinculo]);
  }
}