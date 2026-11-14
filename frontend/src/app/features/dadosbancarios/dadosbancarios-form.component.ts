import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DadosBancariosService } from './dadosbancarios.service';
import { DadosBancarios } from './dadosbancarios.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';


@Component({
  selector: 'app-dadosbancarios-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataHoraComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Dados Bancários</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Conta *</label>
            <input type="number" [(ngModel)]="model.conta" name="conta" [readonly]="fieldDisabled('conta')" />
          </div>
          <div class="form-group fg-col-2">
            <label>CodigoBanco *</label>
            <input type="number" [(ngModel)]="model.codigoBanco" name="codigoBanco" [readonly]="fieldDisabled('codigoBanco')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Agencia *</label>
            <input type="text" [(ngModel)]="model.agencia" name="agencia" [readonly]="fieldDisabled('agencia')" />
          </div>
          <div class="form-group fg-col-2">
            <label>DigitoAgencia</label>
            <input type="text" [(ngModel)]="model.digitoAgencia" name="digitoAgencia" [readonly]="fieldDisabled('digitoAgencia')" />
          </div>
          <div class="form-group fg-col-2">
            <label>DigitoConta *</label>
            <input type="text" [(ngModel)]="model.digitoConta" name="digitoConta" [readonly]="fieldDisabled('digitoConta')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Ativo *</label>
            <input type="text" [(ngModel)]="model.ativo" name="ativo" [readonly]="fieldDisabled('ativo')" />
          </div>
          <div class="form-group fg-col-4">
            <label>DataCadastro *</label>
            <app-campo-data-hora [(ngModel)]="model.dataCadastro" name="dataCadastro" [disabled]="fieldDisabled('dataCadastro')" [required]="true" />
          </div>
          <div class="form-group fg-col-2">
            <label>C[odigo Empresa Cobran;a</label>
            <input type="number" [(ngModel)]="model.codigoEmpresaCobranca" name="codigoEmpresaCobranca" [readonly]="fieldDisabled('codigoEmpresaCobranca')" />
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
export class DadosBancariosFormComponent implements OnInit {
  model: DadosBancarios = {} as DadosBancarios;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'DADOSBANCARIOS';
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: DadosBancariosService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
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

  get pkDisplay(): string { return String(this.model.conta) + ' / ' + String(this.model.codigoBanco) + ' / ' + String(this.model.agencia); }

  ngOnInit(): void {
    
    const conta = this.route.snapshot.paramMap.get('conta');
    const codigoBanco = this.route.snapshot.paramMap.get('codigoBanco');
    const agencia = this.route.snapshot.paramMap.get('agencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (conta && codigoBanco && agencia) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(conta, codigoBanco, agencia).subscribe({
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
        next: () => this.router.navigate(['/dadosbancarios']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/dadosbancarios']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/dadosbancarios']); }

  confirmDelete(): void {
    this.service.delete(this.model.conta!, this.model.codigoBanco!, this.model.agencia!).subscribe({ next: () => this.router.navigate(['/dadosbancarios']) });
  }

}
