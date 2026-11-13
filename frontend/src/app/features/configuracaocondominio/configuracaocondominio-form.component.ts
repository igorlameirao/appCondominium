import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConfiguracaoCondominioService } from './configuracaocondominio.service';
import { ConfiguracaoCondominio } from './configuracaocondominio.model';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { LookupService } from '../../core/services/lookup.service';
import { HugImageUploadComponent } from '../../shared/hug-image-upload/hug-image-upload.component';
import { HugColorPickerComponent } from '../../shared/hug-color-picker/hug-color-picker.component';
import { forkJoin, Observable, of, switchMap, map } from 'rxjs';

type TipoImagem = 'imagem-login' | 'imagem-icone';

@Component({
  selector: 'app-configuracaocondominio-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    ListLoadingModalComponent,
    FormsModule,
    HugImageUploadComponent,
    HugColorPickerComponent,
  ],
  host: { class: 'form-page' },
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/configuracaocondominio'">Configuração do Condomínio</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Configuração do Condomínio</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de configuração do condomínio</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Configuração</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Configuração do Condomínio</h2>
                <p class="cad-secao__texto">Informe as informações principais.</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <div class="cad-blocos config-condominio-form">
                  <app-hug-color-picker
                    class="config-condominio-form__cor"
                    label="Cor Padrão"
                    name="corPadrao"
                    [(ngModel)]="corHex"
                    [disabled]="!canEdit"
                    padrao="#0e7490" />

                  <div class="config-condominio-form__imagens">
                    <app-hug-image-upload
                      label="Imagem Tela de Login"
                      layout="paisagem"
                      [varianteCard]="true"
                      [previewUrl]="previewLogin"
                      [disabled]="!canEdit || !model.idCondominio || saving"
                      [maxMb]="5"
                      metaFormatos="Formatos: JPG, PNG ou WEBP"
                      dimensaoRecomendada="1920 × 1080"
                      (arquivoSelecionado)="selecionarImagem('imagem-login', $event)"
                      (removido)="marcarRemocaoImagem('imagem-login')" />

                    <app-hug-image-upload
                      label="Ícone do Condomínio"
                      layout="quadrado"
                      [varianteCard]="true"
                      iconeZona="building"
                      accept="image/png,image/svg+xml"
                      metaFormatos="Formatos: PNG ou SVG"
                      dimensaoRecomendada="512 × 512"
                      [maxMb]="2"
                      [previewUrl]="previewIcone"
                      [disabled]="!canEdit || !model.idCondominio || saving"
                      (arquivoSelecionado)="selecionarImagem('imagem-icone', $event)"
                      (removido)="marcarRemocaoImagem('imagem-icone')" />
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
})
export class ConfiguracaoCondominioFormComponent implements OnInit, OnDestroy {
  model: ConfiguracaoCondominio = { idCondominio: 0, idConfiguracao: 0 };
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Configuração do Condomínio';
  showDeleteConfirm = false;
  previewLogin: string | null = null;
  previewIcone: string | null = null;
  readonly permissionKey = 'CONFIGURACAOCONDOMINIO';
  canEdit = true;
  canDelete = true;

  private pendenteImagem: Partial<Record<TipoImagem, File | null>> = {};
  private previewServidor: Partial<Record<TipoImagem, string | null>> = {};

  constructor(
    private service: ConfiguracaoCondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    public condominioCtx: CondominioContextService,
    private lookup: LookupService
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

  get corHex(): string {
    const c = this.model.corPadrao;
    if (!c) return '#0e7490';
    return c.startsWith('#') ? c : `#${c}`;
  }
  set corHex(v: string) {
    this.model.corPadrao = v;
  }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    const idConfiguracao = this.route.snapshot.paramMap.get('idConfiguracao');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');

    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      const idCond = this.condominioCtx.idCondominio;
      if (!idCond) {
        this.toast.showError('Selecione um condomínio no login (RT-Gerais 12).');
        return;
      }
      this.model.idCondominio = idCond;
      this.pageLoad.beginEdit();
      this.pageLoad.run(
        this.lookup.configuracaoPorCondominio(idCond),
        cfg => {
          this.isEdit = true;
          this.refreshPermissions();
          this.model = this.normalizarImagens(cfg);
          this.carregarPreviews();
        },
        () => {
          this.model = { idCondominio: idCond, corPadrao: '#0e7490' } as ConfiguracaoCondominio;
        }
      );
      return;
    }

    if (idConfiguracao) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(
        this.service.getById(idConfiguracao),
        r => {
          this.model = this.normalizarImagens(r);
          this.carregarPreviews();
        },
        () => this.toast.showError('Registro não encontrado.')
      );
    }
    this.pageLoad.seal();
  }

  private normalizarImagens(cfg: ConfiguracaoCondominio): ConfiguracaoCondominio {
    const m = { ...cfg };
    if (m.corPadrao && !m.corPadrao.startsWith('#')) m.corPadrao = `#${m.corPadrao}`;
    return m;
  }

  ngOnDestroy(): void {
    this.revogarPreview('imagem-login');
    this.revogarPreview('imagem-icone');
    this.revogarServidor('imagem-login');
    this.revogarServidor('imagem-icone');
  }

  private carregarPreviews(): void {
    const id = this.model.idCondominio;
    if (!id) return;
    if (this.model.temImagemLogin !== false) this.baixarPreview(id, 'imagem-login');
    if (this.model.temImagemIcone !== false) this.baixarPreview(id, 'imagem-icone');
  }

  private baixarPreview(id: number, tipo: TipoImagem): void {
    this.service.baixarImagem(id, tipo).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.revogarServidor(tipo);
        this.previewServidor[tipo] = url;
        if (!(tipo in this.pendenteImagem)) this.definirPreview(tipo, url);
      },
      error: () => {
        if (!(tipo in this.pendenteImagem)) this.definirPreview(tipo, null);
      },
    });
  }

  selecionarImagem(tipo: TipoImagem, arquivo: File): void {
    this.pendenteImagem[tipo] = arquivo;
    this.definirPreview(tipo, URL.createObjectURL(arquivo));
  }

  marcarRemocaoImagem(tipo: TipoImagem): void {
    this.pendenteImagem[tipo] = null;
    this.definirPreview(tipo, null);
  }

  private definirPreview(tipo: TipoImagem, url: string | null): void {
    this.revogarPreview(tipo);
    if (tipo === 'imagem-login') this.previewLogin = url;
    else this.previewIcone = url;
  }

  private revogarPreview(tipo: TipoImagem): void {
    const atual = tipo === 'imagem-login' ? this.previewLogin : this.previewIcone;
    const servidor = this.previewServidor[tipo];
    if (atual?.startsWith('blob:') && atual !== servidor) URL.revokeObjectURL(atual);
    if (tipo === 'imagem-login') this.previewLogin = null;
    else this.previewIcone = null;
  }

  private revogarServidor(tipo: TipoImagem): void {
    const url = this.previewServidor[tipo];
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    delete this.previewServidor[tipo];
  }

  private payload(): ConfiguracaoCondominio {
    const p = { ...this.model };
    if (p.corPadrao?.startsWith('#')) p.corPadrao = p.corPadrao.slice(1);
    delete p.temImagemLogin;
    delete p.temImagemIcone;
    return p;
  }

  private aplicarPendenciasImagem(): Observable<void> {
    const id = this.model.idCondominio;
    if (!id) return of(void 0);

    const ops: Observable<void>[] = [];
    (['imagem-login', 'imagem-icone'] as TipoImagem[]).forEach(tipo => {
      if (!(tipo in this.pendenteImagem)) return;
      const pendente = this.pendenteImagem[tipo];
      if (pendente === null) ops.push(this.service.removerImagem(id, tipo));
      else if (pendente instanceof File) ops.push(this.service.enviarImagem(id, tipo, pendente));
    });

    if (!ops.length) return of(void 0);
    return forkJoin(ops).pipe(switchMap(() => of(void 0)));
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    this.saving = true;
    const body = this.payload();
    const salvar$: Observable<ConfiguracaoCondominio | null> =
      this.isEdit && this.model.idConfiguracao
        ? this.service.update(body).pipe(map(() => null))
        : this.service.create(body);

    salvar$
      .pipe(
        switchMap((created: ConfiguracaoCondominio | null) => {
          if (created?.idConfiguracao) {
            this.model.idConfiguracao = created.idConfiguracao;
            this.isEdit = true;
          }
          return this.aplicarPendenciasImagem();
        })
      )
      .subscribe({
        next: () => {
          this.pendenteImagem = {};
          this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : `${this.entityTitle} gravado com sucesso.`);
          this.router.navigate(['/configuracaocondominio']);
        },
        error: (e: unknown) => {
          this.toast.showError(
            (typeof (e as { error?: unknown })?.error === 'string' ? (e as { error: string }).error : null) ??
              (e as { error?: { title?: string; message?: string } })?.error?.title ??
              (e as { error?: { message?: string } })?.error?.message ??
              (e as { message?: string })?.message ??
              'Não foi possível salvar. Tente novamente.'
          );
          this.saving = false;
        },
        complete: () => {
          this.saving = false;
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/configuracaocondominio']);
  }

  confirmDelete(): void {
    const id = this.model.idConfiguracao;
    if (!id) return;
    this.service.delete(id).subscribe({
      next: () => this.router.navigate(['/configuracaocondominio']),
      error: () => this.toast.showError('Não foi possível excluir. Tente novamente.'),
    });
  }
}
