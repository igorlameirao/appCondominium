import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { DespesaService } from './despesa.service';
import { Despesa } from './despesa.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { FornecedorService } from '../fornecedor/fornecedor.service';
import { ConcorrenciaService } from '../concorrencia/concorrencia.service';
import { TipoDespesaService } from '../tipodespesa/tipodespesa.service';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataComponent, CampoDataHoraComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/despesa'">Despesa</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Despesa</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de despesa</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="wallet" [tamanho]="16" />
              <span>Dados de Despesa</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="wallet" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Despesa</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-blocos despesa-dados">
                <div class="form-grid despesa-dados__linha despesa-dados__linha--1">
                  <div class="form-group">
                    <label>Fornecedor *</label>
                    <app-combobox-customizada
                      [options]="fk_idFornecedor"
                      [(value)]="model.idFornecedor"
                      [disabled]="fieldDisabled('idFornecedor')"
                      [required]="true"
                      ariaLabel="Fornecedor" />
                  </div>
                  <div class="form-group">
                    <label>Tipo de despesa *</label>
                    <app-combobox-customizada
                      [options]="fk_idTipoDespesa"
                      [(value)]="model.idTipoDespesa"
                      [disabled]="fieldDisabled('idTipoDespesa')"
                      [required]="true"
                      ariaLabel="Tipo de despesa" />
                  </div>
                </div>
                <div class="form-grid despesa-dados__linha despesa-dados__linha--2">
                  <div class="form-group">
                    <label>Descrição *</label>
                    <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" required />
                  </div>
                </div>
                <div class="form-grid despesa-dados__linha despesa-dados__linha--3">
                  <div class="form-group despesa-dados__data-despesa">
                    <label>Data da despesa *</label>
                    <app-campo-data
                      [(ngModel)]="model.dataDespesa"
                      name="dataDespesa"
                      [disabled]="fieldDisabled('dataDespesa')"
                      [required]="true"
                      [feedbackVisual]="true" />
                  </div>
                  <div class="form-group despesa-dados__lancamento">
                    <div class="despesa-lancamento-rotulos">
                      <label class="despesa-lancamento-rotulos__data">Data de lançamento *</label>
                      <label class="despesa-lancamento-rotulos__hora">Hora *</label>
                    </div>
                    <app-campo-data-hora
                      [(ngModel)]="model.dataLancamento"
                      name="dataLancamento"
                      [disabled]="fieldDisabled('dataLancamento')"
                      [required]="true"
                      [feedbackVisual]="true" />
                  </div>
                  <div class="form-group despesa-dados__valor">
                    <label>Valor *</label>
                    <input
                      type="number"
                      inputmode="decimal"
                      [(ngModel)]="model.valor"
                      name="valor"
                      step="0.001"
                      [readonly]="fieldDisabled('valor')"
                      required />
                  </div>
                </div>
                <div class="form-grid despesa-dados__linha despesa-dados__linha--4">
                  <div class="form-group">
                    <label>Concorrência</label>
                    <app-combobox-customizada
                      [options]="fk_idConcorrencia"
                      [(value)]="model.idConcorrencia"
                      [disabled]="fieldDisabled('idConcorrencia')"
                      ariaLabel="Concorrência" />
                  </div>
                </div>
                <div class="form-grid despesa-dados__linha despesa-dados__linha--5">
                  <div class="form-group">
                    <label>Observações</label>
                    <input type="text" [(ngModel)]="model.observacoes" name="observacoes" [readonly]="fieldDisabled('observacoes')" />
                  </div>
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
  styles: [`
    .despesa-dados {
      gap: 12px;
    }
    .despesa-dados__linha--1 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .despesa-dados__linha--2,
    .despesa-dados__linha--4,
    .despesa-dados__linha--5 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .despesa-dados__linha--3 {
      grid-template-columns: minmax(0, 28fr) minmax(0, 44fr) minmax(0, 28fr);
      align-items: end;
    }
    .despesa-dados__data-despesa,
    .despesa-dados__lancamento,
    .despesa-dados__valor {
      min-width: 0;
    }
    .despesa-lancamento-rotulos {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .despesa-lancamento-rotulos label {
      margin-bottom: 4px;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .despesa-lancamento-rotulos__data {
      flex: 28 1 0;
      min-width: 0;
    }
    .despesa-lancamento-rotulos__hora {
      flex: 16 1 0;
      min-width: 0;
      white-space: nowrap;
    }
    @media (max-width: 720px) {
      .despesa-dados__linha--1,
      .despesa-dados__linha--3 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DespesaFormComponent implements OnInit {
  model: Despesa = {} as Despesa;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Despesa';
  showDeleteConfirm = false;
  readonly permissionKey = 'DESPESA';
  canEdit = true;
  canDelete = true;
  fk_idFornecedor: ComboboxOption[] = [];
  fk_idConcorrencia: ComboboxOption[] = [];
  fk_idTipoDespesa: ComboboxOption[] = [];

  constructor(
    private service: DespesaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private fornecedorService: FornecedorService,
    private concorrenciaService: ConcorrenciaService,
    private tipoDespesaService: TipoDespesaService,
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

    this.pageLoad.run(this.fornecedorService.getPaged(1, 200), r => {
      this.fk_idFornecedor = r.items.map((x: any) => ({
        value: x.idFornecedor,
        label: this.fkLabel_idFornecedor(x)
      }));
    });

    this.pageLoad.run(this.concorrenciaService.getPaged(1, 200), r => {
      this.fk_idConcorrencia = r.items.map((x: any) => ({
        value: x.idConcorrencia,
        label: this.fkLabel_idConcorrencia(x)
      }));
    });

    this.pageLoad.run(this.tipoDespesaService.getPaged(1, 200), r => {
      this.fk_idTipoDespesa = r.items.map((x: any) => ({
        value: x.idTipoDespesa,
        label: this.fkLabel_idTipoDespesa(x)
      }));
    });

    const idDespesa = this.route.snapshot.paramMap.get('idDespesa');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      this.preencherDataLancamentoInicial();
      return;
    }
    if (idDespesa) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idDespesa), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  /** Na inclusão, preenche data e hora de lançamento com o momento atual (não altera na edição). */
  private preencherDataLancamentoInicial(): void {
    if (this.model.dataLancamento) return;
    const agora = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    this.model.dataLancamento =
      `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}T${p(agora.getHours())}:${p(agora.getMinutes())}:00`;
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/despesa']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/despesa']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/despesa']); }

  confirmDelete(): void {
    this.service.delete(this.model.idDespesa!).subscribe({ next: () => this.router.navigate(['/despesa']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idFornecedor(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idFornecedor ?? '');
  }
  fkLabel_idConcorrencia(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idConcorrencia ?? '');
  }
  fkLabel_idTipoDespesa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoDespesa ?? '');
  }
}
