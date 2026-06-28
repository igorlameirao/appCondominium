import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OfertaConcorrenciaService } from './ofertaconcorrencia.service';
import { OfertaConcorrencia } from './ofertaconcorrencia.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { FornecedorService } from '../fornecedor/fornecedor.service';
import { ConcorrenciaService } from '../concorrencia/concorrencia.service';

@Component({
  selector: 'app-ofertaconcorrencia-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Oferta Concorrência</h2>
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
            <label>Id Fornecedor *</label>
            <app-combobox-customizada
              [options]="fk_idFornecedor"
              [(value)]="model.idFornecedor"
              [disabled]="fieldDisabled('idFornecedor')" />
          </div>
          <div class="form-group">
            <label>Id Concorrência *</label>
            <app-combobox-customizada
              [options]="fk_idConcorrencia"
              [(value)]="model.idConcorrencia"
              [disabled]="fieldDisabled('idConcorrencia')" />
          </div>
          <div class="form-group">
            <label>Descrição *</label>
            <input type="text" [(ngModel)]="model.descricao" name="descricao" [readonly]="fieldDisabled('descricao')" />
          </div>
          <div class="form-group">
            <label>Preco *</label>
            <input type="number" [(ngModel)]="model.preco" name="preco" step="0.001" [readonly]="fieldDisabled('preco')" />
          </div>
          <div class="form-group">
            <label>Data da Oferta *</label>
            <input type="date" [(ngModel)]="model.dataOferta" name="dataOferta" [readonly]="fieldDisabled('dataOferta')" />
          </div>
          <div class="form-group">
            <label>Data Validade *</label>
            <input type="date" [(ngModel)]="model.dataValidade" name="dataValidade" [readonly]="fieldDisabled('dataValidade')" />
          </div>
          <div class="form-group">
            <label>Vencedora</label>
            <input type="text" [(ngModel)]="model.vencedora" name="vencedora" [readonly]="fieldDisabled('vencedora')" />
          </div>
          <div class="form-group">
            <label>Justificativa</label>
            <input type="text" [(ngModel)]="model.justificativa" name="justificativa" [readonly]="fieldDisabled('justificativa')" />
          </div>
          <div class="form-group">
            <label>Desistente</label>
            <input type="text" [(ngModel)]="model.desistente" name="desistente" [readonly]="fieldDisabled('desistente')" />
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
export class OfertaConcorrenciaFormComponent implements OnInit {
  model: OfertaConcorrencia = {} as OfertaConcorrencia;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idFornecedor: ComboboxOption[] = [];
  fk_idConcorrencia: ComboboxOption[] = [];

  constructor(
    private service: OfertaConcorrenciaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private fornecedorService: FornecedorService,
    private concorrenciaService: ConcorrenciaService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idOfertaConcorrencia); }

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
    const idOfertaConcorrencia = this.route.snapshot.paramMap.get('idOfertaConcorrencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idOfertaConcorrencia) {
      this.isEdit = true;
      this.service.getById(idOfertaConcorrencia).subscribe({
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
        next: () => this.router.navigate(['/ofertaconcorrencia']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/ofertaconcorrencia']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/ofertaconcorrencia']); }

  confirmDelete(): void {
    this.service.delete(this.model.idOfertaConcorrencia!).subscribe({ next: () => this.router.navigate(['/ofertaconcorrencia']) });
  }

  fkLabel_idFornecedor(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idFornecedor ?? '');
  }
  fkLabel_idConcorrencia(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idConcorrencia ?? '');
  }
}
