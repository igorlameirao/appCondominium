import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, from, last, map, of } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { PessoaCadastroIntegradoService, PessoaFisicaIntegradaRequest } from '../../core/services/pessoa-cadastro-integrado.service';
import { ToastService } from '../../core/services/toast.service';
import { PessoaPfCamposComponent } from '../pessoas/pessoa-pf-campos.component';
import { PessoaEnderecosPanelComponent } from '../pessoas/pessoa-enderecos-panel.component';
import { PessoaEnderecoService, PessoaEnderecoUpsert } from '../../core/services/pessoa-endereco.service';
import { somenteDigitos, validarCpf } from '../../core/utils/documento-validator';

@Component({
  selector: 'app-pessoafisica-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, FormsModule, PessoaPfCamposComponent, PessoaEnderecosPanelComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a routerLink="/pessoas">Pessoas</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Nova pessoa física</span>
          </nav>
          <h1 class="cad-titulo">Nova pessoa física</h1>
          <p class="cad-subtitulo">Inclua uma pessoa física e retorne ao hub de pessoas</p>
        </header>
        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="abaCad === 'dados'"
              (click)="abaCad = 'dados'" [attr.aria-selected]="abaCad === 'dados'">
              <app-icone nome="user" [tamanho]="16" />
              <span>Dados da pessoa física</span>
            </button>
            <button type="button" role="tab" class="cad-aba"
              [class.cad-aba--ativa]="abaCad === 'enderecos'" (click)="abaCad = 'enderecos'"
              [attr.aria-selected]="abaCad === 'enderecos'">
              <app-icone nome="map-pin" [tamanho]="16" />
              <span>Endereços</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel" [hidden]="abaCad !== 'dados'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="user" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da pessoa física</h2>
                <p class="cad-secao__texto">Informe identificação, contato e dados obrigatórios</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="gravarTudo()" #f="ngForm">
                <app-pessoa-pf-campos #pfCampos [model]="model" secao="completo"
                  [documentoBloqueado]="false" [desabilitado]="!podeGravar" [exibirSenha]="true" />
              </form>
            </div>
          </div>
          <div class="cad-conteudo" role="tabpanel" [hidden]="abaCad !== 'enderecos'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Endereços da pessoa</h2>
                <p class="cad-secao__texto">Inclua um ou mais endereços; serão gravados junto com a pessoa ao clicar em Salvar</p>
              </div>
            </div>
            <app-pessoa-enderecos-panel
              [idPessoa]="null"
              [modoPendente]="true"
              [podeEditar]="podeGravar"
              (pendentesChange)="enderecosPendentes = $event" />
          </div>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="entityForm" *ngIf="abaCad === 'dados'"
              [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
            <button type="button" class="btn-gravar" *ngIf="abaCad === 'enderecos'"
              [class.is-loading]="saving" [disabled]="saving || !podeGravar" (click)="gravarTudo()">Salvar</button>
            <span class="cad-acoes__espaco"></span>
            <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
          </div>
        </section>
      </div>
    </div>
    <p class="msg-erro cad-erro" *ngIf="formError">{{ formError }}</p>
  `
})
export class PessoafisicaFormComponent implements OnInit {
  @ViewChild('f') pfForm?: NgForm;
  @ViewChild('pfCampos') pfCampos?: PessoaPfCamposComponent;

  model: PessoaFisicaIntegradaRequest = {};
  saving = false;
  formError = '';
  abaCad: 'dados' | 'enderecos' = 'dados';
  enderecosPendentes: PessoaEnderecoUpsert[] = [];
  readonly permissionKey = 'PESSOAFISICA';
  private retorno = '/pessoas';

  constructor(
    private cadastro: PessoaCadastroIntegradoService,
    private enderecoSvc: PessoaEnderecoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private toast: ToastService
  ) {}

  get podeGravar(): boolean {
    return this.permissions.can(this.permissionKey, 'Incluir');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idPessoa');
    if (id && !this.route.snapshot.url.some(s => s.path === 'novo')) {
      void this.router.navigate(['/pessoas', id], { queryParams: { tipo: 'PF' }, replaceUrl: true });
      return;
    }
    const ret = this.route.snapshot.queryParamMap.get('retorno');
    if (ret) this.retorno = ret;
  }

  private extrairErro(e: unknown): string {
    const body = (e as { error?: string | { title?: string } })?.error;
    if (typeof body === 'string') return body;
    return body?.title ?? 'Erro ao gravar';
  }

  gravarTudo(): void {
    const f = this.pfForm;
    if (!f) return;
    f.control.markAllAsTouched();
    const cpf = somenteDigitos(this.model.cpfcnpj ?? '');
    if (!f.valid || !validarCpf(cpf)) {
      this.formError = 'Informe um CPF válido e preencha os campos obrigatórios.';
      if (this.abaCad === 'enderecos') this.abaCad = 'dados';
      return;
    }
    if (this.pfCampos && !this.pfCampos.senhasConferem()) {
      this.formError = 'A confirmação de senha deve ser igual à senha informada.';
      if (this.abaCad === 'enderecos') this.abaCad = 'dados';
      return;
    }
    this.saving = true;
    this.formError = '';
    const pendentes = [...this.enderecosPendentes];
    this.cadastro.criarPf(this.model).pipe(
      concatMap(r => {
        if (!pendentes.length) return of(r);
        return from(pendentes).pipe(
          concatMap(p => this.enderecoSvc.gravar(r.idPessoa, p)),
          last(),
          map(() => r)
        );
      })
    ).subscribe({
      next: r => {
        const qtdEnd = pendentes.length;
        const msg = qtdEnd
          ? `Pessoa física e ${qtdEnd} endereço(s) gravados com sucesso.`
          : 'Pessoa física gravada com sucesso.';
        this.toast.showSuccess(msg);
        const destino = this.retorno === '/pessoas'
          ? ['/pessoas', r.idPessoa]
          : [this.retorno];
        void this.router.navigate(destino, {
          queryParams: { tipo: 'PF' },
          state: { pessoaIntegrada: r }
        });
        this.saving = false;
      },
      error: e => {
        this.formError = this.extrairErro(e);
        this.toast.showError(this.formError);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    void this.router.navigateByUrl(this.retorno);
  }
}