import { Component, Input } from '@angular/core';
import { ehRegistroCadastralAtivo } from './lst-situacao-cadastral.util';

@Component({
  selector: 'app-lst-situacao-cadastral',
  standalone: true,
  template: `
    <span
      class="lst-badge"
      [class.lst-badge--sucesso]="ativo"
      [class.lst-badge--perigo]="!ativo"
    >{{ ativo ? 'Ativo' : 'Inativo' }}</span>
  `,
})
export class LstSituacaoCadastralComponent {
  @Input() valor: number | boolean | string | undefined | null = null;

  get ativo(): boolean {
    return ehRegistroCadastralAtivo(this.valor);
  }
}
