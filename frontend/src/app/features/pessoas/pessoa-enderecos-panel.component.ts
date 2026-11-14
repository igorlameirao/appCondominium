import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import {
  PessoaEnderecoItem,
  PessoaEnderecoService,
  PessoaEnderecoUpsert
} from '../../core/services/pessoa-endereco.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-pessoa-enderecos-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, EnderecoWidgetComponent, ListLoadingModalComponent],
  template: `
    <app-list-loading-modal [visible]="loading" />
    <table class="lst-grade" *ngIf="enderecos.length; else semEndereco">
      <thead><tr><th>Tipo</th><th>Logradouro</th><th>Nº</th><th>Complemento</th><th>CEP</th><th *ngIf="podeEditar">Ações</th></tr></thead>
      <tbody>
        <tr *ngFor="let e of enderecos">
          <td>{{ enderecoSvc.labelTipo(e.tipoEndereco) }}</td>
          <td>{{ e.logradouro ?? '—' }}</td>
          <td>{{ e.numeroEndereco ?? '—' }}</td>
          <td>{{ e.complementoEndereco ?? '—' }}</td>
          <td>{{ e.cep ?? '—' }}</td>
          <td *ngIf="podeEditar" class="acoes">
            <button type="button" class="btn-filtrar" (click)="iniciarEdicao(e)">Editar</button>
            <button type="button" class="btn-filtrar" (click)="remover(e)">Remover</button>
          </td>
        </tr>
      </tbody>
    </table>
    <ng-template #semEndereco><p class="empty" *ngIf="!loading">Nenhum endereço cadastrado.</p></ng-template>

    <div *ngIf="podeEditar && exibirForm" class="form-endereco">
      <h3>{{ editandoId ? 'Editar endereço' : 'Novo endereço' }}</h3>
      <app-endereco-widget
        modo="cadastro"
        [cep]="form.cep"
        [logradouroVinculo]="form.logradouro"
        [idBairro]="form.idBairro"
        (cepChange)="form.cep = $event"
        (logradouroChange)="form.logradouro = $event"
        (idBairroChange)="form.idBairro = $event ?? undefined" />
      <div class="form-grid">
        <div class="form-group fg-col-2">
          <label>Número</label>
          <input type="number" [(ngModel)]="form.numeroEndereco" name="numeroEndereco" />
        </div>
        <div class="form-group fg-col-4">
          <label>Complemento</label>
          <input type="text" [(ngModel)]="form.complementoEndereco" name="complementoEndereco" maxlength="100" />
        </div>
        <div class="form-group fg-col-3">
          <label>Tipo *</label>
          <select [(ngModel)]="form.tipoEndereco" name="tipoEndereco">
            <option [ngValue]="0">Principal</option>
            <option [ngValue]="1">Secundário</option>
            <option [ngValue]="2">Inativo</option>
          </select>
        </div>
      </div>
      <div class="msg-erro" *ngIf="formError">{{ formError }}</div>
      <button type="button" class="btn-gravar" (click)="salvar()" [disabled]="saving">{{ editandoId ? 'Salvar alterações' : 'Gravar endereço' }}</button>
      <button type="button" class="btn-cancelar" (click)="cancelarForm()">Cancelar</button>
    </div>
    <button type="button" class="btn-filtrar" *ngIf="podeEditar && !exibirForm && idPessoa" (click)="iniciarNovo()">Adicionar endereço</button>
  `,
  styles: [
    `.acoes { display: flex; gap: 6px; flex-wrap: wrap; }`,
    `.form-endereco { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }`,
    `.msg-erro { color: #c00; margin: 8px 0; font-size: .9rem; }`,
    `table { width: 100%; margin-top: 8px; }`
  ]
})
export class PessoaEnderecosPanelComponent implements OnChanges {
  @Input({ required: true }) idPessoa: number | null = null;
  @Input() podeEditar = false;

  enderecos: PessoaEnderecoItem[] = [];
  loading = false;
  saving = false;
  exibirForm = false;
  editandoId: number | null = null;
  form: PessoaEnderecoUpsert = this.formVazio();
  formError = '';

  constructor(
    public enderecoSvc: PessoaEnderecoService,
    private toast: ToastService
  ) {}

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['idPessoa'] && this.idPessoa) this.recarregar();
    if (!this.idPessoa) this.enderecos = [];
  }

  private formVazio(): PessoaEnderecoUpsert {
    return { tipoEndereco: 1, cep: '', logradouro: '', idBairro: undefined };
  }

  recarregar(): void {
    if (!this.idPessoa) return;
    this.loading = true;
    this.enderecoSvc.listar(this.idPessoa).subscribe({
      next: lista => { this.enderecos = lista ?? []; this.loading = false; },
      error: () => { this.enderecos = []; this.loading = false; }
    });
  }

  iniciarNovo(): void {
    this.editandoId = null;
    this.form = this.formVazio();
    this.formError = '';
    this.exibirForm = true;
  }

  iniciarEdicao(e: PessoaEnderecoItem): void {
    this.editandoId = e.idEndereco;
    this.form = {
      idEndereco: e.idEndereco,
      cep: e.cep ?? '',
      logradouro: e.logradouro ?? '',
      idBairro: e.idBairro,
      numeroEndereco: e.numeroEndereco,
      complementoEndereco: e.complementoEndereco,
      tipoEndereco: e.tipoEndereco
    };
    this.formError = '';
    this.exibirForm = true;
  }

  cancelarForm(): void {
    this.exibirForm = false;
    this.editandoId = null;
    this.form = this.formVazio();
    this.formError = '';
  }

  salvar(): void {
    if (!this.idPessoa) return;
    if (!this.form.logradouro?.trim() || !this.form.idBairro) {
      this.formError = 'Informe logradouro e bairro.';
      return;
    }
    this.saving = true;
    this.formError = '';
    const done = () => {
      this.toast.showSuccess(this.editandoId ? 'Endereço atualizado.' : 'Endereço gravado.');
      this.cancelarForm();
      this.recarregar();
      this.saving = false;
    };
    const err = (e: unknown) => {
      const body = (e as { error?: string })?.error;
      this.formError = typeof body === 'string' ? body : 'Erro ao gravar endereço.';
      this.toast.showError(this.formError);
      this.saving = false;
    };
    if (this.editandoId) {
      this.enderecoSvc.atualizar(this.idPessoa, this.editandoId, this.form).subscribe({ next: done, error: err });
    } else {
      this.enderecoSvc.gravar(this.idPessoa, this.form).subscribe({ next: done, error: err });
    }
  }

  remover(e: PessoaEnderecoItem): void {
    if (!this.idPessoa || !confirm('Remover vínculo deste endereço com a pessoa?')) return;
    this.enderecoSvc.remover(this.idPessoa, e.idEndereco).subscribe({
      next: () => { this.toast.showSuccess('Endereço removido.'); this.recarregar(); },
      error: err => this.toast.showError((err as { error?: string })?.error ?? 'Não foi possível remover.')
    });
  }
}