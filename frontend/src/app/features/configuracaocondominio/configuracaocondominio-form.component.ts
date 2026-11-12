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
import { ArquivoAnexoComponent } from '../../shared/arquivo-anexo/arquivo-anexo.component';
import { LookupService } from '../../core/services/lookup.service';

@Component({
  selector: 'app-configuracaocondominio-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, ArquivoAnexoComponent],
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
              <span>Dados de Configuração do Condomínio</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Configuração do Condomínio</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id Configuração</label>
              <input type="text" [value]="model.idConfiguracao" readonly class="readonly" />
            </div>
            <app-arquivo-anexo style="grid-column: 3 / span 6; grid-row: 1" class="fg-col-6"
              label="Imagem Tela de Login"
              modo="imagem"
              [previewUrl]="previewLogin"
              [disabled]="!canEdit || !model.idCondominio"
              [maxMb]="5"
              (arquivoSelecionado)="enviarImagem('imagem-login', $event)"
              (removido)="removerImagem('imagem-login')" />
            <app-arquivo-anexo style="grid-column: 1 / span 6; grid-row: 2" class="fg-col-6"
              label="Ícone do Condomínio"
              modo="imagem"
              [previewUrl]="previewIcone"
              [disabled]="!canEdit || !model.idCondominio"
              [maxMb]="2"
              (arquivoSelecionado)="enviarImagem('imagem-icone', $event)"
              (removido)="removerImagem('imagem-icone')" />
            <div style="grid-column: 7 / span 2; grid-row: 2" class="form-group fg-col-2">
              <label>Cor Padrão (RT-Gerais 13)</label>
              <input type="color" [(ngModel)]="corHex" name="corPadrao" [disabled]="!canEdit" />
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
  styles: [`
    .form-sub { margin: -8px 0 16px; color: #64748b; font-size: 13px; }
    .img-grid { align-items: start; margin-top: 16px; }
  `]
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
      this.pageLoad.run(this.service.getById(idConfiguracao), (r) => {
        this.model = this.normalizarImagens(r);
        this.carregarPreviews();
      }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  /** API não devolve mais as imagens no JSON. */
  private normalizarImagens(cfg: ConfiguracaoCondominio): ConfiguracaoCondominio {
    const m = { ...cfg };
    if (m.corPadrao && !m.corPadrao.startsWith('#')) m.corPadrao = `#${m.corPadrao}`;
    return m;
  }

  ngOnDestroy(): void {
    this.definirPreview('imagem-login', null);
    this.definirPreview('imagem-icone', null);
  }

  private carregarPreviews(): void {
    const id = this.model.idCondominio;
    if (!id) return;
    if (this.model.temImagemLogin !== false) this.baixarPreview(id, 'imagem-login');
    if (this.model.temImagemIcone !== false) this.baixarPreview(id, 'imagem-icone');
  }

  private baixarPreview(id: number, tipo: 'imagem-login' | 'imagem-icone'): void {
    this.service.baixarImagem(id, tipo).subscribe({
      next: blob => this.definirPreview(tipo, URL.createObjectURL(blob)),
      error: () => this.definirPreview(tipo, null)
    });
  }

  enviarImagem(tipo: 'imagem-login' | 'imagem-icone', arquivo: File): void {
    const id = this.model.idCondominio;
    if (!id) return;
    this.service.enviarImagem(id, tipo, arquivo).subscribe({
      next: () => {
        this.definirPreview(tipo, URL.createObjectURL(arquivo));
        this.toast.showSuccess('Imagem atualizada.');
      },
      error: () => this.toast.showError('Não foi possível gravar a imagem.')
    });
  }

  removerImagem(tipo: 'imagem-login' | 'imagem-icone'): void {
    const id = this.model.idCondominio;
    if (!id) return;
    this.service.removerImagem(id, tipo).subscribe({
      next: () => {
        this.definirPreview(tipo, null);
        this.toast.showSuccess('Imagem removida.');
      },
      error: () => this.toast.showError('Não foi possível remover a imagem.')
    });
  }

  private definirPreview(tipo: 'imagem-login' | 'imagem-icone', url: string | null): void {
    const atual = tipo === 'imagem-login' ? this.previewLogin : this.previewIcone;
    if (atual?.startsWith('blob:')) URL.revokeObjectURL(atual);
    if (tipo === 'imagem-login') this.previewLogin = url;
    else this.previewIcone = url;
  }

  private payload(): ConfiguracaoCondominio {
    const p = { ...this.model };
    if (p.corPadrao?.startsWith('#')) p.corPadrao = p.corPadrao.slice(1);
    delete p.temImagemLogin;
    delete p.temImagemIcone;
    return p;
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    const body = this.payload();
    if (this.isEdit && this.model.idConfiguracao) {
      this.service.update(body).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/configuracaocondominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(body).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/configuracaocondominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/configuracaocondominio']); }

  confirmDelete(): void {
    const id = this.model.idConfiguracao;
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.router.navigate(['/configuracaocondominio']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }
}
