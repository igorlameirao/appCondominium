import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { PessoafisicaService } from './pessoafisica.service';
import { Pessoafisica } from './pessoafisica.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';


@Component({
  selector: 'app-pessoafisica-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/pessoafisica'">pessoafisica</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} pessoafisica</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de pessoafisica</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="user" [tamanho]="16" />
              <span>Dados de pessoafisica</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="user" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de pessoafisica</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>IdPessoa *</label>
              <input type="number" [(ngModel)]="model.idPessoa" name="idPessoa" [readonly]="fieldDisabled('idPessoa')" required />
            </div>
            <div style="grid-column: 3 / span 5; grid-row: 1" class="form-group fg-col-6">
              <label>Senha</label>
              <input type="password" [(ngModel)]="model.senha" name="senha" autocomplete="new-password" />
            </div>
            <div style="grid-column: 8 / span 3; grid-row: 1" class="form-group fg-col-3">
              <label>Data de Nascimento *</label>
              <app-campo-data [(ngModel)]="model.dataNascimento" name="dataNascimento" [disabled]="fieldDisabled('dataNascimento')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
              <label>e-mail</label>
              <input type="text" [(ngModel)]="model.email" name="email" maxlength="255" [readonly]="fieldDisabled('email')" />
            </div>
          </div>
        </form></div>
          </div>
          <div class="actions form-actions cad-acoes">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Salvar</button>
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
export class PessoafisicaFormComponent implements OnInit {
  model: Pessoafisica = {} as Pessoafisica;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'pessoafisica';
  showDeleteConfirm = false;
  readonly permissionKey = 'PESSOAFISICA';
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: PessoafisicaService,
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

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  get pkDisplay(): string { return String(this.model.idPessoa); }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    const idPessoa = this.route.snapshot.paramMap.get('idPessoa');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      
      return;
    }
    if (idPessoa) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idPessoa), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
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
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoafisica']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoafisica']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoafisica']); }

  confirmDelete(): void {
    this.service.delete(this.model.idPessoa!).subscribe({ next: () => this.router.navigate(['/pessoafisica']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
