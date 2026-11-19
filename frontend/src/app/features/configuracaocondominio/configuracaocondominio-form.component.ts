import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConfiguracaoCondominioService } from './configuracaocondominio.service';
import {
  ConfiguracaoCondominio,
  RETENCAO_MESES_OPCOES,
  RETENCAO_PADRAO_FOTOS_MESES,
  RETENCAO_PADRAO_HISTORICO_MESES,
  RETENCAO_PADRAO_SISTEMA,
} from './configuracaocondominio.model';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { LookupService } from '../../core/services/lookup.service';
import { HugImageUploadComponent } from '../../shared/hug-image-upload/hug-image-upload.component';
import { HugColorPickerComponent } from '../../shared/hug-color-picker/hug-color-picker.component';
import { forkJoin, Observable, of, Subscription, switchMap, map } from 'rxjs';

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
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Nova' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Nova' }} Configuração do Condomínio</h1>
          <p class="cad-subtitulo">Defina a identidade visual, as imagens e as regras de retenção do condomínio</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="abaCad === 'dados'"
              (click)="abaCad = 'dados'"
              [attr.aria-selected]="abaCad === 'dados'">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Configuração</span>
            </button>
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="abaCad === 'retencao'"
              (click)="abaCad = 'retencao'"
              [attr.aria-selected]="abaCad === 'retencao'">
              <app-icone nome="clock" [tamanho]="16" />
              <span>Retenção de Dados</span>
            </button>
          </div>
          <div class="form-scroll cad-form-scroll">
            <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-conteudo" role="tabpanel" [hidden]="abaCad !== 'dados'">
                <div class="cad-secao">
                  <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Dados de Configuração do Condomínio</h2>
                    <p class="cad-secao__texto">Cor padrão, imagem do login e ícone exibido no menu.</p>
                  </div>
                </div>
                <div class="cad-blocos config-condominio-form">
                  <app-hug-color-picker
                    class="config-condominio-form__cor"
                    label="Cor Padrão"
                    name="corPadrao"
                    [(ngModel)]="corHex"
                    [disabled]="!canEdit"
                    padrao="#0e7490" />

                  <div class="config-condominio-form__imagens">
                    <div class="config-condominio-form__imagem">
                      <app-hug-image-upload
                        label="Imagem do login"
                        layout="paisagem"
                        [varianteCard]="true"
                        [previewUrl]="previewLogin"
                        [carregando]="carregandoLogin"
                        tituloVazio="Nenhuma imagem cadastrada"
                        textoCarregando="Carregando imagem..."
                        [disabled]="!canEdit || !model.idCondominio || saving || carregandoLogin"
                        [maxMb]="5"
                        metaFormatos="Formatos: JPG, PNG ou WEBP"
                        dimensaoRecomendada="1920 × 1080"
                        (arquivoSelecionado)="selecionarImagem('imagem-login', $event)"
                        (removido)="marcarRemocaoImagem('imagem-login')" />
                      <p class="config-condominio-form__img-erro" *ngIf="erroLogin" role="alert">
                        {{ erroLogin }}
                        <button type="button" class="config-condominio-form__img-retry" (click)="tentarNovamenteImagem('imagem-login')">
                          Tentar novamente
                        </button>
                      </p>
                    </div>

                    <div class="config-condominio-form__imagem">
                      <app-hug-image-upload
                        label="Ícone do condomínio"
                        layout="quadrado"
                        [varianteCard]="true"
                        iconeZona="building"
                        accept="image/png,image/svg+xml"
                        metaFormatos="Formatos: PNG ou SVG"
                        dimensaoRecomendada="512 × 512"
                        [maxMb]="2"
                        [previewUrl]="previewIcone"
                        [carregando]="carregandoIcone"
                        tituloVazio="Nenhuma imagem cadastrada"
                        textoCarregando="Carregando imagem..."
                        [disabled]="!canEdit || !model.idCondominio || saving || carregandoIcone"
                        (arquivoSelecionado)="selecionarImagem('imagem-icone', $event)"
                        (removido)="marcarRemocaoImagem('imagem-icone')" />
                      <p class="config-condominio-form__img-erro" *ngIf="erroIcone" role="alert">
                        {{ erroIcone }}
                        <button type="button" class="config-condominio-form__img-retry" (click)="tentarNovamenteImagem('imagem-icone')">
                          Tentar novamente
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="cad-conteudo" role="tabpanel" [hidden]="abaCad !== 'retencao'">
                <div class="cad-secao">
                  <app-icone class="cad-secao__icone" nome="clock" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Retenção de Dados</h2>
                    <p class="cad-secao__texto">
                      Defina por quanto tempo manter o histórico de encomendas e as fotografias no armazenamento.
                    </p>
                  </div>
                </div>

                <div class="cad-blocos config-condominio-retencao">
                  <div class="form-grid config-condominio-retencao__campos">
                    <div class="form-group config-condominio-retencao__campo">
                      <label for="retencaoHistoricoEncomendas">Retenção do histórico de encomendas</label>
                      <select
                        id="retencaoHistoricoEncomendas"
                        name="retencaoHistoricoEncomendas"
                        [(ngModel)]="retencaoHistoricoSelecao"
                        [disabled]="!canEdit">
                        <option [ngValue]="sentinelaPadrao">
                          Padrão do sistema ({{ padraoHistoricoMeses }} meses)
                        </option>
                        <option [ngValue]="0">Tempo indeterminado</option>
                        <option *ngFor="let m of mesesOpcoes" [ngValue]="m">{{ m }} meses</option>
                      </select>
                      <p class="config-condominio-retencao__ajuda">
                        Controla por quanto tempo permanecem registros de encomendas finalizadas para consulta e auditoria
                        operacional no condomínio.
                      </p>
                    </div>

                    <div class="form-group config-condominio-retencao__campo">
                      <label for="retencaoFotosEncomendas">Retenção das fotografias</label>
                      <select
                        id="retencaoFotosEncomendas"
                        name="retencaoFotosEncomendas"
                        [(ngModel)]="retencaoFotosSelecao"
                        [disabled]="!canEdit">
                        <option [ngValue]="sentinelaPadrao">
                          Padrão do sistema ({{ padraoFotosMeses }} meses)
                        </option>
                        <option [ngValue]="0">Tempo indeterminado</option>
                        <option *ngFor="let m of mesesOpcoes" [ngValue]="m">{{ m }} meses</option>
                      </select>
                      <p class="config-condominio-retencao__ajuda">
                        Define o prazo de guarda das fotos tiradas no recebimento de encomendas, reduzindo a exposição
                        de imagens além do necessário.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
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
  abaCad: 'dados' | 'retencao' = 'dados';
  retencaoHistoricoSelecao = RETENCAO_PADRAO_SISTEMA;
  retencaoFotosSelecao = RETENCAO_PADRAO_SISTEMA;
  readonly sentinelaPadrao = RETENCAO_PADRAO_SISTEMA;
  readonly mesesOpcoes = [...RETENCAO_MESES_OPCOES];
  readonly padraoHistoricoMeses = RETENCAO_PADRAO_HISTORICO_MESES;
  readonly padraoFotosMeses = RETENCAO_PADRAO_FOTOS_MESES;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Configuração do Condomínio';
  showDeleteConfirm = false;
  previewLogin: string | null = null;
  previewIcone: string | null = null;
  carregandoLogin = false;
  carregandoIcone = false;
  erroLogin: string | null = null;
  erroIcone: string | null = null;
  readonly permissionKey = 'CONFIGURACAOCONDOMINIO';
  canEdit = true;
  canDelete = true;

  private pendenteImagem: Partial<Record<TipoImagem, File | null>> = {};
  private previewServidor: Partial<Record<TipoImagem, string | null>> = {};
  private downloadImagem: Partial<Record<TipoImagem, Subscription>> = {};
  private sincronizacaoImagensIniciada = false;

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
          const idCfg = cfg.idConfiguracao;
          if (idCfg) {
            this.pageLoad.run(
              this.service.getById(idCfg),
              full => {
                this.model = this.normalizarImagens(full);
                this.prepararCarregamentoImagens(cfg);
              },
              () => {
                this.model = this.normalizarImagens(cfg);
                this.prepararCarregamentoImagens(cfg);
              }
            );
            return;
          }
          this.model = this.normalizarImagens(cfg);
          this.prepararCarregamentoImagens(cfg);
        },
        () => {
          this.model = { idCondominio: idCond, corPadrao: '#0e7490' } as ConfiguracaoCondominio;
          this.sincronizarRetencaoDoModelo();
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
          this.prepararCarregamentoImagens();
        },
        () => this.toast.showError('Registro não encontrado.')
      );
    }
    this.pageLoad.seal();
  }

  private normalizarImagens(cfg: ConfiguracaoCondominio): ConfiguracaoCondominio {
    const m = { ...cfg };
    if (m.corPadrao && !m.corPadrao.startsWith('#')) m.corPadrao = `#${m.corPadrao}`;
    this.sincronizarRetencaoDoModelo(m);
    return m;
  }

  private sincronizarRetencaoDoModelo(cfg?: ConfiguracaoCondominio): void {
    const base = cfg ?? this.model;
    this.retencaoHistoricoSelecao = this.selecaoDeValor(base.retencaoHistoricoEncomendasMeses);
    this.retencaoFotosSelecao = this.selecaoDeValor(base.retencaoFotosEncomendasMeses);
  }

  private selecaoDeValor(gravado?: number | null): number {
    if (gravado === null || gravado === undefined) return RETENCAO_PADRAO_SISTEMA;
    return gravado;
  }

  private valorDeSelecao(selecao: number): number | null {
    if (selecao === RETENCAO_PADRAO_SISTEMA) return null;
    return selecao;
  }

  ngOnDestroy(): void {
    this.cancelarDownloads();
    this.revogarPreview('imagem-login');
    this.revogarPreview('imagem-icone');
    this.revogarServidor('imagem-login');
    this.revogarServidor('imagem-icone');
  }

  tentarNovamenteImagem(tipo: TipoImagem): void {
    const id = this.model.idCondominio;
    if (!id) return;
    this.definirErro(tipo, null);
    this.iniciarDownload(id, tipo);
  }

  private prepararCarregamentoImagens(cfgPublica?: ConfiguracaoCondominio): void {
    const id = this.model.idCondominio;
    if (!id || this.sincronizacaoImagensIniciada) return;
    this.sincronizacaoImagensIniciada = true;

    const aplicar = (pub: ConfiguracaoCondominio | null) => {
      if (pub) {
        this.model = {
          ...this.model,
          temImagemLogin: pub.temImagemLogin,
          temImagemIcone: pub.temImagemIcone,
        };
      }
      this.sincronizarPreviewsDesdeFlags(id);
    };

    if (cfgPublica) {
      aplicar(cfgPublica);
      return;
    }

    this.lookup.configuracaoPorCondominio(id).subscribe({
      next: pub => aplicar(pub),
      error: () => aplicar(null),
    });
  }

  private sincronizarPreviewsDesdeFlags(id: number): void {
    this.avaliarTipoImagem(id, 'imagem-login');
    this.avaliarTipoImagem(id, 'imagem-icone');
  }

  private avaliarTipoImagem(id: number, tipo: TipoImagem): void {
    if (tipo in this.pendenteImagem) return;
    const cadastrada = tipo === 'imagem-login' ? this.model.temImagemLogin : this.model.temImagemIcone;
    if (cadastrada === false) {
      this.finalizarSemImagem(tipo);
      return;
    }
    this.iniciarDownload(id, tipo);
  }

  private iniciarDownload(id: number, tipo: TipoImagem): void {
    if (tipo in this.pendenteImagem) return;
    this.downloadImagem[tipo]?.unsubscribe();
    this.definirCarregando(tipo, true);
    this.definirErro(tipo, null);
    if (!(tipo in this.pendenteImagem)) this.definirPreview(tipo, null);

    this.downloadImagem[tipo] = this.service.baixarImagem(id, tipo).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.revogarServidor(tipo);
        this.previewServidor[tipo] = url;
        if (tipo === 'imagem-login') this.model.temImagemLogin = true;
        else this.model.temImagemIcone = true;
        if (!(tipo in this.pendenteImagem)) this.definirPreview(tipo, url);
        this.definirCarregando(tipo, false);
      },
      error: (e: { status?: number }) => {
        if (!(tipo in this.pendenteImagem)) this.definirPreview(tipo, null);
        this.definirCarregando(tipo, false);
        if (e?.status === 404) {
          if (tipo === 'imagem-login') this.model.temImagemLogin = false;
          else this.model.temImagemIcone = false;
          this.finalizarSemImagem(tipo);
          return;
        }
        this.definirErro(tipo, 'Não foi possível carregar a imagem.');
      },
    });
  }

  private finalizarSemImagem(tipo: TipoImagem): void {
    if (tipo in this.pendenteImagem) return;
    this.definirErro(tipo, null);
    this.definirCarregando(tipo, false);
    this.definirPreview(tipo, null);
  }

  private cancelarDownloads(): void {
    (['imagem-login', 'imagem-icone'] as TipoImagem[]).forEach(tipo => {
      this.downloadImagem[tipo]?.unsubscribe();
      delete this.downloadImagem[tipo];
    });
  }

  private definirCarregando(tipo: TipoImagem, valor: boolean): void {
    if (tipo === 'imagem-login') this.carregandoLogin = valor;
    else this.carregandoIcone = valor;
  }

  private definirErro(tipo: TipoImagem, msg: string | null): void {
    if (tipo === 'imagem-login') this.erroLogin = msg;
    else this.erroIcone = msg;
  }

  selecionarImagem(tipo: TipoImagem, arquivo: File): void {
    this.downloadImagem[tipo]?.unsubscribe();
    delete this.downloadImagem[tipo];
    this.definirCarregando(tipo, false);
    this.definirErro(tipo, null);
    this.pendenteImagem[tipo] = arquivo;
    this.definirPreview(tipo, URL.createObjectURL(arquivo));
  }

  marcarRemocaoImagem(tipo: TipoImagem): void {
    this.downloadImagem[tipo]?.unsubscribe();
    delete this.downloadImagem[tipo];
    this.definirCarregando(tipo, false);
    this.definirErro(tipo, null);
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
    p.retencaoHistoricoEncomendasMeses = this.valorDeSelecao(this.retencaoHistoricoSelecao);
    p.retencaoFotosEncomendasMeses = this.valorDeSelecao(this.retencaoFotosSelecao);
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
