import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialService } from './material.service';
import { Material } from './material.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Material</h2>
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
            <label>DataAquisicao *</label>
            <input type="date" [(ngModel)]="model.dataAquisicao" name="dataAquisicao" [readonly]="fieldDisabled('dataAquisicao')" />
          </div>
          <div class="form-group">
            <label>Patrimônio *</label>
            <input type="text" [(ngModel)]="model.patrimonio" name="patrimonio" maxlength="30" [readonly]="fieldDisabled('patrimonio')" />
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" />
          </div>
          <div class="form-group">
            <label>Id do Tipo de Material *</label>
            <app-combobox-customizada
              [options]="fk_idTipoMaterial"
              [(value)]="model.idTipoMaterial"
              [disabled]="fieldDisabled('idTipoMaterial')" />
          </div>
          <div class="form-group">
            <label>Vida Útil (em anos) *</label>
            <input type="number" [(ngModel)]="model.vidaUtil" name="vidaUtil" [readonly]="fieldDisabled('vidaUtil')" />
          </div>
          <div class="form-group">
            <label>Valor de Aquisição *</label>
            <input type="number" [(ngModel)]="model.valorAquisicao" name="valorAquisicao" step="0.001" [readonly]="fieldDisabled('valorAquisicao')" />
          </div>
          <div class="form-group">
            <label>Valor Depreciavel *</label>
            <input type="number" [(ngModel)]="model.valorDepreciavel" name="valorDepreciavel" step="0.001" [readonly]="fieldDisabled('valorDepreciavel')" />
          </div>
          <div class="form-group">
            <label>Valor da Depreciacao</label>
            <input type="text" [(ngModel)]="model.valorDepreciacao" name="valorDepreciacao" [readonly]="fieldDisabled('valorDepreciacao')" />
          </div>
          <div class="form-group">
            <label>Valor da Quota de Depreciacao</label>
            <input type="text" [(ngModel)]="model.valorQuotaDepreciacao" name="valorQuotaDepreciacao" [readonly]="fieldDisabled('valorQuotaDepreciacao')" />
          </div>
          <div class="form-group">
            <label>Valor Contábil</label>
            <input type="text" [(ngModel)]="model.valorContabil" name="valorContabil" [readonly]="fieldDisabled('valorContabil')" />
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
export class MaterialFormComponent implements OnInit {
  model: Material = {} as Material;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idTipoMaterial: ComboboxOption[] = [];

  constructor(
    private service: MaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoMaterialService: TipoMaterialService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idMaterial); }

  ngOnInit(): void {
    
    this.tipoMaterialService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoMaterial = r.items.map((x: any) => ({
        value: x.idTipoMaterial,
        label: this.fkLabel_idTipoMaterial(x)
      }));
    });
    const idMaterial = this.route.snapshot.paramMap.get('idMaterial');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idMaterial) {
      this.isEdit = true;
      this.service.getById(idMaterial).subscribe({
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
        next: () => this.router.navigate(['/material']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/material']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/material']); }

  confirmDelete(): void {
    this.service.delete(this.model.idMaterial!).subscribe({ next: () => this.router.navigate(['/material']) });
  }

  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
}
