import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PerfilVinculo } from './login-fluxo';

/** Escolha de perfil usada no login genérico e no login do tenant. */
@Component({
  selector: 'app-login-selecao-perfil',
  standalone: true,
  imports: [FormsModule, ComboboxCustomizadaComponent],
  template: `
    <form (ngSubmit)="confirmar()">
      <button class="login-voltar" type="button" (click)="voltar.emit()" [disabled]="enviando">Voltar</button>
      <h1 class="login-title">Perfil</h1>
      <p class="login-subtitle">{{ subtitulo }}</p>
      <div class="form-group">
        <label [attr.for]="inputId">Perfil</label>
        <app-combobox-customizada
          [inputId]="inputId"
          [options]="opcoes"
          [(value)]="idPerfil"
          placeholder="Selecione o perfil"
          [required]="true"
          [disabled]="enviando" />
      </div>
      <div class="actions">
        <button class="btn-entrar" type="submit" [disabled]="enviando || idPerfil == null">
          {{ enviando ? 'Entrando...' : 'Entrar' }}
        </button>
      </div>
    </form>
  `
})
export class LoginSelecaoPerfilComponent implements OnChanges {
  @Input() subtitulo = 'Selecione o perfil';
  @Input() perfis: PerfilVinculo[] = [];
  @Input() enviando = false;
  @Input() inputId = 'perfil';
  @Output() entrar = new EventEmitter<number>();
  @Output() voltar = new EventEmitter<void>();

  idPerfil: number | null = null;

  get opcoes(): ComboboxOption[] {
    return this.perfis.map(p => ({ value: p.idPerfil, label: p.nome }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['perfis'] && !changes['perfis'].firstChange) this.idPerfil = null;
  }

  confirmar(): void {
    if (this.enviando || this.idPerfil == null) return;
    this.entrar.emit(Number(this.idPerfil));
  }
}
