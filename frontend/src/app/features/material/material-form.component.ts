import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { CampoMoedaComponent } from '../../shared/campo-moeda/campo-moeda.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { MaterialService } from './material.service';
import { Material } from './material.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    ListLoadingModalComponent,
    FormsModule,
    CampoDataComponent,
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
            <a [routerLink]="'/material'">Material</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Material</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de material</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Material</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <div class="cad-blocos material-dados">
                  <div class="form-grid material-dados__linha material-dados__linha--1">
                    <div class="form-group material-dados__tipo">
                      <label>Tipo de Material *</label>
                      <app-combobox-customizada
                        [options]="fk_idTipoMaterial"
                        [(value)]="model.idTipoMaterial"
                        [disabled]="fieldDisabled('idTipoMaterial')"
                        [required]="true"
                        ariaLabel="Tipo de Material" />
                    </div>
                    <div class="form-group material-dados__patrimonio">
                      <label for="mat-patrimonio">Patrimônio *</label>
                      <input
                        id="mat-patrimonio"
                        type="text"
                        [(ngModel)]="model.patrimonio"
                        name="patrimonio"
                        maxlength="30"
                        [readonly]="fieldDisabled('patrimonio')"
                        required />
                    </div>
                    <div class="form-group material-dados__vida">
                      <label for="mat-vida-util">Vida Útil (em anos) *</label>
                      <input
                        id="mat-vida-util"
                        type="number"
                        [(ngModel)]="model.vidaUtil"
                        name="vidaUtil"
                        min="1"
                        step="1"
                        [readonly]="fieldDisabled('vidaUtil')"
                        required />
                    </div>
                    <div class="form-group material-dados__data">
                      <label for="mat-data-aquisicao">Data de Aquisição *</label>
                      <app-campo-data
                        [(ngModel)]="model.dataAquisicao"
                        name="dataAquisicao"
                        [disabled]="fieldDisabled('dataAquisicao')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                  </div>

                  <div class="form-grid material-dados__linha material-dados__linha--2">
                    <div class="form-group">
                      <label for="mat-descricao">Descrição</label>
                      <input
                        id="mat-descricao"
                        type="text"
                        [(ngModel)]="model.descricao"
                        name="descricao"
                        maxlength="255"
                        [readonly]="fieldDisabled('descricao')" />
                    </div>
                  </div>

                  <div class="form-grid material-dados__linha material-dados__linha--3">
                    <div class="form-group material-dados__moeda">
                      <label>Valor de Aquisição *</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorAquisicao"
                        name="valorAquisicao"
                        modo="numero"
                        [readonly]="fieldDisabled('valorAquisicao')"
                        [disabled]="fieldDisabled('valorAquisicao')"
                        [required]="true" />
                    </div>
                    <div class="form-group material-dados__moeda">
                      <label>Valor Depreciável *</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorDepreciavel"
                        name="valorDepreciavel"
                        modo="numero"
                        [readonly]="fieldDisabled('valorDepreciavel')"
                        [disabled]="fieldDisabled('valorDepreciavel')"
                        [required]="true" />
                    </div>
                    <div class="form-group material-dados__moeda">
                      <label>Valor da Depreciação</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorDepreciacao"
                        name="valorDepreciacao"
                        modo="texto"
                        [readonly]="fieldDisabled('valorDepreciacao')"
                        [disabled]="fieldDisabled('valorDepreciacao')" />
                    </div>
                    <div class="form-group material-dados__moeda">
                      <label>Valor da Quota de Depreciação</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorQuotaDepreciacao"
                        name="valorQuotaDepreciacao"
                        modo="texto"
                        [readonly]="fieldDisabled('valorQuotaDepreciacao')"
                        [disabled]="fieldDisabled('valorQuotaDepreciacao')" />
                    </div>
                    <div class="form-group material-dados__moeda">
                      <label>Valor Contábil</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorContabil"
                        name="valorContabil"
                        modo="texto"
                        [readonly]="fieldDisabled('valorContabil')"
                        [disabled]="fieldDisabled('valorContabil')" />
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
      max-width: min(1100px, calc(100vw - 40px));
    }
    .material-dados {
      gap: 12px;
    }
    .material-dados__linha--1 {
      grid-template-columns: minmax(0, 40fr) minmax(0, 20fr) minmax(0, 15fr) minmax(0, 25fr);
      align-items: end;
    }
    .material-dados__linha--2,
    .material-dados__linha--3 {
      align-items: end;
    }
    .material-dados__linha--2 {
      grid-template-columns: minmax(0, 1fr);
    }
    .material-dados__linha--3 {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    .material-dados__tipo,
    .material-dados__patrimonio,
    .material-dados__vida,
    .material-dados__data,
    .material-dados__moeda {
      min-width: 0;
    }
    .material-dados__moeda > label {
      line-height: 1.25;
    }
    @media (max-width: 960px) {
      .material-dados__linha--1 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .material-dados__linha--3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 720px) {
      .material-dados__linha--1,
      .material-dados__linha--2,
      .material-dados__linha--3 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class MaterialFormComponent implements OnInit {
  model: Material = {} as Material;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
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

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    this.pageLoad.run(this.tipoMaterialService.getPaged(1, 200), r => {
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
      this.pageLoad.run(this.service.getById(idMaterial), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
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
