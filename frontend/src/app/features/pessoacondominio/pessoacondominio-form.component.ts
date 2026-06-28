import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PessoaCondominioService } from './pessoacondominio.service';
import { PessoaCondominio } from './pessoacondominio.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';


@Component({
  selector: 'app-pessoacondominio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Pessoa Condominio</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-2">
            
          <div class="form-group">
            <label>IdPessoa *</label>
            <input type="number" [(ngModel)]="model.idPessoa" name="idPessoa" [readonly]="fieldDisabled('idPessoa')" />
          </div>
          <div class="form-group">
            <label>DataInicio *</label>
            <input type="date" [(ngModel)]="model.dataInicio" name="dataInicio" [readonly]="fieldDisabled('dataInicio')" />
          </div>
          <div class="form-group">
            <label>TipoVinculo *</label>
            <select [(ngModel)]="model.tipoVinculo" name="tipoVinculo" [disabled]="fieldDisabled('tipoVinculo')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Administrador</option><option [ngValue]="1">Síndico</option><option [ngValue]="2">Subsíndico</option><option [ngValue]="3">Conselheiro</option><option [ngValue]="4">Funcionário Administração</option><option [ngValue]="5">Funcionário Manutenção</option><option [ngValue]="6">Visitante</option><option [ngValue]="7">Prestador Serviço</option>
            </select>
          </div>
          <div class="form-group">
            <label>DataFim</label>
            <input type="date" [(ngModel)]="model.dataFim" name="dataFim" [readonly]="fieldDisabled('dataFim')" />
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
export class PessoaCondominioFormComponent implements OnInit {
  model: PessoaCondominio = {} as PessoaCondominio;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: PessoaCondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idPessoa) + ' / ' + String(this.model.idCondominio); }

  ngOnInit(): void {
    
    const idPessoa = this.route.snapshot.paramMap.get('idPessoa');
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idPessoa && idCondominio) {
      this.isEdit = true;
      this.service.getById(idPessoa, idCondominio).subscribe({
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
        next: () => this.router.navigate(['/pessoacondominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/pessoacondominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoacondominio']); }

  confirmDelete(): void {
    this.service.delete(this.model.idPessoa!, this.model.idCondominio!).subscribe({ next: () => this.router.navigate(['/pessoacondominio']) });
  }

}
