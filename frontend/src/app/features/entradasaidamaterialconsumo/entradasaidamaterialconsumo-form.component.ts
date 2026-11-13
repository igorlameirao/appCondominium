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
import { EntradaSaidaMaterialConsumoService } from './entradasaidamaterialconsumo.service';
import { EntradaSaidaMaterialConsumo } from './entradasaidamaterialconsumo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EstoqueMaterialConsumoService } from '../estoquematerialconsumo/estoquematerialconsumo.service';
import { TipoMaterialService } from '../tipomaterial/tipomaterial.service';
import { PessoaCondominioService } from '../pessoacondominio/pessoacondominio.service';

/** Saída por utilização — exige Consumidor (RN04, metadado). */
const TIPO_LANCAMENTO_SAIDA_UTILIZACAO = 2;

@Component({
  selector: 'app-entradasaidamaterialconsumo-form',
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
            <a [routerLink]="'/entradasaidamaterialconsumo'">Entrada e Saída de Material de Consumo</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Movimentação de Material</h1>
          <p class="cad-subtitulo">Registre entradas, saídas e informações da movimentação</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="rotate-ccw" [tamanho]="16" />
              <span>Movimentação de Material</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="rotate-ccw" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Movimentação de Material</h2>
                <p class="cad-secao__texto">Informe estoque, tipo de lançamento e envolvidos</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <input
                  *ngIf="isEdit"
                  type="hidden"
                  name="idEntradaSaidaMaterialConsumo"
                  [(ngModel)]="model.idEntradaSaidaMaterialConsumo" />

                <div class="cad-blocos esmc-mov">
                  <div class="form-grid esmc-mov__linha esmc-mov__linha--1">
                    <div class="form-group">
                      <label>Estoque *</label>
                      <app-combobox-customizada
                        [options]="fk_idEstoqueMaterialConsumo"
                        [(value)]="model.idEstoqueMaterialConsumo"
                        [disabled]="fieldDisabled('idEstoqueMaterialConsumo')"
                        [required]="true"
                        ariaLabel="Estoque" />
                    </div>
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

                  <div
                    class="form-grid esmc-mov__linha esmc-mov__linha--2"
                    [class.esmc-mov__linha--2--sem-consumidor]="!exibirConsumidor">
                    <div class="form-group">
                      <label for="esmc-tipo-lancamento">Tipo de Lançamento *</label>
                      <select
                        id="esmc-tipo-lancamento"
                        [(ngModel)]="model.tipoLancamento"
                        (ngModelChange)="onTipoLancamentoChange()"
                        name="tipoLancamento"
                        [disabled]="fieldDisabled('tipoLancamento')"
                        required>
                        <option [ngValue]="null">Selecione…</option>
                        <option [ngValue]="0">Entrada Por Aquisição</option>
                        <option [ngValue]="1">Entrada Por Devolução</option>
                        <option [ngValue]="2">Saída por utilização</option>
                        <option [ngValue]="3">Saída por Perda</option>
                        <option [ngValue]="4">Saída por Inventário</option>
                      </select>
                    </div>
                    <div class="form-group" *ngIf="exibirConsumidor">
                      <label>Consumidor *</label>
                      <app-combobox-customizada
                        [options]="fk_idPessoa"
                        [(value)]="model.idPessoa"
                        [disabled]="fieldDisabled('idPessoa')"
                        [required]="true"
                        ariaLabel="Consumidor" />
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="clipboard-list" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Detalhes da Movimentação</h2>
                  </div>
                </div>

                <div class="cad-blocos esmc-mov">
                  <div class="form-grid esmc-mov__linha esmc-mov__linha--3">
                    <div class="form-group">
                      <label for="esmc-quantidade">Quantidade *</label>
                      <input
                        id="esmc-quantidade"
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
                      <label for="esmc-unidade">Unidade de Medida *</label>
                      <select
                        id="esmc-unidade"
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
                    <div class="form-group">
                      <label for="esmc-lote">Lote</label>
                      <input
                        id="esmc-lote"
                        type="text"
                        [(ngModel)]="model.lote"
                        name="lote"
                        maxlength="20"
                        [readonly]="fieldDisabled('lote')" />
                    </div>
                  </div>

                  <div class="form-grid esmc-mov__linha esmc-mov__linha--4">
                    <div class="form-group esmc-mov__moeda">
                      <label>Valor Unitário da Aquisição</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valorUnitarioAquisicao"
                        name="valorUnitarioAquisicao"
                        modo="numero"
                        [readonly]="fieldDisabled('valorUnitarioAquisicao')"
                        [disabled]="fieldDisabled('valorUnitarioAquisicao')" />
                    </div>
                    <div class="form-group esmc-mov__datahora">
                      <div class="esmc-datahora-rotulos">
                        <label class="esmc-datahora-rotulos__data">Validade</label>
                        <label class="esmc-datahora-rotulos__hora">Hora</label>
                      </div>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataValidade"
                        name="dataValidade"
                        [disabled]="fieldDisabled('dataValidade')"
                        [feedbackVisual]="true" />
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
    .esmc-mov {
      gap: 12px;
    }
    .esmc-mov__linha--1 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .esmc-mov__linha--2 {
      grid-template-columns: minmax(0, 40fr) minmax(0, 60fr);
      align-items: end;
    }
    .esmc-mov__linha--2--sem-consumidor {
      grid-template-columns: minmax(0, 1fr);
    }
    .esmc-mov__linha--3 {
      grid-template-columns: minmax(0, 30fr) minmax(0, 30fr) minmax(0, 40fr);
      align-items: end;
    }
    .esmc-mov__linha--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .esmc-mov__datahora,
    .esmc-mov__moeda {
      min-width: 0;
    }
    .esmc-mov__moeda > label {
      line-height: 1.25;
    }
    .esmc-datahora-rotulos {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .esmc-datahora-rotulos label {
      margin-bottom: 4px;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .esmc-datahora-rotulos__data {
      flex: 1 1 70%;
      min-width: 0;
    }
    .esmc-datahora-rotulos__hora {
      flex: 0 0 30%;
      max-width: 30%;
      text-align: left;
      white-space: nowrap;
    }
    @media (max-width: 720px) {
      .esmc-mov__linha--1,
      .esmc-mov__linha--2,
      .esmc-mov__linha--3,
      .esmc-mov__linha--4 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class EntradaSaidaMaterialConsumoFormComponent implements OnInit {
  model: EntradaSaidaMaterialConsumo = {} as EntradaSaidaMaterialConsumo;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
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

  get exibirConsumidor(): boolean {
    return this.model.tipoLancamento === TIPO_LANCAMENTO_SAIDA_UTILIZACAO;
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

    this.pageLoad.run(this.estoqueMaterialConsumoService.getPaged(1, 200), r => {
      this.fk_idEstoqueMaterialConsumo = r.items.map((x: any) => ({
        value: x.idEstoqueMaterialConsumo,
        label: this.fkLabel_idEstoqueMaterialConsumo(x)
      }));
    });

    this.pageLoad.run(this.tipoMaterialService.getPaged(1, 200), r => {
      this.fk_idTipoMaterial = r.items.map((x: any) => ({
        value: x.idTipoMaterial,
        label: this.fkLabel_idTipoMaterial(x)
      }));
    });

    this.pageLoad.run(this.pessoaCondominioService.getPaged(1, 200), r => {
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
      this.pageLoad.run(this.service.getById(idEntradaSaidaMaterialConsumo), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  onTipoLancamentoChange(): void {
    if (!this.exibirConsumidor) {
      this.model.idPessoa = undefined;
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
