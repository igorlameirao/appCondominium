import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { LIST_CARD_HUG_LAYOUT_STYLES } from '../../shared/list-card-hug-layout.styles';
import { Paginacao } from '../../shared/paginacao';
import { PagedResult } from '../../core/models/paged-result';
import { FilaEmailService } from './fila-email.service';
import { EmailQueueDetalhe, EmailQueueListItem, labelStatusEmailQueue } from './fila-email.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-fila-email-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, Paginacao, DatePipe],
  styles: [LIST_CARD_HUG_LAYOUT_STYLES, `
    .status-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .status-pill.pendente { background: #e2e8f0; color: #334155; }
    .status-pill.enviando { background: #fef3c7; color: #92400e; }
    .status-pill.enviado { background: #d1fae5; color: #065f46; }
    .status-pill.erro { background: #fee2e2; color: #991b1b; }
    .detail-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
      display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px;
    }
    .detail-modal {
      background: #fff; border-radius: 10px; padding: 20px 22px; max-width: 640px; width: 100%;
      max-height: min(90vh, 720px); overflow: auto;
    }
    .corpo-preview {
      margin-top: 8px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
      font-size: 13px; white-space: pre-wrap; word-break: break-word;
    }
  `],
  template: `
    <div class="content-wrapper lst-wrapper">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Fila de e-mails</span>
          </nav>
          <h1 class="lst-titulo">Fila de e-mails</h1>
          <p class="lst-subtitulo">Monitoramento e reprocessamento de envios</p>
        </header>

        <section class="lst-card lst-painel">
          <div class="lst-filtros">
            <div class="lst-filtros__grade">
              <select [(ngModel)]="filtroStatus" aria-label="Situação">
                <option [ngValue]="null">Todas situações</option>
                <option value="Pendente">Pendente</option>
                <option value="Enviando">Processando</option>
                <option value="Enviado">Enviado</option>
                <option value="Erro">Falha</option>
              </select>
              <input type="text" [(ngModel)]="filtroDestinatario" placeholder="Destinatário" aria-label="Destinatário" />
              <input type="date" [(ngModel)]="filtroDataInicio" aria-label="Criado de" />
              <input type="date" [(ngModel)]="filtroDataFim" aria-label="Criado até" />
            </div>
            <div class="lst-filtros__acoes">
              <button type="button" class="btn-filtrar" (click)="carregar(1)">Filtrar</button>
              <button type="button" class="btn-limpar" (click)="limparFiltros()">Limpar</button>
            </div>
          </div>

          <div class="lst-tabela__scroll">
            <table class="lst-grade" *ngIf="paged?.items?.length; else vazio">
              <thead>
                <tr>
                  <th>Criado em</th>
                  <th>Destinatário</th>
                  <th>Assunto</th>
                  <th>Situação</th>
                  <th>Tentativas</th>
                  <th>Enviado em</th>
                  <th>Erro</th>
                  <th class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paged!.items" (dblclick)="verDetalhes(item)">
                  <td>{{ item.dataCriacao | date:'short' }}</td>
                  <td>{{ item.destinatario }}</td>
                  <td>{{ item.assunto }}</td>
                  <td>
                    <span class="status-pill" [ngClass]="classeStatus(item.status)">
                      {{ labelStatus(item.status) }}
                    </span>
                  </td>
                  <td>{{ item.tentativas }}</td>
                  <td>{{ item.dataEnvio ? (item.dataEnvio | date:'short') : '—' }}</td>
                  <td>{{ item.mensagemErro || '—' }}</td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group">
                      <button type="button" class="lst-acao" title="Detalhes" (click)="verDetalhes(item)">
                        <app-icone nome="eye" [tamanho]="16" />
                      </button>
                      @if (item.status === 'Erro') {
                        <button type="button" class="lst-acao" title="Reenviar" (click)="reprocessar(item, $event)">
                          <app-icone nome="refresh" [tamanho]="16" />
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #vazio>
              <p class="lst-vazio" *ngIf="!loading">Nenhum e-mail na fila.</p>
            </ng-template>
          </div>
          <app-paginacao *ngIf="paged" modo="sge" rotulo="e-mails"
            [pagina]="paged.page" [total]="paged.totalCount" [tamanho]="paged.pageSize"
            (paginaChange)="carregar($event)" />
        </section>
      </div>
    </div>

    @if (detalhe) {
      <div class="detail-overlay" (click)="fecharDetalhe()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <h3>Detalhes do e-mail #{{ detalhe.id }}</h3>
          <p><strong>Destinatário:</strong> {{ detalhe.destinatario }}</p>
          <p><strong>Assunto:</strong> {{ detalhe.assunto }}</p>
          <p><strong>Situação:</strong> {{ labelStatus(detalhe.status) }}</p>
          <p><strong>Tentativas:</strong> {{ detalhe.tentativas }}</p>
          <p><strong>Última tentativa:</strong> {{ detalhe.ultimaTentativa ? (detalhe.ultimaTentativa | date:'short') : '—' }}</p>
          <p *ngIf="detalhe.mensagemErro"><strong>Erro:</strong> {{ detalhe.mensagemErro }}</p>
          <div class="corpo-preview">{{ detalhe.corpoPreview || '—' }}</div>
          <div class="confirm-actions" style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
            @if (detalhe.status === 'Erro') {
              <button type="button" class="btn-gravar" (click)="reprocessarDetalhe()">Reenviar</button>
            }
            <button type="button" class="btn-cancelar" (click)="fecharDetalhe()">Fechar</button>
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
  filtroStatus: string | null = null;
  filtroDestinatario = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  detalhe: EmailQueueDetalhe | null = null;
  private refreshTimer?: ReturnType<typeof setInterval>;

  get totalPaginas(): number {
    if (!this.paged) return 1;
    return Math.max(1, Math.ceil(this.paged.totalCount / this.paged.pageSize));
  }

  ngOnInit(): void {
    this.carregar(1);
    this.refreshTimer = setInterval(() => this.carregar(this.paged?.page ?? 1, true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  carregar(page: number, silencioso = false): void {
    if (!silencioso) this.loading = true;
    this.api.getPaged(page, 20, {
      status: this.filtroStatus,
      destinatario: this.filtroDestinatario,
      dataInicio: this.filtroDataInicio || undefined,
      dataFim: this.filtroDataFim || undefined
    }).subscribe({
      next: r => { this.paged = r; this.loading = false; },
      error: () => { this.toast.showError('Falha ao carregar fila.'); this.loading = false; }
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