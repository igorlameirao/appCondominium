import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UFService } from './uf.service';
import { UF } from './uf.model';
import { PermissionService } from '../../core/services/permission.service';
import { LookupService, MunicipioResumo } from '../../core/services/lookup.service';

@Component({
  selector: 'app-uf-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} UF</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="grid grid-2">
            <div class="form-group">
              <label>Sigla UF *</label>
              <input type="text" [(ngModel)]="model.siglaUF" name="siglaUF" maxlength="2"
                [readonly]="isEdit || fieldDisabled('siglaUF')" style="text-transform: uppercase" />
            </div>
            <div class="form-group">
              <label>Estado *</label>
              <input type="text" [(ngModel)]="model.estado" name="estado" maxlength="150" [readonly]="fieldDisabled('estado')" required />
            </div>
            <div class="form-group">
              <label>Código IBGE *</label>
              <input type="number" [(ngModel)]="model.codigoIBGE" name="codigoIBGE" [readonly]="fieldDisabled('codigoIBGE')" required />
            </div>
          </div>

          <section class="child-list" *ngIf="isEdit && model.siglaUF">
            <h3>Municípios desta UF</h3>
            <p class="child-list__hint">RN-UF-01 — somente leitura</p>
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
    .child-list { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .child-list h3 { margin: 0 0 4px; font-size: 16px; color: #0f172a; }
    .child-list__hint { margin: 0 0 12px; font-size: 12px; color: #64748b; }
    .child-list ul { list-style: none; margin: 0; padding: 0; max-height: 240px; overflow-y: auto; }
    .child-list li { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .child-list__code { color: #64748b; margin-right: 8px; font-size: 12px; }
    .child-list__empty { color: #64748b; font-style: italic; }
  `]
})
export class UFFormComponent implements OnInit {
  model: UF = {} as UF;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
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
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  ngOnInit(): void {
    const siglaUF = this.route.snapshot.paramMap.get('siglaUF');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      return;
    }
    if (siglaUF) {
      this.isEdit = true;
      this.service.getById(siglaUF).subscribe({
        next: (r) => {
          this.model = r;
          this.carregarMunicipios();
        },
        error: () => this.formError = 'Registro não encontrado.'
      });
    }
  }

  private carregarMunicipios(): void {
    if (!this.model.siglaUF) return;
    this.lookup.municipiosPorUf(this.model.siglaUF).subscribe({
      next: list => this.municipios = list,
      error: () => this.municipios = []
    });
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (this.isEdit && field === 'siglaUF') return true;
    return false;
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    if (this.model.siglaUF) this.model.siglaUF = this.model.siglaUF.toUpperCase();
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => this.router.navigate(['/uf']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/uf']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/uf']); }

  confirmDelete(): void {
    const id = this.model.siglaUF ?? this.route.snapshot.paramMap.get('siglaUF');
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.router.navigate(['/uf']) });
  }
}
