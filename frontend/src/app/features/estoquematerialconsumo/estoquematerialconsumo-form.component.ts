import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
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
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/estoquematerialconsumo'">Estoque de Material de Consumo</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Estoque de Material de Consumo</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de estoque de material de consumo</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Estoque de Material de Consumo</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Estoque de Material de Consumo</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          
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
            <div style="grid-column: 9 / span 4; grid-row: 1" class="form-group fg-col-4">
              <label>Data/Hora Validade</label>
              <app-campo-data-hora [(ngModel)]="model.dataValidade" name="dataValidade" [disabled]="fieldDisabled('dataValidade')" [feedbackVisual]="true"/>
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Local de Armazenamento *</label>
              <app-combobox-customizada
                [options]="fk_idLocal"
                [(value)]="model.idLocal"
                [disabled]="fieldDisabled('idLocal')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 4; grid-row: 2" class="form-group fg-col-4">
              <label>Data/Hora Última Aquisição *</label>
              <app-campo-data-hora [(ngModel)]="model.dataUltimaAquisicao" name="dataUltimaAquisicao" [disabled]="fieldDisabled('dataUltimaAquisicao')" [required]="true" [feedbackVisual]="true"/>
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
              <label>Valor Total</label>
              <input type="text" [(ngModel)]="model.valorTotal" name="valorTotal" [readonly]="fieldDisabled('valorTotal')" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Quantidade *</label>
              <input type="number" [(ngModel)]="model.quantidade" name="quantidade" step="0.001" [readonly]="fieldDisabled('quantidade')" required />
            </div>
            <div style="grid-column: 1 / span 2; grid-row: 4" class="form-group fg-col-2">
              <label>Unidade de Medida *</label>
              <select [(ngModel)]="model.unidadeMedida" name="unidadeMedida" [disabled]="fieldDisabled('unidadeMedida')" required>
                <option [ngValue]="null">Selecione…</option>
                <option [ngValue]="0">Unidade (UN)</option><option [ngValue]="1">Quilograma (kg)</option><option [ngValue]="2">Litro (L)</option><option [ngValue]="3">Metro (m)</option><option [ngValue]="4">Metro quadrado (m²)</option>
              </select>
            </div>
            <div style="grid-column: 3 / span 2; grid-row: 4" class="form-group fg-col-2">
              <label>Lote</label>
              <input type="text" [(ngModel)]="model.lote" name="lote" maxlength="20" [readonly]="fieldDisabled('lote')" />
            </div>
            <div style="grid-column: 5 / span 2; grid-row: 4" class="form-group fg-col-2">
              <label>Valor Uniário da Aquisição</label>
              <input type="number" [(ngModel)]="model.valorUnitarioUltimaAquisicao" name="valorUnitarioUltimaAquisicao" step="0.001" [readonly]="fieldDisabled('valorUnitarioUltimaAquisicao')" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 4" class="form-group fg-col-2">
              <label>Valor Uniário Médio</label>
              <input type="number" [(ngModel)]="model.valorUnitarioMedio" name="valorUnitarioMedio" step="0.001" [readonly]="fieldDisabled('valorUnitarioMedio')" />
            </div>
          </div>
        </form></div>
          </div>
          <div class="actions form-actions cad-acoes">
        <button type="submit" class="btn-gravar" form="entityForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
        <span class="cad-acoes__espaco"></span>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
        </section>
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
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />
  `,
})
export class EstoqueMaterialConsumoFormComponent implements OnInit {
  model: EstoqueMaterialConsumo = {} as EstoqueMaterialConsumo;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Estoque de Material de Consumo';
  showDeleteConfirm = false;
  readonly permissionKey = 'ESTOQUEMATERIALCONSUMO';
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

  get pkDisplay(): string { return String(this.model.idEstoqueMaterialConsumo); }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    this.pageLoad.run(this.tipoMaterialService.getPaged(1, 200), r => {
      this.fk_idTipoMaterial = r.items.map((x: any) => ({
        value: x.idTipoMaterial,
        label: this.fkLabel_idTipoMaterial(x)
      }));
    });

    this.pageLoad.run(this.localService.getPaged(1, 200), r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });
    const idEstoqueMaterialConsumo = this.route.snapshot.paramMap.get('idEstoqueMaterialConsumo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idEstoqueMaterialConsumo) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idEstoqueMaterialConsumo), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/estoquematerialconsumo']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/estoquematerialconsumo']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/estoquematerialconsumo']); }

  confirmDelete(): void {
    this.service.delete(this.model.idEstoqueMaterialConsumo!).subscribe({ next: () => this.router.navigate(['/estoquematerialconsumo']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idTipoMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoMaterial ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
}
