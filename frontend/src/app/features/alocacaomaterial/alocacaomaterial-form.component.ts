import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlocacaoMaterialService } from './alocacaomaterial.service';
import { AlocacaoMaterial } from './alocacaomaterial.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { MaterialService } from '../material/material.service';
import { PessoaVinculoService } from '../pessoavinculo/pessoavinculo.service';
import { LocalService } from '../local/local.service';

@Component({
  selector: 'app-alocacaomaterial-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataHoraComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Alocação de Material</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-6">
            <label>Id do Material *</label>
            <app-combobox-customizada
              [options]="fk_idMaterial"
              [(value)]="model.idMaterial"
              [disabled]="fieldDisabled('idMaterial')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Locatário / responsável *</label>
            <app-combobox-customizada
              [options]="fk_idVinculo"
              [(value)]="model.idVinculo"
              [disabled]="fieldDisabled('idVinculo')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Local de Alocação *</label>
            <app-combobox-customizada
              [options]="fk_idLocal"
              [(value)]="model.idLocal"
              [disabled]="fieldDisabled('idLocal')" />
          </div>
          <div class="form-group fg-col-4">
            <label>Data/Hora Início *</label>
            <app-campo-data-hora [(ngModel)]="model.dataHoraInicio" name="dataHoraInicio" [disabled]="fieldDisabled('dataHoraInicio')" [required]="true" />
          </div>
          <div class="form-group fg-col-4">
            <label>Data/Hora Início</label>
            <app-campo-data-hora [(ngModel)]="model.dataHoraFim" name="dataHoraFim" [disabled]="fieldDisabled('dataHoraFim')" />
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
export class AlocacaoMaterialFormComponent implements OnInit {
  model: AlocacaoMaterial = {} as AlocacaoMaterial;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'ALOCACAOMATERIAL';
  canEdit = true;
  canDelete = true;
  fk_idMaterial: ComboboxOption[] = [];
  fk_idVinculo: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];

  constructor(
    private service: AlocacaoMaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private materialService: MaterialService,
    private pessoaVinculoService: PessoaVinculoService,
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

    this.pessoaVinculoService.getPaged(1, 200).subscribe(r => {
      this.fk_idVinculo = r.items.map((x: any) => ({
        value: x.idVinculo,
        label: this.fkLabel_idVinculo(x)
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
        next: () => this.router.navigate(['/alocacaomaterial']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/alocacaomaterial']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/alocacaomaterial']); }

  confirmDelete(): void {
    this.service.delete(this.model.idAlocacaoMaterial!).subscribe({ next: () => this.router.navigate(['/alocacaomaterial']) });
  }

  fkLabel_idMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idMaterial ?? '');
  }
  fkLabel_idVinculo(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoaVinculo ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
}
