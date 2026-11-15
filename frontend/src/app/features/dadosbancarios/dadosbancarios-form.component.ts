import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { DadosBancariosService } from './dadosbancarios.service';
import { DadosBancarios } from './dadosbancarios.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { BancoService } from '../banco/banco.service';


@Component({
  selector: 'app-dadosbancarios-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/dadosbancarios'">Dados Bancários</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Dados Bancários</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de dados bancários</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="landmark" [tamanho]="16" />
              <span>Dados Bancários</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="landmark" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados Bancários</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-blocos dadosbancarios-dados">
                <div class="form-grid dadosbancarios-dados__linha dadosbancarios-dados__linha--1">
                  <div class="form-group">
                    <label>Banco *</label>
                    <app-combobox-customizada
                      [options]="fk_idBanco"
                      [(value)]="model.idBanco"
                      [required]="true"
                      [disabled]="fieldDisabled('idBanco')"
                      ariaLabel="Banco" />
                  </div>
                  <div class="form-group">
                    <label for="db-codigo-empresa">Código empresa cobrança</label>
                    <input
                      id="db-codigo-empresa"
                      type="number"
                      [(ngModel)]="model.codigoEmpresaCobranca"
                      name="codigoEmpresaCobranca"
                      [readonly]="fieldDisabled('codigoEmpresaCobranca')" />
                  </div>
                </div>
                <div class="form-grid dadosbancarios-dados__linha dadosbancarios-dados__linha--2">
                  <div class="form-group fg-label-nowrap">
                    <label for="db-agencia">Agência *</label>
                    <input
                      id="db-agencia"
                      type="text"
                      [(ngModel)]="model.agencia"
                      name="agencia"
                      maxlength="4"
                      [readonly]="fieldDisabled('agencia')"
                      required />
                  </div>
                  <div class="form-group fg-label-nowrap dadosbancarios-dados__digito">
                    <label for="db-dig-ag">Díg. Ag.</label>
                    <input
                      id="db-dig-ag"
                      type="text"
                      [(ngModel)]="model.digitoAgencia"
                      name="digitoAgencia"
                      maxlength="1"
                      [readonly]="fieldDisabled('digitoAgencia')" />
                  </div>
                  <div class="form-group">
                    <label for="db-conta">Conta *</label>
                    <input
                      id="db-conta"
                      type="number"
                      [(ngModel)]="model.conta"
                      name="conta"
                      [readonly]="fieldDisabled('conta')"
                      required />
                  </div>
                  <div class="form-group fg-label-nowrap dadosbancarios-dados__digito">
                    <label for="db-dig-conta">Díg. Conta *</label>
                    <input
                      id="db-dig-conta"
                      type="text"
                      [(ngModel)]="model.digitoConta"
                      name="digitoConta"
                      maxlength="1"
                      [readonly]="fieldDisabled('digitoConta')"
                      required />
                  </div>
                  <div class="form-group dadosbancarios-dados__data">
                    <label for="db-data-cadastro">Data de cadastro *</label>
                    <app-campo-data
                      [(ngModel)]="model.dataCadastro"
                      name="dataCadastro"
                      [disabled]="fieldDisabled('dataCadastro')"
                      [required]="true"
                      [feedbackVisual]="true" />
                  </div>
                  <div class="form-group fg-label-nowrap dadosbancarios-dados__situacao">
                    <label id="db-situacao-label">Situação *</label>
                    <div
                      class="cad-segment"
                      role="radiogroup"
                      aria-labelledby="db-situacao-label"
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
    .dadosbancarios-dados {
      gap: 12px;
    }
    .dadosbancarios-dados__linha--1 {
      grid-template-columns: minmax(0, 55fr) minmax(0, 45fr);
    }
    .dadosbancarios-dados__linha--2 {
      grid-template-columns:
        minmax(0, 14fr)
        minmax(0, 8fr)
        minmax(0, 19fr)
        minmax(0, 8fr)
        minmax(0, 23fr)
        minmax(0, 28fr);
      align-items: end;
    }
    .dadosbancarios-dados__digito,
    .dadosbancarios-dados__data,
    .dadosbancarios-dados__situacao {
      min-width: 0;
    }
    @media (max-width: 720px) {
      .dadosbancarios-dados__linha--1,
      .dadosbancarios-dados__linha--2 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DadosBancariosFormComponent implements OnInit {
  model: DadosBancarios = { ativo: 1 };
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Dados Bancários';
  showDeleteConfirm = false;
  readonly permissionKey = 'DADOSBANCARIOS';
  canEdit = true;
  canDelete = true;
  fk_idBanco: ComboboxOption[] = [];

  constructor(
    private service: DadosBancariosService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private bancoService: BancoService
  ) {
    this.refreshPermissions();
  }

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  get situacaoDesabilitada(): boolean {
    return this.fieldDisabled('ativo');
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  get pkDisplay(): string { return String(this.model.conta) + ' / ' + String(this.model.idBanco) + ' / ' + String(this.model.agencia); }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    this.pageLoad.run(this.bancoService.getPaged(1, 1000), (r) => {
      this.fk_idBanco = r.items.map(b => ({
        value: b.idBanco!,
        label: b.codigoBanco ? `${b.codigoBanco} - ${b.nome ?? ''}` : (b.nome ?? ''),
      }));
    });
    const conta = this.route.snapshot.paramMap.get('conta');
    const idBanco = this.route.snapshot.paramMap.get('idBanco');
    const agencia = this.route.snapshot.paramMap.get('agencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      if (this.model.ativo == null) this.model.ativo = 1;
      return;
    }
    if (conta && idBanco && agencia) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(conta, idBanco, agencia), (r) => {
        this.model = r;
        this.model.dataCadastro = this.normalizarDataCadastro(r.dataCadastro);
        if (this.model.ativo == null) this.model.ativo = 1;
      }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  private normalizarDataCadastro(valor?: string): string | undefined {
    if (valor == null || valor === '') return valor;
    const soData = valor.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(soData) ? soData : valor;
  }

  definirAtivo(valor: 0 | 1): void {
    if (this.situacaoDesabilitada) return;
    this.model.ativo = valor;
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid || this.model.idBanco == null) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/dadosbancarios']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/dadosbancarios']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/dadosbancarios']); }

  confirmDelete(): void {
    this.service.delete(this.model.conta!, this.model.idBanco!, this.model.agencia!).subscribe({ next: () => this.router.navigate(['/dadosbancarios']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
