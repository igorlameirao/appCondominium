import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
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
  imports: [CommonModule, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Material</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id do Tipo de Material *</label>
              <app-combobox-customizada
                [options]="fk_idTipoMaterial"
                [(value)]="model.idTipoMaterial"
                [disabled]="fieldDisabled('idTipoMaterial')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Vida Útil (em anos) *</label>
              <input type="number" [(ngModel)]="model.vidaUtil" name="vidaUtil" [readonly]="fieldDisabled('vidaUtil')" required />
            </div>
            <div style="grid-column: 11 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>DataAquisicao *</label>
              <app-campo-data [(ngModel)]="model.dataAquisicao" name="dataAquisicao" [disabled]="fieldDisabled('dataAquisicao')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
              <label>Descrição</label>
              <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
              <label>Valor da Depreciacao</label>
              <input type="text" [(ngModel)]="model.valorDepreciacao" name="valorDepreciacao" [readonly]="fieldDisabled('valorDepreciacao')" />
            </div>
            <div style="grid-column: 7 / span 3; grid-row: 3" class="form-group fg-col-3">
              <label>Patrimônio *</label>
              <input type="text" [(ngModel)]="model.patrimonio" name="patrimonio" maxlength="30" [readonly]="fieldDisabled('patrimonio')" required />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 4" class="form-group fg-col-6">
              <label>Valor da Quota de Depreciacao</label>
              <input type="text" [(ngModel)]="model.valorQuotaDepreciacao" name="valorQuotaDepreciacao" [readonly]="fieldDisabled('valorQuotaDepreciacao')" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 4" class="form-group fg-col-2">
              <label>Valor de Aquisição *</label>
              <input type="number" [(ngModel)]="model.valorAquisicao" name="valorAquisicao" step="0.001" [readonly]="fieldDisabled('valorAquisicao')" required />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 5" class="form-group fg-col-6">
              <label>Valor Contábil</label>
              <input type="text" [(ngModel)]="model.valorContabil" name="valorContabil" [readonly]="fieldDisabled('valorContabil')" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 5" class="form-group fg-col-2">
              <label>Valor Depreciavel *</label>
              <input type="number" [(ngModel)]="model.valorDepreciavel" name="valorDepreciavel" step="0.001" [readonly]="fieldDisabled('valorDepreciavel')" required />
            </div>
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Gravar</button>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
    </div>
    <div class="confirm-overlay" *ngIf="showDeleteConfirm">
      <div class="confirm-modal">
        <p>Deseja realmente excluir este registro?</p>
        <div class="confirm-actions">
          <button type="button" class="btn-cancelar-modal" (click)="showDeleteConfirm=false">Cancelar</button>
          <button type="button" class="btn-confirm-danger" (click)="confirmDelete()">Excluir</button>
        </div>
      </div>
    </div>
  `
})
export class MaterialFormComponent implements OnInit {
  model: Material = {} as Material;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Material';
  showDeleteConfirm = false;
  readonly permissionKey = 'MATERIAL';
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
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idMaterial) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idMaterial).subscribe({
        next: (r) => this.model = r,
        error: () => this.toast.showError('Registro não encontrado.')
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
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/material']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/material']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/material']); }

  confirmDelete(): void {
    this.service.delete(this.model.idMaterial!).subscribe({ next: () => this.router.navigate(['/material']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
}
