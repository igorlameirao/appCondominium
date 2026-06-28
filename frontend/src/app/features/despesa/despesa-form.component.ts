import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DespesaService } from './despesa.service';
import { Despesa } from './despesa.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { FornecedorService } from '../fornecedor/fornecedor.service';
import { ConcorrenciaService } from '../concorrencia/concorrencia.service';
import { TipoDespesaService } from '../tipodespesa/tipodespesa.service';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Despesa</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-id" *ngIf="isEdit">
            <div class="form-group">
              <label>Id</label>
              <input type="text" [value]="pkDisplay" readonly class="readonly" />
            </div>
          </div>
          <div class="grid grid-2">
            
          <div class="form-group">
            <label>IdFornecedor *</label>
            <app-combobox-customizada
              [options]="fk_idFornecedor"
              [(value)]="model.idFornecedor"
              [disabled]="fieldDisabled('idFornecedor')" />
          </div>
          <div class="form-group">
            <label>Id Concorrência</label>
            <app-combobox-customizada
              [options]="fk_idConcorrencia"
              [(value)]="model.idConcorrencia"
              [disabled]="fieldDisabled('idConcorrencia')" />
          </div>
          <div class="form-group">
            <label>idTipoDespesa *</label>
            <app-combobox-customizada
              [options]="fk_idTipoDespesa"
              [(value)]="model.idTipoDespesa"
              [disabled]="fieldDisabled('idTipoDespesa')" />
          </div>
          <div class="form-group">
            <label>DataDespesa *</label>
            <input type="date" [(ngModel)]="model.dataDespesa" name="dataDespesa" [readonly]="fieldDisabled('dataDespesa')" />
          </div>
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" />
          </div>
          <div class="form-group">
            <label>DataLancamento *</label>
            <input type="date" [(ngModel)]="model.dataLancamento" name="dataLancamento" [readonly]="fieldDisabled('dataLancamento')" />
          </div>
          <div class="form-group">
            <label>Valor *</label>
            <input type="number" [(ngModel)]="model.valor" name="valor" step="0.001" [readonly]="fieldDisabled('valor')" />
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <input type="text" [(ngModel)]="model.observacoes" name="observacoes" [readonly]="fieldDisabled('observacoes')" />
          </div>
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !canEdit">Gravar</button>
        <button type="button" class="btn-cancelar" (click)="cancel()">Cancelar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
      <div class="msg-erro" *ngIf="formError">{{ formError }}</div>
    </div>
    <div class="confirm-overlay" *ngIf="showDeleteConfirm">
      <div class="confirm-modal">
        <p>Deseja realmente excluir este registro?</p>
        <button type="button" class="btn-cancelar" (click)="showDeleteConfirm=false">Cancelar</button>
        <button type="button" class="btn-excluir" (click)="confirmDelete()">Excluir</button>
      </div>
    </div>
  `
})
export class DespesaFormComponent implements OnInit {
  model: Despesa = {} as Despesa;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idFornecedor: ComboboxOption[] = [];
  fk_idConcorrencia: ComboboxOption[] = [];
  fk_idTipoDespesa: ComboboxOption[] = [];

  constructor(
    private service: DespesaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private fornecedorService: FornecedorService,
    private concorrenciaService: ConcorrenciaService,
    private tipoDespesaService: TipoDespesaService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idDespesa); }

  ngOnInit(): void {
    
    this.fornecedorService.getPaged(1, 200).subscribe(r => {
      this.fk_idFornecedor = r.items.map((x: any) => ({
        value: x.idFornecedor,
        label: this.fkLabel_idFornecedor(x)
      }));
    });

    this.concorrenciaService.getPaged(1, 200).subscribe(r => {
      this.fk_idConcorrencia = r.items.map((x: any) => ({
        value: x.idConcorrencia,
        label: this.fkLabel_idConcorrencia(x)
      }));
    });

    this.tipoDespesaService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoDespesa = r.items.map((x: any) => ({
        value: x.idTipoDespesa,
        label: this.fkLabel_idTipoDespesa(x)
      }));
    });
    const idDespesa = this.route.snapshot.paramMap.get('idDespesa');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idDespesa) {
      this.isEdit = true;
      this.service.getById(idDespesa).subscribe({
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
      });
    }
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => this.router.navigate(['/despesa']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/despesa']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/despesa']); }

  confirmDelete(): void {
    this.service.delete(this.model.idDespesa!).subscribe({ next: () => this.router.navigate(['/despesa']) });
  }

  fkLabel_idFornecedor(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idFornecedor ?? '');
  }
  fkLabel_idConcorrencia(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idConcorrencia ?? '');
  }
  fkLabel_idTipoDespesa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoDespesa ?? '');
  }
}
