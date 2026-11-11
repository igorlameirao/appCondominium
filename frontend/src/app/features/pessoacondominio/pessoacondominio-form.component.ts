import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { PessoaCondominioService } from './pessoacondominio.service';
import { PessoaCondominio } from './pessoacondominio.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { PerfilAcessoLookupService } from '../../core/services/perfil-acesso-lookup.service';

@Component({
  selector: 'app-pessoacondominio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Pessoa Condominio</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>IdPessoa *</label>
              <input type="number" [(ngModel)]="model.idPessoa" name="idPessoa" [readonly]="fieldDisabled('idPessoa')" required />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Perfil de acesso *</label>
              <app-combobox-customizada
                [options]="fk_idPerfil"
                [(value)]="model.idPerfil"
                [disabled]="fieldDisabled('idPerfil')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 2; grid-row: 2" class="form-group fg-col-2">
              <label>DataInicio *</label>
              <app-campo-data [(ngModel)]="model.dataInicio" name="dataInicio" [disabled]="fieldDisabled('dataInicio')" [required]="true" />
            </div>
            <div style="grid-column: 3 / span 2; grid-row: 2" class="form-group fg-col-2">
              <label>TipoVinculo *</label>
              <select [(ngModel)]="model.tipoVinculo" name="tipoVinculo" [disabled]="fieldDisabled('tipoVinculo')" required>
                <option [ngValue]="null">Selecione…</option>
                <option [ngValue]="0">Administrador</option><option [ngValue]="1">Síndico</option><option [ngValue]="2">Subsíndico</option><option [ngValue]="3">Conselheiro</option><option [ngValue]="4">Funcionário Administração</option><option [ngValue]="5">Funcionário Manutenção</option><option [ngValue]="6">Visitante</option><option [ngValue]="7">Prestador Serviço</option>
              </select>
            </div>
            <div style="grid-column: 5 / span 2; grid-row: 2" class="form-group fg-col-2">
              <label>DataFim</label>
              <app-campo-data [(ngModel)]="model.dataFim" name="dataFim" [disabled]="fieldDisabled('dataFim')" />
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
  `
})
export class PessoaCondominioFormComponent implements OnInit {
  model: PessoaCondominio = {} as PessoaCondominio;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Pessoa Condominio';
  showDeleteConfirm = false;
  readonly permissionKey = 'PESSOACONDOMINIO';
  canEdit = true;
  canDelete = true;
  fk_idPerfil: ComboboxOption[] = [];

  constructor(
    private service: PessoaCondominioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private perfilAcessoLookup: PerfilAcessoLookupService,
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

  get pkDisplay(): string { return String(this.model.idPessoa) + ' / ' + String(this.model.idCondominio); }

  ngOnInit(): void {
    
    this.perfilAcessoLookup.listar().subscribe(r => {
      this.fk_idPerfil = r.map(x => ({ value: x.idPerfil, label: x.descricao }));
    });
    const idPessoa = this.route.snapshot.paramMap.get('idPessoa');
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idPessoa && idCondominio) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idPessoa, idCondominio).subscribe({
        next: (r) => this.model = r,
        error: () => this.toast.showError('Registro não encontrado.')
      });
    }
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoacondominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoacondominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoacondominio']); }

  confirmDelete(): void {
    this.service.delete(this.model.idPessoa!, this.model.idCondominio!).subscribe({ next: () => this.router.navigate(['/pessoacondominio']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
