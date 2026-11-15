import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, Observable, of } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { TipoUnidadeService } from './tipounidade.service';
import { TipoUnidade } from './tipounidade.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { mensagemErroHttp } from '../../core/utils/http-error-message.util';
import { ImagemCadastroComponent } from '../../shared/imagem-cadastro/imagem-cadastro.component';

type ImagemPlantaTipo = 'localizacao-unidade' | 'planta-baixa';

@Component({
  selector: 'app-tipounidade-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    ListLoadingModalComponent,
    FormsModule,
    ComboboxCustomizadaComponent,
    DocumentoInputComponent,
    ImagemCadastroComponent,
  ],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/tipounidade'">Tipo Unidade</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Tipo Unidade</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de tipo unidade</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="aba === 'dados'"
              [attr.aria-selected]="aba === 'dados'"
              (click)="aba = 'dados'">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Tipo Unidade</span>
            </button>
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="aba === 'plantas'"
              [attr.aria-selected]="aba === 'plantas'"
              (click)="aba = 'plantas'">
              <app-icone nome="image" [tamanho]="16" />
              <span>Plantas</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div [hidden]="aba !== 'dados'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Tipo Unidade</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
          <div class="form-grid">
            <div class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div class="form-group fg-col-12">
              <label>Descrição *</label>
              <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Quantidade de Salas *</label>
              <input type="number" [(ngModel)]="model.qtdSalas" name="qtdSalas" [readonly]="fieldDisabled('qtdSalas')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Quantidade de Quartos *</label>
              <input type="number" [(ngModel)]="model.qtdQuartos" name="qtdQuartos" [readonly]="fieldDisabled('qtdQuartos')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Quantidade de Suítes *</label>
              <input type="number" [(ngModel)]="model.qtdSuites" name="qtdSuites" [readonly]="fieldDisabled('qtdSuites')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Quantidade de Banheiros *</label>
              <input type="number" [(ngModel)]="model.qtdBanheiros" name="qtdBanheiros" [readonly]="fieldDisabled('qtdBanheiros')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Área *</label>
              <input type="number" [(ngModel)]="model.area" name="area" step="0.001" [readonly]="fieldDisabled('area')" required />
            </div>
          </div>
          </div>
          <div [hidden]="aba !== 'plantas'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="image" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Plantas</h2>
                <p class="cad-secao__texto">As imagens serão enviadas ao servidor ao pressionar Salvar</p>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group fg-col-6">
                <app-imagem-cadastro
                  label="Localização Unidade"
                  infoTexto="Imagem da localização da Unidade no condomínio."
                  [previewUrl]="previewLocalizacao"
                  [disabled]="!podeEditarPlantas"
                  [maxMb]="5"
                  (arquivoSelecionado)="selecionarImagem('localizacao-unidade', $event)"
                  (removido)="marcarRemocaoImagem('localizacao-unidade')" />
              </div>
              <div class="form-group fg-col-6">
                <app-imagem-cadastro
                  label="Planta Baixa"
                  infoTexto="Imagem da planta baixa da Unidade."
                  [previewUrl]="previewPlantaBaixa"
                  [disabled]="!podeEditarPlantas"
                  [maxMb]="5"
                  (arquivoSelecionado)="selecionarImagem('planta-baixa', $event)"
                  (removido)="marcarRemocaoImagem('planta-baixa')" />
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
})
export class TipoUnidadeFormComponent implements OnInit, OnDestroy {
  model: TipoUnidade = {} as TipoUnidade;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Tipo Unidade';
  showDeleteConfirm = false;
  readonly permissionKey = 'TIPOUNIDADE';
  canEdit = true;
  canDelete = true;
  aba: 'dados' | 'plantas' = 'dados';
  previewLocalizacao: string | null = null;
  previewPlantaBaixa: string | null = null;
  private readonly arquivoPendente: Partial<Record<ImagemPlantaTipo, File>> = {};
  private readonly pendenteRemocao: Record<ImagemPlantaTipo, boolean> = {
    'localizacao-unidade': false,
    'planta-baixa': false,
  };
  private readonly imagemNoServidor: Record<ImagemPlantaTipo, boolean> = {
    'localizacao-unidade': false,
    'planta-baixa': false,
  };

  constructor(
    private service: TipoUnidadeService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
  ) {
    this.refreshPermissions();
  }

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  get podeEditarPlantas(): boolean {
    return this.canEdit;
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  get pkDisplay(): string { return String(this.model.idTipoUnidade); }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    const idTipoUnidade = this.route.snapshot.paramMap.get('idTipoUnidade');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idTipoUnidade) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(
        this.service.getById(idTipoUnidade),
        (r) => {
          this.model = r;
          this.carregarPreviews();
        },
        () => this.toast.showError('Registro não encontrado.')
      );
    }
    this.pageLoad.seal();
  }

  ngOnDestroy(): void {
    this.definirPreview('localizacao-unidade', null);
    this.definirPreview('planta-baixa', null);
  }

  private carregarPreviews(): void {
    const id = this.model.idTipoUnidade;
    if (!id) return;
    this.baixarPreview(id, 'localizacao-unidade');
    this.baixarPreview(id, 'planta-baixa');
  }

  private baixarPreview(id: number, tipo: ImagemPlantaTipo): void {
    this.service.baixarImagem(id, tipo).subscribe({
      next: blob => {
        this.imagemNoServidor[tipo] = true;
        this.definirPreview(tipo, URL.createObjectURL(blob));
      },
      error: () => {
        this.imagemNoServidor[tipo] = false;
        this.definirPreview(tipo, null);
      },
    });
  }

  selecionarImagem(tipo: ImagemPlantaTipo, arquivo: File): void {
    this.arquivoPendente[tipo] = arquivo;
    this.pendenteRemocao[tipo] = false;
    this.definirPreview(tipo, URL.createObjectURL(arquivo));
  }

  marcarRemocaoImagem(tipo: ImagemPlantaTipo): void {
    delete this.arquivoPendente[tipo];
    this.pendenteRemocao[tipo] = this.imagemNoServidor[tipo];
    this.definirPreview(tipo, null);
  }

  private sincronizarImagens(id: number): Observable<void> {
    const operacoes: Observable<unknown>[] = [];
    (['localizacao-unidade', 'planta-baixa'] as ImagemPlantaTipo[]).forEach(tipo => {
      if (this.pendenteRemocao[tipo]) operacoes.push(this.service.removerImagem(id, tipo));
      const arquivo = this.arquivoPendente[tipo];
      if (arquivo) operacoes.push(this.service.enviarImagem(id, tipo, arquivo));
    });
    if (operacoes.length === 0) return of(undefined);
    return forkJoin(operacoes).pipe(map(() => undefined));
  }

  private limparPendentesImagens(): void {
    delete this.arquivoPendente['localizacao-unidade'];
    delete this.arquivoPendente['planta-baixa'];
    this.pendenteRemocao['localizacao-unidade'] = false;
    this.pendenteRemocao['planta-baixa'] = false;
  }

  private definirPreview(tipo: ImagemPlantaTipo, url: string | null): void {
    const atual = tipo === 'localizacao-unidade' ? this.previewLocalizacao : this.previewPlantaBaixa;
    if (atual?.startsWith('blob:')) URL.revokeObjectURL(atual);
    if (tipo === 'localizacao-unidade') this.previewLocalizacao = url;
    else this.previewPlantaBaixa = url;
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    const msgOk = this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.';
    const msgErro = (e: unknown) => mensagemErroHttp(e);

    const aposGravarImagens = (id: number) => {
      this.sincronizarImagens(id).subscribe({
        next: () => {
          this.limparPendentesImagens();
          this.toast.showSuccess(msgOk);
          this.saving = false;
          this.router.navigate(['/tipounidade']);
        },
        error: (e: unknown) => {
          const detalhe = mensagemErroHttp(e, 'Não foi possível gravar as imagens no servidor.');
          this.toast.showError(`Registro salvo, mas houve falha nas plantas: ${detalhe}`);
          this.saving = false;
          this.router.navigate(['/tipounidade']);
        },
      });
    };

    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => aposGravarImagens(this.model.idTipoUnidade!),
        error: (e: unknown) => { this.toast.showError(msgErro(e)); this.saving = false; },
      });
    } else {
      this.service.create(this.model).subscribe({
        next: (created) => aposGravarImagens(created.idTipoUnidade!),
        error: (e: unknown) => { this.toast.showError(msgErro(e)); this.saving = false; },
      });
    }
  }

  cancel(): void { this.router.navigate(['/tipounidade']); }

  confirmDelete(): void {
    this.service.delete(this.model.idTipoUnidade!).subscribe({ next: () => this.router.navigate(['/tipounidade']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
