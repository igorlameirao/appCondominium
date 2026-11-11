import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { GuardaEncomendaService } from './guardaencomenda.service';
import { GuardaEncomenda } from './guardaencomenda.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';
import { LocalService } from '../local/local.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-guardaencomenda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Guarda Encomenda</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id Unidade *</label>
              <app-combobox-customizada
                [options]="fk_idUnidade"
                [(value)]="model.idUnidade"
                [disabled]="fieldDisabled('idUnidade')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 4; grid-row: 1" class="form-group fg-col-4">
              <label>Data/Hora Saída</label>
              <app-campo-data-hora [(ngModel)]="model.dataHoraSaida" name="dataHoraSaida" [disabled]="fieldDisabled('dataHoraSaida')" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Id Local Armazenamento</label>
              <app-combobox-customizada
                [options]="fk_idLocal"
                [(value)]="model.idLocal"
                [disabled]="fieldDisabled('idLocal')" />
            </div>
            <div style="grid-column: 7 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Id Colaborador Entrada *</label>
              <app-combobox-customizada
                [options]="fk_idPessoaEntrada"
                [(value)]="model.idPessoaEntrada"
                [disabled]="fieldDisabled('idPessoaEntrada')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
              <label>Retirado Por</label>
              <app-combobox-customizada
                [options]="fk_idPessoaSaida"
                [(value)]="model.idPessoaSaida"
                [disabled]="fieldDisabled('idPessoaSaida')" />
            </div>
            <div style="grid-column: 7 / span 4; grid-row: 3" class="form-group fg-col-4">
              <label>Data/Hora Entrada *</label>
              <app-campo-data-hora [(ngModel)]="model.dataHoraEntrada" name="dataHoraEntrada" [disabled]="fieldDisabled('dataHoraEntrada')" [required]="true" />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 4" class="form-group fg-col-12">
              <label>Codigo da Encomenda *</label>
              <input type="text" [(ngModel)]="model.codigoEncomenda" name="codigoEncomenda" maxlength="255" [readonly]="fieldDisabled('codigoEncomenda')" required />
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
export class GuardaEncomendaFormComponent implements OnInit {
  model: GuardaEncomenda = {} as GuardaEncomenda;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Guarda Encomenda';
  showDeleteConfirm = false;
  readonly permissionKey = 'GUARDAENCOMENDA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];
  fk_idPessoaEntrada: ComboboxOption[] = [];
  fk_idPessoaSaida: ComboboxOption[] = [];

  constructor(
    private service: GuardaEncomendaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
    private localService: LocalService,
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

  get pkDisplay(): string { return String(this.model.idGuardaEncomenda); }

  ngOnInit(): void {
    
    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.localService.getPaged(1, 200).subscribe(r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaEntrada = r.items.map((x: any) => ({
        value: x.idPessoaEntrada,
        label: this.fkLabel_idPessoaEntrada(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaSaida = r.items.map((x: any) => ({
        value: x.idPessoaSaida,
        label: this.fkLabel_idPessoaSaida(x)
      }));
    });
    const idGuardaEncomenda = this.route.snapshot.paramMap.get('idGuardaEncomenda');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idGuardaEncomenda) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idGuardaEncomenda).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/guardaencomenda']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/guardaencomenda']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/guardaencomenda']); }

  confirmDelete(): void {
    this.service.delete(this.model.idGuardaEncomenda!).subscribe({ next: () => this.router.navigate(['/guardaencomenda']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
  fkLabel_idPessoaEntrada(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
  fkLabel_idPessoaSaida(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
