import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Icone } from '../icone';

@Component({
  selector: 'app-modal-imagem-visualizacao',
  standalone: true,
  imports: [Icone],
  template: `
    <div class="confirm-overlay cad-modal-imagem" role="dialog" aria-modal="true" [attr.aria-label]="titulo" (click)="fechar.emit()">
      <div class="cad-dialog cad-modal-imagem__painel" (click)="$event.stopPropagation()">
        <header class="cad-modal-imagem__cabecalho">
          <h2 class="cad-modal-imagem__titulo">{{ titulo }}</h2>
          <button type="button" class="cad-modal-imagem__fechar" (click)="fechar.emit()" aria-label="Fechar visualização">
            <app-icone nome="x" [tamanho]="18" />
          </button>
        </header>
        <div class="cad-modal-imagem__corpo">
          <img [src]="url" [alt]="titulo" />
        </div>
      </div>
    </div>
  `,
})
export class ModalImagemVisualizacaoComponent {
  @Input() url = '';
  @Input() titulo = 'Visualizar imagem';
  @Output() fechar = new EventEmitter<void>();
}
