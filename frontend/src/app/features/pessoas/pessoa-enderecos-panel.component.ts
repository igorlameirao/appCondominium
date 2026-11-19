import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnderecoFormCorpoComponent } from '../endereco/endereco-form-corpo.component';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { Icone } from '../../shared/icone';
import {
  PessoaEnderecoItem,
  PessoaEnderecoService,
  PessoaEnderecoUpsert
} from '../../core/services/pessoa-endereco.service';
import { ToastService } from '../../core/services/toast.service';
import { mascaraCep } from '../../core/utils/documento-validator';

export type PessoaEnderecoPendente = PessoaEnderecoUpsert & { localId: number };

const MSG_PRINCIPAL_DUPLICADO =
  'Já existe um endereço principal. Altere o tipo do endereço atual antes de definir outro como principal.';

export const MSG_ENDERECO_NAO_INCLUIDO = 'O endereço digitado não foi incluído na lista.';

@Component({
  selector: 'app-pessoa-enderecos-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EnderecoFormCorpoComponent,
    ListLoadingModalComponent,
    Icone
  ],
  host: { class: 'pessoa-enderecos-panel' },
  template: `
    <app-list-loading-modal [visible]="loading" />

  <section
      *ngIf="exibirFormulario"
      class="pessoa-enderecos-form"
      #formularioEndereco
      tabindex="-1"
      [attr.aria-labelledby]="'titulo-form-endereco'">
      <h3 class="pessoa-enderecos-form__titulo" id="titulo-form-endereco">{{ tituloForm }}</h3>
      <div class="pessoa-enderecos-form__corpo">
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
          [erroTipo]="erroTipo"
          [bloquearTipoPrincipal]="bloquearSelecaoPrincipal"
          (tipoEnderecoChange)="aoMudarTipoEndereco($event)"
          (tipoPrincipalIndisponivel)="erroTipo = msgPrincipalDuplicado" />
        <p class="field-error" *ngIf="formError" role="alert">{{ formError }}</p>
      </div>
      <div class="pessoa-enderecos-form__acoes" role="group" [attr.aria-label]="'Ações do formulário de endereço'">
        <button type="button" class="btn-ghost" [disabled]="saving" (click)="limparFormulario()">Limpar</button>
        <span class="pessoa-enderecos-form__acoes-espaco"></span>
        <button type="button" class="btn-cancelar" *ngIf="editandoChave" [disabled]="saving" (click)="cancelarEdicao()">
          Cancelar edição
        </button>
        <button type="button" class="btn-gravar" [class.is-loading]="saving" [disabled]="saving" (click)="confirmarFormulario()">
          {{ rotuloConfirmar }}
        </button>
      </div>
    </section>

    <section class="pessoa-enderecos-lista" aria-labelledby="titulo-lista-enderecos">
      <h3 class="pessoa-enderecos-lista__titulo" id="titulo-lista-enderecos">
        Endereços adicionados
        <span class="pessoa-enderecos-lista__contador" aria-label="Quantidade de endereços">({{ linhas.length }})</span>
      </h3>
      <p class="pessoa-enderecos-lista__vazio" *ngIf="!linhas.length && !loading">Nenhum endereço adicionado.</p>
      <ul class="pessoa-enderecos-cards" *ngIf="linhas.length" role="list">
        <li
          *ngFor="let e of linhas; trackBy: trackEndereco"
          class="pessoa-enderecos-card"
          [class.pessoa-enderecos-card--editando]="chaveLinha(e) === editandoChave"
          [attr.aria-current]="chaveLinha(e) === editandoChave ? 'true' : null">
          <app-icone class="pessoa-enderecos-card__icone" nome="map-pin" [tamanho]="18" aria-hidden="true" />
          <span class="pessoa-enderecos-card__divisor" aria-hidden="true"></span>
          <div class="pessoa-enderecos-card__corpo">
            <p class="pessoa-enderecos-card__linha-principal">{{ formatarLogradouro(e) }}</p>
            <p class="pessoa-enderecos-card__linha-secundaria" *ngIf="e.complementoEndereco">{{ e.complementoEndereco }}</p>
            <p class="pessoa-enderecos-card__linha-secundaria" *ngIf="e.cep">CEP {{ formatarCep(e.cep) }}</p>
          </div>
          <span
            class="pessoa-enderecos-card__tipo"
            [class.pessoa-enderecos-card__tipo--principal]="e.tipoEndereco === 0"
            [class.pessoa-enderecos-card__tipo--secundario]="e.tipoEndereco === 1"
            [class.pessoa-enderecos-card__tipo--inativo]="e.tipoEndereco === 2">
            {{ enderecoSvc.labelTipo(e.tipoEndereco) }}
          </span>
          <div class="pessoa-enderecos-card__acoes" *ngIf="podeEditar" role="group" [attr.aria-label]="'Ações do endereço'">
            <button type="button" class="lst-acao lst-acao--editar" title="Editar" aria-label="Editar endereço"
              (click)="iniciarEdicao(e)">
              <app-icone nome="pencil" [tamanho]="16" />
            </button>
            <button type="button" class="lst-acao lst-acao--excluir" title="Excluir" aria-label="Excluir endereço"
              (click)="remover(e)">
              <app-icone nome="trash" [tamanho]="16" />
            </button>
          </div>
        </li>
      </ul>
    </section>
  `
})
export class PessoaEnderecosPanelComponent implements OnChanges {
  @Input() idPessoa: number | null = null;
  @Input() podeEditar = false;
  @Input() modoPendente = false;
  /** Espelha endereços pendentes do cadastro. */
  @Input() pendentesIniciais: PessoaEnderecoUpsert[] = [];
  /** Preenche o formulário sem incluir na lista (ex.: consulta de CNPJ). */
  @Input() sugestaoFormulario: PessoaEnderecoUpsert | null = null;
  @Output() pendentesChange = new EventEmitter<PessoaEnderecoUpsert[]>();
  @Output() sugestaoDescartada = new EventEmitter<void>();

  @ViewChild('formularioEndereco') private formularioEndereco?: ElementRef<HTMLElement>;

  enderecos: PessoaEnderecoItem[] = [];
  pendentes: PessoaEnderecoPendente[] = [];
  loading = false;
  saving = false;
  editandoId: number | null = null;
  editandoLocalId: number | null = null;
  form: PessoaEnderecoUpsert = this.formVazio();
  formError = '';
  erroTipo = '';
  private nextLocalId = 1;
  private ultimaSugestaoAplicada: PessoaEnderecoUpsert | null = null;
  readonly msgPrincipalDuplicado = MSG_PRINCIPAL_DUPLICADO;

  constructor(
    public enderecoSvc: PessoaEnderecoService,
    private toast: ToastService
  ) {}

  get editandoChave(): number | null {
    return this.editandoId ?? this.editandoLocalId;
  }

  get exibirFormulario(): boolean {
    return this.podeEditar && this.podeIncluirEndereco;
  }

  get podeIncluirEndereco(): boolean {
    return this.modoPendente || !!this.idPessoa;
  }

  get tituloForm(): string {
    return this.editandoChave ? 'Editar endereço' : 'Novo endereço';
  }

  get rotuloConfirmar(): string {
    if (this.editandoChave) return 'Salvar alterações';
    if (this.modoPendente && !this.idPessoa) return 'Adicionar à lista';
    return 'Adicionar à lista';
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
    if (ch['pendentesIniciais'] && this.modoPendente && !this.idPessoa) {
      this.sincronizarPendentesIniciais();
    }
    if (ch['sugestaoFormulario']) {
      if (this.sugestaoFormulario) {
        this.aplicarSugestaoNoFormulario(this.sugestaoFormulario);
      } else if (this.ultimaSugestaoAplicada) {
        if (this.formularioCoincideSugestao(this.ultimaSugestaoAplicada)) {
          this.form = this.formVazio();
        }
        this.ultimaSugestaoAplicada = null;
      }
    }
  }

  temEnderecoDigitadoNaoIncluido(): boolean {
    if (!this.podeEditar || !this.podeIncluirEndereco) return false;
    if (this.editandoChave != null) return false;
    return this.formularioPossuiDados();
  }

  marcarErroEnderecoNaoIncluido(): void {
    this.formError = MSG_ENDERECO_NAO_INCLUIDO;
    this.focarFormulario();
  }

  private formularioPossuiDados(): boolean {
    const f = this.form;
    if (f.logradouro?.trim()) return true;
    if (f.cep?.replace(/\D/g, '').length) return true;
    if (f.idBairro) return true;
    if (f.numeroEndereco != null) return true;
    if (f.complementoEndereco?.trim()) return true;
    return false;
  }

  private aplicarSugestaoNoFormulario(s: PessoaEnderecoUpsert): void {
    if (!this.modoPendente || this.idPessoa || this.editandoChave) return;
    this.form = {
      ...this.formVazio(),
      ...s,
      tipoEndereco: s.tipoEndereco ?? 0,
    };
    this.ultimaSugestaoAplicada = { ...s, tipoEndereco: s.tipoEndereco ?? 0 };
    this.formError = '';
    this.erroTipo = '';
  }

  private formularioCoincideSugestao(s: PessoaEnderecoUpsert): boolean {
    return this.mesmoEnderecoPendente({ ...this.form }, s);
  }

  private descartarSugestaoAplicada(): void {
    if (!this.ultimaSugestaoAplicada) return;
    this.ultimaSugestaoAplicada = null;
    this.sugestaoDescartada.emit();
  }

  private sincronizarPendentesIniciais(): void {
    const ext = this.pendentesIniciais ?? [];
    if (!ext.length) {
      if (!this.pendentes.length) return;
      this.pendentes = [];
      return;
    }
    if (this.pendentes.length === ext.length
      && this.pendentes.every((p, i) => this.mesmoEnderecoPendente(p, ext[i]))) {
      return;
    }
    this.pendentes = ext.map((p, idx) => ({ ...p, localId: idx + 1 }));
    this.nextLocalId = this.pendentes.length + 1;
  }

  private mesmoEnderecoPendente(
    a: PessoaEnderecoUpsert & { localId?: number },
    b: PessoaEnderecoUpsert
  ): boolean {
    return a.tipoEndereco === b.tipoEndereco
      && (a.cep ?? '') === (b.cep ?? '')
      && (a.logradouro ?? '') === (b.logradouro ?? '')
      && (a.idBairro ?? 0) === (b.idBairro ?? 0)
      && (a.numeroEndereco ?? 0) === (b.numeroEndereco ?? 0)
      && (a.complementoEndereco ?? '') === (b.complementoEndereco ?? '');
  }

  trackEndereco(_i: number, e: PessoaEnderecoItem): number {
    return e.idEndereco;
  }

  chaveLinha(e: PessoaEnderecoItem): number {
    return e.idEndereco;
  }

  formatarLogradouro(e: PessoaEnderecoItem): string {
    const log = e.logradouro?.trim();
    const num = e.numeroEndereco != null ? `, nº ${e.numeroEndereco}` : '';
    if (log) return `${log}${num}`;
    return num ? num.replace(/^, /, '') : '—';
  }

  formatarCep(cep: string): string {
    const d = cep.replace(/\D/g, '');
    return d.length === 8 ? mascaraCep(d) : cep;
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

  get bloquearSelecaoPrincipal(): boolean {
    return this.existeOutroEnderecoPrincipal();
  }

  aoMudarTipoEndereco(tipo: number): void {
    if (tipo === 0 && this.bloquearSelecaoPrincipal && this.form.tipoEndereco !== 0) {
      this.erroTipo = MSG_PRINCIPAL_DUPLICADO;
      return;
    }
    this.form.tipoEndereco = tipo;
    this.erroTipo = '';
  }

  recarregar(): void {
    if (!this.idPessoa) return;
    this.loading = true;
    this.enderecoSvc.listar(this.idPessoa).subscribe({
      next: lista => { this.enderecos = lista ?? []; this.loading = false; },
      error: () => { this.enderecos = []; this.loading = false; }
    });
  }

  limparFormulario(): void {
    const manterEdicao = this.editandoChave != null;
    const idEnd = this.editandoId;
    const localId = this.editandoLocalId;
    this.form = this.formVazio();
    this.formError = '';
    this.erroTipo = '';
    if (!manterEdicao) this.descartarSugestaoAplicada();
    if (manterEdicao) {
      this.editandoId = idEnd;
      this.editandoLocalId = localId;
    }
  }

  cancelarEdicao(): void {
    this.editandoId = null;
    this.editandoLocalId = null;
    this.form = this.formVazio();
    this.formError = '';
    this.erroTipo = '';
  }

  iniciarEdicao(e: PessoaEnderecoItem): void {
    if (!this.podeEditar) return;
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
    this.erroTipo = '';
    this.focarFormulario();
  }

  private focarFormulario(): void {
    setTimeout(() => {
      const el = this.formularioEndereco?.nativeElement;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      el.focus({ preventScroll: true });
    }, 0);
  }

  private existeOutroEnderecoPrincipal(): boolean {
    const excluirId = this.editandoId ?? undefined;
    const excluirLocal = this.editandoLocalId ?? undefined;
    return this.linhas.some(e => {
      if (e.tipoEndereco !== 0) return false;
      if (excluirId != null && e.idEndereco === excluirId) return false;
      if (excluirLocal != null && e.idEndereco === excluirLocal) return false;
      return true;
    });
  }

  private violaRegraPrincipalUnico(): boolean {
    return this.form.tipoEndereco === 0 && this.existeOutroEnderecoPrincipal();
  }

  confirmarFormulario(): void {
    this.formError = '';
    this.erroTipo = '';
    if (!this.editandoChave && (!this.form.logradouro?.trim() || !this.form.idBairro)) {
      this.formError = 'Informe logradouro e bairro.';
      return;
    }
    if (this.violaRegraPrincipalUnico()) {
      this.erroTipo = MSG_PRINCIPAL_DUPLICADO;
      return;
    }
    if (this.modoPendente && !this.idPessoa) {
      this.salvarPendente();
      return;
    }
    if (!this.idPessoa) return;
    this.saving = true;
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
      this.cancelarEdicao();
      this.recarregar();
      this.saving = false;
    };
    const err = (e: unknown) => {
      const body = (e as { error?: string })?.error;
      const msg = typeof body === 'string' ? body : 'Erro ao gravar endereço.';
      this.formError = msg;
      this.toast.showError(msg);
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
    this.descartarSugestaoAplicada();
    this.cancelarEdicao();
  }

  remover(e: PessoaEnderecoItem): void {
    if (this.modoPendente && !this.idPessoa) {
      if (!confirm('Remover este endereço da lista?')) return;
      if (this.editandoLocalId === e.idEndereco) this.cancelarEdicao();
      this.pendentes = this.pendentes.filter(p => p.localId !== e.idEndereco);
      this.emitirPendentes();
      return;
    }
    if (!this.idPessoa || !confirm('Remover vínculo deste endereço com a pessoa?')) return;
    if (this.editandoId === e.idEndereco) this.cancelarEdicao();
    this.enderecoSvc.remover(this.idPessoa, e.idEndereco).subscribe({
      next: () => { this.toast.showSuccess('Endereço removido.'); this.recarregar(); },
      error: err => this.toast.showError((err as { error?: string })?.error ?? 'Não foi possível remover.')
    });
  }
}