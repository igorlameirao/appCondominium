import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BairroService } from './bairro.service';
import { Bairro } from './bairro.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { MunicipioService } from '../municipio/municipio.service';

@Component({
  selector: 'app-bairro-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Bairro</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-id" *ngIf="isEdit">
            <div class="form-group">
              <label>Id</label>
              <input type="text" [value]="pkDisplay" readonly class="readonly" />
            </div>
          </div>
          <div class="grid grid-2">
            
          <div class="form-group">
            <label>Bairro *</label>
            <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="150" [readonly]="fieldDisabled('nome')" />
          </div>
          <div class="form-group">
            <label>Município *</label>
            <app-combobox-customizada
              [options]="fk_codigoIBGEMunicipio"
              [(value)]="model.codigoIBGEMunicipio"
              [disabled]="fieldDisabled('codigoIBGEMunicipio')" />
          </div>
          </div>
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
  `
})
export class BairroFormComponent implements OnInit {
  model: Bairro = {} as Bairro;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_codigoIBGEMunicipio: ComboboxOption[] = [];

  constructor(
    private service: BairroService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private municipioService: MunicipioService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idBairro); }

  ngOnInit(): void {
    
    this.municipioService.getPaged(1, 200).subscribe(r => {
      this.fk_codigoIBGEMunicipio = r.items.map((x: any) => ({
        value: x.codigoIBGEMunicipio,
        label: this.fkLabel_codigoIBGEMunicipio(x)
      }));
    });
    const idBairro = this.route.snapshot.paramMap.get('idBairro');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      
      return;
    }
    if (idBairro) {
      this.isEdit = true;
      this.service.getById(idBairro).subscribe({
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
        next: () => this.router.navigate(['/bairro']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/bairro']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/bairro']); }

  confirmDelete(): void {
    this.service.delete(this.model.idBairro!).subscribe({ next: () => this.router.navigate(['/bairro']) });
  }

  fkLabel_codigoIBGEMunicipio(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idMunicipio ?? '');
  }
}
