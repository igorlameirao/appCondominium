import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { UnidadeService } from './unidade.service';
import { Unidade } from './unidade.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { BlocoService } from '../bloco/bloco.service';
import { TipoUnidadeService } from '../tipounidade/tipounidade.service';
import { HidrometroService } from '../hidrometro/hidrometro.service';

@Component({
  selector: 'app-unidade-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Unidade</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id Unidade *</label>
              <input type="number" [(ngModel)]="model.idUnidade" name="idUnidade" [readonly]="fieldDisabled('idUnidade')" required />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id Bloco *</label>
              <app-combobox-customizada
                [options]="fk_idBloco"
                [(value)]="model.idBloco"
                [disabled]="fieldDisabled('idBloco')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Número</label>
              <input type="number" [(ngModel)]="model.numero" name="numero" [readonly]="fieldDisabled('numero')" />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Id Tipo Unidade *</label>
              <app-combobox-customizada
                [options]="fk_idTipoUnidade"
                [(value)]="model.idTipoUnidade"
                [disabled]="fieldDisabled('idTipoUnidade')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 6; grid-row: 2" class="form-group fg-col-6">
              <label>Id Hidrômetro *</label>
              <app-combobox-customizada
                [options]="fk_idHidrometro"
                [(value)]="model.idHidrometro"
                [disabled]="fieldDisabled('idHidrometro')" [required]="true" />
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
export class UnidadeFormComponent implements OnInit {
  model: Unidade = {} as Unidade;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Unidade';
  showDeleteConfirm = false;
  readonly permissionKey = 'UNIDADE';
  canEdit = true;
  canDelete = true;
  fk_idBloco: ComboboxOption[] = [];
  fk_idTipoUnidade: ComboboxOption[] = [];
  fk_idHidrometro: ComboboxOption[] = [];

  constructor(
    private service: UnidadeService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private blocoService: BlocoService,
    private tipoUnidadeService: TipoUnidadeService,
    private hidrometroService: HidrometroService,
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

  get pkDisplay(): string { return String(this.model.idUnidade); }

  ngOnInit(): void {
    
    this.blocoService.getPaged(1, 200).subscribe(r => {
      this.fk_idBloco = r.items.map((x: any) => ({
        value: x.idBloco,
        label: this.fkLabel_idBloco(x)
      }));
    });

    this.tipoUnidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idTipoUnidade = r.items.map((x: any) => ({
        value: x.idTipoUnidade,
        label: this.fkLabel_idTipoUnidade(x)
      }));
    });

    this.hidrometroService.getPaged(1, 200).subscribe(r => {
      this.fk_idHidrometro = r.items.map((x: any) => ({
        value: x.idHidrometro,
        label: this.fkLabel_idHidrometro(x)
      }));
    });
    const idUnidade = this.route.snapshot.paramMap.get('idUnidade');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idUnidade) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idUnidade).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/unidade']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/unidade']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/unidade']); }

  confirmDelete(): void {
    this.service.delete(this.model.idUnidade!).subscribe({ next: () => this.router.navigate(['/unidade']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idBloco(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idBloco ?? '');
  }
  fkLabel_idTipoUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoUnidade ?? '');
  }
  fkLabel_idHidrometro(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idHidrometro ?? '');
  }
}
