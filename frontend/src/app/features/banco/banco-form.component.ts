import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { ConsultaService, ResultadoConsultaBanco } from '../../core/services/consulta.service';
import { BancoService } from './banco.service';
import { Banco } from './banco.model';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { SomenteDigitosDirective } from '../../shared/form-layout/somente-digitos.directive';
import { PermissionService } from '../../core/services/permission.service';
import { somenteDigitos, validarCnpj } from '../../core/utils/documento-validator';

interface CamposConsultaBanco {
  nome?: string;
  ispb?: string;
}

interface SubstituicaoConsultaBanco extends CamposConsultaBanco {
  codigo: string;
}

@Component({
  selector: 'app-banco-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, DocumentoInputComponent, SomenteDigitosDirective],  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/banco'">Banco</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Banco</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de banco</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="landmark" [tamanho]="16" />
              <span>Dados do Banco</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="landmark" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do Banco</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div class="cad-blocos banco-dados">
            <div class="form-grid banco-dados__linha banco-dados__linha--1">
              <div class="form-group fg-label-nowrap" [class.cad-campo--invalido]="cnpjInvalido">
                <label>CNPJ</label>
                <app-documento-input [(ngModel)]="model.cnpj" name="cnpj" tipo="cnpj" [exibirErro]="false"
                  [disabled]="fieldDisabled('cnpj')" (validChange)="cnpjValido = $event" (blurCommit)="onCnpjBlur($event)" />
                <span class="field-error" *ngIf="cnpjInvalido">CNPJ inválido.</span>
              </div>
              <div class="form-group">
                <label for="banco-nome">Nome *</label>
                <input id="banco-nome" type="text" [(ngModel)]="model.nome" name="nome" maxlength="255" [readonly]="fieldDisabled('nome')" required />
              </div>
            </div>
            <div class="form-grid banco-dados__linha banco-dados__linha--2">
              <div class="form-group fg-label-nowrap" [class.cad-campo--invalido]="formatoInvalido(codigoBanco)">
                <label for="banco-codigo">Código Banco</label>
                <input id="banco-codigo" type="text" [(ngModel)]="model.codigoBanco" name="codigoBanco" #codigoBanco="ngModel"
                  appSomenteDigitos="3" maxlength="3" minlength="3" [readonly]="fieldDisabled('codigoBanco')" (blur)="onCodigoBancoBlur()" />
                <span class="field-error" *ngIf="formatoInvalido(codigoBanco)">Informe 3 dígitos.</span>
              </div>
              <div class="form-group fg-label-nowrap banco-dados__digito" [class.cad-campo--invalido]="formatoInvalido(digitoVerificador)">
                <label for="banco-digito">Dígito Verificador</label>
                <input id="banco-digito" type="text" [(ngModel)]="model.digitoVerificador" name="digitoVerificador" #digitoVerificador="ngModel"
                  maxlength="1" pattern="[0-9Xx]" autocomplete="off" [readonly]="fieldDisabled('digitoVerificador')" />
                <span class="field-error" *ngIf="formatoInvalido(digitoVerificador)">Use 0-9 ou X.</span>
              </div>
              <div class="form-group" [class.cad-campo--invalido]="formatoInvalido(ispb)">
                <label for="banco-ispb">ISPB *</label>
                <input id="banco-ispb" type="text" [(ngModel)]="model.ispb" name="ispb" #ispb="ngModel"
                  appSomenteDigitos="8" maxlength="8" minlength="8" [readonly]="fieldDisabled('ispb')" required />
                <span class="field-error" *ngIf="formatoInvalido(ispb)">Informe 8 dígitos.</span>
              </div>
              <div class="form-group fg-label-nowrap banco-dados__situacao">
                <label id="banco-situacao-label">Situação *</label>
                <div
                  class="cad-segment"
                  role="radiogroup"
                  aria-labelledby="banco-situacao-label"
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
    <div class="confirm-overlay" *ngIf="substituicao as s">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="banco-substituir-titulo">
        <p id="banco-substituir-titulo">A BrasilAPI retornou dados diferentes dos informados para o Código Banco {{ s.codigo }}. Deseja substituir?</p>
        <dl class="banco-substituir">
          <ng-container *ngIf="s.nome">
            <dt>Nome</dt>
            <dd>Atual: {{ model.nome }}</dd>
            <dd>BrasilAPI: {{ s.nome }}</dd>
          </ng-container>
          <ng-container *ngIf="s.ispb">
            <dt>ISPB</dt>
            <dd>Atual: {{ model.ispb }}</dd>
            <dd>BrasilAPI: {{ s.ispb }}</dd>
          </ng-container>
        </dl>
        <div class="confirm-actions">
          <button type="button" class="btn-confirm-nao" (click)="manterDadosInformados()">Manter</button>
          <button type="button" class="btn-confirm-ok" (click)="substituirPelaConsulta()">Substituir</button>
        </div>
      </div>
    </div>
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />
    <app-list-loading-modal [visible]="consultandoCnpj" message="Aguarde, consultando o CNPJ..." />
    <app-list-loading-modal [visible]="consultandoCodigo" message="Aguarde, consultando o Código Banco..." />
  `,
  styles: [`
    .banco-dados__linha--1 {
      grid-template-columns: 25% 75%;
    }
    .banco-dados__linha--2 {
      grid-template-columns:
        minmax(0, 25fr)
        minmax(8.125rem, 15fr)
        minmax(0, 25fr)
        minmax(0, 35fr);
    }
    .banco-dados__digito {
      min-width: 0;
    }
    .banco-dados__situacao {
      min-width: 0;
    }
    .banco-substituir {
      margin: 0 0 14px;
      font-size: 13px;
      color: #334155;
    }
    .banco-substituir dt {
      margin-top: 8px;
      font-weight: 600;
      color: #0f172a;
    }
    .banco-substituir dd {
      margin: 2px 0 0;
      overflow-wrap: anywhere;
    }
    @media (max-width: 720px) {
      .banco-dados__linha--1,
      .banco-dados__linha--2 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class BancoFormComponent implements OnInit {
  model: Banco = { ativo: 1 };
  isEdit = false;
  saving = false;
  consultandoCnpj = false;
  consultandoCodigo = false;
  cnpjValido = true;
  cnpjTocado = false;
  substituicao: SubstituicaoConsultaBanco | null = null;
  private ultimoCnpjConsultado = '';
  private ultimoCodigoConsultado = '';
  /** Valores preenchidos pela última consulta de Código Banco; podem ser trocados sem confirmação. */
  private preenchidoPelaConsulta: CamposConsultaBanco = {};
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Banco';
  showDeleteConfirm = false;
  readonly permissionKey = 'BANCO';
  canEdit = true;
  canDelete = true;

  constructor(
    private service: BancoService,
    private consulta: ConsultaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService
  ) {
    this.refreshPermissions();
  }

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  get cnpjInvalido(): boolean {
    return this.cnpjTocado && !this.cnpjValido;
  }

  get situacaoDesabilitada(): boolean {
    return this.fieldDisabled('ativo');
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  ngOnInit(): void {
    const idBanco = this.route.snapshot.paramMap.get('idBanco');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      return;
    }
    this.pageLoad.beginEdit();
    if (idBanco) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idBanco), (r) => {
        this.model = r;
        const cnpj = somenteDigitos(r.cnpj ?? '');
        this.ultimoCnpjConsultado = cnpj.length === 14 ? cnpj : '';
        this.ultimoCodigoConsultado = r.codigoBanco ?? '';
      }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  onCnpjBlur(raw: string): void {
    this.cnpjTocado = true;
    if (this.fieldDisabled('cnpj')) return;
    if (this.consultandoCnpj) return;
    const cnpj = somenteDigitos(raw);
    if (!cnpj) return;
    if (cnpj.length !== 14 || !validarCnpj(cnpj)) return;
    if (cnpj === this.ultimoCnpjConsultado) return;

    this.consultandoCnpj = true;
    this.consulta.consultarCnpj(cnpj).subscribe({
      next: (r) => {
        this.consultandoCnpj = false;
        this.ultimoCnpjConsultado = cnpj;
        if (!this.model.nome?.trim()) {
          const razao = (r.razaoSocial?.trim() || '').trim();
          if (razao) this.model.nome = razao;
        }
      },
      error: (e: unknown) => {
        this.consultandoCnpj = false;
        const err = e as { status?: number; error?: { mensagem?: string; message?: string } };
        const msg = err?.error?.mensagem ?? err?.error?.message
          ?? (err?.status === 404 ? 'CNPJ não encontrado.' : 'Não foi possível consultar o CNPJ. Preencha os dados manualmente.');
        this.toast.showWarning(msg);
      },
    });
  }

  onCodigoBancoBlur(): void {
    if (this.fieldDisabled('codigoBanco')) return;
    if (this.consultandoCodigo || this.substituicao) return;
    const codigo = this.model.codigoBanco ?? '';
    if (!/^\d{3}$/.test(codigo) || codigo === '000') return;
    if (codigo === this.ultimoCodigoConsultado) return;

    this.consultandoCodigo = true;
    this.consulta.consultarBancoPorCodigo(codigo).subscribe({
      next: (r) => {
        this.consultandoCodigo = false;
        this.ultimoCodigoConsultado = codigo;
        if (this.model.codigoBanco !== codigo) { this.onCodigoBancoBlur(); return; }
        this.aplicarConsultaCodigo(codigo, r);
      },
      error: (e: unknown) => {
        this.consultandoCodigo = false;
        const err = e as { status?: number; error?: { mensagem?: string } };
        if (err?.status === 404) this.ultimoCodigoConsultado = codigo;
        if (this.model.codigoBanco !== codigo) { this.onCodigoBancoBlur(); return; }
        this.toast.showWarning(err?.status === 404
          ? 'Código Banco não encontrado na BrasilAPI. Preencha os dados manualmente.'
          : err?.error?.mensagem ?? 'Não foi possível consultar o Código Banco. Preencha os dados manualmente.');
      },
    });
  }

  manterDadosInformados(): void {
    this.substituicao = null;
  }

  substituirPelaConsulta(): void {
    const s = this.substituicao;
    if (!s) return;
    if (s.nome) this.model.nome = this.preenchidoPelaConsulta.nome = s.nome;
    if (s.ispb) this.model.ispb = this.preenchidoPelaConsulta.ispb = s.ispb;
    this.substituicao = null;
  }

  /** Preenche campos vazios ou vindos da consulta anterior; valores digitados só mudam após confirmação. */
  private aplicarConsultaCodigo(codigo: string, r: ResultadoConsultaBanco): void {
    const recebido: CamposConsultaBanco = {
      nome: r.nome?.trim() || undefined,
      ispb: /^\d{8}$/.test(r.ispb ?? '') ? r.ispb! : undefined,
    };
    const conflitos: CamposConsultaBanco = {};
    for (const campo of ['nome', 'ispb'] as const) {
      const novo = recebido[campo];
      if (!novo) continue;
      const atual = (this.model[campo] ?? '').trim();
      if (!atual || atual === this.preenchidoPelaConsulta[campo]) {
        this.model[campo] = this.preenchidoPelaConsulta[campo] = novo;
      } else if (atual !== novo) {
        conflitos[campo] = novo;
      }
    }
    if (conflitos.nome || conflitos.ispb) this.substituicao = { codigo, ...conflitos };
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

  /** Preenchido porém fora do formato, após interação. Obrigatório vazio fica só com a borda vermelha global. */
  formatoInvalido(ctrl: { invalid: boolean | null; touched: boolean | null; value: unknown }): boolean {
    return !!ctrl.invalid && !!ctrl.touched && !!ctrl.value;
  }

  submit(f: NgForm): void {
    f.form.markAllAsTouched();
    this.cnpjTocado = true;
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    if (this.model.cnpj && !validarCnpj(this.model.cnpj)) { this.toast.showError('CNPJ inválido.'); return; }
    this.saving = true;
    const payload: Banco = {
      ...this.model,
      codigoBanco: this.model.codigoBanco || null,
      digitoVerificador: this.model.digitoVerificador?.toUpperCase() || null,
      cnpj: this.model.cnpj || null,
      ativo: this.model.ativo === 0 ? 0 : 1,
    };
    const request: Observable<unknown> = this.isEdit ? this.service.update(payload) : this.service.create(payload);
    request.subscribe({
      next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/banco']); },
      error: (e: unknown) => { this.toast.showError(this.mensagemErro(e, 'Não foi possível salvar. Tente novamente.')); this.saving = false; },
      complete: () => this.saving = false
    });
  }

  cancel(): void { this.router.navigate(['/banco']); }

  confirmDelete(): void {
    this.service.delete(this.model.idBanco!).subscribe({
      next: () => this.router.navigate(['/banco']),
      error: (e: unknown) => { this.showDeleteConfirm = false; this.toast.showError(this.mensagemErro(e, 'Não foi possível excluir. Tente novamente.')); }
    });
  }

  private mensagemErro(e: unknown, padrao: string): string {
    const err = (e as any)?.error;
    return (typeof err === 'string' && err ? err : null) ?? err?.title ?? err?.message ?? padrao;
  }
}
