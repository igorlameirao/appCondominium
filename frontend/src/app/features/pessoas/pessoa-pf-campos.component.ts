import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PessoaFisicaIntegradaRequest } from '../../core/services/pessoa-cadastro-integrado.service';
import { Icone } from '../../shared/icone';

/** Campos integrados de PF — layout Hug (`pessoa-pf-dados` em cadastro.css). */
@Component({
  selector: 'app-pessoa-pf-campos',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentoInputComponent, CampoDataComponent, Icone],
  template: `
    <ng-container [ngSwitch]="secao">
      <div *ngSwitchCase="'dados'" class="form-grid pessoa-pf-dados">
        <div class="form-group pessoa-pf-dados__doc" *ngIf="!ocultarDocumento">
          <label>CPF *</label>
          <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpjPf" tipo="cpf"
            [disabled]="documentoBloqueado" [required]="true" (blurCommit)="documentoInformado.emit($event)" />
        </div>
        <div class="form-group pessoa-pf-dados__nome" *ngIf="!ocultarNome">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="model.nome" name="nomePf" required maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pf-dados__nasc" *ngIf="!ocultarDataNascimento">
          <label>Data de nascimento *</label>
          <app-campo-data [(ngModel)]="model.dataNascimento" name="dataNascimentoPf"
            [feedbackVisual]="true" [nascimento]="true" [required]="true" [disabled]="desabilitado" />
        </div>
      </div>

      <div *ngSwitchCase="'contatos'" class="form-grid pessoa-contatos-dados">
        <div class="form-group pessoa-contatos-dados__tel">
          <label>Telefone</label>
          <input type="text" [(ngModel)]="model.telefone" name="telefonePf" maxlength="20"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-contatos-dados__email">
          <label>E-mail</label>
          <input type="email" [(ngModel)]="model.email" name="emailPf" maxlength="255"
            [readonly]="desabilitado" />
        </div>
      </div>

      <div *ngSwitchDefault class="form-grid pessoa-pf-dados pessoa-pf-dados--completo">
        <div class="form-group pessoa-pf-dados__doc">
          <label>CPF *</label>
          <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpjPfNovo" tipo="cpf"
            [disabled]="documentoBloqueado" [required]="true" />
        </div>
        <div class="form-group pessoa-pf-dados__nome">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="model.nome" name="nomePfNovo" required maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pf-dados__tel">
          <label>Telefone</label>
          <input type="text" [(ngModel)]="model.telefone" name="telefonePfNovo" maxlength="20"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pf-dados__nasc">
          <label>Data de nascimento *</label>
          <app-campo-data [(ngModel)]="model.dataNascimento" name="dataNascimentoPfNovo"
            [feedbackVisual]="true" [nascimento]="true" [required]="true" [disabled]="desabilitado" />
        </div>
        <div class="form-group pessoa-pf-dados__email">
          <label>E-mail</label>
          <input type="email" [(ngModel)]="model.email" name="emailPfNovo" maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="pessoa-pf-dados__senhas" *ngIf="exibirSenha">
          <div class="form-group pessoa-pf-dados__senha">
            <label for="senhaPf">Senha</label>
            <div class="cad-senha-wrap">
              <input id="senhaPf" name="senhaPf" autocomplete="new-password"
                [type]="mostrarSenha ? 'text' : 'password'"
                [(ngModel)]="model.senha" [readonly]="desabilitado" />
              <button type="button" class="cad-senha-toggle"
                (click)="mostrarSenha = !mostrarSenha"
                [attr.aria-label]="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                [attr.aria-pressed]="mostrarSenha"
                [disabled]="desabilitado">
                <app-icone [nome]="mostrarSenha ? 'eye-off' : 'eye'" [tamanho]="18" />
              </button>
            </div>
          </div>
          <div class="form-group pessoa-pf-dados__senha-conf">
            <label for="senhaConfirmPf">Confirmar senha</label>
            <div class="cad-senha-wrap">
              <input id="senhaConfirmPf" name="senhaConfirmPf" autocomplete="new-password"
                [type]="mostrarSenhaConfirmacao ? 'text' : 'password'"
                [(ngModel)]="confirmacaoSenha"
                [required]="senhaInformada"
                [readonly]="desabilitado" />
              <button type="button" class="cad-senha-toggle"
                (click)="mostrarSenhaConfirmacao = !mostrarSenhaConfirmacao"
                [attr.aria-label]="mostrarSenhaConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'"
                [attr.aria-pressed]="mostrarSenhaConfirmacao"
                [disabled]="desabilitado">
                <app-icone [nome]="mostrarSenhaConfirmacao ? 'eye-off' : 'eye'" [tamanho]="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class PessoaPfCamposComponent {
  @Input({ required: true }) model!: PessoaFisicaIntegradaRequest;
  @Input() secao: 'dados' | 'contatos' | 'completo' = 'completo';
  @Input() documentoBloqueado = false;
  @Input() desabilitado = false;
  /** Documento preenchido no shell (detecção CPF/CNPJ). */
  @Input() ocultarDocumento = false;
  /** Nome na linha 1 do shell (aba Dados gerais). */
  @Input() ocultarNome = false;
  /** Data de nascimento abaixo do CPF no shell (aba Dados gerais). */
  @Input() ocultarDataNascimento = false;
  @Input() exibirSenha = false;
  @Output() documentoInformado = new EventEmitter<string>();

  confirmacaoSenha = '';
  mostrarSenha = false;
  mostrarSenhaConfirmacao = false;

  get senhaInformada(): boolean {
    return !!(this.model.senha ?? '').trim();
  }

  /** Senha vazia (permitido) ou confirmação igual à senha. */
  senhasConferem(): boolean {
    const s = (this.model.senha ?? '').trim();
    const c = this.confirmacaoSenha.trim();
    if (!s) return !c;
    return s === c;
  }
}