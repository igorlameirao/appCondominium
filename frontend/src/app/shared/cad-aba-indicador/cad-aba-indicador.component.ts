import { Component, Input } from '@angular/core';

/** Bolinha antes do ícone da aba: contorno = ok / sem obrigatórios; preenchida vermelha = pendências. */
@Component({
  selector: 'app-cad-aba-indicador',
  standalone: true,
  host: { class: 'cad-aba-indicador-host' },
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      align-self: center;
      line-height: 0;
      vertical-align: middle;
    }

    .cad-aba__indicador {
      display: block;
      flex: 0 0 8px;
      width: 8px;
      height: 8px;
      min-width: 8px;
      min-height: 8px;
      max-width: 8px;
      max-height: 8px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      background: transparent;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
    }

    .cad-aba__indicador--pendente {
      background: #dc2626;
      border-color: #dc2626;
    }
  `],
  template: `
    <span
      class="cad-aba__indicador"
      [class.cad-aba__indicador--pendente]="pendente"
      [attr.aria-label]="pendente ? 'Campos obrigatórios pendentes nesta aba' : null"
      role="img"></span>
  `,
})
export class CadAbaIndicadorComponent {
  @Input() pendente = false;
}