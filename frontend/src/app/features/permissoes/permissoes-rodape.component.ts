import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-permissoes-rodape',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="actions form-actions cad-acoes">
      <span class="cad-acoes__espaco"></span>
      @if (mostrarVoltar) {
        <button type="button" class="btn-cancelar" [disabled]="gravando" (click)="voltar.emit()">Voltar</button>
      }
      @if (podeAlterar) {
        @if (mostrarDesfazer) {
          <button type="button" class="btn-cancelar" [disabled]="gravando || !salvarHabilitado" (click)="desfazer.emit()">
            Desfazer
          </button>
        }
        <button
          type="button"
          class="btn-gravar"
          [class.is-loading]="gravando"
          [disabled]="!salvarHabilitado"
          [attr.aria-busy]="gravando || null"
          (click)="solicitarSalvar.emit()"
        >
          {{ gravando ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      }
    </div>
  `,
})
export class PermissoesRodapeComponent {
  private cd = inject(ChangeDetectorRef);

  @Input() podeAlterar = false;
  @Input() mostrarVoltar = true;
  @Input() mostrarDesfazer = true;

  @Input() set temAlteracao(valor: boolean) {
    this._temAlteracao = valor;
    if (valor) this.salvoSemAlteracaoPendente = false;
    this.cd.markForCheck();
  }
  get temAlteracao() {
    return this._temAlteracao;
  }
  private _temAlteracao = false;

  private salvoSemAlteracaoPendente = false;

  gravando = false;

  get salvarHabilitado() {
    return this._temAlteracao && !this.salvoSemAlteracaoPendente;
  }

  @Output() voltar = new EventEmitter<void>();
  @Output() desfazer = new EventEmitter<void>();
  @Output() solicitarSalvar = new EventEmitter<void>();

  iniciarGravacao() {
    this.gravando = true;
    this.cd.markForCheck();
  }

  encerrarGravacao(sucesso = false) {
    this.gravando = false;
    if (sucesso) this.salvoSemAlteracaoPendente = true;
    this.cd.markForCheck();
  }

  aoDesfazer() {
    this.salvoSemAlteracaoPendente = false;
    this.cd.markForCheck();
  }
}
