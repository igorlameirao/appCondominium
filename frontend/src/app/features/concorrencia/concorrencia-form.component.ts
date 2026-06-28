import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConcorrenciaService } from './concorrencia.service';
import { Concorrencia } from './concorrencia.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoDespesaService } from '../tipodespesa/tipodespesa.service';

@Component({
  selector: 'app-concorrencia-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Concorrência</h2>
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
            <label>idTipoDespesa *</label>
            <app-combobox-customizada
              [options]="fk_idTipoDespesa"
              [(value)]="model.idTipoDespesa"
              [disabled]="fieldDisabled('idTipoDespesa')" />
          </div>
          <div class="form-group">
            <label>Descricao *</label>
            <input type="text" [(ngModel)]="model.descricao" name="descricao" [readonly]="fieldDisabled('descricao')" />
          </div>
          <div class="form-group">
            <label>TipoConcorrencia *</label>
            <select [(ngModel)]="model.tipoConcorrencia" name="tipoConcorrencia" [disabled]="fieldDisabled('tipoConcorrencia')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Preço</option><option [ngValue]="1">Qualidade</option><option [ngValue]="2">Prazo Entrega</option><option [ngValue]="3">Capacidade Técnica</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fase *</label>
            <select [(ngModel)]="model.fase" name="fase" [disabled]="fieldDisabled('fase')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Divulgação</option><option [ngValue]="1">Recebimento Proposta</option><option [ngValue]="2">Análise</option><option [ngValue]="3">Escolha Vencedor</option><option [ngValue]="4">Assinatura Contrato</option><option [ngValue]="5">Finalizado</option>
            </select>
          </div>
          <div class="form-group">
            <label>DataAbertura *</label>
            <input type="date" [(ngModel)]="model.dataAbertura" name="dataAbertura" [readonly]="fieldDisabled('dataAbertura')" />
          </div>
          <div class="form-group">
            <label>Data Prevista Encerramento *</label>
            <input type="date" [(ngModel)]="model.dataPrevistaEncerramento" name="dataPrevistaEncerramento" [readonly]="fieldDisabled('dataPrevistaEncerramento')" />
          </div>
          <div class="form-group">
            <label>DataEncerramento</label>
            <input type="date" [(ngModel)]="model.dataEncerramento" name="dataEncerramento" [readonly]="fieldDisabled('dataEncerramento')" />
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
export class ConcorrenciaFormComponent implements OnInit {
  model: Concorrencia = {} as Concorrencia;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idTipoDespesa: ComboboxOption[] = [];

  constructor(
    private service: ConcorrenciaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoDespesaService: TipoDespesaService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idConcorrencia); }

  ngOnInit(): void {
    
    this.tipoDespesaService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoDespesa = r.items.map((x: any) => ({
        value: x.idTipoDespesa,
        label: this.fkLabel_idTipoDespesa(x)
      }));
    });
    const idConcorrencia = this.route.snapshot.paramMap.get('idConcorrencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idConcorrencia) {
      this.isEdit = true;
      this.service.getById(idConcorrencia).subscribe({
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
        next: () => this.router.navigate(['/concorrencia']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/concorrencia']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/concorrencia']); }

  confirmDelete(): void {
    this.service.delete(this.model.idConcorrencia!).subscribe({ next: () => this.router.navigate(['/concorrencia']) });
  }

  fkLabel_idTipoDespesa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoDespesa ?? '');
  }
}
