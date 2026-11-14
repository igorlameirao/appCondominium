import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PessoaFisicaIntegradaRequest } from '../../core/services/pessoa-cadastro-integrado.service';

/** Campos integrados de PF — layout Hug (`pessoa-pf-dados` em cadastro.css). */
@Component({
  selector: 'app-pessoa-pf-campos',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentoInputComponent, CampoDataComponent],
  template: `
    <ng-container [ngSwitch]="secao">
      <div *ngSwitchCase="'dados'" class="form-grid pessoa-pf-dados">
        <div class="form-group pessoa-pf-dados__doc">
          <label>CPF *</label>
          <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpjPf" tipo="cpf"
            [disabled]="documentoBloqueado" [required]="true" />
        </div>
        <div class="form-group pessoa-pf-dados__nome">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="model.nome" name="nomePf" required maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pf-dados__nasc">
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
        <div class="form-group pessoa-pf-dados__senha" *ngIf="exibirSenha">
          <label>Senha (acesso ao sistema)</label>
          <input type="password" [(ngModel)]="model.senha" name="senhaPf" autocomplete="new-password" />
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
  @Input() exibirSenha = false;
}