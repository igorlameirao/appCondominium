import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../icone';
import { AnexarAoBodyDirective } from '../foto-perfil/anexar-ao-body.directive';
import { AlterarSenhaFormComponent } from './alterar-senha-form.component';

@Component({
  selector: 'app-alterar-senha-modal',
  standalone: true,
  imports: [CommonModule, Icone, AnexarAoBodyDirective, AlterarSenhaFormComponent],
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
              (click)="fecharModal()">
              <app-icone nome="x" [tamanho]="16" />
            </button>
          </header>

          <div class="modal-sge-form__corpo alterar-senha-modal__corpo">
            <app-alterar-senha-form
              #formulario
              idPrefix="alterar-senha-modal-"
              (cancelar)="fecharModal()" />
          </div>
        </div>
      </div>
    }
  `,
})
export class AlterarSenhaModalComponent {
  @Input() aberto = false;
  @Output() readonly fechar = new EventEmitter<void>();

  @ViewChild('formulario') private formulario?: AlterarSenhaFormComponent;

  fecharModal(): void {
    if (this.formulario?.salvando) return;
    this.formulario?.reset();
    this.fechar.emit();
  }
}