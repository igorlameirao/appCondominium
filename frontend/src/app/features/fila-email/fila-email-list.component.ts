import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListaSgeViewport } from '../../shared/lista-sge/lista-sge-viewport.directive';
import {
  iniciarCarregamentoLista,
  finalizarCarregamentoListaSucesso,
  finalizarCarregamentoListaErro,
} from '../../shared/lista-sge/lista-sge-erro.util';
import {
  TAMANHO_PAGINA_LISTA_PADRAO,
  ajustarTamanhoPaginaLista,
  agendarPrimeiraCargaLista,
} from '../../shared/lista-sge/lista-sge-pagina.util';
import { Paginacao } from '../../shared/paginacao';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PagedResult } from '../../core/models/paged-result';
import { FilaEmailService } from './fila-email.service';
import { EmailQueueDetalhe, EmailQueueListItem, labelStatusEmailQueue } from './fila-email.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-fila-email-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, Paginacao, DatePipe, CampoDataComponent, ListaSgeViewport],
  styleUrl: './fila-email-list.component.css',
  template: `
    <div
      class="content-wrapper lst-wrapper"
      lstSgeViewport
      [tamanhoPagina]="pageSize"
      (tamanhoPaginaChange)="aplicarTamanhoPagina($event)"
      [totalItens]="totalCount"
      [itensNaPagina]="paged?.items?.length ?? 0"
      [filtrosRecolhidos]="filtrosRecolhidos">
      <div class="lst-page lst-page--fila-email">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Fila de e-mails</span>
          </nav>
          <div class="lst-cabecalho__linha">
            <div>
              <h1 class="lst-titulo">Fila de e-mails</h1>
              <p class="lst-subtitulo">Monitoramento e reprocessamento de envios do sistema</p>
            </div>
            <div class="lst-cabecalho__acoes">
              <label class="lst-fila-email__auto-refresh">
                <input type="checkbox" [(ngModel)]="atualizacaoAutomatica" (ngModelChange)="onToggleAutoRefresh()" />
                Atualizar a cada 15 s
              </label>
            </div>
          </div>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <button
              type="button"
              class="lst-filtros__topo"
              (click)="filtrosRecolhidos = !filtrosRecolhidos"
              [attr.aria-expanded]="!filtrosRecolhidos"
              aria-controls="lst-filtros-fila-email">
              <span class="lst-filtros__titulo"><app-icone nome="filter" [tamanho]="18" /> Filtros</span>
              <app-icone class="lst-filtros__seta" [nome]="filtrosRecolhidos ? 'chevron-down' : 'chevron-up'" [tamanho]="18" />
            </button>

            <div class="lst-filtros__corpo" id="lst-filtros-fila-email" *ngIf="!filtrosRecolhidos">
              <div class="lst-filtros__grade lst-filtros__grade--fila-email">
                <div class="form-group">
                  <label for="fila-email-status">Situação</label>
                  <select id="fila-email-status" [(ngModel)]="filtroStatus">
                    <option [ngValue]="null">Todas situações</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Enviando">Processando</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Erro">Falha</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="fila-email-destinatario">Destinatário</label>
                  <input
                    id="fila-email-destinatario"
                    type="search"
                    [(ngModel)]="filtroDestinatario"
                    placeholder="parte do e-mail"
                    (keyup.enter)="carregar(1)" />
                </div>
                <div class="form-group">
                  <label for="fila-email-data-inicio">Data inicial</label>
                  <app-campo-data id="fila-email-data-inicio" [(ngModel)]="filtroDataInicio" name="dataInicio" [feedbackVisual]="true" />
                </div>
                <div class="form-group">
                  <label for="fila-email-data-fim">Data final</label>
                  <app-campo-data id="fila-email-data-fim" [(ngModel)]="filtroDataFim" name="dataFim" [feedbackVisual]="true" />
                </div>
                <button type="button" class="btn-filtrar" (click)="carregar(1)">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="limparFiltros()">Limpar</button>
              </div>
            </div>
          </div>

          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length && !erroCarregamento; else lstEmpty">
              <thead>
                <tr>
                  <th scope="col">Criado em</th>
                  <th scope="col">Destinatário</th>
                  <th scope="col" class="lst-col--conteudo">Assunto</th>
                  <th scope="col" class="lst-col--situacao">Situação</th>
                  <th scope="col">Tentativas</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged?.items" class="row-click" (dblclick)="verDetalhes(item)">
                  <td>{{ item.dataCriacao | date:'short' }}</td>
                  <td class="lst-col--resumo" [title]="item.destinatario">{{ item.destinatario }}</td>
                  <td class="lst-col--conteudo" [title]="item.assunto">{{ item.assunto }}</td>
                  <td class="lst-col--situacao">
                    <span class="lst-status" [ngClass]="classeStatus(item.status)">
                      {{ labelStatus(item.status) }}
                    </span>
                  </td>
                  <td>{{ item.tentativas }}</td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações do e-mail">
                      <button type="button" class="lst-acao lst-acao--visualizar" title="Detalhes" aria-label="Detalhes" (click)="verDetalhes(item)">
                        <app-icone nome="eye" [tamanho]="16" />
                      </button>
                      @if (item.status === 'Erro') {
                        <button type="button" class="lst-acao lst-acao--editar" title="Reenviar" aria-label="Reenviar" (click)="reprocessar(item, $event)">
                          <app-icone nome="rotate-ccw" [tamanho]="16" />
                        </button>
                      }
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
                <app-icone nome="mail" [tamanho]="28" />
                <p class="lst-vazio__titulo">{{ consultaComFiltro ? 'Nenhum e-mail encontrado' : 'Nenhum e-mail na fila' }}</p>
                <p class="lst-vazio__texto">
                  {{ consultaComFiltro ? 'Ajuste os filtros ou limpe a busca para ver outros envios.' : 'Os envios registrados aparecerão nesta lista.' }}
                </p>
              </div>
            </ng-template>
          </div>
          <div class="lst-rodape">
            <app-paginacao
              modo="sge"
              rotulo="e-mails"
              [pagina]="page"
              [total]="totalCount"
              [tamanho]="pageSize"
              (paginaChange)="carregar($event)" />
          </div>
        </section>
      </div>
    </div>

    @if (detalhe) {
      <div class="confirm-overlay" (click)="fecharDetalhe()">
        <div class="confirm-modal confirm-modal--leitura fila-email-detalhe" role="dialog" aria-modal="true" aria-labelledby="fila-detalhe-titulo" (click)="$event.stopPropagation()">
          <h3 class="lst-contexto__titulo" id="fila-detalhe-titulo">E-mail #{{ detalhe.id }}</h3>
          <dl class="fila-email-detalhe__meta">
            <div>
              <dt>Destinatário</dt>
              <dd>{{ detalhe.destinatario }}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>
                <span class="lst-status" [ngClass]="classeStatus(detalhe.status)">{{ labelStatus(detalhe.status) }}</span>
              </dd>
            </div>
            <div>
              <dt>Assunto</dt>
              <dd>{{ detalhe.assunto }}</dd>
            </div>
            <div>
              <dt>Tentativas</dt>
              <dd>{{ detalhe.tentativas }}</dd>
            </div>
            <div>
              <dt>Criado em</dt>
              <dd>{{ detalhe.dataCriacao | date:'short' }}</dd>
            </div>
            <div>
              <dt>Enviado em</dt>
              <dd>{{ detalhe.dataEnvio ? (detalhe.dataEnvio | date:'short') : '—' }}</dd>
            </div>
            <div>
              <dt>Última tentativa</dt>
              <dd>{{ detalhe.ultimaTentativa ? (detalhe.ultimaTentativa | date:'short') : '—' }}</dd>
            </div>
            @if (detalhe.mensagemErro) {
              <div>
                <dt>Erro</dt>
                <dd class="fila-email-detalhe__erro">{{ detalhe.mensagemErro }}</dd>
              </div>
            }
          </dl>
          <p class="fila-email-detalhe__corpo-titulo">Prévia do corpo</p>
          <div class="fila-email-detalhe__corpo">{{ detalhe.corpoPreview || '—' }}</div>
          <div class="confirm-actions">
            @if (detalhe.status === 'Erro') {
              <button type="button" class="btn-primary" (click)="reprocessarDetalhe()">Reenviar</button>
            }
            <button type="button" class="btn-cancelar-modal" (click)="fecharDetalhe()">Fechar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class FilaEmailListComponent implements OnInit, OnDestroy {
  private readonly api = inject(FilaEmailService);
  private readonly toast = inject(ToastService);

  paged: PagedResult<EmailQueueListItem> | null = null;
  loading = false;
  erroCarregamento: string | null = null;
  page = 1;
  pageSize = TAMANHO_PAGINA_LISTA_PADRAO;
  filtrosRecolhidos = false;
  filtroStatus: string | null = null;
  filtroDestinatario = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  consultaComFiltro = false;
  atualizacaoAutomatica = true;
  detalhe: EmailQueueDetalhe | null = null;
  private refreshTimer?: ReturnType<typeof setInterval>;

  get totalCount(): number {
    return this.paged?.totalCount ?? 0;
  }

  ngOnInit(): void {
    agendarPrimeiraCargaLista(() => this.carregar(1));
    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    this.pararAutoRefresh();
  }

  onToggleAutoRefresh(): void {
    if (this.atualizacaoAutomatica) this.iniciarAutoRefresh();
    else this.pararAutoRefresh();
  }

  private iniciarAutoRefresh(): void {
    this.pararAutoRefresh();
    if (!this.atualizacaoAutomatica) return;
    this.refreshTimer = setInterval(() => this.carregar(this.page, true), 15000);
  }

  private pararAutoRefresh(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
  }

  carregar(page: number, silencioso = false): void {
    this.page = page;
    if (!silencioso) iniciarCarregamentoLista(this);
    const dataInicio = this.filtroDataInicio || undefined;
    const dataFim = this.filtroDataFim || undefined;
    this.consultaComFiltro = !!(this.filtroStatus || this.filtroDestinatario.trim() || dataInicio || dataFim);
    this.api.getPaged(page, this.pageSize, {
      status: this.filtroStatus,
      destinatario: this.filtroDestinatario,
      dataInicio,
      dataFim,
    }).subscribe({
      next: (r) => {
        this.paged = r;
        finalizarCarregamentoListaSucesso(this);
      },
      error: (e) => {
        finalizarCarregamentoListaErro(this, e, 'Não foi possível carregar a fila de e-mails.');
        if (!silencioso) this.toast.showError('Falha ao carregar fila.');
      },
    });
  }

  aplicarTamanhoPagina(novo: number): void {
    const ctx = {
      pagina: this.page,
      total: this.totalCount,
      tamanhoPagina: this.pageSize,
      itens: this.paged?.items ?? [],
      carregar: () => this.carregar(this.page),
    };
    ajustarTamanhoPaginaLista(ctx, novo);
    this.page = ctx.pagina;
    this.pageSize = ctx.tamanhoPagina;
  }

  limparFiltros(): void {
    this.filtroStatus = null;
    this.filtroDestinatario = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.carregar(1);
  }

  labelStatus(s: string): string {
    return labelStatusEmailQueue(s);
  }

  classeStatus(s: string): string {
    switch (s) {
      case 'Enviando':
        return 'enviando';
      case 'Enviado':
        return 'enviado';
      case 'Erro':
        return 'erro';
      default:
        return 'pendente';
    }
  }

  verDetalhes(item: EmailQueueListItem): void {
    this.api.getById(item.id).subscribe({
      next: (d) => (this.detalhe = d),
      error: () => this.toast.showError('Não foi possível carregar detalhes.'),
    });
  }

  fecharDetalhe(): void {
    this.detalhe = null;
  }

  reprocessar(item: EmailQueueListItem, ev?: Event): void {
    ev?.stopPropagation();
    this.api.reprocessar(item.id).subscribe({
      next: (r) => {
        r.ok ? this.toast.showSuccess(r.mensagem) : this.toast.showError(r.mensagem);
        this.carregar(this.page, true);
      },
      error: () => this.toast.showError('Falha ao reenviar.'),
    });
  }

  reprocessarDetalhe(): void {
    if (!this.detalhe) return;
    this.reprocessar(this.detalhe);
    this.fecharDetalhe();
  }
}