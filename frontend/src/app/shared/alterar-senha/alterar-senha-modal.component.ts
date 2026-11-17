import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icone } from '../icone';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { AnexarAoBodyDirective } from '../foto-perfil/anexar-ao-body.directive';

@Component({
  selector: 'app-alterar-senha-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Icone, AnexarAoBodyDirective],
  template: `
    @if (aberto) {
      <div class="confirm-overlay alterar-senha-overlay" appAnexarAoBody role="presentation">
        <div
          class="confirm-modal modal-sge-form alterar-senha-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alterar-senha-titulo"
          (click)="$event.stopPropagation()">
          <header class="captura-modal__topo">
            <div class="alterar-senha-modal__titulo-grupo">
              <app-icone nome="lock" [tamanho]="20" />
              <h2 id="alterar-senha-titulo">Alterar senha</h2>
            </div>
            <button
              type="button"
              class="btn-ghost btn-icon btn-icon--sm"
              aria-label="Fechar"
              [disabled]="salvando"
              (click)="fecharModal()">
              <app-icone nome="x" [tamanho]="16" />
            </button>
          </header>

          <form class="modal-sge-form__corpo alterar-senha-modal__corpo" (ngSubmit)="salvar()">
            @if (feedback; as fb) {
              <div
                class="alterar-senha-modal__feedback"
                [class.alterar-senha-modal__feedback--sucesso]="fb.tipo === 'sucesso'"
                [class.alterar-senha-modal__feedback--erro]="fb.tipo === 'erro'"
                role="alert">
                <app-icone [nome]="fb.tipo === 'sucesso' ? 'check' : 'alert'" [tamanho]="18" />
                <span>{{ fb.texto }}</span>
              </div>
            }

            <div class="form-group">
              <label for="alterar-senha-atual">Senha atual</label>
              <div class="modal-sge-senha-wrap">
                <input
                  id="alterar-senha-atual"
                  name="senhaAtual"
                  [type]="mostrarAtual ? 'text' : 'password'"
                  [(ngModel)]="senhaAtual"
                  required
                  autocomplete="current-password"
                  [disabled]="salvando" />
                <button
                  type="button"
                  class="modal-sge-senha-toggle"
                  (click)="mostrarAtual = !mostrarAtual"
                  [attr.aria-label]="mostrarAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'"
                  [attr.aria-pressed]="mostrarAtual">
                  <app-icone [nome]="mostrarAtual ? 'eye-off' : 'eye'" [tamanho]="18" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="alterar-senha-nova">Nova senha</label>
              <div class="modal-sge-senha-wrap">
                <input
                  id="alterar-senha-nova"
                  name="senhaNova"
                  [type]="mostrarNova ? 'text' : 'password'"
                  [(ngModel)]="senhaNova"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  [disabled]="salvando" />
                <button
                  type="button"
                  class="modal-sge-senha-toggle"
                  (click)="mostrarNova = !mostrarNova"
                  [attr.aria-label]="mostrarNova ? 'Ocultar nova senha' : 'Mostrar nova senha'"
                  [attr.aria-pressed]="mostrarNova">
                  <app-icone [nome]="mostrarNova ? 'eye-off' : 'eye'" [tamanho]="18" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="alterar-senha-confirma">Confirmar nova senha</label>
              <div class="modal-sge-senha-wrap">
                <input
                  id="alterar-senha-confirma"
                  name="senhaConfirma"
                  [type]="mostrarConfirma ? 'text' : 'password'"
                  [(ngModel)]="senhaConfirma"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  [disabled]="salvando" />
                <button
                  type="button"
                  class="modal-sge-senha-toggle"
                  (click)="mostrarConfirma = !mostrarConfirma"
                  [attr.aria-label]="mostrarConfirma ? 'Ocultar confirmação' : 'Mostrar confirmação'"
                  [attr.aria-pressed]="mostrarConfirma">
                  <app-icone [nome]="mostrarConfirma ? 'eye-off' : 'eye'" [tamanho]="18" />
                </button>
              </div>
            </div>

            <footer class="captura-acoes modal-sge-form__rodape">
              <button type="button" class="btn-cancelar-modal" [disabled]="salvando" (click)="fecharModal()">
                Cancelar
              </button>
              <button type="submit" class="btn-confirm-ok" [disabled]="salvando || !podeSalvar">
                @if (salvando) {
                  <span class="loading-spinner alterar-senha-modal__spinner" aria-hidden="true"></span>
                  Salvando…
                } @else {
                  <app-icone nome="check" [tamanho]="14" />
                  Salvar nova senha
                }
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
})
export class AlterarSenhaModalComponent {
  @Input() aberto = false;
  @Output() readonly fechar = new EventEmitter<void>();

  senhaAtual = '';
  senhaNova = '';
  senhaConfirma = '';
  mostrarAtual = false;
  mostrarNova = false;
  mostrarConfirma = false;
  salvando = false;
  feedback: { tipo: 'sucesso' | 'erro'; texto: string } | null = null;

  constructor(
    private readonly conta: ContaService,
    private readonly toast: ToastService,
  ) {}

  get podeSalvar(): boolean {
    return !!this.senhaAtual && !!this.senhaNova && !!this.senhaConfirma;
  }

  fecharModal(): void {
    if (this.salvando) return;
    this.limpar();
    this.fechar.emit();
  }

  salvar(): void {
    this.feedback = null;
    if (this.senhaNova !== this.senhaConfirma) {
      this.feedback = { tipo: 'erro', texto: 'A confirmação não coincide com a nova senha.' };
      return;
    }
    if (this.senhaNova.length < 8) {
      this.feedback = { tipo: 'erro', texto: 'A nova senha deve ter pelo menos 8 caracteres.' };
      return;
    }
    if (this.senhaNova === this.senhaAtual) {
      this.feedback = { tipo: 'erro', texto: 'A nova senha deve ser diferente da senha atual.' };
      return;
    }

    this.salvando = true;
    this.conta.alterarSenha(this.senhaAtual, this.senhaNova).subscribe({
      next: () => {
        this.salvando = false;
        this.feedback = { tipo: 'sucesso', texto: 'Senha alterada com sucesso.' };
        this.toast.showSuccess('Sua senha foi alterada.');
        this.limparCampos();
        window.setTimeout(() => this.fecharModal(), 1200);
      },
      error: err => {
        this.salvando = false;
        const msg =
          err?.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
            : typeof err?.error === 'string'
              ? err.error
              : 'Não foi possível alterar a senha.';
        this.feedback = { tipo: 'erro', texto: msg };
        this.toast.showError(msg);
      },
    });
  }

  private limparCampos(): void {
    this.senhaAtual = '';
    this.senhaNova = '';
    this.senhaConfirma = '';
    this.mostrarAtual = false;
    this.mostrarNova = false;
    this.mostrarConfirma = false;
  }

  private limpar(): void {
    this.feedback = null;
    this.limparCampos();
    this.salvando = false;
  }
}