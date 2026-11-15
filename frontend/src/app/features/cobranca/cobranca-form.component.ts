import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { CobrancaService } from './cobranca.service';
import { Cobranca } from './cobranca.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';

@Component({
  selector: 'app-cobranca-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/cobranca'">Cobrança</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Nova' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ tituloPagina }}</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de cobrança</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="wallet" [tamanho]="16" />
              <span>Dados da Cobrança</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="wallet" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da Cobrança</h2>
                <p class="cad-secao__texto">Informe a unidade e as datas da cobrança</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-blocos cobranca-dados">
                <div class="form-grid cobranca-dados__linha cobranca-dados__linha--principal">
                  <div class="form-group cobranca-dados__unidade">
                    <label>Unidade *</label>
                    <app-combobox-customizada
                      [options]="fk_idUnidade"
                      [(value)]="model.idUnidade"
                      [disabled]="fieldDisabled('idUnidade')"
                      [required]="true"
                      ariaLabel="Unidade" />
                  </div>
                  <div class="form-group cobranca-dados__data">
                    <label for="cob-data-geracao">Data de geração</label>
                    <app-campo-data
                      [(ngModel)]="model.dataGeracao"
                      name="dataGeracao"
                      [disabled]="fieldDisabled('dataGeracao')"
                      [feedbackVisual]="true" />
                  </div>
                  <div class="form-group cobranca-dados__data">
                    <label for="cob-data-vencimento">Data de vencimento</label>
                    <app-campo-data
                      [(ngModel)]="model.dataVencimento"
                      name="dataVencimento"
                      [disabled]="fieldDisabled('dataVencimento')"
                      [feedbackVisual]="true" />
                  </div>
                </div>

                @if (isEdit && exibirProcessamentoBancario) {
                  <div class="cobranca-dados__processamento">
                    <h3 class="cobranca-dados__processamento-titulo">Processamento bancário</h3>
                    <p class="cobranca-dados__processamento-texto">Preenchido automaticamente na geração de remessa e retorno CNAB.</p>
                    <div class="form-grid cobranca-dados__linha cobranca-dados__linha--3">
                      <div class="form-group">
                        <label for="cob-arq-remessa">Arquivo de remessa</label>
                        <input
                          id="cob-arq-remessa"
                          type="text"
                          class="readonly"
                          [value]="textoOuVazio(model.idArquivoCobrancaRemessa)"
                          readonly
                          tabindex="-1"
                          aria-readonly="true" />
                      </div>
                      <div class="form-group">
                        <label for="cob-seq-remessa">Seq. registro na remessa</label>
                        <input
                          id="cob-seq-remessa"
                          type="text"
                          class="readonly"
                          [value]="textoOuVazio(model.sequencialRegistroRemessa)"
                          readonly
                          tabindex="-1"
                          aria-readonly="true" />
                      </div>
                      <div class="form-group">
                        <label for="cob-arq-retorno">Arquivo de retorno</label>
                        <input
                          id="cob-arq-retorno"
                          type="text"
                          class="readonly"
                          [value]="textoOuVazio(model.idArquivoCobrancaRetorno)"
                          readonly
                          tabindex="-1"
                          aria-readonly="true" />
                      </div>
                      <div class="form-group">
                        <label for="cob-seq-retorno">Seq. registro no retorno</label>
                        <input
                          id="cob-seq-retorno"
                          type="text"
                          class="readonly"
                          [value]="textoOuVazio(model.sequencialRegistroRetorno)"
                          readonly
                          tabindex="-1"
                          aria-readonly="true" />
                      </div>
                    </div>
                  </div>
                }
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
    .cobranca-dados {
      gap: 12px;
    }
    .cobranca-dados__linha--principal {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
      align-items: end;
    }
    .cobranca-dados__unidade,
    .cobranca-dados__data {
      min-width: 0;
    }
    .cobranca-dados__linha--3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .cobranca-dados__processamento {
      margin-top: 4px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .cobranca-dados__processamento-titulo {
      margin: 0 0 4px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #334155;
    }
    .cobranca-dados__processamento-texto {
      margin: 0 0 12px;
      font-size: 0.8125rem;
      color: #64748b;
    }
    @media (max-width: 720px) {
      .cobranca-dados__linha--principal,
      .cobranca-dados__linha--3 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class CobrancaFormComponent implements OnInit {
  model: Cobranca = {} as Cobranca;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Cobrança';
  showDeleteConfirm = false;
  readonly permissionKey = 'COBRANCA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];

  constructor(
    private service: CobrancaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
  ) {
    this.refreshPermissions();
  }

  get tituloPagina(): string {
    return this.isEdit ? 'Editar Cobrança' : 'Nova Cobrança';
  }

  /** Campos de remessa/retorno CNAB — preenchidos pelo processamento, não no cadastro manual. */
  get exibirProcessamentoBancario(): boolean {
    return (
      this.model.idArquivoCobrancaRemessa != null
      || this.model.sequencialRegistroRemessa != null
      || this.model.idArquivoCobrancaRetorno != null
      || this.model.sequencialRegistroRetorno != null
    );
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

    this.pageLoad.run(this.unidadeService.getPaged(1, 200), r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x),
      }));
    });
    const idCobranca = this.route.snapshot.paramMap.get('idCobranca');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idCobranca) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idCobranca), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const camposProcessamento = [
      'idArquivoCobrancaRetorno',
      'sequencialRegistroRetorno',
      'idArquivoCobrancaRemessa',
      'sequencialRegistroRemessa',
    ];
    return camposProcessamento.includes(field);
  }

  textoOuVazio(valor: number | null | undefined): string {
    return valor != null && valor !== undefined ? String(valor) : '—';
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess('Alterações salvas com sucesso.'); this.router.navigate(['/cobranca']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as { error?: unknown })?.error === 'string' ? (e as { error: string }).error : null) ?? (e as { error?: { title?: string; message?: string } })?.error?.title ?? (e as { error?: { message?: string } })?.error?.message ?? (e as { message?: string })?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false,
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.entityTitle + ' gravada com sucesso.'); this.router.navigate(['/cobranca']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as { error?: unknown })?.error === 'string' ? (e as { error: string }).error : null) ?? (e as { error?: { title?: string; message?: string } })?.error?.title ?? (e as { error?: { message?: string } })?.error?.message ?? (e as { message?: string })?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false,
      });
    }
  }

  cancel(): void { this.router.navigate(['/cobranca']); }

  confirmDelete(): void {
    this.service.delete(this.model.idCobranca!).subscribe({ next: () => this.router.navigate(['/cobranca']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
}
