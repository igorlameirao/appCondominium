import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CondominioService } from './condominio.service';
import { Condominio } from './condominio.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';

@Component({
  selector: 'app-condominio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, EnderecoWidgetComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Condomínio</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-id" *ngIf="isEdit">
            <div class="form-group">
              <label>Id</label>
              <input type="text" [value]="pkDisplay" readonly class="readonly" />
            </div>
          </div>
          <div class="grid grid-2">
                      <app-endereco-widget
            [(idEndereco)]="model.idEndereco"
            [(numero)]="model.numeroEndereco"
            [(complemento)]="model.complementoEndereco"
            [readonly]="isEdit && !canEdit" />

          <div class="form-group">
            <label>Nome *</label>
            <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="255" [readonly]="fieldDisabled('nome')" />
          </div>
          <div class="form-group">
            <label>Área Terreno *</label>
            <input type="number" [(ngModel)]="model.areaTerreno" name="areaTerreno" step="0.001" [readonly]="fieldDisabled('areaTerreno')" />
          </div>
          <div class="form-group">
            <label>Área Total Edificada *</label>
            <input type="number" [(ngModel)]="model.areaTotalEdificada" name="areaTotalEdificada" step="0.001" [readonly]="fieldDisabled('areaTotalEdificada')" />
          </div>
          <div class="form-group">
            <label>Área Total Unidades</label>
            <input type="number" [(ngModel)]="model.areaTotalUnidades" name="areaTotalUnidades" step="0.001" [readonly]="fieldDisabled('areaTotalUnidades')" />
          </div>
          <div class="form-group">
            <label>Quantidade Total Unidades</label>
            <input type="number" [(ngModel)]="model.quantidadeTotalUnidades" name="quantidadeTotalUnidades" [readonly]="fieldDisabled('quantidadeTotalUnidades')" />
          </div>
          <div class="form-group">
            <label>CNPJ</label>
            <app-documento-input [(ngModel)]="model.cNPJ" name="cNPJ" tipo="cnpj" [disabled]="fieldDisabled('cNPJ')" />
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
export class CondominioFormComponent implements OnInit {
  model: Condominio = {} as Condominio;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: CondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idCondominio); }

  ngOnInit(): void {
    
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      
      return;
    }
    if (idCondominio) {
      this.isEdit = true;
      this.service.getById(idCondominio).subscribe({
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
      });
    }
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['areaTotalUnidades','quantidadeTotalUnidades','cNPJ'];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => this.router.navigate(['/condominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/condominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/condominio']); }

  confirmDelete(): void {
    this.service.delete(this.model.idCondominio!).subscribe({ next: () => this.router.navigate(['/condominio']) });
  }

}
