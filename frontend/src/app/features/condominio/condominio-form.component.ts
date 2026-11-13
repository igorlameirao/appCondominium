import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { merge, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { CondominioService } from './condominio.service';
import { Condominio } from './condominio.model';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';
import { ConsultaService } from '../../core/services/consulta.service';
import { somenteDigitos, validarCnpj } from '../../core/utils/documento-validator';
import { abaTemPendenciasFormulario } from '../../shared/form-aba-pendencias.util';

@Component({
  selector: 'app-condominio-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, DocumentoInputComponent, EnderecoWidgetComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/condominio'">Condomínio</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Condomínio</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de condomínio</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'dados'" [attr.aria-selected]="aba === 'dados'" (click)="aba = 'dados'">
              <app-icone nome="building" [tamanho]="16" />
              <span>Dados do Condomínio</span>
              <span *ngIf="pendenciaAbaDados" class="cad-aba__pendencia" title="Campos obrigatórios pendentes" aria-label="Campos obrigatórios pendentes">
                <app-icone nome="alert" [tamanho]="14" />
              </span>
            </button>
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'endereco'" [attr.aria-selected]="aba === 'endereco'" (click)="aba = 'endereco'">
              <app-icone nome="map-pin" [tamanho]="16" />
              <span>Endereço</span>
              <span *ngIf="pendenciaAbaEndereco" class="cad-aba__pendencia" title="Campos obrigatórios pendentes" aria-label="Campos obrigatórios pendentes">
                <app-icone nome="alert" [tamanho]="14" />
              </span>
            </button>
          </div>
          <div class="cad-conteudo">
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div role="tabpanel" [hidden]="aba !== 'dados'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="building" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do Condomínio</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
          <div class="cad-blocos condominio-dados">
            <div class="form-grid condominio-dados__linha condominio-dados__linha--1">
              <div class="form-group fg-label-nowrap">
                <label>CNPJ</label>
                <app-documento-input [(ngModel)]="model.cNPJ" name="cNPJ" tipo="cnpj"
                  [disabled]="fieldDisabled('cNPJ')" (blurCommit)="onCnpjBlur($event)" />
              </div>
              <div class="form-group">
                <label>Nome *</label>
                <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="255" [readonly]="fieldDisabled('nome')" required />
              </div>
            </div>
            <div class="form-grid condominio-dados__linha condominio-dados__linha--2">
              <div class="form-group fg-label-nowrap">
                <label>Área Terreno *</label>
                <input type="number" [(ngModel)]="model.areaTerreno" name="areaTerreno" step="0.001" [readonly]="fieldDisabled('areaTerreno')" required />
              </div>
              <div class="form-group fg-label-nowrap">
                <label>Área Total Edificada *</label>
                <input type="number" [(ngModel)]="model.areaTotalEdificada" name="areaTotalEdificada" step="0.001" [readonly]="fieldDisabled('areaTotalEdificada')" required />
              </div>
              <div class="form-group fg-label-nowrap">
                <label>Área Total Unidades</label>
                <input type="number" [(ngModel)]="model.areaTotalUnidades" name="areaTotalUnidades" step="0.001" [readonly]="fieldDisabled('areaTotalUnidades')" />
              </div>
              <div class="form-group fg-label-nowrap condominio-dados__qtd-unidades">
                <label>Quantidade Total Unidades</label>
                <input type="number" [(ngModel)]="model.quantidadeTotalUnidades" name="quantidadeTotalUnidades" [readonly]="fieldDisabled('quantidadeTotalUnidades')" />
              </div>
            </div>
            <div class="form-grid condominio-dados__linha condominio-dados__linha--3">
              <div class="form-group">
                <label>Domínio *</label>
                <input type="text" [(ngModel)]="model.dominio" name="dominio" maxlength="255" [readonly]="fieldDisabled('dominio')" required />
              </div>
              <div class="form-group fg-label-nowrap condominio-dados__data-inativacao">
                <div class="condominio-data-inativacao-rotulos">
                  <label class="condominio-data-inativacao-rotulos__data">Data Inativação</label>
                  <label class="condominio-data-inativacao-rotulos__hora">Hora</label>
                </div>
                <app-campo-data-hora [(ngModel)]="model.dataInativacao" name="dataInativacao" [disabled]="fieldDisabled('dataInativacao')" [feedbackVisual]="true" />
              </div>
              <div class="form-group fg-label-nowrap condominio-dados__situacao">
                <label id="condominio-situacao-label">Situação *</label>
                <div
                  class="cad-segment"
                  role="radiogroup"
                  aria-labelledby="condominio-situacao-label"
                  [class.cad-segment--desabilitado]="situacaoDesabilitada">
                  <button
                    type="button"
                    role="radio"
                    class="cad-segment__opcao"
                    [class.cad-segment__opcao--ativa]="model.ativo === 1"
                    [attr.aria-checked]="model.ativo === 1"
                    [disabled]="situacaoDesabilitada"
                    (click)="definirAtivo(1)">Ativo</button>
                  <button
                    type="button"
                    role="radio"
                    class="cad-segment__opcao"
                    [class.cad-segment__opcao--ativa]="model.ativo === 0"
                    [attr.aria-checked]="model.ativo === 0"
                    [disabled]="situacaoDesabilitada"
                    (click)="definirAtivo(0)">Inativo</button>
                </div>
                <input type="hidden" [(ngModel)]="model.ativo" name="ativo" required />
              </div>
            </div>
          </div>
          </div>
          <div role="tabpanel" [hidden]="aba !== 'endereco'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Endereço</h2>
                <p class="cad-secao__texto">Informe o endereço do condomínio</p>
              </div>
            </div>
            <app-endereco-widget #enderecoWidget
              disposicao="condominio"
              [(idEndereco)]="model.idEndereco"
              [(numero)]="model.numeroEndereco"
              [(complemento)]="model.complementoEndereco"
              [readonly]="isEdit && !canEdit" />
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
    <app-list-loading-modal [visible]="consultandoCnpj" message="Aguarde, consultando o CNPJ..." />
  `,
  styles: [`
    .condominio-dados__linha--1 {
      grid-template-columns: 26% 74%;
    }
    .condominio-dados__linha--2 {
      grid-template-columns: 1fr 1fr 1fr minmax(0, 0.72fr);
    }
    .condominio-dados__linha--3 {
      grid-template-columns: minmax(0, 1fr) minmax(212px, 228px) 165px;
    }
    .condominio-dados__data-inativacao {
      min-width: 0;
    }
    .condominio-data-inativacao-rotulos {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .condominio-data-inativacao-rotulos label {
      margin-bottom: 4px;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .condominio-data-inativacao-rotulos__data {
      flex: 1 1 auto;
      min-width: 0;
    }
    .condominio-data-inativacao-rotulos__hora {
      flex: 0 0 5.25rem;
      width: 5.25rem;
      text-align: left;
      white-space: nowrap;
    }
    @media (max-width: 720px) {
      .condominio-dados__linha--1,
      .condominio-dados__linha--2,
      .condominio-dados__linha--3 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class CondominioFormComponent implements OnInit, AfterViewInit, OnDestroy {
  model: Condominio = {} as Condominio;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Condomínio';
  showDeleteConfirm = false;
  readonly permissionKey = 'CONDOMINIO';
  canEdit = true;
  canDelete = true;
  aba: 'dados' | 'endereco' = 'dados';
  consultandoCnpj = false;
  private ultimoCnpjConsultado = '';
  private readonly cdr = inject(ChangeDetectorRef);
  private formRefresh?: Subscription;
  @ViewChild('f') formulario?: NgForm;
  @ViewChild('enderecoWidget') enderecoWidget?: EnderecoWidgetComponent;
  private readonly camposDados = new Set([
    'dataInativacao', 'areaTotalUnidades', 'quantidadeTotalUnidades', 'nome', 'cNPJ',
    'areaTerreno', 'areaTotalEdificada', 'ativo', 'dominio'
  ]);
  private readonly camposEndereco = new Set([
    'cEPCondominio', 'logradouroCondominio', 'bairroCondominio', 'ufCondominio', 'municipioCondominio'
  ]);
  

  constructor(
    private service: CondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private consulta: ConsultaService,
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

    
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      this.model.ativo = 1;
      return;
    }
    if (idCondominio) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idCondominio), (r) => {
        this.model = r;
        const cnpj = somenteDigitos(r.cNPJ ?? '');
        this.ultimoCnpjConsultado = cnpj.length === 14 ? cnpj : '';
      }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  ngAfterViewInit(): void {
    const form = this.formulario;
    if (!form) return;
    const grupo = form.control;
    this.formRefresh = merge(grupo.statusChanges, grupo.valueChanges).subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.formRefresh?.unsubscribe();
  }

  onCnpjBlur(raw: string): void {
    if (this.fieldDisabled('cNPJ')) return;
    const cnpj = somenteDigitos(raw);
    if (!cnpj) return;
    if (cnpj.length !== 14) {
      this.toast.showError('CNPJ deve conter 14 caracteres.');
      return;
    }
    if (!validarCnpj(cnpj)) {
      this.toast.showError('CNPJ inválido.');
      return;
    }
    if (cnpj === this.ultimoCnpjConsultado) return;

    this.consultandoCnpj = true;
    this.consulta.consultarCnpj(cnpj).subscribe({
      next: (r) => {
        this.consultandoCnpj = false;
        this.ultimoCnpjConsultado = cnpj;
        if (!this.model.nome?.trim()) {
          const nome = (r.nomeFantasia?.trim() || r.razaoSocial?.trim() || '').trim();
          if (nome) this.model.nome = nome;
        }
        this.enderecoWidget?.aplicarDadosCnpj({
          cep: r.cep,
          enderecoLogradouro: r.enderecoLogradouro,
          enderecoNumero: r.enderecoNumero,
          enderecoComplemento: r.enderecoComplemento,
          idBairro: r.idBairro ?? undefined,
        });
      },
      error: (e: unknown) => {
        this.consultandoCnpj = false;
        const err = e as { status?: number; error?: { mensagem?: string; message?: string } };
        const msg = err?.error?.mensagem ?? err?.error?.message
          ?? (err?.status === 404 ? 'CNPJ não encontrado.' : 'Não foi possível consultar o CNPJ.');
        this.toast.showError(msg);
      },
    });
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['areaTotalUnidades','quantidadeTotalUnidades','cNPJ','dominio','ativo'];
    return roFields.includes(field);
  }

  get situacaoDesabilitada(): boolean {
    return this.fieldDisabled('ativo');
  }

  definirAtivo(valor: 0 | 1): void {
    if (this.situacaoDesabilitada) return;
    this.model.ativo = valor;
  }

  private ativoValido(): boolean {
    return this.model.ativo === 0 || this.model.ativo === 1;
  }

  get pendenciaAbaDados(): boolean {
    if (!this.podeGravar) return false;
    return abaTemPendenciasFormulario(this.formulario, this.camposDados, () => !this.ativoValido());
  }

  get pendenciaAbaEndereco(): boolean {
    if (!this.podeGravar) return false;
    return abaTemPendenciasFormulario(this.formulario, this.camposEndereco);
  }

  submit(f: NgForm): void {
    if (!this.ativoValido()) {
      this.aba = 'dados';
      this.toast.showError('Selecione a situação do condomínio (Ativo ou Inativo).');
      return;
    }
    if (!f.valid) {
      this.aba = this.abaDoErro(f);
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/condominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/condominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  private abaDoErro(f: NgForm): 'dados' | 'endereco' {
    if (abaTemPendenciasFormulario(f, this.camposDados, () => !this.ativoValido())) return 'dados';
    if (abaTemPendenciasFormulario(f, this.camposEndereco)) return 'endereco';
    return 'dados';
  }

  cancel(): void { this.router.navigate(['/condominio']); }

  confirmDelete(): void {
    this.service.delete(this.model.idCondominio!).subscribe({ next: () => this.router.navigate(['/condominio']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
