import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';

/** Corpo reutilizável do cadastro de endereço (`endereco-form`) para embutir em outras telas. */
@Component({
  selector: 'app-endereco-form-corpo',
  standalone: true,
  imports: [CommonModule, FormsModule, EnderecoWidgetComponent],
  host: { class: 'endereco-form-corpo' },
  template: `
    <div class="form-grid" *ngIf="exibirId">
      <div class="form-group fg-col-2">
        <label>Id</label>
        <input type="text" [value]="idDisplay ?? ''" readonly class="readonly" />
      </div>
    </div>
    <app-endereco-widget
      modo="cadastro"
      [cep]="cep"
      [logradouroVinculo]="logradouro"
      [idBairro]="idBairro"
      [numero]="numero"
      [complemento]="complemento"
      (cepChange)="cepChange.emit($event)"
      (logradouroChange)="logradouroChange.emit($event)"
      (idBairroChange)="idBairroChange.emit($event)"
      (numeroChange)="numeroChange.emit($event)"
      (complementoChange)="complementoChange.emit($event)"
      [readonly]="readonlyEndereco"
      [readonlyNumero]="readonlyNumero"
      [exibirTipoEndereco]="exibirTipoEndereco"
      [tipoEndereco]="tipoEndereco"
      [erroTipo]="erroTipo"
      [bloquearTipoPrincipal]="bloquearTipoPrincipal"
      (tipoEnderecoChange)="tipoEnderecoChange.emit($event)"
      (tipoPrincipalIndisponivel)="tipoPrincipalIndisponivel.emit()" />
  `,
  styles: [`:host { display: block; }`]
})
export class EnderecoFormCorpoComponent {
  @Input() exibirId = false;
  @Input() idDisplay: number | string | null = null;
  @Input() cep = '';
  @Input() logradouro = '';
  @Input() idBairro?: number;
  @Input() numero: string | number | undefined = '';
  @Input() complemento = '';
  @Input() readonlyEndereco = false;
  @Input() readonlyNumero = false;
  @Input() exibirTipoEndereco = false;
  @Input() tipoEndereco = 1;
  /** Mensagem de validação exibida junto ao campo Tipo (ex.: regra de único Principal). */
  @Input() erroTipo = '';
  @Input() bloquearTipoPrincipal = false;

  @Output() cepChange = new EventEmitter<string>();
  @Output() logradouroChange = new EventEmitter<string>();
  @Output() idBairroChange = new EventEmitter<number | null>();
  @Output() numeroChange = new EventEmitter<string>();
  @Output() complementoChange = new EventEmitter<string>();
  @Output() tipoEnderecoChange = new EventEmitter<number>();
  @Output() tipoPrincipalIndisponivel = new EventEmitter<void>();
}