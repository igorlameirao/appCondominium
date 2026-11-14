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
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';

@Component({
  selector: 'app-condominio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataHoraComponent, EnderecoWidgetComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Condomínio</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-12">
            <label>Nome *</label>
            <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="255" [readonly]="fieldDisabled('nome')" />
          </div>          <app-endereco-widget class="fg-col-12"
            [(idEndereco)]="model.idEndereco"
            [(numero)]="model.numeroEndereco"
            [(complemento)]="model.complementoEndereco"
            [readonly]="isEdit && !canEdit" />

          <div class="form-group fg-col-2">
            <label>Área Terreno *</label>
            <input type="number" [(ngModel)]="model.areaTerreno" name="areaTerreno" step="0.001" [readonly]="fieldDisabled('areaTerreno')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Área Total Edificada *</label>
            <input type="number" [(ngModel)]="model.areaTotalEdificada" name="areaTotalEdificada" step="0.001" [readonly]="fieldDisabled('areaTotalEdificada')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Área Total Unidades</label>
            <input type="number" [(ngModel)]="model.areaTotalUnidades" name="areaTotalUnidades" step="0.001" [readonly]="fieldDisabled('areaTotalUnidades')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Quantidade Total Unidades</label>
            <input type="number" [(ngModel)]="model.quantidadeTotalUnidades" name="quantidadeTotalUnidades" [readonly]="fieldDisabled('quantidadeTotalUnidades')" />
          </div>
          <div class="form-group fg-col-3">
            <label>CNPJ</label>
            <app-documento-input [(ngModel)]="model.cNPJ" name="cNPJ" tipo="cnpj" [disabled]="fieldDisabled('cNPJ')" />
          </div>
          <div class="form-group fg-col-12">
            <label>Domínio *</label>
            <input type="text" [(ngModel)]="model.dominio" name="dominio" maxlength="255" [readonly]="fieldDisabled('dominio')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Ativo *</label>
            <input type="number" [(ngModel)]="model.ativo" name="ativo" [readonly]="fieldDisabled('ativo')" />
          </div>
          <div class="form-group fg-col-4">
            <label>Data Inativação</label>
            <app-campo-data-hora [(ngModel)]="model.dataInativacao" name="dataInativacao" [disabled]="fieldDisabled('dataInativacao')" />
          </div>
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Gravar</button>
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
  readonly permissionKey = 'CONDOMINIO';
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: CondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
  ) {
    this.refreshPermissions();
  }

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  get pkDisplay(): string { return String(this.model.idCondominio); }

  ngOnInit(): void {
    
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idCondominio) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idCondominio).subscribe({
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
      });
    }
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['areaTotalUnidades','quantidadeTotalUnidades','cNPJ','dominio','ativo'];
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
