import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnderecoFormCorpoComponent } from '../endereco/endereco-form-corpo.component';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { Icone } from '../../shared/icone';
import { AnexarAoBodyDirective } from '../../shared/foto-perfil/anexar-ao-body.directive';
import {
  PessoaEnderecoItem,
  PessoaEnderecoService,
  PessoaEnderecoUpsert
} from '../../core/services/pessoa-endereco.service';
import { ToastService } from '../../core/services/toast.service';

export type PessoaEnderecoPendente = PessoaEnderecoUpsert & { localId: number };

@Component({
  selector: 'app-pessoa-enderecos-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EnderecoFormCorpoComponent,
    ListLoadingModalComponent,
    Icone,
    AnexarAoBodyDirective
  ],
  template: `
    <app-list-loading-modal [visible]="loading" />

    <div class="cad-lista-cabecalho" *ngIf="podeEditar && podeIncluirEndereco">
      <button type="button" class="btn-novo" (click)="iniciarNovo()">Adicionar endereço</button>
    </div>

    <div class="lst-tabela__scroll">
      <table class="lst-grade" *ngIf="linhas.length; else semEndereco">
        <thead>
          <tr>
            <th scope="col">Tipo</th>
            <th scope="col" class="lst-col--conteudo">Logradouro</th>
            <th scope="col">Nº</th>
            <th scope="col">Complemento</th>
            <th scope="col">CEP</th>
            <th scope="col" class="lst-grade__acoes" *ngIf="podeEditar">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of linhas" class="row-click" (dblclick)="podeEditar && iniciarEdicao(e)">
            <td>{{ enderecoSvc.labelTipo(e.tipoEndereco) }}</td>
            <td class="lst-col--conteudo">{{ e.logradouro ?? '—' }}</td>
            <td>{{ e.numeroEndereco ?? '—' }}</td>
            <td>{{ e.complementoEndereco ?? '—' }}</td>
            <td>{{ e.cep ?? '—' }}</td>
            <td class="lst-grade__acoes" *ngIf="podeEditar">
              <div class="lst-acoes" role="group" [attr.aria-label]="'Ações do endereço'">
                <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar endereço"
                  (click)="iniciarEdicao(e); $event.stopPropagation()" (dblclick)="$event.stopPropagation()">
                  <app-icone nome="pencil" [tamanho]="16" />
                </button>
                <button type="button" class="lst-acao lst-acao--excluir" title="Remover" aria-label="Remover endereço"
                  (click)="remover(e); $event.stopPropagation()" (dblclick)="$event.stopPropagation()">
                  <app-icone nome="trash" [tamanho]="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #semEndereco>
        <p class="lst-vazio" *ngIf="!loading">Nenhum endereço cadastrado.</p>
      </ng-template>
    </div>

  <div *ngIf="modalAberta" class="confirm-overlay" appAnexarAoBody role="presentation"
      (click)="cancelarForm()" (keydown.escape)="cancelarForm()">
      <div
        class="confirm-modal modal-sge-form pessoa-endereco-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'titulo-modal-endereco'"
        (click)="$event.stopPropagation()">
        <header class="captura-modal__topo">
          <h3 id="titulo-modal-endereco">{{ editandoChave ? 'Editar endereço' : 'Novo endereço' }}</h3>
          <button type="button" class="btn-ghost btn-icon btn-icon--sm" aria-label="Fechar"
            [disabled]="saving" (click)="cancelarForm()">
            <app-icone nome="x" [tamanho]="16" />
          </button>
        </header>
        <div class="captura-modal__corpo modal-sge-form__corpo pessoa-endereco-modal__corpo">
          <app-endereco-form-corpo
            [exibirId]="!!editandoId && !modoPendente"
            [idDisplay]="editandoId"
            [cep]="form.cep ?? ''"
            [logradouro]="form.logradouro ?? ''"
            [idBairro]="form.idBairro"
            [numero]="form.numeroEndereco"
            [complemento]="form.complementoEndereco ?? ''"
            (cepChange)="form.cep = $event"
            (logradouroChange)="form.logradouro = $event"
            (idBairroChange)="form.idBairro = $event ?? undefined"
            (numeroChange)="onNumeroChange($event)"
            (complementoChange)="form.complementoEndereco = $event"
            [readonlyEndereco]="!!editandoId && !modoPendente"
            [readonlyNumero]="false"
            [exibirTipoEndereco]="true"
            [tipoEndereco]="form.tipoEndereco"
            (tipoEnderecoChange)="form.tipoEndereco = $event" />
          <p class="field-error" *ngIf="formError">{{ formError }}</p>
        </div>
        <footer class="captura-acoes modal-sge-form__rodape">
          <button type="button" class="btn-cancelar-modal" [disabled]="saving" (click)="cancelarForm()">Cancelar</button>
          <button type="button" class="btn-gravar" [class.is-loading]="saving" [disabled]="saving" (click)="salvar()">
            {{ rotuloSalvarForm }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .pessoa-endereco-modal.confirm-modal.modal-sge-form {
      display: flex;
      flex-direction: column;
      width: min(920px, 96vw);
      max-width: min(920px, 96vw);
    }
    .pessoa-endereco-modal__corpo {
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: auto;
      overflow-y: auto;
      max-height: min(62vh, 580px);
    }
    .pessoa-endereco-modal .modal-sge-form__rodape {
      flex-shrink: 0;
      gap: 12px;
      padding: 18px 24px 28px;
    }
    .field-error {
      margin: 0;
      font-size: 12px;
      color: var(--cad-campo-erro, #dc3545);
    }
  `]
})
export class PessoaEnderecosPanelComponent implements OnChanges {
  @Input() idPessoa: number | null = null;
  @Input() podeEditar = false;
  @Input() modoPendente = false;
  @Output() pendentesChange = new EventEmitter<PessoaEnderecoUpsert[]>();

  enderecos: PessoaEnderecoItem[] = [];
  pendentes: PessoaEnderecoPendente[] = [];
  loading = false;
  saving = false;
  modalAberta = false;
  editandoId: number | null = null;
  editandoLocalId: number | null = null;
  form: PessoaEnderecoUpsert = this.formVazio();
  formError = '';
  private nextLocalId = 1;

  constructor(
    public enderecoSvc: PessoaEnderecoService,
    private toast: ToastService
  ) {}

  get editandoChave(): number | null {
    return this.editandoId ?? this.editandoLocalId;
  }

  get podeIncluirEndereco(): boolean {
    return this.modoPendente || !!this.idPessoa;
  }

  get rotuloSalvarForm(): string {
    if (this.modoPendente && !this.idPessoa) {
      return this.editandoChave ? 'Salvar na lista' : 'Incluir na lista';
    }
    return this.editandoId ? 'Salvar alterações' : 'Gravar endereço';
  }

  get linhas(): PessoaEnderecoItem[] {
    if (this.modoPendente && !this.idPessoa) {
      return this.pendentes.map(p => ({
        idPessoa: 0,
        idEndereco: p.localId,
        numeroEndereco: p.numeroEndereco,
        complementoEndereco: p.complementoEndereco,
        tipoEndereco: p.tipoEndereco,
        cep: p.cep,
        logradouro: p.logradouro,
        idBairro: p.idBairro
      }));
    }
    return this.enderecos;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['idPessoa'] && this.idPessoa && !this.modoPendente) this.recarregar();
    if (!this.idPessoa && !this.modoPendente) this.enderecos = [];
  }

  emitirPendentes(): void {
    this.pendentesChange.emit(this.pendentes.map(({ localId: _l, ...rest }) => rest));
  }

  private formVazio(): PessoaEnderecoUpsert {
    return { tipoEndereco: 1, cep: '', logradouro: '', idBairro: undefined };
  }

  onNumeroChange(v: string): void {
    const n = v.trim();
    this.form.numeroEndereco = n ? Number(n) : undefined;
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
    this.editandoLocalId = null;
    this.form = this.formVazio();
    this.formError = '';
    this.modalAberta = true;
  }

  iniciarEdicao(e: PessoaEnderecoItem): void {
    if (this.modoPendente && !this.idPessoa) {
      const p = this.pendentes.find(x => x.localId === e.idEndereco);
      if (!p) return;
      this.editandoLocalId = p.localId;
      this.editandoId = null;
      this.form = { ...p };
    } else {
      this.editandoId = e.idEndereco;
      this.editandoLocalId = null;
      this.form = {
        idEndereco: e.idEndereco,
        cep: e.cep ?? '',
        logradouro: e.logradouro ?? '',
        idBairro: e.idBairro,
        numeroEndereco: e.numeroEndereco,
        complementoEndereco: e.complementoEndereco,
        tipoEndereco: e.tipoEndereco
      };
    }
    this.formError = '';
    this.modalAberta = true;
  }

  cancelarForm(): void {
    this.modalAberta = false;
    this.editandoId = null;
    this.editandoLocalId = null;
    this.form = this.formVazio();
    this.formError = '';
  }

  salvar(): void {
    if (!this.editandoChave && (!this.form.logradouro?.trim() || !this.form.idBairro)) {
      this.formError = 'Informe logradouro e bairro.';
      return;
    }
    if (this.modoPendente && !this.idPessoa) {
      this.salvarPendente();
      return;
    }
    if (!this.idPessoa) return;
    this.saving = true;
    this.formError = '';
    const payload: PessoaEnderecoUpsert = this.editandoId
      ? {
          idEndereco: this.form.idEndereco,
          numeroEndereco: this.form.numeroEndereco,
          complementoEndereco: this.form.complementoEndereco,
          tipoEndereco: this.form.tipoEndereco
        }
      : { ...this.form };
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
      this.enderecoSvc.atualizar(this.idPessoa, this.editandoId, payload).subscribe({ next: done, error: err });
    } else {
      this.enderecoSvc.gravar(this.idPessoa, payload).subscribe({ next: done, error: err });
    }
  }

  private salvarPendente(): void {
    const { localId: _drop, ...upsert } = this.form as PessoaEnderecoPendente;
    if (this.editandoLocalId != null) {
      const idx = this.pendentes.findIndex(p => p.localId === this.editandoLocalId);
      if (idx >= 0) this.pendentes[idx] = { ...upsert, localId: this.editandoLocalId };
    } else {
      this.pendentes.push({ ...upsert, localId: this.nextLocalId++ });
    }
    this.emitirPendentes();
    this.cancelarForm();
  }

  remover(e: PessoaEnderecoItem): void {
    if (this.modoPendente && !this.idPessoa) {
      if (!confirm('Remover este endereço da lista?')) return;
      this.pendentes = this.pendentes.filter(p => p.localId !== e.idEndereco);
      this.emitirPendentes();
      return;
    }
    if (!this.idPessoa || !confirm('Remover vínculo deste endereço com a pessoa?')) return;
    this.enderecoSvc.remover(this.idPessoa, e.idEndereco).subscribe({
      next: () => { this.toast.showSuccess('Endereço removido.'); this.recarregar(); },
      error: err => this.toast.showError((err as { error?: string })?.error ?? 'Não foi possível remover.')
    });
  }
}