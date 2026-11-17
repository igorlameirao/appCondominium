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
import {
  AbaPessoa,
  CHAVES_PERMISSAO_COLABORADOR,
  PessoaContextoConfig,
  ehContextoColaborador,
  pessoaContextoPorId,
  rotuloTipoColaborador,
} from './pessoa-contexto.config';
import { PapelVinculoCodigo } from './pessoa-contexto-codigos';
import { PessoaContextoApiService } from './pessoa-contexto.service';
import { DadosProfissionaisModel, PessoaColaboradorPanelComponent } from './pessoa-colaborador-panel.component';
import { PessoaConsultaService } from '../../core/services/pessoa-consulta.service';
import { FuncaoColaboradorService } from '../funcaocolaborador/funcaocolaborador.service';

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
    ConviteEmitirPanelComponent,
    PessoaColaboradorPanelComponent
  ],
  template: `
    <app-list-loading-modal [visible]="loading" />
    <div class="content-wrapper cad-wrapper" *ngIf="!loading">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="contexto.routeLista">{{ contexto.tituloLista }}</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ modoNovo ? 'Novo' : (tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física') }}</span>
          </nav>
          <h1 class="cad-titulo">{{ titulo }}</h1>
          <p class="cad-subtitulo">{{ subtitulo }}</p>
        </header>

        <section class="cad-card form-page">
          <form id="pessoaForm" novalidate (ngSubmit)="salvar(f)" #f="ngForm">
            <div class="cad-abas" role="tablist" aria-label="Seções da pessoa">
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('dados')" [class.cad-aba--ativa]="aba === 'dados'" (click)="aba='dados'">
                <app-icone nome="user" [tamanho]="16" /><span>Dados</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('contatos')" [class.cad-aba--ativa]="aba === 'contatos'" (click)="aba='contatos'">
                <app-icone nome="phone" [tamanho]="16" /><span>Contatos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('enderecos')" [class.cad-aba--ativa]="aba === 'enderecos'" (click)="aba='enderecos'">
                <app-icone nome="map-pin" [tamanho]="16" /><span>Endereços</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('vinculoContexto')" [class.cad-aba--ativa]="aba === 'vinculoContexto'" (click)="aba='vinculoContexto'">
                <app-icone nome="users" [tamanho]="16" /><span>Vínculo</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('vinculos')" [class.cad-aba--ativa]="aba === 'vinculos'" (click)="aba='vinculos'">
                <app-icone nome="users" [tamanho]="16" /><span>Vínculos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('autorizacoes') && canAutorizacaoVer" [class.cad-aba--ativa]="aba === 'autorizacoes'" (click)="aba='autorizacoes'">
                <app-icone nome="key" [tamanho]="16" /><span>Autorizações</span>
              </button>
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'dados'">
              <div class="cad-secao">
                <app-icone class="cad-secao__icone" [nome]="tipo === 'PJ' ? 'briefcase' : 'user'" [tamanho]="26" />
                <div>
                  <h2 class="cad-secao__titulo">Dados cadastrais</h2>
                  <p class="cad-secao__texto">{{ textoDados }}</p>
                </div>
              </div>
              <div class="form-scroll cad-form-scroll">
                <div class="form-group" *ngIf="modoNovo && aceitaAmbosTipos">
                  <label for="tipoPessoaNovo">Tipo de pessoa</label>
                  <select id="tipoPessoaNovo" name="tipoPessoaNovo" [(ngModel)]="tipo" (ngModelChange)="aoTrocarTipo()">
                    <option value="PF">Pessoa física</option>
                    <option value="PJ">Pessoa jurídica</option>
                  </select>
                </div>
                <app-pessoa-pf-campos *ngIf="tipo === 'PF'" [model]="modelPf" secao="dados"
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura"
                  (documentoInformado)="aoDocumento($event)" />
                <app-pessoa-pj-campos *ngIf="tipo === 'PJ'" [model]="modelPj" secao="dados"
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura" [responsaveis]="fkResponsavel"
                  (documentoInformado)="aoDocumento($event)" />
                <p class="cad-secao__texto" *ngIf="modoNovo && pessoaExistente">Pessoa já cadastrada. Os dados foram carregados e o vínculo deste contexto pode ser informado nas demais abas.</p>
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
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura" />
                <app-pessoa-pj-campos *ngIf="tipo === 'PJ'" [model]="modelPj" secao="contatos"
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura" [responsaveis]="fkResponsavel" />
              </div>
            </div>

            <div class="cad-conteudo" role="tabpanel" *ngIf="aba === 'enderecos'">
              <app-pessoa-enderecos-panel [idPessoa]="idPessoa" [podeEditar]="podeEditarEndereco" />
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'vinculoContexto'" *ngIf="exibeAba('vinculoContexto')">
              <fieldset class="tipo-colaborador-opcoes form-group" *ngIf="mostraEscolhaTipoColaborador">
                <legend>Tipo de colaborador *</legend>
                <label class="tipo-colaborador-opcoes__item">
                  <input
                    type="radio"
                    name="tipoColaborador"
                    [value]="1"
                    [(ngModel)]="tipoColaborador"
                    [disabled]="tipoColaboradorTravado || !podeGravarContexto" />
                  Funcionário
                </label>
                <label class="tipo-colaborador-opcoes__item">
                  <input
                    type="radio"
                    name="tipoColaborador"
                    [value]="2"
                    [(ngModel)]="tipoColaborador"
                    [disabled]="tipoColaboradorTravado || !podeGravarContexto" />
                  Terceirizado
                </label>
              </fieldset>
              <div class="form-grid">
                <div class="form-group" *ngIf="contexto.escopoPapel === 'unidade'">
                  <label>Unidade *</label>
                  <select name="idUnidadeCtx" [(ngModel)]="idUnidade" required>
                    <option [ngValue]="null">Selecione</option>
                    <option *ngFor="let u of unidadesOpcoes" [ngValue]="u.value">{{ u.label }}</option>
                  </select>
                </div>
                <div class="form-group" *ngIf="contexto.escopoPapel === 'pessoa'">
                  <label>Pessoa relacionada *</label>
                  <select name="idPessoaRelacionadaCtx" [(ngModel)]="idPessoaRelacionada" required>
                    <option [ngValue]="null">Selecione</option>
                    <option *ngFor="let p of fkResponsavel" [ngValue]="p.value">{{ p.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Início *</label>
                  <input type="date" name="dataInicioCtx" [(ngModel)]="dataInicio" required />
                </div>
                <div class="form-group">
                  <label>Fim</label>
                  <input type="date" name="dataFimCtx" [(ngModel)]="dataFim" />
                </div>
              </div>
              <app-pessoa-colaborador-panel *ngIf="temColaborador"
                [model]="dadosProfissionais"
                [funcoes]="funcoes"
                [historico]="historicoColaborador"
                [tipoRotulo]="rotuloTipoColaboradorAtual"
                [exibirTipoTravado]="!mostraEscolhaTipoColaborador"
                [arquivoObrigatorio]="modoNovo"
                [possuiArquivo]="possuiArquivoCtps"
                [desabilitado]="!podeGravarContexto" />
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

            <div class="actions form-actions cad-acoes" *ngIf="aba === 'dados' || aba === 'contatos' || aba === 'vinculoContexto'">
              <button type="submit" class="btn-gravar" [class.is-loading]="saving"
                [disabled]="saving || !podeSalvarAba">Salvar</button>
              <span class="cad-acoes__espaco"></span>
              <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
            </div>
            <div class="actions form-actions cad-acoes" *ngIf="aba !== 'dados' && aba !== 'contatos' && aba !== 'vinculoContexto'">
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
  contexto: PessoaContextoConfig = pessoaContextoPorId('pessoas');
  modoNovo = false;
  pessoaExistente = false;
  private ultimoDocumentoBuscado = '';
  idPessoa = 0;
  tipo: 'PF' | 'PJ' = 'PF';
  aba: AbaPessoa = 'dados';
  idUnidade: number | null = null;
  idPessoaRelacionada: number | null = null;
  dataInicio = new Date().toISOString().slice(0, 10);
  dataFim = '';
  tipoColaborador: 1 | 2 = 1;
  private codigoPapelVinculoContexto: number | null = null;
  dadosProfissionais: DadosProfissionaisModel = {};
  funcoes: ComboboxOption[] = [];
  historicoColaborador: { dataAdmissao?: string; dataDesligamento?: string; ctps?: string; funcaoDescricao?: string; ativo: boolean; possuiArquivoCtps: boolean }[] = [];
  possuiArquivoCtps = false;
  unidadesOpcoes: ComboboxOption[] = [];
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
    private toast: ToastService,
    private contextoApi: PessoaContextoApiService,
    private consulta: PessoaConsultaService,
    private funcoesApi: FuncaoColaboradorService
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
  get temColaborador(): boolean { return this.contexto.vinculoContexto.tiposDado.includes('colaborador'); }
  get mostraEscolhaTipoColaborador(): boolean { return ehContextoColaborador(this.contexto.id); }
  get tipoColaboradorTravado(): boolean {
    return !this.modoNovo && this.codigoPapelVinculoContexto != null;
  }
  get rotuloTipoColaboradorAtual(): string {
    const codigo = this.codigoPapelVinculoContexto
      ?? (this.tipoColaborador === 2 ? PapelVinculoCodigo.terceirizado : PapelVinculoCodigo.funcionario);
    return rotuloTipoColaborador(codigo, null);
  }
  get aceitaAmbosTipos(): boolean { return this.contexto.tipoPessoa === 'PF_OU_PJ'; }
  get documentoBloqueado(): boolean { return !this.modoNovo; }
  get textoDados(): string {
    if (!this.modoNovo) return 'Identificação e dados principais da pessoa';
    return this.tipo === 'PJ'
      ? 'Informe o CNPJ para carregar a pessoa jurídica, se ela já existir'
      : 'Informe o CPF para carregar a pessoa física, se ela já existir';
  }
  get dadosSomenteLeitura(): boolean {
    if (this.modoNovo && this.pessoaExistente) return true;
    if (this.modoNovo && !this.pessoaExistente) return false;
    return !this.podeEditarCadastro;
  }
  get podeGravarContexto(): boolean {
    const acao = this.modoNovo ? 'Incluir' : 'Alterar';
    if (ehContextoColaborador(this.contexto.id)
      && this.permissions.canAny([...CHAVES_PERMISSAO_COLABORADOR], acao)) {
      return true;
    }
    return this.permissions.can(this.contexto.permissionKey, acao)
      || this.permissions.can('PESSOAVINCULO', acao)
      || this.podeEditarCadastro;
  }
  get podeSalvarAba(): boolean {
    if (this.modoNovo) return this.podeGravarContexto;
    if (this.aba === 'vinculoContexto') return this.podeGravarContexto;
    return this.podeEditarCadastro;
  }

  exibeAba(aba: AbaPessoa): boolean {
    return this.contexto.abasDetalhe.includes(aba);
  }

  ngOnInit(): void {
    this.contexto = pessoaContextoPorId(this.route.snapshot.data['pessoaContexto'] as string | undefined);
    this.modoNovo = this.route.snapshot.data['modo'] === 'novo';
    if (ehContextoColaborador(this.contexto.id)) {
      this.tipoColaborador = this.contexto.inclusao?.tipoColaborador ?? 1;
    }
    if (this.modoNovo && this.contexto.tipoPessoa === 'PF') this.tipo = 'PF';
    if (!this.exibeAba(this.aba)) this.aba = this.contexto.abasDetalhe[0] ?? 'dados';
    this.idPessoa = Number(this.route.snapshot.paramMap.get('idPessoa') || 0);
    const tipoQ = this.route.snapshot.queryParamMap.get('tipo');
    if (tipoQ === 'PJ') this.tipo = 'PJ';

    const state = history.state as {
      pessoaIntegrada?: { idPessoa?: number; dados?: PessoaFisicaIntegradaRequest | PessoaJuridicaIntegradaRequest };
    };
    if (state?.pessoaIntegrada?.idPessoa === this.idPessoa && state.pessoaIntegrada.dados) {
      if (tipoQ === 'PJ' || this.eDadosPj(state.pessoaIntegrada.dados)) {
        this.tipo = 'PJ';
        this.modelPj = { ...state.pessoaIntegrada.dados } as PessoaJuridicaIntegradaRequest;
      } else {
        this.tipo = 'PF';
        this.modelPf = { ...state.pessoaIntegrada.dados } as PessoaFisicaIntegradaRequest;
      }
    }

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
      this.unidadesOpcoes = [];
      for (const u of r.items ?? []) {
        if (u.idUnidade != null) {
          const label = u.numero != null ? `Unidade ${u.numero}` : String(u.idUnidade);
          this.unidades.set(u.idUnidade, label);
          this.unidadesOpcoes.push({ value: u.idUnidade, label });
        }
      }
    });

    if (this.temColaborador) {
      this.funcoesApi.getPaged(1, 200).subscribe(r => {
        this.funcoes = (r.items ?? [])
          .filter(x => x.idFuncaoColaborador != null)
          .map(x => ({ value: x.idFuncaoColaborador as number, label: x.descricao ?? String(x.idFuncaoColaborador) }));
      });
    }

    if (this.modoNovo) {
      this.loading = false;
      return;
    }
    this.carregar();
  }

  aoTrocarTipo(): void {
    this.pessoaExistente = false;
    this.idPessoa = 0;
    this.ultimoDocumentoBuscado = '';
    this.modelPf = {};
    this.modelPj = {};
    this.limparProfissionalCarregado();
  }

  aoDocumento(valor: string): void {
    if (!this.modoNovo) return;
    const doc = (valor || '').replace(/\D/g, '');
    const tamanho = this.tipo === 'PJ' ? 14 : 11;
    if (doc.length !== tamanho) {
      if (this.pessoaExistente) this.limparPessoaCarregada(doc);
      return;
    }
    if (doc === this.ultimoDocumentoBuscado) return;
    this.ultimoDocumentoBuscado = doc;
    this.consulta.porDocumento(doc, 'cadastro').subscribe({
      next: r => {
        if (r.ehPessoaJuridica && this.tipo !== 'PJ') {
          this.toast.showError('Este documento pertence a uma pessoa jurídica.');
          this.limparPessoaCarregada(doc);
          return;
        }
        if (!r.ehPessoaJuridica && this.tipo !== 'PF') {
          this.toast.showError('Este documento pertence a uma pessoa física.');
          this.limparPessoaCarregada(doc);
          return;
        }
        this.pessoaExistente = true;
        this.idPessoa = r.idPessoa;
        if (r.ehPessoaJuridica) {
          this.modelPj = {
            cpfcnpj: r.cpfcnpj, nome: r.nome, telefone: r.telefone,
            nomeFantasia: r.nomeFantasia, dataFundacao: r.dataFundacao, idResponsavel: r.idResponsavel
          };
        } else {
          this.modelPf = {
            cpfcnpj: r.cpfcnpj, nome: r.nome, telefone: r.telefone,
            email: r.email, dataNascimento: r.dataNascimento
          };
        }
        if (this.temColaborador) this.carregarColaborador();
      },
      error: () => this.limparPessoaCarregada(doc)
    });
  }

  private limparPessoaCarregada(doc: string): void {
    this.pessoaExistente = false;
    this.idPessoa = 0;
    this.limparProfissionalCarregado();
    if (this.tipo === 'PJ') this.modelPj = { cpfcnpj: doc };
    else this.modelPf = { cpfcnpj: doc };
  }

  private limparProfissionalCarregado(): void {
    this.dadosProfissionais = {};
    this.historicoColaborador = [];
    this.possuiArquivoCtps = false;
  }

  private carregar(): void {
    this.loading = true;
    this.formError = '';
    const onOk = () => {
      this.carregarVinculos();
      if (this.canAutorizacaoVer && this.exibeAba('autorizacoes')) this.carregarAutorizacoes();
      if (this.temColaborador) this.carregarColaborador();
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
    if (this.modoNovo || (this.contexto.id !== 'pessoas' && this.aba === 'vinculoContexto')) {
      this.gravarContexto(f);
      return;
    }
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

  private gravarContexto(f: NgForm): void {
    if (!this.podeGravarContexto) return;
    if (!f.valid) {
      this.formError = 'Preencha os campos obrigatórios.';
      this.toast.showError(this.formError);
      return;
    }
    const base = this.tipo === 'PJ' ? this.modelPj : this.modelPf;
    this.saving = true;
    this.formError = '';
    const body = {
      contextoId: this.contexto.id,
      cpfcnpj: base.cpfcnpj,
      nome: base.nome,
      telefone: base.telefone,
      email: this.tipo === 'PF' ? this.modelPf.email : undefined,
      dataNascimento: this.tipo === 'PF' ? this.modelPf.dataNascimento : undefined,
      nomeFantasia: this.tipo === 'PJ' ? this.modelPj.nomeFantasia : undefined,
      dataFundacao: this.tipo === 'PJ' ? this.modelPj.dataFundacao : undefined,
      inscricaoEstadual: this.tipo === 'PJ' ? this.modelPj.inscricaoEstadual : undefined,
      inscricaoMunicipal: this.tipo === 'PJ' ? this.modelPj.inscricaoMunicipal : undefined,
      idUnidade: this.idUnidade,
      idPessoaRelacionada: this.idPessoaRelacionada,
      dataInicio: this.dataInicio,
      dataFim: this.dataFim || undefined,
      dataAdmissao: this.dadosProfissionais.dataAdmissao,
      dataDesligamento: this.dadosProfissionais.dataDesligamento || undefined,
      ctps: this.dadosProfissionais.ctps,
      idFuncaoColaborador: this.dadosProfissionais.idFuncaoColaborador,
      ctpsArquivoBase64: this.dadosProfissionais.ctpsArquivoBase64,
      ...(ehContextoColaborador(this.contexto.id)
        ? {
            tipoColaborador: this.tipoColaborador,
            codigoPapelVinculo: this.tipoColaborador === 2
              ? PapelVinculoCodigo.terceirizado
              : PapelVinculoCodigo.funcionario,
          }
        : {}),
    };
    const req = this.modoNovo
      ? this.contextoApi.incluir(body)
      : this.contextoApi.alterar(this.idPessoa, body);
    req.subscribe({
      next: r => {
        this.saving = false;
        this.toast.showSuccess('Cadastro salvo com sucesso.');
        void this.router.navigate([this.contexto.routeLista, r.idPessoa], { queryParams: { tipo: r.tipo === 'PJ' ? 'PJ' : 'PF' } });
      },
      error: e => {
        this.formError = this.extrairErro(e);
        this.toast.showError(this.formError);
        this.saving = false;
      }
    });
  }

  private carregarColaborador(): void {
    if (!this.idPessoa) return;
    this.contextoApi.colaborador(this.idPessoa, this.contexto.id).subscribe(r => {
      this.historicoColaborador = r.historico ?? [];
      if (r.ativo) {
        this.dadosProfissionais = {
          dataAdmissao: r.ativo.dataAdmissao,
          dataDesligamento: r.ativo.dataDesligamento,
          ctps: r.ativo.ctps,
          idFuncaoColaborador: r.ativo.idFuncaoColaborador
        };
        this.possuiArquivoCtps = !!r.ativo.possuiArquivoCtps;
        if (ehContextoColaborador(this.contexto.id) && r.ativo.tipoColaborador === 2) {
          this.tipoColaborador = 2;
        }
      }
    });
  }

  private carregarVinculos(): void {
    this.vinculoService.getPaged(1, 500).subscribe(r => {
      this.vinculos = (r.items ?? []).filter(v => v.idPessoa === this.idPessoa);
      const codigos = this.contexto.codigosPapel;
      const doContexto = codigos.length
        ? this.vinculos.filter(v => v.codigoPapelVinculo != null && codigos.includes(v.codigoPapelVinculo))
        : [];
      const aberto = doContexto.find(v => this.vigente(v)) ?? doContexto[0];
      if (aberto) {
        this.idUnidade = aberto.idUnidade ?? null;
        this.idPessoaRelacionada = aberto.idPessoaRelacionada ?? null;
        this.dataInicio = aberto.dataInicio ?? this.dataInicio;
        this.dataFim = aberto.dataFim ?? '';
        if (ehContextoColaborador(this.contexto.id) && aberto.codigoPapelVinculo != null) {
          this.codigoPapelVinculoContexto = aberto.codigoPapelVinculo;
          this.tipoColaborador = aberto.codigoPapelVinculo === PapelVinculoCodigo.terceirizado ? 2 : 1;
        }
      }
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

  voltar(): void { void this.router.navigateByUrl(this.contexto.routeLista); }

  /** Distingue payload PJ (sem e-mail/senha de PF) ao hidratar via navigation state. */
  private eDadosPj(dados: PessoaFisicaIntegradaRequest | PessoaJuridicaIntegradaRequest): dados is PessoaJuridicaIntegradaRequest {
    return 'nomeFantasia' in dados || 'inscricaoEstadual' in dados || 'idResponsavel' in dados;
  }
}