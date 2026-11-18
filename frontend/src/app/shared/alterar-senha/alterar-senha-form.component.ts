import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icone } from '../icone';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';

type CampoSenha = 'atual' | 'nova' | 'confirma';

@Component({
  selector: 'app-alterar-senha-form',
  standalone: true,
  imports: [CommonModule, FormsModule, Icone],
  template: `
    <form
      class="alterar-senha-form"
      [class.alterar-senha-form--pagina]="embutido"
      (ngSubmit)="salvar()">
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
        <label [attr.for]="idPrefix + 'atual'">Senha atual *</label>
        <div
          class="alterar-senha-campo-wrap"
          [class.modal-sge-senha-wrap]="!embutido"
          [class.cad-senha-wrap]="embutido"
          [class.alterar-senha-campo-wrap--invalido]="campoComErro('atual')">
          <span class="alterar-senha-campo-wrap__icone" aria-hidden="true">
            <app-icone nome="lock" [tamanho]="16" />
          </span>
          <input
            [id]="idPrefix + 'atual'"
            name="senhaAtual"
            [type]="mostrarAtual ? 'text' : 'password'"
            [(ngModel)]="senhaAtual"
            (ngModelChange)="limparErroCampo()"
            aria-required="true"
            placeholder="Informe sua senha atual"
            autocomplete="current-password"
            [disabled]="salvando" />
          <button
            type="button"
            [class.modal-sge-senha-toggle]="!embutido"
            [class.cad-senha-toggle]="embutido"
            (click)="mostrarAtual = !mostrarAtual"
            [attr.aria-label]="mostrarAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'"
            [attr.aria-pressed]="mostrarAtual">
            <app-icone [nome]="mostrarAtual ? 'eye-off' : 'eye'" [tamanho]="18" />
          </button>
        </div>
      </div>

      <div class="form-group">
        <label [attr.for]="idPrefix + 'nova'">Nova senha *</label>
        <div
          class="alterar-senha-campo-wrap"
          [class.modal-sge-senha-wrap]="!embutido"
          [class.cad-senha-wrap]="embutido"
          [class.alterar-senha-campo-wrap--invalido]="campoComErro('nova')">
          <span class="alterar-senha-campo-wrap__icone" aria-hidden="true">
            <app-icone nome="lock" [tamanho]="16" />
          </span>
          <input
            [id]="idPrefix + 'nova'"
            name="senhaNova"
            [type]="mostrarNova ? 'text' : 'password'"
            [(ngModel)]="senhaNova"
            (ngModelChange)="limparErroCampo()"
            aria-required="true"
            placeholder="Informe a nova senha"
            autocomplete="new-password"
            [disabled]="salvando" />
          <button
            type="button"
            [class.modal-sge-senha-toggle]="!embutido"
            [class.cad-senha-toggle]="embutido"
            (click)="mostrarNova = !mostrarNova"
            [attr.aria-label]="mostrarNova ? 'Ocultar nova senha' : 'Mostrar nova senha'"
            [attr.aria-pressed]="mostrarNova">
            <app-icone [nome]="mostrarNova ? 'eye-off' : 'eye'" [tamanho]="18" />
          </button>
        </div>
      </div>

      <div class="form-group">
        <label [attr.for]="idPrefix + 'confirma'">Confirmar nova senha *</label>
        <div
          class="alterar-senha-campo-wrap"
          [class.modal-sge-senha-wrap]="!embutido"
          [class.cad-senha-wrap]="embutido"
          [class.alterar-senha-campo-wrap--invalido]="campoComErro('confirma')">
          <span class="alterar-senha-campo-wrap__icone" aria-hidden="true">
            <app-icone nome="lock" [tamanho]="16" />
          </span>
          <input
            [id]="idPrefix + 'confirma'"
            name="senhaConfirma"
            [type]="mostrarConfirma ? 'text' : 'password'"
            [(ngModel)]="senhaConfirma"
            (ngModelChange)="limparErroCampo()"
            aria-required="true"
            placeholder="Confirme a nova senha"
            autocomplete="new-password"
            [disabled]="salvando" />
          <button
            type="button"
            [class.modal-sge-senha-toggle]="!embutido"
            [class.cad-senha-toggle]="embutido"
            (click)="mostrarConfirma = !mostrarConfirma"
            [attr.aria-label]="mostrarConfirma ? 'Ocultar confirmação' : 'Mostrar confirmação'"
            [attr.aria-pressed]="mostrarConfirma">
            <app-icone [nome]="mostrarConfirma ? 'eye-off' : 'eye'" [tamanho]="18" />
          </button>
        </div>
      </div>

      @if (embutido) {
        <div class="cad-acoes actions form-actions minha-conta-senha__acoes">
          <span class="cad-acoes__espaco"></span>
          <button type="button" class="btn-cancelar-modal" [disabled]="salvando" (click)="cancelarEmbutido()">
            Cancelar
          </button>
          <button type="submit" class="btn-gravar" [disabled]="salvando || !podeSalvar">
            @if (salvando) {
              <span class="loading-spinner alterar-senha-modal__spinner" aria-hidden="true"></span>
              Salvando…
            } @else {
              <app-icone nome="check" [tamanho]="14" />
              Salvar nova senha
            }
          </button>
        </div>
      } @else {
        <footer class="captura-acoes modal-sge-form__rodape">
          <button type="button" class="btn-cancelar-modal" [disabled]="salvando" (click)="cancelar.emit()">
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
      }
    </form>
  `,
})
export class AlterarSenhaFormComponent {
  private readonly conta = inject(ContaService);
  private readonly toast = inject(ToastService);

  /** Formulário dentro da aba Minha conta (sem cancelar / sem fechar diálogo). */
  @Input() embutido = false;
  @Input() idPrefix = 'alterar-senha-';

  @Output() readonly cancelar = new EventEmitter<void>();
  @Output() readonly sucesso = new EventEmitter<void>();

  senhaAtual = '';
  senhaNova = '';
  senhaConfirma = '';
  mostrarAtual = false;
  mostrarNova = false;
  mostrarConfirma = false;
  salvando = false;
  feedback: { tipo: 'sucesso' | 'erro'; texto: string } | null = null;
  camposInvalidos = new Set<CampoSenha>();

  get podeSalvar(): boolean {
    return !!this.senhaAtual && !!this.senhaNova && !!this.senhaConfirma;
  }

  campoComErro(campo: CampoSenha): boolean {
    return this.camposInvalidos.has(campo);
  }

  limparErroCampo(): void {
    if (this.camposInvalidos.size) {
      this.camposInvalidos.clear();
    }
  }

  cancelarEmbutido(): void {
    if (this.salvando) return;
    this.reset();
    this.cancelar.emit();
  }

  salvar(): void {
    this.feedback = null;
    this.camposInvalidos.clear();
    if (this.senhaNova !== this.senhaConfirma) {
      this.camposInvalidos.add('nova');
      this.camposInvalidos.add('confirma');
      this.feedback = { tipo: 'erro', texto: 'A confirmação não coincide com a nova senha.' };
      return;
    }
    if (this.senhaNova.length < 8) {
      this.camposInvalidos.add('nova');
      this.feedback = { tipo: 'erro', texto: 'A nova senha deve ter pelo menos 8 caracteres.' };
      return;
    }
    if (this.senhaNova === this.senhaAtual) {
      this.camposInvalidos.add('nova');
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
        this.sucesso.emit();
        if (!this.embutido) {
          window.setTimeout(() => this.cancelar.emit(), 1200);
        }
      },
      error: err => {
        this.salvando = false;
        const msg =
          err?.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
            : typeof err?.error === 'string'
              ? err.error
              : 'Não foi possível alterar a senha.';
        this.camposInvalidos.add('atual');
        this.feedback = { tipo: 'erro', texto: msg };
        this.toast.showError(msg);
      },
    });
  }

  reset(): void {
    this.feedback = null;
    this.camposInvalidos.clear();
    this.limparCampos();
    this.salvando = false;
  }

  private limparCampos(): void {
    this.senhaAtual = '';
    this.senhaNova = '';
    this.senhaConfirma = '';
    this.mostrarAtual = false;
    this.mostrarNova = false;
    this.mostrarConfirma = false;
    this.camposInvalidos.clear();
  }
}