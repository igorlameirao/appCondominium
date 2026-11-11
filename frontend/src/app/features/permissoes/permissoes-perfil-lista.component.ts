import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Icone } from '../../shared/icone';
import { Paginacao } from '../../shared/paginacao';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import { TAMANHO_PAGINA_LISTA_PADRAO, ajustarPaginaAoTamanho } from '../../shared/lista-sge/lista-sge-pagina.util';
import { ToastService } from '../../core/services/toast.service';
import { ehPerfilAdministrador, PerfilOpcao } from './permissoes.util';

@Component({
  selector: 'app-permissoes-perfil-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, Paginacao, ListaSgeViewport],
  template: `
    <div class="content-wrapper lst-wrapper" lstSgeViewport [tamanhoPagina]="tamanhoPagina" (tamanhoPaginaChange)="aplicarTamanhoPagina($event)" [totalItens]="total" [itensNaPagina]="itensPagina.length" [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Permissões por perfil</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Permissões por perfil</h1>
              <p class="lst-subtitulo">Selecione um perfil para configurar suas permissões no condomínio</p>
            </div>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="carregando">
          <div class="lst-filtros">
            <button type="button" class="lst-filtros__topo" (click)="filtrosRecolhidos = !filtrosRecolhidos" [attr.aria-expanded]="!filtrosRecolhidos" aria-controls="lst-filtros-perfil">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>
            <div class="lst-filtros__corpo" id="lst-filtros-perfil" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade">
                <div class="form-group">
                  <input id="filtroPerfil" type="search" aria-label="Filtrar perfil" placeholder="Pesquisar perfil" [(ngModel)]="filtro" (keydown.enter)="filtrar()" />
                </div>
              </div>
              <div class="lst-filtros__acoes">
                <button type="button" class="btn-filtrar" (click)="filtrar()">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="limpar()">Limpar</button>
              </div>
            </div>
          </div>

          <p *ngIf="erro" class="erro-form">{{ erro }}</p>

          <div class="lst-tabela__scroll" [class.is-loading]="carregando">
            <p *ngIf="carregando && !perfis.length" class="lst-vazio">Carregando...</p>
            <p *ngIf="!carregando && !itensPagina.length" class="lst-vazio">Nenhum perfil encontrado.</p>
            <table *ngIf="itensPagina.length" class="lst-grade">
              <thead>
                <tr>
                  <th scope="col" class="lst-col--conteudo">Perfil</th>
                  <th scope="col">Situação</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of itensPagina" class="row-click" (dblclick)="abrir(item)">
                  <td class="lst-col--conteudo">{{ item.descricao }}</td>
                  <td>{{ situacao(item) }}</td>
                  <td class="lst-grade__acoes">
                    <button type="button" class="lst-acao lst-acao--editar" title="Configurar permissões" aria-label="Configurar permissões" (click)="abrir(item)" (dblclick)="$event.stopPropagation()">
                      <app-icone nome="pencil" [tamanho]="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="lst-rodape">
            <app-paginacao modo="sge" rotulo="perfis" [pagina]="pagina" [total]="total" [tamanho]="tamanhoPagina" (paginaChange)="pagina = $event" />
          </div>
        </section>
      </div>
    </div>
  `,
})
export class PermissoesPerfilListaComponent implements OnInit {
  perfis: PerfilOpcao[] = [];
  filtro = '';
  erro = '';
  carregando = false;
  filtrosRecolhidos = false;
  pagina = 1;
  tamanhoPagina = TAMANHO_PAGINA_LISTA_PADRAO;

  constructor(private http: HttpClient, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.carregar();
  }

  get perfisFiltrados(): PerfilOpcao[] {
    const texto = this.filtro.trim().toLowerCase();
    if (!texto) return this.perfis;
    return this.perfis.filter(p => p.descricao.toLowerCase().includes(texto));
  }

  get total(): number {
    return this.perfisFiltrados.length;
  }

  get itensPagina(): PerfilOpcao[] {
    const inicio = (this.pagina - 1) * this.tamanhoPagina;
    return this.perfisFiltrados.slice(inicio, inicio + this.tamanhoPagina);
  }

  carregar(): void {
    this.carregando = true;
    this.http.get<PerfilOpcao[]>(`${environment.apiUrl}/Permissao/perfis`).subscribe({
      next: lista => {
        this.perfis = lista;
        this.erro = '';
        this.carregando = false;
        this.ajustarPagina();
      },
      error: () => {
        this.erro = 'Sem permissão para listar perfis.';
        this.toast.showError(this.erro);
        this.carregando = false;
      },
    });
  }

  filtrar(): void {
    this.pagina = 1;
    this.ajustarPagina();
  }

  limpar(): void {
    this.filtro = '';
    this.pagina = 1;
  }

  abrir(item: PerfilOpcao): void {
    void this.router.navigate(['/gerenciamento-permissoes/perfil', item.idPerfil]);
  }

  situacao(item: PerfilOpcao): string {
    return ehPerfilAdministrador(item.descricao) ? 'Protegido (somente leitura)' : 'Configurável';
  }

  aplicarTamanhoPagina(novo: number): void {
    if (!Number.isFinite(novo) || novo < 1 || Math.floor(novo) === this.tamanhoPagina) return;
    this.tamanhoPagina = Math.floor(novo);
    this.ajustarPagina();
  }

  private ajustarPagina(): void {
    ajustarPaginaAoTamanho(this);
  }
}
