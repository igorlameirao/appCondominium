import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { ColaboradorItem } from './pessoa-contexto.service';

export interface DadosProfissionaisModel {
  dataAdmissao?: string;
  dataDesligamento?: string;
  ctps?: string;
  idFuncaoColaborador?: number | null;
  ctpsArquivoBase64?: string;
  ctpsNomeArquivo?: string;
}

@Component({
  selector: 'app-pessoa-colaborador-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cad-secao">
      <div>
        <h2 class="cad-secao__titulo">Dados profissionais</h2>
        <p class="cad-secao__texto" *ngIf="exibirTipoTravado">Tipo travado neste contexto: {{ tipoRotulo }}</p>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Data de admissão *</label>
        <input type="date" name="dataAdmissao" [(ngModel)]="model.dataAdmissao" [required]="obrigatorio" [disabled]="desabilitado" />
      </div>
      <div class="form-group">
        <label>Data de desligamento</label>
        <input type="date" name="dataDesligamento" [(ngModel)]="model.dataDesligamento" [disabled]="desabilitado" />
      </div>
      <div class="form-group">
        <label>CTPS *</label>
        <input type="text" name="ctps" [(ngModel)]="model.ctps" maxlength="20" [required]="obrigatorio" [readonly]="desabilitado" />
      </div>
      <div class="form-group">
        <label>Função *</label>
        <select name="idFuncaoColaborador" [(ngModel)]="model.idFuncaoColaborador" [required]="obrigatorio" [disabled]="desabilitado">
          <option [ngValue]="null">Selecione</option>
          <option *ngFor="let f of funcoes" [ngValue]="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Arquivo da CTPS {{ arquivoObrigatorio ? '*' : '' }}</label>
        <input type="file" accept="application/pdf,image/jpeg,image/png" (change)="aoArquivo($event)" [disabled]="desabilitado" />
        <p *ngIf="model.ctpsNomeArquivo">{{ model.ctpsNomeArquivo }}</p>
        <p *ngIf="possuiArquivo && !model.ctpsNomeArquivo">Arquivo já enviado.</p>
      </div>
    </div>
    <div *ngIf="historico.length" class="lst-tabela__scroll">
      <p class="cad-secao__texto">Histórico</p>
      <table class="lst-grade">
        <thead><tr><th>Admissão</th><th>Desligamento</th><th>CTPS</th><th>Função</th></tr></thead>
        <tbody>
          <tr *ngFor="let h of historico">
            <td>{{ h.dataAdmissao }}</td>
            <td>{{ h.dataDesligamento ?? '—' }}</td>
            <td>{{ h.ctps }}</td>
            <td>{{ h.funcaoDescricao ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class PessoaColaboradorPanelComponent {
  @Input() model: DadosProfissionaisModel = {};
  @Input() funcoes: ComboboxOption[] = [];
  @Input() historico: ColaboradorItem[] = [];
  @Input() tipoRotulo = 'Funcionário';
  @Input() exibirTipoTravado = true;
  @Input() obrigatorio = true;
  @Input() arquivoObrigatorio = true;
  @Input() desabilitado = false;
  @Input() possuiArquivo = false;

  aoArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      this.model.ctpsArquivoBase64 = comma >= 0 ? result.slice(comma + 1) : result;
      this.model.ctpsNomeArquivo = file.name;
    };
    reader.readAsDataURL(file);
  }
}
