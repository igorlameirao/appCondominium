import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PessoaJuridicaIntegradaRequest } from '../../core/services/pessoa-cadastro-integrado.service';

@Component({
  selector: 'app-pessoa-pj-campos',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentoInputComponent, CampoDataComponent, ComboboxCustomizadaComponent],
  template: `
    <ng-container [ngSwitch]="secao">
      <div *ngSwitchCase="'dados'" class="form-grid pessoa-pj-dados">
        <div class="form-group pessoa-pj-dados__doc" *ngIf="!ocultarDocumento">
          <label>CNPJ *</label>
          <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpjPj" tipo="cnpj"
            [disabled]="documentoBloqueado" [required]="true" (blurCommit)="documentoInformado.emit($event)" />
        </div>
        <div class="form-group pessoa-pj-dados__razao" *ngIf="!ocultarNome">
          <label>Razão social *</label>
          <input type="text" [(ngModel)]="model.nome" name="nomePj" required maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__fantasia">
          <label>Nome fantasia</label>
          <input type="text" [(ngModel)]="model.nomeFantasia" name="nomeFantasiaPj" maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__fundacao">
          <label>Data de fundação</label>
          <app-campo-data [(ngModel)]="model.dataFundacao" name="dataFundacaoPj"
            [feedbackVisual]="true" [disabled]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__responsavel">
          <label>Responsável legal</label>
          <app-combobox-customizada [options]="responsaveis" [(value)]="model.idResponsavel"
            [disabled]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__ie">
          <label>Inscrição estadual</label>
          <input type="text" [(ngModel)]="model.inscricaoEstadual" name="iePj" maxlength="40"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__im">
          <label>Inscrição municipal</label>
          <input type="text" [(ngModel)]="model.inscricaoMunicipal" name="imPj" maxlength="40"
            [readonly]="desabilitado" />
        </div>
      </div>

      <div *ngSwitchCase="'contatos'" class="form-grid pessoa-contatos-dados pessoa-contatos-dados--unico">
        <div class="form-group pessoa-contatos-dados__tel">
          <label>Telefone</label>
          <input type="text" [(ngModel)]="model.telefone" name="telefonePj" maxlength="20"
            [readonly]="desabilitado" />
        </div>
      </div>

      <div *ngSwitchDefault class="form-grid pessoa-pj-dados pessoa-pj-dados--completo">
        <div class="form-group pessoa-pj-dados__doc">
          <label>CNPJ *</label>
          <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpjPjNovo" tipo="cnpj"
            [disabled]="documentoBloqueado" [required]="true" />
        </div>
        <div class="form-group pessoa-pj-dados__razao">
          <label>Razão social *</label>
          <input type="text" [(ngModel)]="model.nome" name="nomePjNovo" required maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__fantasia">
          <label>Nome fantasia</label>
          <input type="text" [(ngModel)]="model.nomeFantasia" name="nomeFantasiaPjNovo" maxlength="255"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__tel">
          <label>Telefone</label>
          <input type="text" [(ngModel)]="model.telefone" name="telefonePjNovo" maxlength="20"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__fundacao">
          <label>Data de fundação</label>
          <app-campo-data [(ngModel)]="model.dataFundacao" name="dataFundacaoPjNovo"
            [feedbackVisual]="true" [disabled]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__responsavel">
          <label>Responsável legal</label>
          <app-combobox-customizada [options]="responsaveis" [(value)]="model.idResponsavel"
            [disabled]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__ie">
          <label>Inscrição estadual</label>
          <input type="text" [(ngModel)]="model.inscricaoEstadual" name="iePjNovo" maxlength="40"
            [readonly]="desabilitado" />
        </div>
        <div class="form-group pessoa-pj-dados__im">
          <label>Inscrição municipal</label>
          <input type="text" [(ngModel)]="model.inscricaoMunicipal" name="imPjNovo" maxlength="40"
            [readonly]="desabilitado" />
        </div>
      </div>
    </ng-container>
  `
})
export class PessoaPjCamposComponent {
  @Input({ required: true }) model!: PessoaJuridicaIntegradaRequest;
  @Input() secao: 'dados' | 'contatos' | 'completo' = 'completo';
  @Input() documentoBloqueado = false;
  @Input() desabilitado = false;
  @Input() responsaveis: ComboboxOption[] = [];
  @Input() ocultarDocumento = false;
  @Input() ocultarNome = false;
  @Output() documentoInformado = new EventEmitter<string>();
}