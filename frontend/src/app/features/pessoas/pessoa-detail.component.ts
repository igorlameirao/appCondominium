import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { ToastService } from '../../core/services/toast.service';
import {
  PessoaCadastroIntegradoService,
  PessoaFisicaIntegradaRequest,
  PessoaJuridicaIntegradaRequest
} from '../../core/services/pessoa-cadastro-integrado.service';
import { PessoaVinculoService } from '../pessoavinculo/pessoavinculo.service';
import { PessoaVinculo } from '../pessoavinculo/pessoavinculo.model';
import { PapelVinculoService } from '../papelvinculo/papelvinculo.service';
import { PermissionService } from '../../core/services/permission.service';
import { AutorizacaoAcessoTemporarioService } from '../autorizacaoacessotemporario/autorizacaoacessotemporario.service';
import { AutorizacaoAcessoTemporario } from '../autorizacaoacessotemporario/autorizacaoacessotemporario.model';
import { UnidadeService } from '../unidade/unidade.service';
import { PessoaEnderecosPanelComponent } from './pessoa-enderecos-panel.component';
import { PessoaPfCamposComponent } from './pessoa-pf-campos.component';
import { PessoaPjCamposComponent } from './pessoa-pj-campos.component';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { ConviteEmitirPanelComponent } from '../convite/convite-emitir-panel.component';

@Component({
  selector: 'app-pessoa-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    FormsModule,
    ListLoadingModalComponent,
    PessoaEnderecosPanelComponent,
    PessoaPfCamposComponent,
    PessoaPjCamposComponent,
    ConviteEmitirPanelComponent
  ],
  template: `
    <app-list-loading-modal [visible]="loading" />
    <div class="content-wrapper cad-wrapper" *ngIf="!loading">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a routerLink="/pessoas">Pessoas</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ titulo }}</h1>
          <p class="cad-subtitulo">{{ subtitulo }}</p>
        </header>

        <section class="cad-card form-page">
          <form id="pessoaForm" novalidate (ngSubmit)="salvar(f)" #f="ngForm">
            <div class="cad-abas" role="tablist" aria-label="Seções da pessoa">
              <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'dados'" (click)="aba='dados'">
                <app-icone nome="user" [tamanho]="16" /><span>Dados</span>
              </button>
              <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'contatos'" (click)="aba='contatos'">
                <app-icone nome="phone" [tamanho]="16" /><span>Contatos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'enderecos'" (click)="aba='enderecos'">
                <app-icone nome="map-pin" [tamanho]="16" /><span>Endereços</span>
              </button>
              <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'vinculos'" (click)="aba='vinculos'">
                <app-icone nome="users" [tamanho]="16" /><span>Vínculos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="canAutorizacaoVer" [class.cad-aba--ativa]="aba === 'autorizacoes'" (click)="aba='autorizacoes'">
                <app-icone nome="key" [tamanho]="16" /><span>Autorizações</span>
              </button>
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'dados'">
              <div class="cad-secao">
                <app-icone class="cad-secao__icone" [nome]="tipo === 'PJ' ? 'briefcase' : 'user'" [tamanho]="26" />
                <div>
                  <h2 class="cad-secao__titulo">Dados cadastrais</h2>
                  <p class="cad-secao__texto">Identificação e dados principais da pessoa</p>
                </div>
              </div>
              <div class="form-scroll cad-form-scroll">
                <app-pessoa-pf-campos *ngIf="tipo === 'PF'" [model]="modelPf" secao="dados"
                  [documentoBloqueado]="true" [desabilitado]="!podeEditarCadastro" />
                <app-pessoa-pj-campos *ngIf="tipo === 'PJ'" [model]="modelPj" secao="dados"
                  [documentoBloqueado]="true" [desabilitado]="!podeEditarCadastro" [responsaveis]="fkResponsavel" />
              </div>
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'contatos'">
              <div class="cad-secao">
                <app-icone class="cad-secao__icone" nome="phone" [tamanho]="26" />
                <div>
                  <h2 class="cad-secao__titulo">Contatos</h2>
                  <p class="cad-secao__texto">Telefone e e-mail utilizados no condomínio</p>
                </div>
              </div>
              <div class="form-scroll cad-form-scroll">
                <app-pessoa-pf-campos *ngIf="tipo === 'PF'" [model]="modelPf" secao="contatos"
                  [documentoBloqueado]="true" [desabilitado]="!podeEditarCadastro" />
                <app-pessoa-pj-campos *ngIf="tipo === 'PJ'" [model]="modelPj" secao="contatos"
                  [documentoBloqueado]="true" [desabilitado]="!podeEditarCadastro" [responsaveis]="fkResponsavel" />
              </div>
            </div>

            <div class="cad-conteudo" role="tabpanel" *ngIf="aba === 'enderecos'">
              <app-pessoa-enderecos-panel [idPessoa]="idPessoa" [podeEditar]="podeEditarEndereco" />
            </div>

            <div class="cad-conteudo" role="tabpanel" *ngIf="aba === 'vinculos'">
              <app-convite-emitir-panel *ngIf="tipo === 'PF'"
                [idPessoaDestinatario]="idPessoa"
                [emailInicial]="modelPf.email ?? ''"
                [cpfInicial]="modelPf.cpfcnpj ?? ''" />
              <div class="cad-lista-cabecalho" *ngIf="canVinculoIncluir">
                <a class="btn-novo" [routerLink]="['/pessoavinculo/novo']" [queryParams]="{ idPessoa }">Novo vínculo</a>
              </div>
              <div class="lst-tabela__scroll">
                <table class="lst-grade" *ngIf="vinculos.length; else semVinculo">
                  <thead>
                    <tr>
                      <th scope="col">Papel</th>
                      <th scope="col" class="lst-col--conteudo">Unidade</th>
                      <th scope="col">Início</th>
                      <th scope="col">Fim</th>
                      <th scope="col">Situação</th>
                      <th scope="col" class="lst-grade__acoes">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let v of vinculos" class="row-click" (dblclick)="editarVinculo(v)">
                      <td>{{ papelLabel(v.codigoPapelVinculo) }}</td>
                      <td class="lst-col--conteudo">
                        <a *ngIf="v.idUnidade" [routerLink]="['/unidade', v.idUnidade]" (click)="$event.stopPropagation()">{{ unidadeLabel(v.idUnidade) }}</a>
                        <span *ngIf="!v.idUnidade">—</span>
                      </td>
                      <td>{{ v.dataInicio }}</td>
                      <td>{{ v.dataFim ?? '—' }}</td>
                      <td><span [class.lst-situacao--inativa]="!vigente(v)">{{ situacaoVinculo(v) }}</span></td>
                      <td class="lst-grade__acoes">
                        <button type="button" class="lst-acao lst-acao--editar" title="Editar vínculo" (click)="editarVinculo(v)" (dblclick)="$event.stopPropagation()">
                          <app-icone nome="pencil" [tamanho]="16" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <ng-template #semVinculo><p class="lst-vazio">Nenhum vínculo para esta pessoa.</p></ng-template>
              </div>
            </div>

            <div class="cad-conteudo" role="tabpanel" *ngIf="aba === 'autorizacoes' && canAutorizacaoVer">
              <div class="lst-tabela__scroll">
                <table class="lst-grade" *ngIf="autorizacoes.length; else semAuth">
                  <thead>
                    <tr>
                      <th scope="col" class="lst-col--conteudo">Visitante / motivo</th>
                      <th scope="col">Unidade</th>
                      <th scope="col">Período</th>
                      <th scope="col">Situação</th>
                      <th scope="col" class="lst-grade__acoes">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let a of autorizacoes" class="row-click" (dblclick)="editarAutorizacao(a)">
                      <td class="lst-col--conteudo">{{ a.nomeVisitante || a.motivo || '—' }}</td>
                      <td>{{ unidadeLabel(a.idUnidade) }}</td>
                      <td>{{ a.dataHoraInicio }} — {{ a.dataHoraFim }}</td>
                      <td>{{ situacaoAutorizacao(a) }}</td>
                      <td class="lst-grade__acoes">
                        <button type="button" class="lst-acao lst-acao--editar" title="Editar autorização" (click)="editarAutorizacao(a)" (dblclick)="$event.stopPropagation()">
                          <app-icone nome="pencil" [tamanho]="16" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <ng-template #semAuth><p class="lst-vazio">Nenhuma autorização temporária vinculada.</p></ng-template>
              </div>
            </div>

            <div class="actions form-actions cad-acoes" *ngIf="aba === 'dados' || aba === 'contatos'">
              <button type="submit" class="btn-gravar" [class.is-loading]="saving"
                [disabled]="saving || !podeEditarCadastro">Salvar</button>
              <span class="cad-acoes__espaco"></span>
              <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
            </div>
            <div class="actions form-actions cad-acoes" *ngIf="aba !== 'dados' && aba !== 'contatos'">
              <span class="cad-acoes__espaco"></span>
              <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
            </div>
          </form>
        </section>
      </div>
    </div>
    <p class="msg-erro cad-erro" *ngIf="formError">{{ formError }}</p>
  `,
})
export class PessoaDetailComponent implements OnInit {
  idPessoa = 0;
  tipo: 'PF' | 'PJ' = 'PF';
  aba: 'dados' | 'contatos' | 'enderecos' | 'vinculos' | 'autorizacoes' = 'dados';
  modelPf: PessoaFisicaIntegradaRequest = {};
  modelPj: PessoaJuridicaIntegradaRequest = {};
  loading = true;
  saving = false;
  formError = '';
  fkResponsavel: ComboboxOption[] = [];
  vinculos: PessoaVinculo[] = [];
  autorizacoes: AutorizacaoAcessoTemporario[] = [];
  papeis = new Map<number, string>();
  unidades = new Map<number, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cadastro: PessoaCadastroIntegradoService,
    private vinculoService: PessoaVinculoService,
    private papelService: PapelVinculoService,
    private authService: AutorizacaoAcessoTemporarioService,
    private unidadeService: UnidadeService,
    private permissions: PermissionService,
    private pfService: PessoafisicaService,
    private toast: ToastService
  ) {}

  get titulo(): string {
    const nome = this.tipo === 'PJ' ? this.modelPj.nome : this.modelPf.nome;
    return nome?.trim() || `Pessoa ${this.idPessoa}`;
  }

  get subtitulo(): string {
    const doc = this.tipo === 'PJ' ? this.modelPj.cpfcnpj : this.modelPf.cpfcnpj;
    const partes = [doc?.trim(), this.tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'].filter(Boolean);
    return partes.join(' · ');
  }

  get canVinculoIncluir(): boolean { return this.permissions.can('PESSOAVINCULO', 'Incluir'); }
  get canAutorizacaoVer(): boolean { return this.permissions.can('AUTORIZACAOACESSOTEMPORARIO', 'Visualizar'); }
  get podeEditarCadastro(): boolean {
    return this.tipo === 'PJ'
      ? this.permissions.can('PESSOAJURIDICA', 'Alterar')
      : this.permissions.can('PESSOAFISICA', 'Alterar');
  }
  get podeEditarEndereco(): boolean {
    return this.podeEditarCadastro || this.permissions.can('FORNECEDOR', 'Alterar');
  }

  ngOnInit(): void {
    this.idPessoa = Number(this.route.snapshot.paramMap.get('idPessoa'));
    const tipoQ = this.route.snapshot.queryParamMap.get('tipo');
    if (tipoQ === 'PJ') this.tipo = 'PJ';

    this.pfService.getPaged(1, 200).subscribe(r => {
      this.fkResponsavel = (r.items ?? [])
        .filter(x => x.idPessoa != null)
        .map(x => ({
          value: x.idPessoa as number,
          label: (x as { email?: string; nome?: string }).nome
            ?? (x as { email?: string }).email
            ?? String(x.idPessoa)
        }));
    });

    this.papelService.getPaged(1, 100).subscribe(r => {
      for (const p of r.items ?? []) {
        if (p.codigoPapelVinculo != null && p.descricao) this.papeis.set(p.codigoPapelVinculo, p.descricao);
      }
    });
    this.unidadeService.getPaged(1, 500).subscribe(r => {
      for (const u of r.items ?? []) {
        if (u.idUnidade != null) {
          this.unidades.set(u.idUnidade, u.numero != null ? `Unidade ${u.numero}` : String(u.idUnidade));
        }
      }
    });

    this.carregar();
  }

  private carregar(): void {
    this.loading = true;
    this.formError = '';
    const onOk = () => {
      this.carregarVinculos();
      if (this.canAutorizacaoVer) this.carregarAutorizacoes();
      this.loading = false;
    };
    if (this.tipo === 'PJ') {
      this.cadastro.obterPj(this.idPessoa).subscribe({
        next: r => {
          this.tipo = 'PJ';
          this.modelPj = { ...(r.dados ?? {}) };
          onOk();
        },
        error: () => this.tentarPf(onOk)
      });
    } else {
      this.tentarPf(onOk);
    }
  }

  private tentarPf(onOk: () => void): void {
    this.cadastro.obterPf(this.idPessoa).subscribe({
      next: r => {
        this.tipo = 'PF';
        this.modelPf = { ...(r.dados ?? {}) };
        onOk();
      },
      error: () => {
        this.formError = 'Pessoa não encontrada.';
        onOk();
      }
    });
  }

  private extrairErro(e: unknown): string {
    const body = (e as { error?: string | { title?: string } })?.error;
    if (typeof body === 'string') return body;
    return body?.title ?? 'Erro ao gravar';
  }

  salvar(f: NgForm): void {
    if (!this.podeEditarCadastro) return;
    if (!f.valid) {
      this.formError = 'Preencha os campos obrigatórios.';
      this.toast.showError(this.formError);
      return;
    }
    this.saving = true;
    this.formError = '';
    const done = () => {
      this.toast.showSuccess('Dados salvos com sucesso.');
      this.saving = false;
    };
    if (this.tipo === 'PJ') {
      this.cadastro.atualizarPj(this.idPessoa, this.modelPj).subscribe({
        next: () => done(),
        error: e => {
          this.formError = this.extrairErro(e);
          this.saving = false;
        }
      });
    } else {
      this.cadastro.atualizarPf(this.idPessoa, this.modelPf).subscribe({
        next: () => done(),
        error: e => {
          this.formError = this.extrairErro(e);
          this.saving = false;
        }
      });
    }
  }

  private carregarVinculos(): void {
    this.vinculoService.getPaged(1, 500).subscribe(r => {
      this.vinculos = (r.items ?? []).filter(v => v.idPessoa === this.idPessoa);
    });
  }

  private carregarAutorizacoes(): void {
    this.authService.getPaged(1, 200).subscribe(r => {
      this.autorizacoes = (r.items ?? []).filter(a =>
        a.idPessoaVisitante === this.idPessoa || a.idPessoaAutorizador === this.idPessoa
      );
    });
  }

  papelLabel(codigo?: number): string {
    if (codigo == null) return '—';
    return this.papeis.get(codigo) ?? String(codigo);
  }

  unidadeLabel(id?: number): string {
    if (id == null) return '—';
    return this.unidades.get(id) ?? String(id);
  }

  vigente(v: PessoaVinculo): boolean {
    const hoje = new Date().toISOString().slice(0, 10);
    if (v.dataFim && v.dataFim < hoje) return false;
    if (v.dataInicio && v.dataInicio > hoje) return false;
    return true;
  }

  situacaoVinculo(v: PessoaVinculo): string {
    const hoje = new Date().toISOString().slice(0, 10);
    if (v.dataInicio && v.dataInicio > hoje) return 'Futuro';
    if (v.dataFim && v.dataFim < hoje) return 'Encerrado';
    return 'Ativo';
  }

  situacaoAutorizacao(a: AutorizacaoAcessoTemporario): string {
    const now = new Date().toISOString();
    if (a.dataHoraFim && a.dataHoraFim < now) return 'Encerrada';
    if (a.dataHoraInicio && a.dataHoraInicio > now) return 'Futura';
    return 'Vigente';
  }

  editarVinculo(v: PessoaVinculo): void {
    void this.router.navigate(['/pessoavinculo', v.idVinculo]);
  }

  editarAutorizacao(a: AutorizacaoAcessoTemporario): void {
    void this.router.navigate(['/autorizacaoacessotemporario', a.idAutorizacao]);
  }

  voltar(): void { void this.router.navigate(['/pessoas']); }
}