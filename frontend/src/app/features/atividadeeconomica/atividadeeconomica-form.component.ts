import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AtividadeEconomicaService } from './atividadeeconomica.service';
import { AtividadeEconomica } from './atividadeeconomica.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoAtividadeEconomicaService } from '../tipoatividadeeconomica/tipoatividadeeconomica.service';

@Component({
  selector: 'app-atividadeeconomica-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Atividade Econômica</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Código *</label>
            <input type="number" [(ngModel)]="model.codigoAtividadeEconomica" name="codigoAtividadeEconomica" [readonly]="fieldDisabled('codigoAtividadeEconomica')" />
          </div>
          <div class="form-group fg-col-12">
            <label>Descrição *</label>
            <input type="text" [(ngModel)]="model.descricao" name="descricao" maxlength="255" [readonly]="fieldDisabled('descricao')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Tipo Atividade *</label>
            <app-combobox-customizada
              [options]="fk_codigoTipoAtividadeEconomica"
              [(value)]="model.codigoTipoAtividadeEconomica"
              [disabled]="fieldDisabled('codigoTipoAtividadeEconomica')" />
          </div>
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Gravar</button>
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
  `
})
export class AtividadeEconomicaFormComponent implements OnInit {
  model: AtividadeEconomica = {} as AtividadeEconomica;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'ATIVIDADEECONOMICA';
  canEdit = true;
  canDelete = true;
  fk_codigoTipoAtividadeEconomica: ComboboxOption[] = [];

  constructor(
    private service: AtividadeEconomicaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoAtividadeEconomicaService: TipoAtividadeEconomicaService,
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

  get pkDisplay(): string { return String(this.model.codigoAtividadeEconomica); }

  ngOnInit(): void {
    
    this.tipoAtividadeEconomicaService.getPaged(1, 200).subscribe(r => {
      this.fk_codigoTipoAtividadeEconomica = r.items.map((x: any) => ({
        value: x.codigoTipoAtividadeEconomica,
        label: this.fkLabel_codigoTipoAtividadeEconomica(x)
      }));
    });
    const codigoAtividadeEconomica = this.route.snapshot.paramMap.get('codigoAtividadeEconomica');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      
      return;
    }
    if (codigoAtividadeEconomica) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(codigoAtividadeEconomica).subscribe({
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
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
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => this.router.navigate(['/atividadeeconomica']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/atividadeeconomica']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/atividadeeconomica']); }

  confirmDelete(): void {
    this.service.delete(this.model.codigoAtividadeEconomica!).subscribe({ next: () => this.router.navigate(['/atividadeeconomica']) });
  }

  fkLabel_codigoTipoAtividadeEconomica(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoAtividadeEconomica ?? '');
  }
}
