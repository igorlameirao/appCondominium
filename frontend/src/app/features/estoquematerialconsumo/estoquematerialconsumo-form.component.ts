import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { CampoMoedaComponent } from '../../shared/campo-moeda/campo-moeda.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { EstoqueMaterialConsumoService } from './estoquematerialconsumo.service';
import { EstoqueMaterialConsumo } from './estoquematerialconsumo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';
import { LocalService } from '../local/local.service';

@Component({
  selector: 'app-estoquematerialconsumo-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    ListLoadingModalComponent,
    FormsModule,
    CampoDataHoraComponent,
    CampoMoedaComponent,
    ComboboxCustomizadaComponent,
  ],
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

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados do Estoque</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do Estoque</h2>
                <p class="cad-secao__texto">Informe o material, armazenamento e dados da aquisição</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <div class="cad-blocos emc-estoque">
                  <div class="form-grid emc-estoque__linha emc-estoque__linha--1">
                    <div class="form-group">
                      <label>Tipo de Material *</label>
                      <app-combobox-customizada
                        [options]="fk_idTipoMaterial"
                        [(value)]="model.idTipoMaterial"
                        [disabled]="fieldDisabled('idTipoMaterial')"
                        [required]="true"
                        ariaLabel="Tipo de Material" />
                    </div>
                  </div>

                  <div class="form-grid emc-estoque__linha emc-estoque__linha--2">
                    <div class="form-group">
                      <label>Local de Armazenamento *</label>
                      <app-combobox-customizada
                        [options]="fk_idLocal"
                        [(value)]="model.idLocal"
                        [disabled]="fieldDisabled('idLocal')"
                        [required]="true"
                        ariaLabel="Local de Armazenamento" />
                    </div>
                    <div class="form-group">
                      <label for="emc-lote">Lote</label>
                      <input
                        id="emc-lote"
                        type="text"
                        [(ngModel)]="model.lote"
                        name="lote"
                        maxlength="20"
                        [readonly]="fieldDisabled('lote')" />
                    </div>
                  </div>

                  <div class="form-grid emc-estoque__linha emc-estoque__linha--3">
                    <div class="form-group emc-estoque__datahora">
                      <div class="emc-datahora-rotulos">
                        <label class="emc-datahora-rotulos__data">Última Aquisição *</label>
                        <label class="emc-datahora-rotulos__hora">Hora</label>
                      </div>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataUltimaAquisicao"
                        name="dataUltimaAquisicao"
                        [disabled]="fieldDisabled('dataUltimaAquisicao')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group emc-estoque__datahora">
                      <div class="emc-datahora-rotulos">
                        <label class="emc-datahora-rotulos__data">Validade</label>
                        <label class="emc-datahora-rotulos__hora">Hora</label>
                      </div>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataValidade"
                        name="dataValidade"
                        [disabled]="fieldDisabled('dataValidade')"
                        [feedbackVisual]="true" />
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="wallet" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Quantidades e Valores</h2>
                  </div>
                </div>

                <div class="cad-blocos emc-estoque">
                  <div class="form-grid emc-estoque__linha emc-estoque__linha--4">
                    <div class="form-group">
                      <label for="emc-quantidade">Quantidade *</label>
                      <input
                        id="emc-quantidade"
                        type="number"
                        [(ngModel)]="model.quantidade"
                        name="quantidade"
                        step="0.001"
                        min="0"
                        inputmode="decimal"
                        [readonly]="fieldDisabled('quantidade')"
                        required />
                    </div>
                    <div class="form-group">
                      <label for="emc-unidade">Unidade de Medida *</label>
                      <select
                        id="emc-unidade"
                        [(ngModel)]="model.unidadeMedida"
                        name="unidadeMedida"
                        [disabled]="fieldDisabled('unidadeMedida')"
                        required>
                        <option [ngValue]="null">Selecione…</option>
                        <option [ngValue]="0">Unidade (UN)</option>
                        <option [ngValue]="1">Quilograma (kg)</option>
                        <option [ngValue]="2">Litro (L)</option>
                        <option [ngValue]="3">Metro (m)</option>
                        <option [ngValue]="4">Metro quadrado (m²)</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-grid emc-estoque__linha emc-estoque__linha--5">
                    <div class="form-group emc-estoque__moeda">
                      <label>Valor Unitário da Aquisição</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorUnitarioUltimaAquisicao"
                        name="valorUnitarioUltimaAquisicao"
                        modo="numero"
                        [readonly]="fieldDisabled('valorUnitarioUltimaAquisicao')"
                        [disabled]="fieldDisabled('valorUnitarioUltimaAquisicao')" />
                    </div>
                    <div class="form-group emc-estoque__moeda emc-estoque__moeda--calculado">
                      <label>Valor Total</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorTotal"
                        name="valorTotal"
                        modo="texto"
                        [readonly]="true"
                        [disabled]="fieldDisabled('valorTotal')" />
                    </div>
                    <div class="form-group emc-estoque__moeda">
                      <label>Valor Unitário Médio</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorUnitarioMedio"
                        name="valorUnitarioMedio"
                        modo="numero"
                        [readonly]="fieldDisabled('valorUnitarioMedio')"
                        [disabled]="fieldDisabled('valorUnitarioMedio')" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
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
  styles: [`
    :host .cad-page {
      max-width: min(960px, calc(100vw - 40px));
    }
    .emc-estoque {
      gap: 12px;
    }
    .emc-estoque__linha--1 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .emc-estoque__linha--2 {
      grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
      align-items: end;
    }
    .emc-estoque__linha--3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .emc-estoque__linha--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .emc-estoque__linha--5 {
      grid-template-columns: minmax(0, 34fr) minmax(0, 33fr) minmax(0, 33fr);
      align-items: end;
    }
    .emc-estoque__datahora,
    .emc-estoque__moeda {
      min-width: 0;
    }
    .emc-estoque__moeda > label {
      line-height: 1.25;
    }
    .emc-estoque__moeda--calculado ::ng-deep .caixa-conferencia__input-moeda {
      background: #f8fafc;
      color: #475569;
      cursor: default;
    }
    .emc-datahora-rotulos {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .emc-datahora-rotulos label {
      margin-bottom: 4px;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .emc-datahora-rotulos__data {
      flex: 1 1 70%;
      min-width: 0;
    }
    .emc-datahora-rotulos__hora {
      flex: 0 0 30%;
      max-width: 30%;
      text-align: left;
      white-space: nowrap;
    }
    @media (max-width: 720px) {
      .emc-estoque__linha--2,
      .emc-estoque__linha--3,
      .emc-estoque__linha--4,
      .emc-estoque__linha--5 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
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
