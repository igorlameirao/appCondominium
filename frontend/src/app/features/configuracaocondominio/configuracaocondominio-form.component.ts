import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConfiguracaoCondominioService } from './configuracaocondominio.service';
import { ConfiguracaoCondominio } from './configuracaocondominio.model';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { ImagemUploadComponent } from '../../shared/imagem-upload/imagem-upload.component';
import { LookupService } from '../../core/services/lookup.service';

@Component({
  selector: 'app-configuracaocondominio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ImagemUploadComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Nova' }} Configuração do Condomínio</h2>
      <p class="form-sub" *ngIf="condominioCtx.idCondominio">
        Condomínio #{{ condominioCtx.idCondominio }} (RT-Gerais 12)
      </p>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id Configuração</label>
              <input type="text" [value]="model.idConfiguracao" readonly class="readonly" />
            </div>
            <app-imagem-upload style="grid-column: 3 / span 6; grid-row: 1" class="fg-col-6"
              label="Imagem Tela de Login"
              [(value)]="model.imagemLogin"
              [disabled]="!canEdit"
              [maxMb]="5" />
            <app-imagem-upload style="grid-column: 1 / span 6; grid-row: 2" class="fg-col-6"
              label="Ícone do Condomínio"
              [(value)]="model.imagemIcone"
              [disabled]="!canEdit"
              [maxMb]="2" />
            <div style="grid-column: 7 / span 2; grid-row: 2" class="form-group fg-col-2">
              <label>Cor Padrão (RT-Gerais 13)</label>
              <input type="color" [(ngModel)]="corHex" name="corPadrao" [disabled]="!canEdit" />
            </div>
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Gravar</button>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
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
  `,
  styles: [`
    .form-sub { margin: -8px 0 16px; color: #64748b; font-size: 13px; }
    .img-grid { align-items: start; margin-top: 16px; }
  `]
})
export class ConfiguracaoCondominioFormComponent implements OnInit {
  model: ConfiguracaoCondominio = { idCondominio: 0, idConfiguracao: 0 };
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Configuração do Condomínio';
  showDeleteConfirm = false;
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
      this.lookup.configuracaoPorCondominio(idCond).subscribe({
        next: cfg => {
          this.isEdit = true;
          this.refreshPermissions();
          this.model = this.normalizarImagens(cfg);
        },
        error: () => {
          this.model = { idCondominio: idCond, corPadrao: '#0e7490' } as ConfiguracaoCondominio;
        }
      });
      return;
    }

    if (idConfiguracao) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idConfiguracao).subscribe({
        next: (r) => this.model = this.normalizarImagens(r),
        error: () => this.toast.showError('Registro não encontrado.')
      });
    }
  }

  /** API retorna byte[] como base64 string no JSON. */
  private normalizarImagens(cfg: ConfiguracaoCondominio): ConfiguracaoCondominio {
    const m = { ...cfg };
    if (m.corPadrao && !m.corPadrao.startsWith('#')) m.corPadrao = `#${m.corPadrao}`;
    return m;
  }

  private payload(): ConfiguracaoCondominio {
    const p = { ...this.model };
    if (p.corPadrao?.startsWith('#')) p.corPadrao = p.corPadrao.slice(1);
    if (!p.imagemLogin) delete p.imagemLogin;
    if (!p.imagemIcone) delete p.imagemIcone;
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
