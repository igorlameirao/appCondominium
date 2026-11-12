import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { UFService } from './uf.service';
import { UF } from './uf.model';
import { PermissionService } from '../../core/services/permission.service';
import { LookupService, MunicipioResumo } from '../../core/services/lookup.service';

@Component({
  selector: 'app-uf-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/uf'">UF</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} UF</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de UF</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="map-pin" [tamanho]="16" />
              <span>Dados de UF</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de UF</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid uf-dados">
            <div class="form-group uf-dados__sigla">
              <label>Sigla UF *</label>
              <input type="text" [(ngModel)]="model.siglaUF" name="siglaUF" maxlength="2"
                [readonly]="isEdit || fieldDisabled('siglaUF')" style="text-transform: uppercase" required />
            </div>
            <div class="form-group uf-dados__estado">
              <label>Estado *</label>
              <input type="text" [(ngModel)]="model.estado" name="estado" maxlength="150" [readonly]="fieldDisabled('estado')" required />
            </div>
            <div class="form-group uf-dados__ibge">
              <label>Código IBGE *</label>
              <input type="number" [(ngModel)]="model.codigoIBGE" name="codigoIBGE" [readonly]="fieldDisabled('codigoIBGE')" required />
            </div>
          </div>

          <section class="child-list" *ngIf="isEdit && model.siglaUF">
            <h3>Municípios desta UF</h3>
            <ul *ngIf="municipios.length; else semMunicipios">
              <li *ngFor="let m of municipios">
                <span class="child-list__code">{{ m.codigoIBGEMunicipio }}</span>
                {{ m.nome }}
              </li>
            </ul>
            <ng-template #semMunicipios>
              <p class="child-list__empty">Nenhum município cadastrado para esta UF.</p>
            </ng-template>
          </section>
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
    .uf-dados {
      grid-template-columns: 6.75rem minmax(0, 1fr) 8rem;
    }
    .child-list { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .child-list h3 { margin: 0 0 12px; font-size: 16px; color: #0f172a; }
    .child-list ul { list-style: none; margin: 0; padding: 0; max-height: 240px; overflow-y: auto; }
    .child-list li { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .child-list__code { color: #64748b; margin-right: 8px; font-size: 12px; }
    .child-list__empty { color: #64748b; font-style: italic; }
    @media (max-width: 720px) {
      .uf-dados { grid-template-columns: 1fr; }
    }
  `]
})
export class UFFormComponent implements OnInit {
  model: UF = {} as UF;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'UF';
  showDeleteConfirm = false;
  readonly permissionKey = 'UF';
  canEdit = true;
  canDelete = true;
  municipios: MunicipioResumo[] = [];

  constructor(
    private service: UFService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
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

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    const siglaUF = this.route.snapshot.paramMap.get('siglaUF');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      return;
    }
    if (siglaUF) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(siglaUF), (r) => {
          this.model = r;
          this.carregarMunicipios();
        }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  private carregarMunicipios(): void {
    if (!this.model.siglaUF) return;
    this.pageLoad.run(
      this.lookup.municipiosPorUf(this.model.siglaUF),
      list => this.municipios = list,
      () => { this.municipios = []; }
    );
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (this.isEdit && field === 'siglaUF') return true;
    return false;
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    if (this.model.siglaUF) this.model.siglaUF = this.model.siglaUF.toUpperCase();
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/uf']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/uf']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/uf']); }

  confirmDelete(): void {
    const id = this.model.siglaUF ?? this.route.snapshot.paramMap.get('siglaUF');
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.router.navigate(['/uf']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }
}
