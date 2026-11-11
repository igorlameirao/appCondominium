import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AlocacaoMaterialService } from './alocacaomaterial.service';
import { AlocacaoMaterial } from './alocacaomaterial.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { MaterialService } from '../material/material.service';
import { PessoaCondominioService } from '../pessoacondominio/pessoacondominio.service';
import { LocalService } from '../local/local.service';

@Component({
  selector: 'app-alocacaomaterial-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Alocação de Material</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id do Material *</label>
              <app-combobox-customizada
                [options]="fk_idMaterial"
                [(value)]="model.idMaterial"
                [disabled]="fieldDisabled('idMaterial')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Locatario *</label>
              <app-combobox-customizada
                [options]="fk_idPessoa"
                [(value)]="model.idPessoa"
                [disabled]="fieldDisabled('idPessoa')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 4; grid-row: 2" class="form-group fg-col-4">
              <label>Data/Hora Início *</label>
              <app-campo-data-hora [(ngModel)]="model.dataHoraInicio" name="dataHoraInicio" [disabled]="fieldDisabled('dataHoraInicio')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
              <label>Local de Alocação *</label>
              <app-combobox-customizada
                [options]="fk_idLocal"
                [(value)]="model.idLocal"
                [disabled]="fieldDisabled('idLocal')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 4; grid-row: 3" class="form-group fg-col-4">
              <label>Data/Hora Início</label>
              <app-campo-data-hora [(ngModel)]="model.dataHoraFim" name="dataHoraFim" [disabled]="fieldDisabled('dataHoraFim')" />
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
export class AlocacaoMaterialFormComponent implements OnInit {
  model: AlocacaoMaterial = {} as AlocacaoMaterial;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Alocação de Material';
  showDeleteConfirm = false;
  readonly permissionKey = 'ALOCACAOMATERIAL';
  canEdit = true;
  canDelete = true;
  fk_idMaterial: ComboboxOption[] = [];
  fk_idPessoa: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];

  constructor(
    private service: AlocacaoMaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private materialService: MaterialService,
    private pessoaCondominioService: PessoaCondominioService,
    private localService: LocalService,
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

  get pkDisplay(): string { return String(this.model.idAlocacaoMaterial); }

  ngOnInit(): void {
    
    this.materialService.getPaged(1, 200).subscribe(r => {
      this.fk_idMaterial = r.items.map((x: any) => ({
        value: x.idMaterial,
        label: this.fkLabel_idMaterial(x)
      }));
    });

    this.pessoaCondominioService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoa = r.items.map((x: any) => ({
        value: x.idPessoa,
        label: this.fkLabel_idPessoa(x)
      }));
    });

    this.localService.getPaged(1, 200).subscribe(r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });
    const idAlocacaoMaterial = this.route.snapshot.paramMap.get('idAlocacaoMaterial');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idAlocacaoMaterial) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idAlocacaoMaterial).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/alocacaomaterial']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/alocacaomaterial']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/alocacaomaterial']); }

  confirmDelete(): void {
    this.service.delete(this.model.idAlocacaoMaterial!).subscribe({ next: () => this.router.navigate(['/alocacaomaterial']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idMaterial ?? '');
  }
  fkLabel_idPessoa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoaCondominio ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
}
