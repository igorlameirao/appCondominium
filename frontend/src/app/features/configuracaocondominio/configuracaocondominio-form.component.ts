import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
          <div class="grid grid-id" *ngIf="isEdit">
            <div class="form-group">
              <label>Id Configuração</label>
              <input type="text" [value]="model.idConfiguracao" readonly class="readonly" />
            </div>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label>Cor Padrão (RT-Gerais 13)</label>
              <input type="color" [(ngModel)]="corHex" name="corPadrao" [disabled]="!canEdit" />
            </div>
          </div>
          <div class="grid grid-2 img-grid">
            <app-imagem-upload
              label="Imagem Tela de Login"
              [(value)]="model.imagemLogin"
              [disabled]="!canEdit"
              [maxMb]="5" />
            <app-imagem-upload
              label="Ícone do Condomínio"
              [(value)]="model.imagemIcone"
              [disabled]="!canEdit"
              [maxMb]="2" />
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !canEdit">Gravar</button>
        <button type="button" class="btn-cancelar" (click)="cancel()">Cancelar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
      <div class="msg-erro" *ngIf="formError">{{ formError }}</div>
    </div>
    <div class="confirm-overlay" *ngIf="showDeleteConfirm">
      <div class="confirm-modal">
        <p>Deseja realmente excluir este registro?</p>
        <button type="button" class="btn-cancelar" (click)="showDeleteConfirm=false">Cancelar</button>
        <button type="button" class="btn-excluir" (click)="confirmDelete()">Excluir</button>
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
  formError = '';
  showDeleteConfirm = false;
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
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
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
      const idCond = this.condominioCtx.idCondominio;
      if (!idCond) {
        this.formError = 'Selecione um condomínio no login (RT-Gerais 12).';
        return;
      }
      this.model.idCondominio = idCond;
      this.lookup.configuracaoPorCondominio(idCond).subscribe({
        next: cfg => {
          this.isEdit = true;
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
      this.service.getById(idConfiguracao).subscribe({
        next: (r) => this.model = this.normalizarImagens(r),
        error: () => this.formError = 'Registro não encontrado.'
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
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    const body = this.payload();
    if (this.isEdit && this.model.idConfiguracao) {
      this.service.update(body).subscribe({
        next: () => this.router.navigate(['/configuracaocondominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(body).subscribe({
        next: () => this.router.navigate(['/configuracaocondominio']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/configuracaocondominio']); }

  confirmDelete(): void {
    const id = this.model.idConfiguracao;
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.router.navigate(['/configuracaocondominio']) });
  }
}
