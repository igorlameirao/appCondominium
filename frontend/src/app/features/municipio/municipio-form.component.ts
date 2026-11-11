import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { MunicipioService } from './municipio.service';
import { Municipio } from './municipio.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { UFService } from '../uf/uf.service';
import { LookupService, BairroResumo } from '../../core/services/lookup.service';

@Component({
  selector: 'app-municipio-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Município</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            <div style="grid-column: 1 / span 3; grid-row: 1" *ngIf="isEdit" class="form-group fg-col-3 fg-label-nowrap">
              <label>Código IBGE Município</label>
              <input type="text" [value]="model.codigoIBGEMunicipio" readonly class="readonly" />
            </div>
            <div style="grid-column: 1 / span 3; grid-row: 1" class="form-group fg-col-3 fg-label-nowrap" *ngIf="!isEdit">
              <label>Código IBGE Município *</label>
              <input type="number" [(ngModel)]="model.codigoIBGEMunicipio" name="codigoIBGEMunicipio" required />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
              <label>Município *</label>
              <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="150" [readonly]="fieldDisabled('nome')" required />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6 fg-label-nowrap">
              <label>UF *</label>
              <app-combobox-customizada
                [options]="fk_siglaUF"
                [(value)]="model.siglaUF"
                [disabled]="fieldDisabled('siglaUF')" [required]="true" />
            </div>
          </div>

          <section class="child-list" *ngIf="isEdit && model.codigoIBGEMunicipio">
            <h3>Bairros deste município</h3>
            <p class="child-list__hint">RN-Municipio-01 — somente leitura</p>
            <ul *ngIf="bairros.length; else semBairros">
              <li *ngFor="let b of bairros">{{ b.nome }}</li>
            </ul>
            <ng-template #semBairros>
              <p class="child-list__empty">Nenhum bairro cadastrado.</p>
            </ng-template>
          </section>
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
    .child-list { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .child-list h3 { margin: 0 0 4px; font-size: 16px; }
    .child-list__hint { margin: 0 0 12px; font-size: 12px; color: #64748b; }
    .child-list ul { list-style: none; margin: 0; padding: 0; max-height: 200px; overflow-y: auto; }
    .child-list li { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .child-list__empty { color: #64748b; font-style: italic; }
  `]
})
export class MunicipioFormComponent implements OnInit {
  model: Municipio = {} as Municipio;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Município';
  showDeleteConfirm = false;
  readonly permissionKey = 'MUNICIPIO';
  canEdit = true;
  canDelete = true;
  fk_siglaUF: ComboboxOption[] = [];
  bairros: BairroResumo[] = [];

  constructor(
    private service: MunicipioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private uFService: UFService,
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
    this.uFService.getPaged(1, 200).subscribe(r => {
      this.fk_siglaUF = r.items.map(x => ({
        value: x.siglaUF!,
        label: `${x.siglaUF} - ${x.estado}`
      }));
    });

    const codigoIBGEMunicipio = this.route.snapshot.paramMap.get('codigoIBGEMunicipio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      return;
    }

    if (codigoIBGEMunicipio) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(codigoIBGEMunicipio).subscribe({
        next: (r) => {
          this.model = r;
          this.carregarBairros();
        },
        error: () => this.toast.showError('Registro não encontrado.')
      });
    }
  }

  private carregarBairros(): void {
    if (!this.model.codigoIBGEMunicipio) return;
    this.lookup.bairrosPorMunicipio(this.model.codigoIBGEMunicipio).subscribe({
      next: list => this.bairros = list,
      error: () => this.bairros = []
    });
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (this.isEdit && field === 'codigoIBGEMunicipio') return true;
    return false;
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/municipio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/municipio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/municipio']); }

  confirmDelete(): void {
    const id = this.model.codigoIBGEMunicipio ?? this.route.snapshot.paramMap.get('codigoIBGEMunicipio');
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.router.navigate(['/municipio']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }
}
