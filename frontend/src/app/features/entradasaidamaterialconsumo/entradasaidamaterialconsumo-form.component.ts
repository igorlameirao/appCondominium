import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EntradaSaidaMaterialConsumoService } from './entradasaidamaterialconsumo.service';
import { EntradaSaidaMaterialConsumo } from './entradasaidamaterialconsumo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';
import { PessoaCondominioService } from '../pessoacondominio/pessoacondominio.service';

@Component({
  selector: 'app-entradasaidamaterialconsumo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Entrada e Saída de Material de Consumo</h2>
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
            <label>Tipo de Lançamento *</label>
            <select [(ngModel)]="model.tipoLancamento" name="tipoLancamento" [disabled]="fieldDisabled('tipoLancamento')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Entrada Por Aquisição</option><option [ngValue]="1">Entrada Por Devolução</option><option [ngValue]="2">Saída por utilização</option><option [ngValue]="3">Saída por Perda</option><option [ngValue]="4">Saída por Inventário</option>
            </select>
          </div>
          <div class="form-group">
            <label>Id do Estoque *</label>
            <input type="number" [(ngModel)]="model.idEstoqueMaterialConsumo" name="idEstoqueMaterialConsumo" [readonly]="fieldDisabled('idEstoqueMaterialConsumo')" />
          </div>
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
            <label>Valor Uniário da Aquisição</label>
            <input type="number" [(ngModel)]="model.valorUnitarioAquisicao" name="valorUnitarioAquisicao" step="0.001" [readonly]="fieldDisabled('valorUnitarioAquisicao')" />
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" [(ngModel)]="model.quantidade" name="quantidade" step="0.001" [readonly]="fieldDisabled('quantidade')" />
          </div>
          <div class="form-group">
            <label>Unidade de Medida *</label>
            <select [(ngModel)]="model.unidadeMedida" name="unidadeMedida" [disabled]="fieldDisabled('unidadeMedida')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Unidade (UN)</option><option [ngValue]="1">Quilograma (kg)</option><option [ngValue]="2">Litro (L)</option><option [ngValue]="3">Metro (m)</option><option [ngValue]="4">Metro quadrado (m²)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Consumidor</label>
            <app-combobox-customizada
              [options]="fk_idPessoa"
              [(value)]="model.idPessoa"
              [disabled]="fieldDisabled('idPessoa')" />
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
export class EntradaSaidaMaterialConsumoFormComponent implements OnInit {
  model: EntradaSaidaMaterialConsumo = {} as EntradaSaidaMaterialConsumo;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idTipoMaterial: ComboboxOption[] = [];
  fk_idPessoa: ComboboxOption[] = [];

  constructor(
    private service: EntradaSaidaMaterialConsumoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoMaterialService: TipoMaterialService,
    private pessoaCondominioService: PessoaCondominioService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idEntradaSaidaMaterialConsumo); }

  ngOnInit(): void {
    
    this.tipoMaterialService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoMaterial = r.items.map((x: any) => ({
        value: x.idTipoMaterial,
        label: this.fkLabel_idTipoMaterial(x)
      }));
    });

    this.pessoaCondominioService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoa = r.items.map((x: any) => ({
        value: x.idPessoa,
        label: this.fkLabel_idPessoa(x)
      }));
    });
    const idEntradaSaidaMaterialConsumo = this.route.snapshot.paramMap.get('idEntradaSaidaMaterialConsumo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idEntradaSaidaMaterialConsumo) {
      this.isEdit = true;
      this.service.getById(idEntradaSaidaMaterialConsumo).subscribe({
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
        next: () => this.router.navigate(['/entradasaidamaterialconsumo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/entradasaidamaterialconsumo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/entradasaidamaterialconsumo']); }

  confirmDelete(): void {
    this.service.delete(this.model.idEntradaSaidaMaterialConsumo!).subscribe({ next: () => this.router.navigate(['/entradasaidamaterialconsumo']) });
  }

  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
  fkLabel_idPessoa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoaCondominio ?? '');
  }
}
