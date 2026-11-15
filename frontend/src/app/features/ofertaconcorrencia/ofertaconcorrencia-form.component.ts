import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { CampoMoedaComponent } from '../../shared/campo-moeda/campo-moeda.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { OfertaConcorrenciaService } from './ofertaconcorrencia.service';
import { OfertaConcorrencia } from './ofertaconcorrencia.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { HugFileUploadComponent } from '../../shared/hug-file-upload/hug-file-upload.component';
import { blobComTipo, classificarArquivoPreview, inferirMimeArquivo, mimeArquivoLocal } from '../../shared/hug-file-upload/hug-arquivo.util';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { FornecedorService } from '../fornecedor/fornecedor.service';
import { ConcorrenciaService } from '../concorrencia/concorrencia.service';

type SituacaoOferta = 'analise' | 'vencedora' | 'desistente';

@Component({
  selector: 'app-ofertaconcorrencia-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    ListLoadingModalComponent,
    FormsModule,
    CampoDataComponent,
    CampoMoedaComponent,
    ComboboxCustomizadaComponent,
    HugFileUploadComponent,
  ],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/ofertaconcorrencia'">Oferta Concorrência</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Oferta Concorrência</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de oferta concorrência</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="file-text" [tamanho]="16" />
              <span>Dados da Oferta</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="file-text" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da Oferta</h2>
                <p class="cad-secao__texto">Informe a concorrência, fornecedor e condições da proposta</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                @if (isEdit) {
                  <input
                    type="hidden"
                    [(ngModel)]="model.idOfertaConcorrencia"
                    name="idOfertaConcorrencia" />
                }

                <div class="cad-blocos oferta-dados">
                  <div class="form-grid oferta-dados__linha oferta-dados__linha--1">
                    <div class="form-group oferta-dados__campo">
                      <label>Concorrência *</label>
                      <app-combobox-customizada
                        [options]="fk_idConcorrencia"
                        [(value)]="model.idConcorrencia"
                        [disabled]="fieldDisabled('idConcorrencia')"
                        [required]="true"
                        ariaLabel="Concorrência" />
                    </div>
                    <div class="form-group oferta-dados__campo">
                      <label>Fornecedor *</label>
                      <app-combobox-customizada
                        [options]="fk_idFornecedor"
                        [(value)]="model.idFornecedor"
                        [disabled]="fieldDisabled('idFornecedor')"
                        [required]="true"
                        ariaLabel="Fornecedor" />
                    </div>
                  </div>

                  <div class="form-grid oferta-dados__linha oferta-dados__linha--2">
                    <div class="form-group oferta-dados__campo">
                      <label for="oferta-descricao">Descrição *</label>
                      <textarea
                        id="oferta-descricao"
                        class="input-textarea"
                        [(ngModel)]="model.descricao"
                        name="descricao"
                        rows="2"
                        [readonly]="fieldDisabled('descricao')"
                        required></textarea>
                    </div>
                  </div>

                  <div class="form-grid oferta-dados__linha oferta-dados__linha--3">
                    <div class="form-group oferta-dados__campo">
                      <label>Data da Oferta *</label>
                      <app-campo-data
                        [(ngModel)]="model.dataOferta"
                        name="dataOferta"
                        [disabled]="fieldDisabled('dataOferta')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group oferta-dados__campo">
                      <label>Validade *</label>
                      <app-campo-data
                        [(ngModel)]="model.dataValidade"
                        name="dataValidade"
                        [disabled]="fieldDisabled('dataValidade')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group oferta-dados__campo oferta-dados__moeda">
                      <label>Preço *</label>
                      <app-campo-moeda
                        [(ngModel)]="model.preco"
                        name="preco"
                        modo="numero"
                        [readonly]="fieldDisabled('preco')"
                        [disabled]="fieldDisabled('preco')"
                        [required]="true" />
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="clipboard-list" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Resultado e Comprovação</h2>
                  </div>
                </div>

                <div class="cad-blocos oferta-resultado">
                  <div class="form-grid oferta-resultado__linha oferta-resultado__linha--4">
                    <div class="form-group oferta-resultado__campo">
                      <label id="oferta-situacao-label">Situação da Oferta</label>
                      <div
                        class="cad-segment"
                        role="radiogroup"
                        aria-labelledby="oferta-situacao-label"
                        [class.cad-segment--desabilitado]="situacaoDesabilitada">
                        <button
                          type="button"
                          role="radio"
                          class="cad-segment__opcao"
                          [class.cad-segment__opcao--ativa]="situacaoAtiva('analise')"
                          [attr.aria-checked]="situacaoAtiva('analise')"
                          [disabled]="situacaoDesabilitada"
                          (click)="definirSituacao('analise')">Em análise</button>
                        <button
                          type="button"
                          role="radio"
                          class="cad-segment__opcao"
                          [class.cad-segment__opcao--ativa]="situacaoAtiva('vencedora')"
                          [attr.aria-checked]="situacaoAtiva('vencedora')"
                          [disabled]="situacaoDesabilitada"
                          (click)="definirSituacao('vencedora')">Vencedora</button>
                        <button
                          type="button"
                          role="radio"
                          class="cad-segment__opcao"
                          [class.cad-segment__opcao--ativa]="situacaoAtiva('desistente')"
                          [attr.aria-checked]="situacaoAtiva('desistente')"
                          [disabled]="situacaoDesabilitada"
                          (click)="definirSituacao('desistente')">Desistente</button>
                      </div>
                      <input type="hidden" [(ngModel)]="model.vencedora" name="vencedora" />
                      <input type="hidden" [(ngModel)]="model.desistente" name="desistente" />
                    </div>
                  </div>

                  <div class="form-grid oferta-resultado__linha oferta-resultado__linha--5">
                    <div class="form-group oferta-resultado__campo">
                      <label for="oferta-justificativa">Justificativa</label>
                      <textarea
                        id="oferta-justificativa"
                        class="input-textarea"
                        [(ngModel)]="model.justificativa"
                        name="justificativa"
                        rows="2"
                        [readonly]="fieldDisabled('justificativa')"></textarea>
                    </div>
                  </div>

                  <div class="form-grid oferta-resultado__linha oferta-resultado__linha--6">
                    <div class="form-group oferta-resultado__campo oferta-resultado__anexo">
                      <app-hug-file-upload
                        label="Documento comprobatório"
                        layout="paisagem"
                        [varianteCard]="true"
                        [compacta]="true"
                        iconeZona="file-text"
                        accept="application/pdf,image/jpeg,image/png"
                        metaFormatos="Formatos: PDF, JPG ou PNG"
                        dimensaoRecomendada="documento legível"
                        [maxMb]="8"
                        [previewUrl]="previewDocumento"
                        [previewMime]="mimePreviewDocumento"
                        [nomeArquivo]="nomePreviewDocumento"
                        [carregando]="carregandoPreviewDocumento"
                        [exibirBaixar]="!!previewDocumento"
                        [disabled]="!canEdit || saving"
                        (arquivoSelecionado)="selecionarDocumento($event)"
                        (removido)="marcarRemocaoDocumento()" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
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
    .oferta-dados,
    .oferta-resultado {
      gap: 12px;
    }
    .oferta-dados__linha--1 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
      gap: 10px;
    }
    .oferta-dados__linha--2,
    .oferta-resultado__linha--5,
    .oferta-resultado__linha--6 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .oferta-dados__linha--3 {
      grid-template-columns: minmax(0, 30fr) minmax(0, 30fr) minmax(0, 40fr);
      align-items: end;
      gap: 10px;
    }
    .oferta-resultado__linha--4 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .oferta-dados__campo,
    .oferta-resultado__campo {
      min-width: 0;
    }
    .oferta-dados__moeda app-campo-moeda {
      display: block;
      width: 100%;
    }
    @media (max-width: 720px) {
      .oferta-dados__linha--1,
      .oferta-dados__linha--3 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class OfertaConcorrenciaFormComponent implements OnInit, OnDestroy {
  model: OfertaConcorrencia = {} as OfertaConcorrencia;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Oferta Concorrência';
  showDeleteConfirm = false;
  readonly permissionKey = 'OFERTACONCORRENCIA';
  canEdit = true;
  canDelete = true;
  fk_idFornecedor: ComboboxOption[] = [];
  fk_idConcorrencia: ComboboxOption[] = [];

  constructor(
    private service: OfertaConcorrenciaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private fornecedorService: FornecedorService,
    private concorrenciaService: ConcorrenciaService,
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

  get situacaoDesabilitada(): boolean {
    return this.fieldDisabled('vencedora') || this.fieldDisabled('desistente');
  }

  situacaoAtiva(op: SituacaoOferta): boolean {
    const v = this.flagAtivo(this.model.vencedora);
    const d = this.flagAtivo(this.model.desistente);
    if (op === 'vencedora') return v && !d;
    if (op === 'desistente') return d && !v;
    return !v && !d || (v && d);
  }

  definirSituacao(op: SituacaoOferta): void {
    if (this.situacaoDesabilitada) return;
    if (op === 'vencedora') {
      this.model.vencedora = '1';
      this.model.desistente = '0';
    } else if (op === 'desistente') {
      this.model.vencedora = '0';
      this.model.desistente = '1';
    } else {
      this.model.vencedora = '0';
      this.model.desistente = '0';
    }
  }

  private flagAtivo(val: string | number | boolean | null | undefined): boolean {
    return val === 1 || val === '1' || val === true || val === 'true';
  }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    this.pageLoad.run(this.fornecedorService.getPaged(1, 200), r => {
      this.fk_idFornecedor = r.items.map((x: any) => ({
        value: x.idFornecedor,
        label: this.fkLabel_idFornecedor(x),
      }));
    });

    this.pageLoad.run(this.concorrenciaService.getPaged(1, 200), r => {
      this.fk_idConcorrencia = r.items.map((x: any) => ({
        value: x.idConcorrencia,
        label: this.fkLabel_idConcorrencia(x),
      }));
    });
    const idOfertaConcorrencia = this.route.snapshot.paramMap.get('idOfertaConcorrencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idOfertaConcorrencia) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(
        this.service.getById(idOfertaConcorrencia),
        r => {
          this.model = r;
          this.verificarDocumento();
        },
        () => this.toast.showError('Registro não encontrado.'),
      );
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  temDocumento = false;
  documentoPendente: File | null = null;
  previewDocumento: string | null = null;
  mimePreviewDocumento: string | null = null;
  nomePreviewDocumento: string | null = null;
  carregandoPreviewDocumento = false;
  private removerDocumentoPendente = false;
  private previewDocumentoLocal: string | null = null;
  private previewDocumentoServidor: string | null = null;

  ngOnDestroy(): void {
    this.revogarPreviewLocal();
    this.revogarPreviewServidor();
  }

  selecionarDocumento(arquivo: File): void {
    this.revogarPreviewLocal();
    this.documentoPendente = arquivo;
    this.removerDocumentoPendente = false;
    this.temDocumento = true;
    this.mimePreviewDocumento = mimeArquivoLocal(arquivo);
    this.nomePreviewDocumento = arquivo.name;
    const url = URL.createObjectURL(arquivo);
    this.previewDocumentoLocal = url;
    this.previewDocumento = url;
  }

  marcarRemocaoDocumento(): void {
    this.documentoPendente = null;
    this.removerDocumentoPendente = true;
    this.temDocumento = false;
    this.mimePreviewDocumento = null;
    this.nomePreviewDocumento = null;
    this.revogarPreviewLocal();
    this.revogarPreviewServidor();
    this.previewDocumento = null;
  }

  private revogarPreviewLocal(): void {
    if (this.previewDocumentoLocal) {
      URL.revokeObjectURL(this.previewDocumentoLocal);
      this.previewDocumentoLocal = null;
    }
  }

  private revogarPreviewServidor(): void {
    if (this.previewDocumentoServidor) {
      URL.revokeObjectURL(this.previewDocumentoServidor);
      this.previewDocumentoServidor = null;
    }
  }

  private carregarPreviewDocumento(): void {
    const id = this.model.idOfertaConcorrencia;
    if (!id || this.documentoPendente) return;
    this.carregandoPreviewDocumento = true;
    this.service.baixarDocumento(id).subscribe({
      next: blob => {
        const nomePadrao = 'documento-comprobatorio.pdf';
        const mime = inferirMimeArquivo(blob.type, nomePadrao) || 'application/pdf';
        const tipado = blobComTipo(blob, mime);
        this.revogarPreviewServidor();
        const url = URL.createObjectURL(tipado);
        this.previewDocumentoServidor = url;
        this.mimePreviewDocumento = tipado.type;
        this.nomePreviewDocumento = this.nomeArquivoPersistido(mime);
        if (!this.documentoPendente && !this.removerDocumentoPendente) {
          this.previewDocumento = url;
        }
        this.carregandoPreviewDocumento = false;
      },
      error: () => {
        this.mimePreviewDocumento = null;
        this.nomePreviewDocumento = null;
        if (!this.documentoPendente) this.previewDocumento = null;
        this.carregandoPreviewDocumento = false;
      },
    });
  }

  private nomeArquivoPersistido(mime: string): string {
    const tipo = classificarArquivoPreview(mime, 'documento-comprobatorio');
    if (tipo === 'pdf') return 'documento-comprobatorio.pdf';
    if (tipo === 'imagem') {
      if (mime.includes('png')) return 'documento-comprobatorio.png';
      return 'documento-comprobatorio.jpg';
    }
    return 'documento-comprobatorio';
  }

  private verificarDocumento(): void {
    const id = this.model.idOfertaConcorrencia;
    if (!id) return;
    this.service.temDocumento(id).subscribe({
      next: () => {
        this.temDocumento = true;
        this.carregarPreviewDocumento();
      },
      error: () => {
        this.temDocumento = false;
        this.previewDocumento = null;
        this.mimePreviewDocumento = null;
        this.nomePreviewDocumento = null;
      },
    });
  }

  private sincronizarDocumento(id: number): void {
    if (this.documentoPendente) {
      this.service.enviarDocumento(id, this.documentoPendente).subscribe({
        next: () => this.toast.showSuccess('Documento anexado.'),
        error: () => this.toast.showError('A oferta foi salva, mas o documento não foi enviado.'),
      });
      return;
    }
    if (this.removerDocumentoPendente) {
      this.service.removerDocumento(id).subscribe({
        error: () => this.toast.showError('A oferta foi salva, mas o documento não foi removido.'),
      });
    }
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => {
          if (this.model.idOfertaConcorrencia) this.sincronizarDocumento(this.model.idOfertaConcorrencia);
          this.toast.showSuccess('Alterações salvas com sucesso.');
          this.router.navigate(['/ofertaconcorrencia']);
        },
        error: (e: unknown) => {
          this.toast.showError(
            (typeof (e as any)?.error === 'string' ? (e as any).error : null) ??
              (e as any)?.error?.title ??
              (e as any)?.error?.message ??
              (e as any)?.message ??
              'Não foi possível salvar. Tente novamente.',
          );
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    } else {
      this.service.create(this.model).subscribe({
        next: criada => {
          if (criada.idOfertaConcorrencia) this.sincronizarDocumento(criada.idOfertaConcorrencia);
          this.toast.showSuccess(this.entityTitle + ' gravado com sucesso.');
          this.router.navigate(['/ofertaconcorrencia']);
        },
        error: (e: unknown) => {
          this.toast.showError(
            (typeof (e as any)?.error === 'string' ? (e as any).error : null) ??
              (e as any)?.error?.title ??
              (e as any)?.error?.message ??
              (e as any)?.message ??
              'Não foi possível salvar. Tente novamente.',
          );
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/ofertaconcorrencia']);
  }

  confirmDelete(): void {
    this.service.delete(this.model.idOfertaConcorrencia!).subscribe({
      next: () => this.router.navigate(['/ofertaconcorrencia']),
      error: () => this.toast.showError('Não foi possível excluir. Tente novamente.'),
    });
  }

  fkLabel_idFornecedor(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idFornecedor ?? '');
  }
  fkLabel_idConcorrencia(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idConcorrencia ?? '');
  }
}
