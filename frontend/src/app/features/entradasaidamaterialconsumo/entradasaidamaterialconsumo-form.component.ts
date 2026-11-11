import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { EntradaSaidaMaterialConsumoService } from './entradasaidamaterialconsumo.service';
import { EntradaSaidaMaterialConsumo } from './entradasaidamaterialconsumo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EstoqueMaterialConsumoService } from '../estoquematerialconsumo/estoquematerialconsumo.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';
import { PessoaCondominioService } from '../pessoacondominio/pessoacondominio.service';

@Component({
  selector: 'app-entradasaidamaterialconsumo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Entrada e Saída de Material de Consumo</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id do Estoque *</label>
              <app-combobox-customizada
                [options]="fk_idEstoqueMaterialConsumo"
                [(value)]="model.idEstoqueMaterialConsumo"
                [disabled]="fieldDisabled('idEstoqueMaterialConsumo')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 4; grid-row: 1" class="form-group fg-col-4">
              <label>Data/Hora Validade</label>
              <app-campo-data-hora [(ngModel)]="model.dataValidade" name="dataValidade" [disabled]="fieldDisabled('dataValidade')" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Id do Tipo de Material *</label>
              <app-combobox-customizada
                [options]="fk_idTipoMaterial"
                [(value)]="model.idTipoMaterial"
                [disabled]="fieldDisabled('idTipoMaterial')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Consumidor</label>
              <app-combobox-customizada
                [options]="fk_idPessoa"
                [(value)]="model.idPessoa"
                [disabled]="fieldDisabled('idPessoa')" />
            </div>
            <div style="grid-column: 1 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Quantidade *</label>
              <input type="number" [(ngModel)]="model.quantidade" name="quantidade" step="0.001" [readonly]="fieldDisabled('quantidade')" required />
            </div>
            <div style="grid-column: 3 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Unidade de Medida *</label>
              <select [(ngModel)]="model.unidadeMedida" name="unidadeMedida" [disabled]="fieldDisabled('unidadeMedida')" required>
                <option [ngValue]="null">Selecione…</option>
                <option [ngValue]="0">Unidade (UN)</option><option [ngValue]="1">Quilograma (kg)</option><option [ngValue]="2">Litro (L)</option><option [ngValue]="3">Metro (m)</option><option [ngValue]="4">Metro quadrado (m²)</option>
              </select>
            </div>
            <div style="grid-column: 5 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Tipo de Lançamento *</label>
              <select [(ngModel)]="model.tipoLancamento" name="tipoLancamento" [disabled]="fieldDisabled('tipoLancamento')" required>
                <option [ngValue]="null">Selecione…</option>
                <option [ngValue]="0">Entrada Por Aquisição</option><option [ngValue]="1">Entrada Por Devolução</option><option [ngValue]="2">Saída por utilização</option><option [ngValue]="3">Saída por Perda</option><option [ngValue]="4">Saída por Inventário</option>
              </select>
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Lote</label>
              <input type="text" [(ngModel)]="model.lote" name="lote" maxlength="20" [readonly]="fieldDisabled('lote')" />
            </div>
            <div style="grid-column: 9 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Valor Uniário da Aquisição</label>
              <input type="number" [(ngModel)]="model.valorUnitarioAquisicao" name="valorUnitarioAquisicao" step="0.001" [readonly]="fieldDisabled('valorUnitarioAquisicao')" />
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
export class EntradaSaidaMaterialConsumoFormComponent implements OnInit {
  model: EntradaSaidaMaterialConsumo = {} as EntradaSaidaMaterialConsumo;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Entrada e Saída de Material de Consumo';
  showDeleteConfirm = false;
  readonly permissionKey = 'ENTRADASAIDAMATERIALCONSUMO';
  canEdit = true;
  canDelete = true;
  fk_idEstoqueMaterialConsumo: ComboboxOption[] = [];
  fk_idTipoMaterial: ComboboxOption[] = [];
  fk_idPessoa: ComboboxOption[] = [];

  constructor(
    private service: EntradaSaidaMaterialConsumoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private estoqueMaterialConsumoService: EstoqueMaterialConsumoService,
    private tipoMaterialService: TipoMaterialService,
    private pessoaCondominioService: PessoaCondominioService,
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

  get pkDisplay(): string { return String(this.model.idEntradaSaidaMaterialConsumo); }

  ngOnInit(): void {
    
    this.estoqueMaterialConsumoService.getPaged(1, 200).subscribe(r => {
      this.fk_idEstoqueMaterialConsumo = r.items.map((x: any) => ({
        value: x.idEstoqueMaterialConsumo,
        label: this.fkLabel_idEstoqueMaterialConsumo(x)
      }));
    });

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
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idEntradaSaidaMaterialConsumo) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idEntradaSaidaMaterialConsumo).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/entradasaidamaterialconsumo']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/entradasaidamaterialconsumo']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/entradasaidamaterialconsumo']); }

  confirmDelete(): void {
    this.service.delete(this.model.idEntradaSaidaMaterialConsumo!).subscribe({ next: () => this.router.navigate(['/entradasaidamaterialconsumo']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idEstoqueMaterialConsumo(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idEstoqueMaterialConsumo ?? '');
  }
  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
  fkLabel_idPessoa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoaCondominio ?? '');
  }
}
