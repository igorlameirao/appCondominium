import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import {
  ContaService,
  PreferenciaNotificacaoCategoria,
  PreferenciaNotificacaoSalvarItem,
} from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-minha-conta-notificacoes',
  standalone: true,
  imports: [CommonModule, Icone],
  host: { class: 'minha-conta-notificacoes-host' },
  template: `
    <div class="minha-conta-notificacoes__corpo">
      <header class="minha-conta-notificacoes__intro">
        <span class="minha-conta-notificacoes__intro-icone" aria-hidden="true">
          <app-icone nome="bell" [tamanho]="22" />
        </span>
        <div class="minha-conta-notificacoes__intro-textos">
          <h2 class="minha-conta-notificacoes__intro-titulo">Notificações</h2>
          <p class="minha-conta-notificacoes__intro-descricao">
            Escolha como deseja receber cada tipo de aviso.
          </p>
        </div>
      </header>

      <p *ngIf="carregando" class="minha-conta-notificacoes__estado">Carregando preferências…</p>
      <p *ngIf="!carregando && erroCarregar" class="minha-conta-notificacoes__erro">{{ erroCarregar }}</p>

      <ng-container *ngIf="!carregando && !erroCarregar">
        <section
          *ngFor="let grupo of grupos; let ultimoModulo = last"
          class="minha-conta-notificacoes__modulo"
          [class.minha-conta-notificacoes__modulo--ultimo]="ultimoModulo"
        >
          <div class="minha-conta-notificacoes__modulo-faixa">
            <app-icone [nome]="iconeModulo(grupo.modulo)" [tamanho]="16" />
            <span class="minha-conta-notificacoes__modulo-titulo">{{ grupo.modulo }}</span>
          </div>

          <div
            *ngFor="let item of grupo.itens; let ultimoItem = last"
            class="minha-conta-notificacoes__linha"
            [class.minha-conta-notificacoes__linha--ultima]="ultimoItem"
            [class.minha-conta-notificacoes__linha--obrigatoria]="item.obrigatoria"
          >
            <div class="minha-conta-notificacoes__evento">
              <span class="minha-conta-notificacoes__evento-icone" aria-hidden="true">
                <app-icone [nome]="iconeEvento(item.codigoTipo)" [tamanho]="18" />
              </span>
              <div class="minha-conta-notificacoes__evento-textos">
                <div class="minha-conta-notificacoes__evento-cabecalho">
                  <span class="minha-conta-notificacoes__evento-titulo">{{ item.descricao }}</span>
                  <span *ngIf="item.obrigatoria" class="minha-conta-notificacoes__badge">Obrigatória</span>
                </div>
                <p *ngIf="subtituloEvento(item.codigoTipo) as sub" class="minha-conta-notificacoes__evento-sub">
                  {{ sub }}
                </p>
              </div>
            </div>

            <div class="minha-conta-notificacoes__canais" role="group" [attr.aria-label]="item.descricao">
              <div class="minha-conta-notificacoes__canal" *ngIf="item.pushDisponivel">
                <app-icone class="minha-conta-notificacoes__canal-icone" nome="phone" [tamanho]="14" />
                <span class="minha-conta-notificacoes__canal-rotulo">No aplicativo</span>
                <label class="cad-switch">
                  <input
                    type="checkbox"
                    [checked]="item.ativoPush"
                    [disabled]="item.obrigatoria || salvando"
                    (change)="alternarCanal(item, 'push', $any($event.target).checked)"
                    [attr.aria-label]="'No aplicativo — ' + item.descricao"
                  />
                  <span class="cad-switch-trilha" aria-hidden="true"></span>
                </label>
              </div>
              <div class="minha-conta-notificacoes__canal" *ngIf="item.emailDisponivel">
                <app-icone class="minha-conta-notificacoes__canal-icone" nome="mail" [tamanho]="14" />
                <span class="minha-conta-notificacoes__canal-rotulo">E-mail</span>
                <label class="cad-switch">
                  <input
                    type="checkbox"
                    [checked]="item.ativoEmail"
                    [disabled]="item.obrigatoria || salvando"
                    (change)="alternarCanal(item, 'email', $any($event.target).checked)"
                    [attr.aria-label]="'E-mail — ' + item.descricao"
                  />
                  <span class="cad-switch-trilha" aria-hidden="true"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <aside class="minha-conta-notificacoes__info" aria-labelledby="minha-conta-notif-info-titulo">
          <app-icone class="minha-conta-notificacoes__info-icone" nome="info" [tamanho]="18" />
          <div class="minha-conta-notificacoes__info-textos">
            <p id="minha-conta-notif-info-titulo" class="minha-conta-notificacoes__info-titulo">Sobre os avisos</p>
            <p class="minha-conta-notificacoes__info-descricao">
              Para receber avisos no aplicativo, você precisa ter o AppCondominium instalado no celular, estar
              conectado à sua conta e permitir as notificações.
            </p>
          </div>
        </aside>

        <div class="minha-conta-notificacoes__acoes cad-acoes">
          <button
            type="button"
            class="btn-gravar"
            [class.is-loading]="salvando"
            [disabled]="salvando || !alterado"
            (click)="salvar()"
          >
            {{ salvando ? 'Salvando…' : 'Salvar preferências' }}
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class MinhaContaNotificacoesComponent implements OnInit {
  private conta = inject(ContaService);
  private toast = inject(ToastService);

  carregando = true;
  salvando = false;
  erroCarregar: string | null = null;
  alterado = false;

  categorias: PreferenciaNotificacaoCategoria[] = [];
  private rascunho = new Map<string, PreferenciaNotificacaoSalvarItem>();

  get grupos(): { modulo: string; itens: PreferenciaNotificacaoCategoria[] }[] {
    const mapa = new Map<string, PreferenciaNotificacaoCategoria[]>();
    for (const cat of this.categorias) {
      const lista = mapa.get(cat.modulo) ?? [];
      lista.push(cat);
      mapa.set(cat.modulo, lista);
    }
    const entradas = [...mapa.entries()].map(([modulo, itens]) => ({
      modulo,
      itens: [...itens].sort((a, b) => a.ordem - b.ordem),
    }));
    entradas.sort((a, b) => {
      const oa = Math.min(...a.itens.map(i => i.ordem));
      const ob = Math.min(...b.itens.map(i => i.ordem));
      return oa - ob;
    });
    return entradas;
  }

  ngOnInit(): void {
    this.conta.carregarPreferenciasNotificacao().subscribe({
      next: resp => {
        this.categorias = resp.categorias.map(c => ({ ...c }));
        this.sincronizarRascunho();
        this.carregando = false;
        this.alterado = false;
      },
      error: () => {
        this.carregando = false;
        this.erroCarregar = 'Não foi possível carregar as preferências.';
      },
    });
  }

  iconeModulo(modulo: string): string {
    const chave = modulo.toLowerCase();
    if (chave.includes('encomenda')) return 'package';
    return 'layers';
  }

  iconeEvento(codigoTipo: string): string {
    switch (codigoTipo) {
      case 'ENCOMENDA_RECEBIDA':
        return 'package';
      case 'ENCOMENDA_RETIRADA':
        return 'package-check';
      default:
        return 'bell';
    }
  }

  subtituloEvento(codigoTipo: string): string | null {
    switch (codigoTipo) {
      case 'ENCOMENDA_RECEBIDA':
        return 'Aviso quando uma encomenda for registrada.';
      case 'ENCOMENDA_RETIRADA':
        return 'Aviso quando uma encomenda for retirada.';
      default:
        return null;
    }
  }

  alternarCanal(item: PreferenciaNotificacaoCategoria, canal: 'push' | 'email', ativo: boolean): void {
    if (canal === 'push') item.ativoPush = ativo;
    else item.ativoEmail = ativo;
    this.rascunho.set(item.codigoTipo, {
      codigoTipo: item.codigoTipo,
      ativoPush: item.ativoPush,
      ativoEmail: item.ativoEmail,
    });
    this.alterado = true;
  }

  salvar(): void {
    if (!this.alterado) return;
    this.salvando = true;
    const preferencias = [...this.rascunho.values()];
    this.conta.salvarPreferenciasNotificacao(preferencias).subscribe({
      next: resp => {
        this.categorias = resp.categorias.map(c => ({ ...c }));
        this.sincronizarRascunho();
        this.alterado = false;
        this.salvando = false;
        this.toast.showSuccess('Preferências salvas.');
      },
      error: () => {
        this.salvando = false;
        this.toast.showError('Não foi possível salvar as preferências.');
      },
    });
  }

  private sincronizarRascunho(): void {
    this.rascunho.clear();
    for (const cat of this.categorias) {
      this.rascunho.set(cat.codigoTipo, {
        codigoTipo: cat.codigoTipo,
        ativoPush: cat.ativoPush,
        ativoEmail: cat.ativoEmail,
      });
    }
  }
}