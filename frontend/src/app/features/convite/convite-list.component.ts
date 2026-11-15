import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { LIST_CARD_HUG_LAYOUT_STYLES } from '../../shared/list-card-hug-layout.styles';
import { ConviteListItem, ConviteService } from './convite.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-convite-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone],
  styles: [LIST_CARD_HUG_LAYOUT_STYLES],
  template: `
    <div class="content-wrapper lst-wrapper">
      <div class="lst-page">
        <header class="lst-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Convites</span>
          </nav>
          <h1 class="lst-titulo">Convites de acesso</h1>
          <p class="lst-subtitulo">Emissão, reenvio e revogação de convites para novas contas e vínculos</p>
        </header>

        <section class="lst-card lst-painel">
          <div class="lst-filtros">
            <div class="lst-filtros__grade">
              <input type="search" [(ngModel)]="filtroEmail" placeholder="Filtrar por e-mail" aria-label="E-mail" />
            </div>
            <div class="lst-filtros__acoes">
              <button type="button" class="btn-filtrar" (click)="carregar()">Filtrar</button>
            </div>
          </div>

          <div class="lst-tabela__scroll">
            <table class="lst-grade" *ngIf="itens.length; else vazio">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Envio</th>
                  <th>Expira</th>
                  <th class="lst-grade__acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of itens">
                  <td>{{ c.emailMascarado }}</td>
                  <td>{{ rotuloTipo(c.tipoConvite) }}</td>
                  <td>{{ rotuloEstado(c.estado) }}</td>
                  <td>{{ rotuloEnvio(c.estadoEnvioEmail) }}</td>
                  <td>{{ c.dataExpiracao | date:'short' }}</td>
                  <td class="lst-grade__acoes">
                    <div class="lst-acoes" role="group">
                      <button type="button" class="lst-acao" title="Reenviar" [disabled]="c.estado !== 1" (click)="reenviar(c)">
                        <app-icone nome="mail" [tamanho]="16" />
                      </button>
                      <button type="button" class="lst-acao lst-acao--perigo" title="Revogar" [disabled]="c.estado !== 1" (click)="revogar(c)">
                        <app-icone nome="ban" [tamanho]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #vazio><p class="lst-vazio">Nenhum convite encontrado.</p></ng-template>
          </div>
        </section>
      </div>
    </div>
  `
})
export class ConviteListComponent implements OnInit {
  itens: ConviteListItem[] = [];
  filtroEmail = '';
  loading = false;

  constructor(private readonly convites: ConviteService, private readonly toast: ToastService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.convites.listar(this.filtroEmail || undefined).subscribe({
      next: rows => { this.itens = rows; this.loading = false; },
      error: () => { this.loading = false; this.toast.showError('Não foi possível listar convites.'); }
    });
  }

  reenviar(c: ConviteListItem): void {
    this.convites.reenviar(c.idConvite).subscribe({
      next: r => { this.toast.showSuccess(r.mensagem); this.carregar(); },
      error: () => this.toast.showError('Falha ao reenviar convite.')
    });
  }

  revogar(c: ConviteListItem): void {
    this.convites.revogar(c.idConvite).subscribe({
      next: () => { this.toast.showSuccess('Convite revogado.'); this.carregar(); },
      error: () => this.toast.showError('Falha ao revogar convite.')
    });
  }

  rotuloTipo(t: number): string {
    return ({ 1: 'Conta nova', 2: 'Ativar credencial', 3: 'Novo condomínio' } as Record<number, string>)[t] ?? '—';
  }

  rotuloEstado(e: number): string {
    return ({ 1: 'Pendente', 2: 'Aceito', 3: 'Expirado', 4: 'Revogado' } as Record<number, string>)[e] ?? '—';
  }

  rotuloEnvio(e: number): string {
    return ({ 1: 'Pendente', 2: 'Enviado', 3: 'Falha' } as Record<number, string>)[e] ?? '—';
  }
}