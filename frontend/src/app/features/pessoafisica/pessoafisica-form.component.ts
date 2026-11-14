import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { PessoaCadastroIntegradoService, PessoaFisicaIntegradaRequest } from '../../core/services/pessoa-cadastro-integrado.service';
import { ToastService } from '../../core/services/toast.service';
import { PessoaPfCamposComponent } from '../pessoas/pessoa-pf-campos.component';

@Component({
  selector: 'app-pessoafisica-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, FormsModule, PessoaPfCamposComponent],
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
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="user" [tamanho]="16" />
              <span>Dados da pessoa física</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="user" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da pessoa física</h2>
                <p class="cad-secao__texto">Informe identificação, contato e dados obrigatórios</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <app-pessoa-pf-campos [model]="model" secao="completo"
                  [documentoBloqueado]="false" [desabilitado]="!podeGravar" [exibirSenha]="true" />
              </form>
            </div>
          </div>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="entityForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
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
  model: PessoaFisicaIntegradaRequest = {};
  saving = false;
  formError = '';
  readonly permissionKey = 'PESSOAFISICA';
  private retorno = '/pessoas';

  constructor(
    private cadastro: PessoaCadastroIntegradoService,
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

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    this.cadastro.criarPf(this.model).subscribe({
      next: r => {
        this.toast.showSuccess('Pessoa física gravada com sucesso.');
        void this.router.navigate([this.retorno === '/pessoas' ? `/pessoas/${r.idPessoa}` : this.retorno], {
          queryParams: { tipo: 'PF' }
        });
      },
      error: e => { this.formError = this.extrairErro(e); this.saving = false; },
      complete: () => this.saving = false
    });
  }

  cancel(): void { void this.router.navigateByUrl(this.retorno); }
}