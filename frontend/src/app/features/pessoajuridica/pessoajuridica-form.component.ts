import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { PessoaJuridicaService } from './pessoajuridica.service';
import { PessoaJuridica } from './pessoajuridica.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-pessoajuridica-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Pessoa Jurídica</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>IdPessoa *</label>
              <input type="number" [(ngModel)]="model.idPessoa" name="idPessoa" [readonly]="fieldDisabled('idPessoa')" required />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>IdResponsavel *</label>
              <app-combobox-customizada
                [options]="fk_idResponsavel"
                [(value)]="model.idResponsavel"
                [disabled]="fieldDisabled('idResponsavel')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
              <label>Nome Fantasia</label>
              <input type="text" [(ngModel)]="model.nomeFantasia" name="nomeFantasia" maxlength="255" [readonly]="fieldDisabled('nomeFantasia')" />
            </div>
            <div style="grid-column: 1 / span 3; grid-row: 3" class="form-group fg-col-3">
              <label>Inscrição Estadual</label>
              <input type="text" [(ngModel)]="model.inscricaoEstadual" name="inscricaoEstadual" maxlength="40" [readonly]="fieldDisabled('inscricaoEstadual')" />
            </div>
            <div style="grid-column: 4 / span 3; grid-row: 3" class="form-group fg-col-3">
              <label>Inscrição Municipal</label>
              <input type="text" [(ngModel)]="model.inscricaoMunicipal" name="inscricaoMunicipal" maxlength="40" [readonly]="fieldDisabled('inscricaoMunicipal')" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Data de Fundacao</label>
              <app-campo-data [(ngModel)]="model.dataFundacao" name="dataFundacao" [disabled]="fieldDisabled('dataFundacao')" />
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
export class PessoaJuridicaFormComponent implements OnInit {
  model: PessoaJuridica = {} as PessoaJuridica;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Pessoa Jurídica';
  showDeleteConfirm = false;
  readonly permissionKey = 'PESSOAJURIDICA';
  canEdit = true;
  canDelete = true;
  fk_idResponsavel: ComboboxOption[] = [];

  constructor(
    private service: PessoaJuridicaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private pessoafisicaService: PessoafisicaService,
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
    
    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idResponsavel = r.items.map((x: any) => ({
        value: x.idResponsavel,
        label: this.fkLabel_idResponsavel(x)
      }));
    });
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
      this.service.getById(idPessoa).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoajuridica']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/pessoajuridica']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoajuridica']); }

  confirmDelete(): void {
    this.service.delete(this.model.idPessoa!).subscribe({ next: () => this.router.navigate(['/pessoajuridica']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idResponsavel(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
