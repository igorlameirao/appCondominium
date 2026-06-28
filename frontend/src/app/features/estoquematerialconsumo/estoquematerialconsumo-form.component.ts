import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueMaterialConsumoService } from './estoquematerialconsumo.service';
import { EstoqueMaterialConsumo } from './estoquematerialconsumo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';
import { LocalService } from '../local/local.service';

@Component({
  selector: 'app-estoquematerialconsumo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Estoque de Material de Consumo</h2>
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
            <label>Id do Tipo de Material *</label>
            <app-combobox-customizada
              [options]="fk_idTipoMaterial"
              [(value)]="model.idTipoMaterial"
              [disabled]="fieldDisabled('idTipoMaterial')" />
          </div>
          <div class="form-group">
            <label>Data/Hora Validade</label>
            <input type="date" [(ngModel)]="model.dataValidade" name="dataValidade" [readonly]="fieldDisabled('dataValidade')" />
          </div>
          <div class="form-group">
            <label>Lote</label>
            <input type="text" [(ngModel)]="model.lote" name="lote" maxlength="20" [readonly]="fieldDisabled('lote')" />
          </div>
          <div class="form-group">
            <label>Data/Hora Última Aquisição *</label>
            <input type="date" [(ngModel)]="model.dataUltimaAquisicao" name="dataUltimaAquisicao" [readonly]="fieldDisabled('dataUltimaAquisicao')" />
          </div>
          <div class="form-group">
            <label>Valor Uniário da Aquisição</label>
            <input type="number" [(ngModel)]="model.valorUnitarioUltimaAquisicao" name="valorUnitarioUltimaAquisicao" step="0.001" [readonly]="fieldDisabled('valorUnitarioUltimaAquisicao')" />
          </div>
          <div class="form-group">
            <label>Valor Uniário Médio</label>
            <input type="number" [(ngModel)]="model.valorUnitarioMedio" name="valorUnitarioMedio" step="0.001" [readonly]="fieldDisabled('valorUnitarioMedio')" />
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" [(ngModel)]="model.quantidade" name="quantidade" step="0.001" [readonly]="fieldDisabled('quantidade')" />
          </div>
          <div class="form-group">
            <label>Valor Total</label>
            <input type="text" [(ngModel)]="model.valorTotal" name="valorTotal" [readonly]="fieldDisabled('valorTotal')" />
          </div>
          <div class="form-group">
            <label>Unidade de Medida *</label>
            <select [(ngModel)]="model.unidadeMedida" name="unidadeMedida" [disabled]="fieldDisabled('unidadeMedida')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Unidade (UN)</option><option [ngValue]="1">Quilograma (kg)</option><option [ngValue]="2">Litro (L)</option><option [ngValue]="3">Metro (m)</option><option [ngValue]="4">Metro quadrado (m²)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Local de Armazenamento *</label>
            <app-combobox-customizada
              [options]="fk_idLocal"
              [(value)]="model.idLocal"
              [disabled]="fieldDisabled('idLocal')" />
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
export class EstoqueMaterialConsumoFormComponent implements OnInit {
  model: EstoqueMaterialConsumo = {} as EstoqueMaterialConsumo;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idTipoMaterial: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];

  constructor(
    private service: EstoqueMaterialConsumoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoMaterialService: TipoMaterialService,
    private localService: LocalService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idEstoqueMaterialConsumo); }

  ngOnInit(): void {
    
    this.tipoMaterialService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoMaterial = r.items.map((x: any) => ({
        value: x.idTipoMaterial,
        label: this.fkLabel_idTipoMaterial(x)
      }));
    });

    this.localService.getPaged(1, 200).subscribe(r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });
    const idEstoqueMaterialConsumo = this.route.snapshot.paramMap.get('idEstoqueMaterialConsumo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idEstoqueMaterialConsumo) {
      this.isEdit = true;
      this.service.getById(idEstoqueMaterialConsumo).subscribe({
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
        next: () => this.router.navigate(['/estoquematerialconsumo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/estoquematerialconsumo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/estoquematerialconsumo']); }

  confirmDelete(): void {
    this.service.delete(this.model.idEstoqueMaterialConsumo!).subscribe({ next: () => this.router.navigate(['/estoquematerialconsumo']) });
  }

  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
}
