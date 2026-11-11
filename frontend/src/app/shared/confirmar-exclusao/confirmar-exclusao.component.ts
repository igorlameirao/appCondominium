import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnexarAoBodyDirective } from '../foto-perfil/anexar-ao-body.directive';

@Component({
  selector: 'app-confirmar-exclusao',
  standalone: true,
  imports: [CommonModule, AnexarAoBodyDirective],
  template: `
    <div class="confirm-overlay" appAnexarAoBody *ngIf="aberto" (keydown.escape)="cancelar.emit()">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmar-exclusao-titulo" (click)="$event.stopPropagation()">
        <p id="confirmar-exclusao-titulo" class="confirm-text">Confirma a exclusão deste registro?</p>
        <div class="confirm-actions">
          <button type="button" class="btn-cancelar-modal" [disabled]="excluindo" (click)="cancelar.emit()">Cancelar</button>
          <button
            type="button"
            class="btn-confirm-danger"
            [class.is-loading]="excluindo"
            [attr.aria-busy]="excluindo || null"
            [disabled]="excluindo"
            (click)="confirmar.emit()">{{ excluindo ? 'Excluindo...' : 'Excluir' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmarExclusaoComponent {
  @Input() aberto = false;
  @Input() excluindo = false;
  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
}
