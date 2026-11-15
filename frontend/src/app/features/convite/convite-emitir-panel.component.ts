import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConviteService } from './convite.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-convite-emitir-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cad-convite-entrega">
      <h3 class="cad-secao__titulo">Enviar convite de acesso</h3>
      <div class="form-grid">
        <label>E-mail <input required type="email" [(ngModel)]="email" /></label>
        <label>CPF <input [(ngModel)]="cpf" /></label>
        <label>Papel (código) <input required type="number" [(ngModel)]="codigoPapelVinculo" /></label>
        <label>Perfil (Id) <input type="number" [(ngModel)]="idPerfil" /></label>
        <label>Unidade (Id) <input type="number" [(ngModel)]="idUnidade" /></label>
        <button type="button" class="btn-gravar" [disabled]="enviando" (click)="enviar()">Enviar convite</button>
      </div>
    </div>
  `
})
export class ConviteEmitirPanelComponent implements OnChanges {
  @Input() idPessoaDestinatario?: number;
  @Input() emailInicial = '';
  @Input() cpfInicial = '';
  @Output() conviteEmitido = new EventEmitter<void>();

  email = '';
  cpf = '';
  codigoPapelVinculo = 2;
  idPerfil?: number;
  idUnidade?: number;
  enviando = false;

  constructor(private readonly convites: ConviteService, private readonly toast: ToastService) {}

  ngOnChanges(): void {
    this.email = this.emailInicial;
    this.cpf = this.cpfInicial;
  }

  enviar(): void {
    this.enviando = true;
    this.convites.emitir({
      email: this.email,
      cpf: this.cpf || undefined,
      codigoPapelVinculo: this.codigoPapelVinculo,
      idPerfil: this.idPerfil,
      idUnidade: this.idUnidade,
      idPessoaDestinatario: this.idPessoaDestinatario
    }).subscribe({
      next: r => {
        this.toast.showSuccess(r.mensagem);
        this.enviando = false;
        this.conviteEmitido.emit();
      },
      error: e => {
        this.toast.showError(e.error?.title ?? 'Falha ao emitir convite.');
        this.enviando = false;
      }
    });
  }
}