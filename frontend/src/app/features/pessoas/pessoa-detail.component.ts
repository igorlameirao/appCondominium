import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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
import { Unidade } from '../unidade/unidade.model';
import { BlocoService } from '../bloco/bloco.service';
import {
  MSG_ENDERECO_NAO_INCLUIDO,
  PessoaEnderecosPanelComponent
} from './pessoa-enderecos-panel.component';
import {
  PessoaEnderecoService,
  PessoaEnderecoUpsert
} from '../../core/services/pessoa-endereco.service';
import { concatMap, from, last, map, of } from 'rxjs';
import { PessoaPfCamposComponent } from './pessoa-pf-campos.component';
import { PessoaPjCamposComponent } from './pessoa-pj-campos.component';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { CadAbaIndicadorComponent } from '../../shared/cad-aba-indicador/cad-aba-indicador.component';
import { ConviteEmitirPanelComponent } from '../convite/convite-emitir-panel.component';
import {
  AbaPessoa,
  CHAVES_PERMISSAO_COLABORADOR,
  CHAVES_PERMISSAO_GESTOR,
  CHAVES_PERMISSAO_OCUPANTE,
  PessoaContextoConfig,
  ehContextoColaborador,
  ehContextoGestor,
  ehContextoOcupante,
  pessoaContextoPorId,
  rotuloTipoColaborador,
} from './pessoa-contexto.config';
import { PapelVinculoCodigo } from './pessoa-contexto-codigos';
import { PessoaContextoApiService } from './pessoa-contexto.service';
import { DadosProfissionaisModel, PessoaColaboradorPanelComponent } from './pessoa-colaborador-panel.component';
import { PessoaFotoPanelComponent } from './pessoa-foto-panel.component';
import { PessoaFotoService } from './pessoa-foto.service';
import { PessoaConsultaService } from '../../core/services/pessoa-consulta.service';
import { ConsultaService, ResultadoConsultaCnpj } from '../../core/services/consulta.service';
import { FuncaoColaboradorService } from '../funcaocolaborador/funcaocolaborador.service';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import {
  inferirTipoPessoaPorDocumento,
  mascaraCnpj,
  mascaraCpf,
  mascaraDocumentoUnificado,
  normalizarDocumento,
  somenteDigitos,
  validarCnpj,
  validarCpf,
} from '../../core/utils/documento-validator';
import { validarArquivoFotoPerfil } from '../../shared/foto-perfil/foto-perfil.util';

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
    PessoaColaboradorPanelComponent,
    PessoaFotoPanelComponent,
    ComboboxCustomizadaComponent,
    CadAbaIndicadorComponent,
    DocumentoInputComponent,
    CampoDataComponent,
  ],
  template: `
    <app-list-loading-modal [visible]="loading" />
    <app-list-loading-modal [visible]="consultandoCnpj" message="Aguarde, consultando o CNPJ..." />
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
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('dados')" />
                <app-icone nome="user" [tamanho]="16" /><span>Dados Gerais</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('foto')" [class.cad-aba--ativa]="aba === 'foto'" (click)="aba='foto'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('foto')" />
                <app-icone nome="camera" [tamanho]="16" /><span>Foto</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('contatos')" [class.cad-aba--ativa]="aba === 'contatos'" (click)="aba='contatos'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('contatos')" />
                <app-icone nome="phone" [tamanho]="16" /><span>Contatos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('enderecos')" [class.cad-aba--ativa]="aba === 'enderecos'" (click)="aba='enderecos'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('enderecos')" />
                <app-icone nome="map-pin" [tamanho]="16" /><span>Endereços</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('vinculoContexto')" [class.cad-aba--ativa]="aba === 'vinculoContexto'" (click)="aba='vinculoContexto'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('vinculoContexto')" />
                <app-icone nome="users" [tamanho]="16" /><span>Vínculo</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('vinculos')" [class.cad-aba--ativa]="aba === 'vinculos'" (click)="aba='vinculos'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('vinculos')" />
                <app-icone nome="users" [tamanho]="16" /><span>Vínculos</span>
              </button>
              <button type="button" role="tab" class="cad-aba" *ngIf="exibeAba('autorizacoes') && canAutorizacaoVer" [class.cad-aba--ativa]="aba === 'autorizacoes'" (click)="aba='autorizacoes'">
                <app-cad-aba-indicador [pendente]="abaIndicadorPendente('autorizacoes')" />
                <app-icone nome="key" [tamanho]="16" /><span>Autorizações</span>
              </button>
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'dados'">
              <div class="cad-secao">
                <app-icone class="cad-secao__icone" [nome]="tipo === 'PJ' ? 'briefcase' : 'user'" [tamanho]="26" />
                <div>
                  <h2 class="cad-secao__titulo">Dados Gerais</h2>
                  <p class="cad-secao__texto">{{ textoDados }}</p>
                </div>
              </div>
              <div class="form-scroll cad-form-scroll">
                <div class="form-grid pessoa-pf-dados pessoa-dados-gerais"
                  [class.pessoa-dados-gerais--pf]="tipo === 'PF'">
                  <div class="form-group pessoa-pf-dados__doc">
                    <label for="docDadosGerais">{{ rotuloDocumentoDadosGerais }} *</label>
                    <app-documento-input
                      id="docDadosGerais"
                      [ngModel]="valorDocumentoDadosGerais"
                      (ngModelChange)="aoMudarDocumentoDadosGerais($event)"
                      name="docDadosGerais"
                      [tipo]="tipoInputDocumentoDadosGerais"
                      [required]="true"
                      [disabled]="documentoBloqueado"
                      (blurCommit)="aoBlurDocumentoDadosGerais($event)" />
                  </div>
                  <div class="form-group pessoa-pf-dados__nome">
                    <label for="nomeDadosGerais">{{ rotuloNomeDadosGerais }} *</label>
                    <input
                      id="nomeDadosGerais"
                      type="text"
                      [ngModel]="valorNomeDadosGerais"
                      (ngModelChange)="aoMudarNomeDadosGerais($event)"
                      name="nomeDadosGerais"
                      required
                      maxlength="255"
                      [readonly]="dadosSomenteLeitura" />
                  </div>
                  <div class="form-group pessoa-pf-dados__nasc pessoa-dados-gerais__nasc" *ngIf="tipo === 'PF'">
                    <label for="nascDadosGerais">Data de nascimento *</label>
                    <app-campo-data
                      id="nascDadosGerais"
                      [(ngModel)]="modelPf.dataNascimento"
                      name="dataNascimentoDadosGerais"
                      [feedbackVisual]="true"
                      [nascimento]="true"
                      [required]="true"
                      [disabled]="dadosSomenteLeitura" />
                  </div>
                </div>
                <app-pessoa-pf-campos *ngIf="tipo === 'PF'" [model]="modelPf" secao="dados"
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura"
                  [ocultarDocumento]="true" [ocultarNome]="true" [ocultarDataNascimento]="true" />
                <app-pessoa-pj-campos *ngIf="tipo === 'PJ'" [model]="modelPj" secao="dados"
                  [documentoBloqueado]="documentoBloqueado" [desabilitado]="dadosSomenteLeitura" [responsaveis]="fkResponsavel"
                  [ocultarDocumento]="true" [ocultarNome]="true" />
                <p class="cad-secao__texto" *ngIf="modoNovo && pessoaExistente">Pessoa já cadastrada. Os dados foram carregados e o vínculo deste contexto pode ser informado nas demais abas.</p>
              </div>
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'foto'" *ngIf="exibeAba('foto')">
              <app-pessoa-foto-panel
                [fotoUrl]="fotoExibidaUrl"
                [nome]="valorNomeDadosGerais"
                [podeEditar]="podeGerenciarFoto"
                [temFoto]="fotoTemNoServidor"
                [temEmbedding]="fotoTemEmbedding"
                [fotoAlteradaPendente]="fotoAlteradaPendente"
                (fotoSelecionada)="registrarFotoPendente($event)"
                (fotoRemovida)="marcarRemocaoFotoPendente()" />
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

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'enderecos'" *ngIf="exibeAba('enderecos')">
              <div class="cad-secao">
                <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
                <div>
                  <h2 class="cad-secao__titulo">Endereços</h2>
                  <p class="cad-secao__texto">Adicione e gerencie os endereços desta pessoa sem sair da tela.</p>
                </div>
              </div>
              <app-pessoa-enderecos-panel
                [idPessoa]="idPessoaParaEndereco"
                [modoPendente]="enderecosEmModoPendente"
                [pendentesIniciais]="enderecosPendentes"
                [sugestaoFormulario]="enderecoSugestaoCnpj"
                [podeEditar]="podeEditarEndereco"
                (pendentesChange)="aoPendentesEnderecoChange($event)"
                (sugestaoDescartada)="enderecoSugestaoCnpj = null" />
            </div>

            <div class="cad-conteudo" role="tabpanel" [hidden]="aba !== 'vinculoContexto'" *ngIf="exibeAba('vinculoContexto')">
              <ng-container *ngIf="mostraEscolhaTipoGestor">
                <div class="cad-secao">
                  <app-icone class="cad-secao__icone" nome="shield" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Vínculo de gestão</h2>
                    <p class="cad-secao__texto">Defina o papel desta pessoa na gestão do condomínio.</p>
                  </div>
                </div>
                <div class="pessoa-vinculo-ocupante">
                  <fieldset class="pessoa-vinculo-ocupante__tipos">
                    <legend class="pessoa-vinculo-ocupante__rotulo" id="pessoaVinculoGestorLegenda">Tipo de gestor *</legend>
                    <div
                      class="pessoa-vinculo-ocupante__cards pessoa-vinculo-ocupante__cards--gestor"
                      role="radiogroup"
                      aria-labelledby="pessoaVinculoGestorLegenda">
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoGestor === papelSindico">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoGestor"
                          [value]="papelSindico"
                          [(ngModel)]="tipoGestor"
                          [disabled]="tipoGestorTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="shield" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Síndico</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Representante legal do condomínio</span>
                          </span>
                        </span>
                      </label>
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoGestor === papelSubsindico">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoGestor"
                          [value]="papelSubsindico"
                          [(ngModel)]="tipoGestor"
                          [disabled]="tipoGestorTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="user-plus" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Subsíndico</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Auxilia o síndico na gestão</span>
                          </span>
                        </span>
                      </label>
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoGestor === papelConselheiro">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoGestor"
                          [value]="papelConselheiro"
                          [(ngModel)]="tipoGestor"
                          [disabled]="tipoGestorTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="book-open" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Conselheiro</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Integra o conselho do condomínio</span>
                          </span>
                        </span>
                      </label>
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoGestor === papelAdministradora">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoGestor"
                          [value]="papelAdministradora"
                          [(ngModel)]="tipoGestor"
                          [disabled]="tipoGestorTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="building" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Administração</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Presta serviços de administração</span>
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div class="pessoa-vinculo-ctx__linha pessoa-vinculo-ocupante__campos pessoa-vinculo-ocupante__campos--datas-duplas">
                    <div class="form-group pessoa-vinculo-ocupante__campo pessoa-vinculo-ctx__data">
                      <label for="dataInicioGestor">Início do vínculo *</label>
                      <div class="pessoa-vinculo-ocupante__campo-controle">
                        <app-campo-data
                          id="dataInicioGestor"
                          [(ngModel)]="dataInicio"
                          name="dataInicioCtx"
                          [feedbackVisual]="true"
                          [required]="true"
                          [disabled]="!podeGravarContexto" />
                      </div>
                      <span class="pessoa-vinculo-ocupante__campo-rodape" aria-hidden="true"></span>
                    </div>
                    <div class="form-group pessoa-vinculo-ocupante__campo pessoa-vinculo-ctx__data">
                      <label for="dataFimGestor">Fim do vínculo</label>
                      <div class="pessoa-vinculo-ocupante__campo-controle">
                        <app-campo-data
                          id="dataFimGestor"
                          [(ngModel)]="dataFim"
                          name="dataFimCtx"
                          [feedbackVisual]="true"
                          [disabled]="!podeGravarContexto" />
                      </div>
                      <span class="pessoa-vinculo-ocupante__campo-rodape">Opcional</span>
                    </div>
                  </div>
                </div>
              </ng-container>

              <fieldset class="tipo-colaborador-opcoes tipo-colaborador-opcoes--compacto form-group" *ngIf="mostraEscolhaTipoColaborador">
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

              <ng-container *ngIf="mostraEscolhaTipoOcupante">
                <div class="cad-secao">
                  <app-icone class="cad-secao__icone" nome="users" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Vínculo com a unidade</h2>
                    <p class="cad-secao__texto">Defina a relação desta pessoa com a unidade.</p>
                  </div>
                </div>
                <div class="pessoa-vinculo-ocupante">
                  <fieldset class="pessoa-vinculo-ocupante__tipos">
                    <legend class="pessoa-vinculo-ocupante__rotulo" id="pessoaVinculoTipoLegenda">Tipo de vínculo *</legend>
                    <div
                      class="pessoa-vinculo-ocupante__cards"
                      role="radiogroup"
                      aria-labelledby="pessoaVinculoTipoLegenda">
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoOcupacao === papelProprietario">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoOcupacao"
                          [value]="papelProprietario"
                          [(ngModel)]="tipoOcupacao"
                          (ngModelChange)="aoMudarTipoOcupacao()"
                          [disabled]="tipoOcupacaoTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="home" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Proprietário</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">É dono da unidade</span>
                          </span>
                        </span>
                      </label>
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoOcupacao === papelLocatario">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoOcupacao"
                          [value]="papelLocatario"
                          [(ngModel)]="tipoOcupacao"
                          (ngModelChange)="aoMudarTipoOcupacao()"
                          [disabled]="tipoOcupacaoTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="key" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Locatário</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Aluga a unidade</span>
                          </span>
                        </span>
                      </label>
                      <label
                        class="pessoa-vinculo-ocupante__card"
                        [class.pessoa-vinculo-ocupante__card--ativa]="tipoOcupacao === papelDependente">
                        <input
                          type="radio"
                          class="pessoa-vinculo-ocupante__card-radio"
                          name="tipoOcupacao"
                          [value]="papelDependente"
                          [(ngModel)]="tipoOcupacao"
                          (ngModelChange)="aoMudarTipoOcupacao()"
                          [disabled]="tipoOcupacaoTravado || !podeGravarContexto" />
                        <span class="pessoa-vinculo-ocupante__card-linha">
                          <app-icone class="pessoa-vinculo-ocupante__card-icone" nome="users" [tamanho]="18" />
                          <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                          <span class="pessoa-vinculo-ocupante__card-texto">
                            <span class="pessoa-vinculo-ocupante__card-titulo">Dependente</span>
                            <span class="pessoa-vinculo-ocupante__card-apoio">Vinculado a um responsável</span>
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div class="pessoa-vinculo-ocupante__morador">
                    <div class="pessoa-vinculo-ocupante__morador-corpo">
                      <app-icone class="pessoa-vinculo-ocupante__morador-icone" nome="home" [tamanho]="20" />
                      <span class="pessoa-vinculo-ocupante__divisor" aria-hidden="true"></span>
                      <div class="pessoa-vinculo-ocupante__morador-texto">
                        <p class="pessoa-vinculo-ocupante__morador-titulo" id="pessoaVinculoMoradorLegenda">Reside nesta unidade</p>
                        <p class="pessoa-vinculo-ocupante__morador-apoio">Informe se esta pessoa também é moradora.</p>
                      </div>
                    </div>
                    <label class="cad-switch" [attr.aria-labelledby]="'pessoaVinculoMoradorLegenda'">
                      <input
                        type="checkbox"
                        name="ehMorador"
                        role="switch"
                        [(ngModel)]="ehMorador"
                        [disabled]="moradorCheckboxDesabilitado || !podeGravarContexto" />
                      <span class="cad-switch-trilha" aria-hidden="true"></span>
                    </label>
                  </div>

                  <div class="pessoa-vinculo-ctx__linha pessoa-vinculo-ocupante__campos">
                    <div class="form-group pessoa-vinculo-ocupante__campo pessoa-vinculo-ctx__unidade" *ngIf="contexto.escopoPapel === 'unidade'">
                      <label for="idUnidadeOcupante">Unidade *</label>
                      <div class="pessoa-vinculo-ocupante__campo-controle">
                        <app-combobox-customizada
                          inputId="idUnidadeOcupante"
                          name="idUnidadeCtx"
                          [options]="unidadesOpcoes"
                          [(value)]="idUnidade"
                          [required]="true"
                          [disabled]="!podeGravarContexto" />
                      </div>
                      <span class="pessoa-vinculo-ocupante__campo-rodape" aria-hidden="true"></span>
                    </div>
                    <div class="form-group pessoa-vinculo-ocupante__campo pessoa-vinculo-ctx__data">
                      <label for="dataInicioOcupante">Início do vínculo *</label>
                      <div class="pessoa-vinculo-ocupante__campo-controle">
                        <app-campo-data
                          id="dataInicioOcupante"
                          [(ngModel)]="dataInicio"
                          name="dataInicioCtx"
                          [feedbackVisual]="true"
                          [required]="true"
                          [disabled]="!podeGravarContexto" />
                      </div>
                      <span class="pessoa-vinculo-ocupante__campo-rodape" aria-hidden="true"></span>
                    </div>
                    <div class="form-group pessoa-vinculo-ocupante__campo pessoa-vinculo-ctx__data">
                      <label for="dataFimOcupante">Fim do vínculo</label>
                      <div class="pessoa-vinculo-ocupante__campo-controle">
                        <app-campo-data
                          id="dataFimOcupante"
                          [(ngModel)]="dataFim"
                          name="dataFimCtx"
                          [feedbackVisual]="true"
                          [disabled]="!podeGravarContexto" />
                      </div>
                      <span class="pessoa-vinculo-ocupante__campo-rodape">Opcional</span>
                    </div>
                  </div>
                </div>
              </ng-container>

              <ng-container *ngIf="!mostraEscolhaTipoGestor && !mostraEscolhaTipoOcupante">
                <div class="pessoa-vinculo-ctx">
                  <div class="pessoa-vinculo-ctx__linha">
                    <div class="form-group pessoa-vinculo-ctx__unidade" *ngIf="contexto.escopoPapel === 'unidade'">
                      <label>Unidade *</label>
                      <app-combobox-customizada
                        name="idUnidadeCtx"
                        [options]="unidadesOpcoes"
                        [(value)]="idUnidade"
                        [required]="true"
                        [disabled]="!podeGravarContexto" />
                    </div>
                    <div class="form-group pessoa-vinculo-ctx__relacionada" *ngIf="contexto.escopoPapel === 'pessoa'">
                      <label>Pessoa relacionada *</label>
                      <app-combobox-customizada
                        name="idPessoaRelacionadaCtx"
                        [options]="fkResponsavel"
                        [(value)]="idPessoaRelacionada"
                        [required]="true"
                        [disabled]="!podeGravarContexto" />
                    </div>
                    <div class="form-group pessoa-vinculo-ctx__data">
                      <label>Início *</label>
                      <input type="date" name="dataInicioCtx" [(ngModel)]="dataInicio" required />
                    </div>
                    <div class="form-group pessoa-vinculo-ctx__data">
                      <label>Fim</label>
                      <input type="date" name="dataFimCtx" [(ngModel)]="dataFim" />
                    </div>
                  </div>
                </div>
              </ng-container>

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

            <div class="actions form-actions cad-acoes" *ngIf="aba === 'dados' || aba === 'contatos' || aba === 'vinculoContexto' || aba === 'foto'">
              <ng-container *ngIf="aba === 'vinculoContexto' && mostraEscolhaTipoOcupante; else cadAcoesFormPadrao">
                <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
                <span class="cad-acoes__espaco"></span>
                <button type="submit" class="btn-gravar" [class.is-loading]="saving"
                  [disabled]="saving || !podeSalvarAba">Salvar</button>
              </ng-container>
              <ng-template #cadAcoesFormPadrao>
                <button type="submit" class="btn-gravar" [class.is-loading]="saving"
                  [disabled]="saving || !podeSalvarAba">Salvar</button>
                <span class="cad-acoes__espaco"></span>
                <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
              </ng-template>
            </div>
            <div class="actions form-actions cad-acoes" *ngIf="aba !== 'dados' && aba !== 'contatos' && aba !== 'vinculoContexto' && aba !== 'foto'">
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
  private ultimoCnpjConsultadoExterno = '';
  consultandoCnpj = false;
  idPessoa = 0;
  tipo: 'PF' | 'PJ' = 'PF';
  documentoUnificado = '';
  aba: AbaPessoa = 'dados';
  idUnidade: number | null = null;
  idPessoaRelacionada: number | null = null;
  dataInicio = new Date().toISOString().slice(0, 10);
  dataFim = '';
  tipoColaborador: 1 | 2 = 1;
  tipoOcupacao: number = PapelVinculoCodigo.proprietario;
  tipoGestor: number = PapelVinculoCodigo.sindico;
  ehMorador = false;
  private codigoPapelVinculoContexto: number | null = null;
  readonly papelProprietario = PapelVinculoCodigo.proprietario;
  readonly papelLocatario = PapelVinculoCodigo.locatario;
  readonly papelDependente = PapelVinculoCodigo.dependenteUnidade;
  readonly papelSindico = PapelVinculoCodigo.sindico;
  readonly papelSubsindico = PapelVinculoCodigo.subsindico;
  readonly papelConselheiro = PapelVinculoCodigo.conselheiro;
  readonly papelAdministradora = PapelVinculoCodigo.administradora;
  dadosProfissionais: DadosProfissionaisModel = {};
  funcoes: ComboboxOption[] = [];
  historicoColaborador: { dataAdmissao?: string; dataDesligamento?: string; ctps?: string; funcaoDescricao?: string; ativo: boolean; possuiArquivoCtps: boolean }[] = [];
  possuiArquivoCtps = false;
  private fotoPendenteBase64 = '';
  private fotoPendenteContentType = '';
  private fotoPendentePreviewUrl: string | null = null;
  private fotoMarcarRemocao = false;
  private fotoAlteracaoPendente = false;
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
  private blocosPorId = new Map<number, string>();
  private itensUnidadeCatalogo: Unidade[] = [];
  enderecosPendentes: PessoaEnderecoUpsert[] = [];
  /** Sugestão de endereço vinda da consulta de CNPJ (só preenche o formulário). */
  enderecoSugestaoCnpj: PessoaEnderecoUpsert | null = null;

  @ViewChild(PessoaEnderecosPanelComponent) private painelEnderecos?: PessoaEnderecosPanelComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cadastro: PessoaCadastroIntegradoService,
    private vinculoService: PessoaVinculoService,
    private papelService: PapelVinculoService,
    private authService: AutorizacaoAcessoTemporarioService,
    private unidadeService: UnidadeService,
    private blocoService: BlocoService,
    private permissions: PermissionService,
    private pfService: PessoafisicaService,
    private toast: ToastService,
    private contextoApi: PessoaContextoApiService,
    private consulta: PessoaConsultaService,
    private consultaExterna: ConsultaService,
    private funcoesApi: FuncaoColaboradorService,
    private pessoaFoto: PessoaFotoService,
    private enderecoSvc: PessoaEnderecoService,
    private cdr: ChangeDetectorRef
  ) {}

  get titulo(): string {
    const nome = this.valorNomeDadosGerais?.trim();
    return nome || '#Nome ou Razão Social';
  }

  get subtitulo(): string {
    const tipoLabel = this.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física';
    const doc = this.valorDocumentoDadosGerais?.trim();
    if (!doc) return tipoLabel;
    return `${this.mascaraDocumentoCabecalho(doc)} · ${tipoLabel}`;
  }

  get canVinculoIncluir(): boolean { return this.permissions.can('PESSOAVINCULO', 'Incluir'); }
  get canAutorizacaoVer(): boolean { return this.permissions.can('AUTORIZACAOACESSOTEMPORARIO', 'Visualizar'); }
  get podeEditarCadastro(): boolean {
    return this.tipo === 'PJ'
      ? this.permissions.can('PESSOAJURIDICA', 'Alterar')
      : this.permissions.can('PESSOAFISICA', 'Alterar');
  }
  get podeGerenciarFoto(): boolean {
    if (this.tipo !== 'PF') return false;
    if (this.modoNovo) return this.podeGravarContexto;
    return this.podeEditarCadastro
      || this.podeGravarContexto
      || this.permissions.can(this.contexto.permissionKey, 'Alterar');
  }
  get fotoExibidaUrl(): string | null {
    if (this.fotoAlteracaoPendente) {
      if (this.fotoMarcarRemocao) return null;
      return this.fotoPendentePreviewUrl;
    }
    return this.pessoaFoto.fotoUrl();
  }
  get fotoAlteradaPendente(): boolean {
    return this.fotoAlteracaoPendente;
  }
  get fotoTemNoServidor(): boolean {
    if (this.fotoAlteracaoPendente) {
      return !this.fotoMarcarRemocao && (!!this.fotoPendentePreviewUrl || !!this.fotoPendenteBase64);
    }
    return this.pessoaFoto.status()?.temFoto ?? false;
  }
  get fotoTemEmbedding(): boolean {
    if (this.fotoAlteracaoPendente) return false;
    return this.pessoaFoto.status()?.temEmbedding ?? false;
  }
  get podeEditarEndereco(): boolean {
    return this.podeGravarContexto
      || this.podeEditarCadastro
      || this.permissions.can('FORNECEDOR', 'Alterar');
  }
  get enderecosEmModoPendente(): boolean {
    return this.modoNovo && this.idPessoa <= 0;
  }
  get idPessoaParaEndereco(): number | null {
    return this.idPessoa > 0 ? this.idPessoa : null;
  }
  get temColaborador(): boolean { return this.contexto.vinculoContexto.tiposDado.includes('colaborador'); }
  get mostraEscolhaTipoColaborador(): boolean { return ehContextoColaborador(this.contexto.id); }
  get mostraEscolhaTipoGestor(): boolean { return ehContextoGestor(this.contexto.id); }
  get mostraEscolhaTipoOcupante(): boolean { return ehContextoOcupante(this.contexto.id); }
  get tipoOcupacaoTravado(): boolean {
    return !this.modoNovo && this.codigoPapelVinculoContexto != null;
  }
  get moradorCheckboxDesabilitado(): boolean {
    return this.tipoOcupacao === PapelVinculoCodigo.dependenteUnidade || this.tipoOcupacaoTravado;
  }
  get tipoColaboradorTravado(): boolean {
    return !this.modoNovo && this.codigoPapelVinculoContexto != null;
  }
  get tipoGestorTravado(): boolean {
    return !this.modoNovo && this.codigoPapelVinculoContexto != null;
  }
  get rotuloTipoColaboradorAtual(): string {
    const codigo = this.codigoPapelVinculoContexto
      ?? (this.tipoColaborador === 2 ? PapelVinculoCodigo.terceirizado : PapelVinculoCodigo.funcionario);
    return rotuloTipoColaborador(codigo, null);
  }
  get aceitaAmbosTipos(): boolean {
    if (this.contexto.tipoPessoa !== 'PF_OU_PJ') return false;
    if (ehContextoOcupante(this.contexto.id) && this.tipoOcupacao === PapelVinculoCodigo.dependenteUnidade) {
      return false;
    }
    return true;
  }
  /** Contextos que aceitam somente PJ desde o primeiro paint (ex.: futuro `documento: 'cnpj'`). */
  get iniciaComoPessoaJuridica(): boolean {
    return this.contexto.inclusao?.documento === 'cnpj';
  }
  get usaDocumentoUnificado(): boolean {
    if (!this.modoNovo) return false;
    if (this.iniciaComoPessoaJuridica) return false;
    return this.contexto.tipoPessoa === 'PF_OU_PJ' && this.aceitaAmbosTipos;
  }
  get documentoBloqueado(): boolean { return !this.modoNovo; }
  get textoDados(): string {
    if (!this.modoNovo) return 'Identificação e dados principais da pessoa';
    if (this.usaDocumentoUnificado) {
      return 'Informe o CPF ou CNPJ para carregar os dados, se a pessoa já existir';
    }
    return this.tipo === 'PJ'
      ? 'Informe o CNPJ para carregar a pessoa jurídica, se ela já existir'
      : 'Informe o CPF para carregar a pessoa física, se ela já existir';
  }
  /** No modo misto, rótulos PF até 11 caracteres (sem máscara); acima disso, PJ. */
  get dadosGeraisRotulosComoPf(): boolean {
    if (!this.modoNovo || !this.usaDocumentoUnificado) return this.tipo === 'PF';
    const raw = normalizarDocumento(this.documentoUnificado);
    if (!raw) return true;
    if (/[A-Z]/.test(raw)) return false;
    return raw.length <= 11;
  }
  get rotuloDocumentoDadosGerais(): string {
    if (!this.modoNovo || !this.usaDocumentoUnificado) {
      return this.tipo === 'PJ' ? 'CNPJ' : 'CPF';
    }
    const raw = normalizarDocumento(this.documentoUnificado);
    if (!raw) return 'CPF/CNPJ';
    if (/[A-Z]/.test(raw) || raw.length > 11) return 'CNPJ';
    return 'CPF';
  }
  get rotuloNomeDadosGerais(): string {
    return this.dadosGeraisRotulosComoPf ? 'Nome' : 'Razão social';
  }
  get tipoInputDocumentoDadosGerais(): 'cpf' | 'cnpj' | 'cpfcnpj' {
    if (this.modoNovo && this.usaDocumentoUnificado) return 'cpfcnpj';
    return this.tipo === 'PJ' ? 'cnpj' : 'cpf';
  }
  get valorDocumentoDadosGerais(): string {
    if (this.modoNovo && this.usaDocumentoUnificado) return this.documentoUnificado;
    return this.tipo === 'PJ' ? (this.modelPj.cpfcnpj ?? '') : (this.modelPf.cpfcnpj ?? '');
  }
  get valorNomeDadosGerais(): string {
    return this.tipo === 'PJ' ? (this.modelPj.nome ?? '') : (this.modelPf.nome ?? '');
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
    if (ehContextoOcupante(this.contexto.id)
      && this.permissions.canAny([...CHAVES_PERMISSAO_OCUPANTE], acao)) {
      return true;
    }
    if (ehContextoGestor(this.contexto.id)
      && this.permissions.canAny([...CHAVES_PERMISSAO_GESTOR], acao)) {
      return true;
    }
    return this.permissions.can(this.contexto.permissionKey, acao)
      || this.permissions.can('PESSOAVINCULO', acao)
      || this.podeEditarCadastro;
  }
  get podeSalvarAba(): boolean {
    if (this.modoNovo) return this.podeGravarContexto;
    if (this.aba === 'vinculoContexto' || this.aba === 'foto') return this.podeGravarContexto || this.podeEditarCadastro;
    return this.podeEditarCadastro;
  }

  exibeAba(aba: AbaPessoa): boolean {
    if (aba === 'foto') return this.tipo === 'PF' && this.contexto.abasDetalhe.includes('foto');
    return this.contexto.abasDetalhe.includes(aba);
  }

  abaIndicadorPendente(aba: AbaPessoa): boolean {
    if (!this.exibeAba(aba)) return false;
    switch (aba) {
      case 'dados':
        return this.abaDadosComPendencias();
      case 'vinculoContexto':
        return this.abaVinculoContextoComPendencias();
      case 'enderecos':
        return this.abaEnderecosComPendencias();
      case 'foto':
        return this.abaFotoComPendencias();
      case 'contatos':
      case 'vinculos':
      case 'autorizacoes':
        return false;
      default:
        return false;
    }
  }

  private abaDadosComPendencias(): boolean {
    if (this.dadosSomenteLeitura) return false;
    if (this.modoNovo && this.pessoaExistente) return false;

    const reqs = this.modoNovo
      ? this.contexto.camposObrigatorios.pessoaNova
      : this.contexto.camposObrigatorios.pessoaExistente;

    if (reqs.length) {
      return reqs.some(c => !this.campoDadosPreenchido(c));
    }

    if (!this.documentoDadosValido()) return true;
    if (!this.textoPreenchido(this.valorNomeDadosGerais)) return true;
    if (this.tipo === 'PF' && !this.textoPreenchido(this.modelPf.dataNascimento)) return true;
    return false;
  }

  private abaVinculoContextoComPendencias(): boolean {
    if (!this.modoNovo && !this.podeGravarContexto) return false;
    const { vinculo, colaborador } = this.contexto.camposObrigatorios.vinculoContexto;
    if (!vinculo.length && !colaborador.length) return false;

    for (const c of vinculo) {
      if (!this.campoVinculoContextoPreenchido(c)) return true;
    }

    if (this.temColaborador && colaborador.length) {
      for (const c of colaborador) {
        if (!this.campoColaboradorPreenchido(c)) return true;
      }
      if (
        this.modoNovo
        && !this.possuiArquivoCtps
        && !this.dadosProfissionais.ctpsArquivoBase64
      ) {
        return true;
      }
    }
    return false;
  }

  private abaEnderecosComPendencias(): boolean {
    return this.contexto.camposObrigatorios.endereco.length > 0;
  }

  private abaFotoComPendencias(): boolean {
    if (!this.podeGerenciarFoto) return false;
    return false;
  }

  private campoDadosPreenchido(campo: string): boolean {
    switch (campo) {
      case 'cpfcnpj':
        return this.documentoDadosValido();
      case 'nome':
        return this.textoPreenchido(this.valorNomeDadosGerais);
      case 'dataNascimento':
        return this.tipo === 'PJ' || this.textoPreenchido(this.modelPf.dataNascimento);
      default:
        return true;
    }
  }

  private campoVinculoContextoPreenchido(campo: string): boolean {
    switch (campo) {
      case 'codigoPapelVinculo':
        return true;
      case 'idUnidade':
        return this.contexto.escopoPapel !== 'unidade' || this.idUnidade != null;
      case 'idPessoaRelacionada':
        return this.contexto.escopoPapel !== 'pessoa' || this.idPessoaRelacionada != null;
      case 'dataInicio':
        return this.textoPreenchido(this.dataInicio);
      default:
        return true;
    }
  }

  private campoColaboradorPreenchido(campo: string): boolean {
    switch (campo) {
      case 'dataAdmissao':
        return this.textoPreenchido(this.dadosProfissionais.dataAdmissao);
      case 'ctps':
        return this.textoPreenchido(this.dadosProfissionais.ctps);
      case 'idFuncaoColaborador':
        return this.dadosProfissionais.idFuncaoColaborador != null;
      default:
        return true;
    }
  }

  private documentoDadosValido(): boolean {
    const doc = normalizarDocumento(this.valorDocumentoDadosGerais);
    const tamanho = this.tipo === 'PJ' ? 14 : 11;
    if (doc.length !== tamanho) return false;
    return this.tipo === 'PJ' ? validarCnpj(doc) : validarCpf(doc);
  }

  private textoPreenchido(valor: string | null | undefined): boolean {
    return (valor ?? '').trim().length > 0;
  }

  private mascaraDocumentoCabecalho(doc: string): string {
    if (this.modoNovo && this.usaDocumentoUnificado) {
      return mascaraDocumentoUnificado(doc);
    }
    return this.tipo === 'PJ' ? mascaraCnpj(doc) : mascaraCpf(doc);
  }

  ngOnInit(): void {
    this.contexto = pessoaContextoPorId(this.route.snapshot.data['pessoaContexto'] as string | undefined);
    this.modoNovo = this.route.snapshot.data['modo'] === 'novo';
    if (ehContextoColaborador(this.contexto.id)) {
      this.tipoColaborador = this.contexto.inclusao?.tipoColaborador ?? 1;
    }
    if (ehContextoOcupante(this.contexto.id)) {
      this.tipoOcupacao = this.contexto.inclusao?.codigoPapelPadrao ?? PapelVinculoCodigo.proprietario;
    }
    if (ehContextoGestor(this.contexto.id)) {
      this.tipoGestor = this.contexto.inclusao?.codigoPapelPadrao ?? PapelVinculoCodigo.sindico;
    }
    if (this.modoNovo) {
      if (this.iniciaComoPessoaJuridica) this.tipo = 'PJ';
      else if (this.contexto.tipoPessoa === 'PF') this.tipo = 'PF';
      else this.tipo = 'PF';
    }
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
    this.unidadeService.getPaged(1, 500).subscribe({
      next: r => {
        this.itensUnidadeCatalogo = r.items ?? [];
        this.preencherUnidadesOpcoes();
      },
      error: () => {
        this.itensUnidadeCatalogo = [];
        this.unidadesOpcoes = [];
        this.cdr.markForCheck();
      },
    });
    this.blocoService.getPaged(1, 500).subscribe({
      next: br => {
        this.blocosPorId.clear();
        for (const b of br.items ?? []) {
          if (b.idBloco != null) {
            const nome = b.descricao?.trim();
            this.blocosPorId.set(b.idBloco, nome || String(b.idBloco));
          }
        }
        if (this.itensUnidadeCatalogo.length) this.preencherUnidadesOpcoes();
      },
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

  aoMudarTipoOcupacao(): void {
    if (this.tipoOcupacao === PapelVinculoCodigo.dependenteUnidade) {
      this.ehMorador = true;
      if (this.modoNovo && this.tipo === 'PJ') {
        this.tipo = 'PF';
        this.documentoUnificado = '';
        this.modelPj = {};
        this.modelPf = {};
        this.pessoaExistente = false;
        this.idPessoa = 0;
        this.ultimoDocumentoBuscado = '';
      }
    }
  }

  aoMudarNomeDadosGerais(valor: string): void {
    if (this.tipo === 'PJ') this.modelPj = { ...this.modelPj, nome: valor };
    else this.modelPf = { ...this.modelPf, nome: valor };
  }

  aoMudarDocumentoDadosGerais(valor: string): void {
    if (this.modoNovo && this.usaDocumentoUnificado) {
      this.documentoUnificado = valor;
      this.aoMudarDocumentoUnificado(valor);
      return;
    }
    if (this.tipo === 'PJ') this.modelPj = { ...this.modelPj, cpfcnpj: valor };
    else this.modelPf = { ...this.modelPf, cpfcnpj: valor };
  }

  aoBlurDocumentoDadosGerais(valor: string): void {
    if (!this.modoNovo) return;
    if (this.usaDocumentoUnificado) this.aoDocumentoUnificado(valor);
    else this.aoDocumento(valor);
  }

  aoMudarDocumentoUnificado(valor: string): void {
    if (!this.modoNovo || !this.usaDocumentoUnificado) return;
    const raw = normalizarDocumento(valor);
    this.sincronizarTipoPorDocumento(raw, false);
  }

  aoDocumentoUnificado(valor: string): void {
    if (!this.modoNovo || !this.usaDocumentoUnificado) return;
    const raw = normalizarDocumento(valor);
    this.documentoUnificado = raw;
    this.sincronizarTipoPorDocumento(raw, true);

    const inferido = inferirTipoPessoaPorDocumento(raw);
    if (!inferido) return;
    const tamanho = inferido === 'PJ' ? 14 : 11;
    if (raw.length !== tamanho) {
      if (raw.length > 0 && this.pessoaExistente) this.limparPessoaCarregada(raw);
      return;
    }
    const valido = inferido === 'PJ' ? validarCnpj(raw) : validarCpf(raw);
    if (!valido) {
      this.toast.showError(inferido === 'PJ' ? 'CNPJ inválido' : 'CPF inválido');
      return;
    }
    this.aoDocumento(raw);
  }

  private sincronizarTipoPorDocumento(raw: string, avisarPjBloqueado: boolean): void {
    const inferido = inferirTipoPessoaPorDocumento(raw);
    if (!inferido) return;
    if (!this.aceitaAmbosTipos && inferido === 'PJ') {
      if (avisarPjBloqueado) {
        this.toast.showError('Este contexto aceita somente pessoa física (CPF).');
      }
      this.tipo = 'PF';
      if (raw) this.modelPf = { ...this.modelPf, cpfcnpj: raw.replace(/\D/g, '').slice(0, 11) };
      return;
    }
    if (this.tipo !== inferido) {
      if (inferido === 'PJ') {
        this.tipo = 'PJ';
        if (this.aba === 'foto') this.aba = 'dados';
        this.modelPj = { cpfcnpj: raw };
        this.modelPf = {};
      } else {
        this.tipo = 'PF';
        this.modelPf = { cpfcnpj: raw };
        this.modelPj = {};
      }
      this.pessoaExistente = false;
      this.idPessoa = 0;
      this.ultimoDocumentoBuscado = '';
      this.ultimoCnpjConsultadoExterno = '';
      this.limparProfissionalCarregado();
    } else if (inferido === 'PF') {
      this.modelPf = { ...this.modelPf, cpfcnpj: raw };
    } else {
      this.modelPj = { ...this.modelPj, cpfcnpj: raw };
    }
  }

  aoDocumento(valor: string): void {
    if (!this.modoNovo) return;
    const doc = normalizarDocumento(valor);
    const inferido = inferirTipoPessoaPorDocumento(doc) ?? this.tipo;
    const tamanho = inferido === 'PJ' ? 14 : 11;
    if (doc.length !== tamanho) {
      if (this.pessoaExistente) this.limparPessoaCarregada(doc);
      return;
    }
    const valido = inferido === 'PJ' ? validarCnpj(doc) : validarCpf(doc);
    if (!valido) {
      this.toast.showError(inferido === 'PJ' ? 'CNPJ inválido' : 'CPF inválido');
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
      error: e => {
        const status = (e as { status?: number })?.status;
        if (status === 404 && inferido === 'PJ' && this.tipo === 'PJ') {
          this.consultarCnpjExterno(doc);
          return;
        }
        this.limparPessoaCarregada(doc);
      }
    });
  }

  private consultarCnpjExterno(doc: string): void {
    const cnpj = somenteDigitos(doc);
    if (cnpj.length !== 14) {
      this.limparPessoaCarregada(doc);
      return;
    }
    if (cnpj === this.ultimoCnpjConsultadoExterno) return;
    this.ultimoCnpjConsultadoExterno = cnpj;
    this.consultandoCnpj = true;
    this.consultaExterna.consultarCnpj(cnpj).subscribe({
      next: r => {
        this.consultandoCnpj = false;
        this.pessoaExistente = false;
        this.idPessoa = 0;
        const razao = r.razaoSocial?.trim();
        const fantasia = r.nomeFantasia?.trim();
        this.modelPj = {
          ...this.modelPj,
          cpfcnpj: doc,
          nome: razao || this.modelPj.nome,
          nomeFantasia: fantasia || this.modelPj.nomeFantasia,
        };
        if (this.usaDocumentoUnificado) this.documentoUnificado = doc;
        this.aplicarSugestaoEnderecoConsultaCnpj(r);
        this.toast.showSuccess('Empresa não cadastrada; dados obtidos na consulta de CNPJ.');
      },
      error: e => {
        this.consultandoCnpj = false;
        const err = e as { status?: number; error?: { mensagem?: string; message?: string } };
        const msg = err?.error?.mensagem ?? err?.error?.message
          ?? (err?.status === 404
            ? 'CNPJ não encontrado na consulta externa.'
            : 'Não foi possível consultar o CNPJ. Preencha os dados manualmente.');
        this.toast.showWarning(msg);
        this.limparPessoaCarregada(doc);
      },
    });
  }

  private aplicarSugestaoEnderecoConsultaCnpj(r: ResultadoConsultaCnpj): void {
    if (!this.enderecosEmModoPendente) return;
    const logradouro = r.enderecoLogradouro?.trim();
    const cep = somenteDigitos(r.cep ?? '');
    if (!logradouro && cep.length !== 8) return;
    this.enderecoSugestaoCnpj = {
      tipoEndereco: 0,
      cep: cep.length === 8 ? cep : undefined,
      logradouro: logradouro || undefined,
      numeroEndereco: r.enderecoNumero ?? undefined,
      complementoEndereco: r.enderecoComplemento?.trim() || undefined,
      idBairro: r.idBairro ?? undefined,
    };
  }

  aoPendentesEnderecoChange(lista: PessoaEnderecoUpsert[]): void {
    this.enderecosPendentes = lista;
    if (this.enderecoSugestaoCnpj && lista.some(p => this.enderecoMesmoConteudo(p, this.enderecoSugestaoCnpj!))) {
      this.enderecoSugestaoCnpj = null;
    }
  }

  private enderecoMesmoConteudo(a: PessoaEnderecoUpsert, b: PessoaEnderecoUpsert): boolean {
    return a.tipoEndereco === b.tipoEndereco
      && (a.cep ?? '') === (b.cep ?? '')
      && (a.logradouro ?? '') === (b.logradouro ?? '')
      && (a.idBairro ?? 0) === (b.idBairro ?? 0)
      && (a.numeroEndereco ?? 0) === (b.numeroEndereco ?? 0)
      && (a.complementoEndereco ?? '') === (b.complementoEndereco ?? '');
  }

  private limparPessoaCarregada(doc: string): void {
    this.pessoaExistente = false;
    this.idPessoa = 0;
    this.enderecosPendentes = [];
    this.enderecoSugestaoCnpj = null;
    this.ultimoCnpjConsultadoExterno = '';
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
        this.recarregarFotoDoServidor();
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
    if (this.bloquearPorEnderecoNaoIncluido()) return;
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
      const bodyPf = { ...this.modelPf, ...this.camposFotoParaGravacao() };
      this.cadastro.atualizarPf(this.idPessoa, bodyPf).subscribe({
        next: () => {
          this.finalizarFotoAposGravacao();
          done();
        },
        error: e => {
          this.formError = this.extrairErro(e);
          this.saving = false;
        }
      });
    }
  }

  private bloquearPorEnderecoNaoIncluido(): boolean {
    if (!this.exibeAba('enderecos') || !this.podeEditarEndereco) return false;
    if (!this.painelEnderecos?.temEnderecoDigitadoNaoIncluido()) return false;
    this.formError = MSG_ENDERECO_NAO_INCLUIDO;
    this.toast.showError(MSG_ENDERECO_NAO_INCLUIDO);
    this.aba = 'enderecos';
    this.painelEnderecos.marcarErroEnderecoNaoIncluido();
    return true;
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
      ...(ehContextoOcupante(this.contexto.id)
        ? {
            codigoPapelVinculo: this.tipoOcupacao,
            ehMorador: this.ehMorador || this.tipoOcupacao === PapelVinculoCodigo.dependenteUnidade,
          }
        : {}),
      ...(ehContextoGestor(this.contexto.id)
        ? { codigoPapelVinculo: this.tipoGestor }
        : {}),
      ...this.camposFotoParaGravacao(),
    };
    const req = this.modoNovo
      ? this.contextoApi.incluir(body)
      : this.contextoApi.alterar(this.idPessoa, body);
    const pendentesEndereco = [...this.enderecosPendentes];
    req.pipe(
      concatMap(r => {
        if (!pendentesEndereco.length) return of(r);
        return from(pendentesEndereco).pipe(
          concatMap(p => this.enderecoSvc.gravar(r.idPessoa, p)),
          last(),
          map(() => r)
        );
      })
    ).subscribe({
      next: r => {
        this.saving = false;
        this.idPessoa = r.idPessoa;
        this.enderecosPendentes = [];
        this.finalizarFotoAposGravacao();
        const qtdEnd = pendentesEndereco.length;
        const msg = qtdEnd
          ? `Cadastro salvo com ${qtdEnd} endereço(s).`
          : 'Cadastro salvo com sucesso.';
        this.toast.showSuccess(msg);
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
      const papeisOcupacao: number[] = [
        PapelVinculoCodigo.proprietario,
        PapelVinculoCodigo.locatario,
        PapelVinculoCodigo.dependenteUnidade,
      ];
      const aberto = ehContextoOcupante(this.contexto.id)
        ? doContexto.find(v => v.codigoPapelVinculo != null && papeisOcupacao.includes(v.codigoPapelVinculo) && this.vigente(v))
          ?? doContexto.find(v => v.codigoPapelVinculo != null && papeisOcupacao.includes(v.codigoPapelVinculo))
        : doContexto.find(v => this.vigente(v)) ?? doContexto[0];
      if (aberto) {
        this.idUnidade = aberto.idUnidade ?? null;
        this.idPessoaRelacionada = aberto.idPessoaRelacionada ?? null;
        this.dataInicio = aberto.dataInicio ?? this.dataInicio;
        this.dataFim = aberto.dataFim ?? '';
        if (ehContextoColaborador(this.contexto.id) && aberto.codigoPapelVinculo != null) {
          this.codigoPapelVinculoContexto = aberto.codigoPapelVinculo;
          this.tipoColaborador = aberto.codigoPapelVinculo === PapelVinculoCodigo.terceirizado ? 2 : 1;
        }
        if (ehContextoGestor(this.contexto.id) && aberto.codigoPapelVinculo != null) {
          this.codigoPapelVinculoContexto = aberto.codigoPapelVinculo;
          this.tipoGestor = aberto.codigoPapelVinculo;
        }
        if (ehContextoOcupante(this.contexto.id)) {
          const naUnidade = doContexto.filter(v => v.idUnidade === aberto.idUnidade);
          const principal = naUnidade.find(v => v.codigoPapelVinculo != null && papeisOcupacao.includes(v.codigoPapelVinculo) && this.vigente(v))
            ?? naUnidade.find(v => v.codigoPapelVinculo != null && papeisOcupacao.includes(v.codigoPapelVinculo));
          if (principal?.codigoPapelVinculo != null) {
            this.codigoPapelVinculoContexto = principal.codigoPapelVinculo;
            this.tipoOcupacao = principal.codigoPapelVinculo;
          }
          this.ehMorador = naUnidade.some(v => v.codigoPapelVinculo === PapelVinculoCodigo.morador && this.vigente(v));
          if (this.tipoOcupacao === PapelVinculoCodigo.dependenteUnidade) this.ehMorador = true;
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

  private preencherUnidadesOpcoes(): void {
    this.unidadesOpcoes = [];
    this.unidades.clear();
    for (const u of this.itensUnidadeCatalogo) {
      if (u.idUnidade != null) {
        const label = this.rotuloUnidadeComBloco(u);
        this.unidades.set(u.idUnidade, label);
        this.unidadesOpcoes.push({ value: u.idUnidade, label });
      }
    }
    this.cdr.markForCheck();
  }

  private rotuloUnidadeComBloco(u: Unidade): string {
    const bloco =
      u.idBloco != null ? this.blocosPorId.get(u.idBloco) ?? String(u.idBloco) : '';
    const unidade = u.numero != null ? String(u.numero) : u.idUnidade != null ? String(u.idUnidade) : '';
    if (bloco && unidade) return `${bloco} - ${unidade}`;
    if (bloco) return bloco;
    return unidade || (u.idUnidade != null ? String(u.idUnidade) : '');
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

  registrarFotoPendente(arquivo: File): void {
    if (!this.podeGerenciarFoto) return;
    const erro = validarArquivoFotoPerfil(arquivo);
    if (erro) {
      this.toast.showError(erro);
      return;
    }
    this.revogarPreviewFotoPendente();
    this.fotoPendentePreviewUrl = URL.createObjectURL(arquivo);
    this.fotoMarcarRemocao = false;
    this.fotoAlteracaoPendente = true;
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      this.fotoPendenteBase64 = comma >= 0 ? result.slice(comma + 1) : result;
      this.fotoPendenteContentType = arquivo.type || 'image/jpeg';
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(arquivo);
  }

  marcarRemocaoFotoPendente(): void {
    if (!this.podeGerenciarFoto) return;
    this.revogarPreviewFotoPendente();
    this.fotoPendenteBase64 = '';
    this.fotoPendenteContentType = '';
    this.fotoMarcarRemocao = true;
    this.fotoAlteracaoPendente = true;
    this.cdr.markForCheck();
  }

  private camposFotoParaGravacao(): Pick<PessoaFisicaIntegradaRequest, 'fotoPerfilBase64' | 'fotoPerfilContentType' | 'fotoPerfilRemover'> {
    if (this.tipo !== 'PF' || !this.fotoAlteracaoPendente) return {};
    if (this.fotoMarcarRemocao) return { fotoPerfilRemover: true };
    if (!this.fotoPendenteBase64) return {};
    return {
      fotoPerfilBase64: this.fotoPendenteBase64,
      fotoPerfilContentType: this.fotoPendenteContentType,
    };
  }

  private finalizarFotoAposGravacao(): void {
    this.limparFotoPendente();
    if (this.idPessoa > 0) this.recarregarFotoDoServidor();
  }

  private recarregarFotoDoServidor(): void {
    if (this.tipo !== 'PF' || this.idPessoa <= 0) return;
    this.pessoaFoto.carregarStatus(this.idPessoa, this.contexto.id).subscribe();
  }

  private limparFotoPendente(): void {
    this.revogarPreviewFotoPendente();
    this.fotoPendenteBase64 = '';
    this.fotoPendenteContentType = '';
    this.fotoMarcarRemocao = false;
    this.fotoAlteracaoPendente = false;
  }

  private revogarPreviewFotoPendente(): void {
    if (this.fotoPendentePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.fotoPendentePreviewUrl);
    }
    this.fotoPendentePreviewUrl = null;
  }

  voltar(): void {
    this.pessoaFoto.limpar();
    void this.router.navigateByUrl(this.contexto.routeLista);
  }

  /** Distingue payload PJ (sem e-mail/senha de PF) ao hidratar via navigation state. */
  private eDadosPj(dados: PessoaFisicaIntegradaRequest | PessoaJuridicaIntegradaRequest): dados is PessoaJuridicaIntegradaRequest {
    return 'nomeFantasia' in dados || 'inscricaoEstadual' in dados || 'idResponsavel' in dados;
  }
}