import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import {
  iniciarCarregamentoLista,
  finalizarCarregamentoListaSucesso,
  finalizarCarregamentoListaErro,
} from '../../shared/lista-sge/lista-sge-erro.util';
import { LIST_CARD_HUG_LAYOUT_STYLES } from '../../shared/list-card-hug-layout.styles';
import { Paginacao } from '../../shared/paginacao';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PagedResult } from '../../core/models/paged-result';
import { FilaEmailService } from './fila-email.service';
import { EmailQueueDetalhe, EmailQueueListItem, labelStatusEmailQueue } from './fila-email.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-fila-email-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, Paginacao, DatePipe, CampoDataComponent],
  styles: [LIST_CARD_HUG_LAYOUT_STYLES],
  template: `
    <div class="content-wrapper lst-wrapper">
      <div class="lst-page lst-page--fila-email">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Fila de e-mails</span>
          </nav>
          <h1 class="lst-titulo">Fila de e-mails</h1>
          <p class="lst-subtitulo">Monitoramento e reprocessamento de envios</p>
        </header>

        <section class="lst-card lst-painel" [attr.aria-busy]="loading">
          <div class="lst-filtros">
            <div class="lst-filtros__corpo">
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
                  <input id="fila-email-destinatario" type="text" [(ngModel)]="filtroDestinatario" />
                </div>
                <div class="form-group">
                  <label>Data inicial</label>
                  <app-campo-data [(ngModel)]="filtroDataInicio" name="dataInicio" [feedbackVisual]="true" />
                </div>
                <div class="form-group">
                  <label>Data final</label>
                  <app-campo-data [(ngModel)]="filtroDataFim" name="dataFim" [feedbackVisual]="true" />
                </div>
                <button type="button" class="btn-filtrar" (click)="carregar(1)">Filtrar</button>
                <button type="button" class="btn-limpar" (click)="limparFiltros()">Limpar</button>
              </div>
            </div>
          </div>

          <div class="lst-tabela__scroll" [class.is-loading]="loading">
            <table class="lst-grade" *ngIf="paged?.items?.length; else vazio">
              <thead>
                <tr>
                  <th scope="col">Criado em</th>
                  <th scope="col">Destinatário</th>
                  <th scope="col" class="lst-col--conteudo">Assunto</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Tentativas</th>
                  <th scope="col">Enviado em</th>
                  <th scope="col" class="lst-col--resumo">Erro</th>
                  <th scope="col" class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged!.items" class="row-click" (dblclick)="verDetalhes(item)">
                  <td>{{ item.dataCriacao | date:'short' }}</td>
                  <td class="lst-col--resumo" [title]="item.destinatario">{{ item.destinatario }}</td>
                  <td class="lst-col--conteudo">{{ item.assunto }}</td>
                  <td>
                    <span class="lst-status" [ngClass]="classeStatus(item.status)">
                      {{ labelStatus(item.status) }}
                    </span>
                  </td>
                  <td>{{ item.tentativas }}</td>
                  <td>{{ item.dataEnvio ? (item.dataEnvio | date:'short') : '—' }}</td>
                  <td class="lst-col--resumo" [title]="item.mensagemErro || ''">{{ item.mensagemErro || '—' }}</td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group" aria-label="Ações do e-mail">
                      <button type="button" class="lst-acao lst-acao--visualizar" title="Detalhes" aria-label="Detalhes" (click)="verDetalhes(item)">
                        <app-icone nome="eye" [tamanho]="16" />
                      </button>
                      @if (item.status === 'Erro') {
                        <button type="button" class="lst-acao" title="Reenviar" aria-label="Reenviar" (click)="reprocessar(item, $event)">
                          <app-icone nome="rotate-ccw" [tamanho]="16" />
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #vazio>
              <div class="lst-vazio lst-vazio--bloco" *ngIf="!loading">
                <app-icone nome="mail" [tamanho]="28" />
                <p class="lst-vazio__titulo">{{ consultaComFiltro ? 'Nenhum e-mail encontrado' : 'Nenhum e-mail na fila' }}</p>
                <p class="lst-vazio__texto">{{ consultaComFiltro ? 'Ajuste os filtros ou limpe a busca para ver outros envios.' : 'Os envios registrados aparecerão nesta lista.' }}</p>
              </div>
            </ng-template>
          </div>
          <div class="lst-rodape" *ngIf="paged">
            <app-paginacao modo="sge" rotulo="e-mails"
              [pagina]="paged.page" [total]="paged.totalCount" [tamanho]="paged.pageSize"
              (paginaChange)="carregar($event)" />
          </div>
        </section>
      </div>
    </div>

    @if (detalhe) {
      <div class="confirm-overlay" (click)="fecharDetalhe()">
        <div class="confirm-modal confirm-modal--leitura" role="dialog" aria-modal="true" aria-labelledby="fila-detalhe-titulo" (click)="$event.stopPropagation()">
          <h3 class="lst-contexto__titulo" id="fila-detalhe-titulo">Detalhes do e-mail #{{ detalhe.id }}</h3>
          <p><strong>Destinatário:</strong> {{ detalhe.destinatario }}</p>
          <p><strong>Assunto:</strong> {{ detalhe.assunto }}</p>
          <p><strong>Situação:</strong> {{ labelStatus(detalhe.status) }}</p>
          <p><strong>Tentativas:</strong> {{ detalhe.tentativas }}</p>
          <p><strong>Última tentativa:</strong> {{ detalhe.ultimaTentativa ? (detalhe.ultimaTentativa | date:'short') : '—' }}</p>
          <p *ngIf="detalhe.mensagemErro"><strong>Erro:</strong> {{ detalhe.mensagemErro }}</p>
          <div class="lst-leitura">{{ detalhe.corpoPreview || '—' }}</div>
          <div class="confirm-actions">
            @if (detalhe.status === 'Erro') {
              <button type="button" class="btn-primary" (click)="reprocessarDetalhe()">Reenviar</button>
            }
            <button type="button" class="btn-cancelar-modal" (click)="fecharDetalhe()">Fechar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class FilaEmailListComponent implements OnInit, OnDestroy {
  private readonly api = inject(FilaEmailService);
  private readonly toast = inject(ToastService);

  paged: PagedResult<EmailQueueListItem> | null = null;
  loading = false;
  erroCarregamento: string | null = null;
  filtroStatus: string | null = null;
  filtroDestinatario = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  consultaComFiltro = false;
  detalhe: EmailQueueDetalhe | null = null;
  private refreshTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.carregar(1);
    this.refreshTimer = setInterval(() => this.carregar(this.paged?.page ?? 1, true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  carregar(page: number, silencioso = false): void {
    if (!silencioso) this.loading = true;
    const dataInicio = this.filtroDataInicio || undefined;
    const dataFim = this.filtroDataFim || undefined;
    this.consultaComFiltro = !!(this.filtroStatus || this.filtroDestinatario.trim() || dataInicio || dataFim);
    this.api.getPaged(page, 20, {
      status: this.filtroStatus,
      destinatario: this.filtroDestinatario,
      dataInicio,
      dataFim
    }).subscribe({
      next: r => { this.paged = r; finalizarCarregamentoListaSucesso(this); },
      error: (e) => {
        finalizarCarregamentoListaErro(this, e, 'Falha ao carregar fila.');
        this.toast.showError('Falha ao carregar fila.');
      }
    });
  }

  limparFiltros(): void {
    this.filtroStatus = null;
    this.filtroDestinatario = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.carregar(1);
  }

  labelStatus(s: string): string { return labelStatusEmailQueue(s); }

  classeStatus(s: string): string {
    switch (s) {
      case 'Enviando': return 'enviando';
      case 'Enviado': return 'enviado';
      case 'Erro': return 'erro';
      default: return 'pendente';
    }
  }

  verDetalhes(item: EmailQueueListItem): void {
    this.api.getById(item.id).subscribe({
      next: d => this.detalhe = d,
      error: () => this.toast.showError('Não foi possível carregar detalhes.')
    });
  }

  fecharDetalhe(): void { this.detalhe = null; }

  reprocessar(item: EmailQueueListItem, ev?: Event): void {
    ev?.stopPropagation();
    this.api.reprocessar(item.id).subscribe({
      next: r => {
        r.ok ? this.toast.showSuccess(r.mensagem) : this.toast.showError(r.mensagem);
        this.carregar(this.paged?.page ?? 1, true);
      },
      error: () => this.toast.showError('Falha ao reenviar.')
    });
  }

  reprocessarDetalhe(): void {
    if (!this.detalhe) return;
    this.reprocessar(this.detalhe);
    this.fecharDetalhe();
  }
}