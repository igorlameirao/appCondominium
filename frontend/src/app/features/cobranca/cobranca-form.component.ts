import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CobrancaService } from './cobranca.service';
import { Cobranca } from './cobranca.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { UnidadeService } from '../unidade/unidade.service';

@Component({
  selector: 'app-cobranca-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Cobranca</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-2">
            <label>IdArquivoCobrancaRetorno</label>
            <input type="number" [(ngModel)]="model.idArquivoCobrancaRetorno" name="idArquivoCobrancaRetorno" [readonly]="fieldDisabled('idArquivoCobrancaRetorno')" />
          </div>
          <div class="form-group fg-col-2">
            <label>SequencialRegistroRetorno</label>
            <input type="number" [(ngModel)]="model.sequencialRegistroRetorno" name="sequencialRegistroRetorno" [readonly]="fieldDisabled('sequencialRegistroRetorno')" />
          </div>
          <div class="form-group fg-col-2">
            <label>IdArquivoCobrancaRemessa</label>
            <input type="number" [(ngModel)]="model.idArquivoCobrancaRemessa" name="idArquivoCobrancaRemessa" [readonly]="fieldDisabled('idArquivoCobrancaRemessa')" />
          </div>
          <div class="form-group fg-col-2">
            <label>SequencialRegistroRemessa</label>
            <input type="number" [(ngModel)]="model.sequencialRegistroRemessa" name="sequencialRegistroRemessa" [readonly]="fieldDisabled('sequencialRegistroRemessa')" />
          </div>
          <div class="form-group fg-col-6">
            <label>IdUnidade *</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group fg-col-2">
            <label>DataGeracao</label>
            <app-campo-data [(ngModel)]="model.dataGeracao" name="dataGeracao" [disabled]="fieldDisabled('dataGeracao')" />
          </div>
          <div class="form-group fg-col-2">
            <label>DataVencimento</label>
            <app-campo-data [(ngModel)]="model.dataVencimento" name="dataVencimento" [disabled]="fieldDisabled('dataVencimento')" />
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
export class CobrancaFormComponent implements OnInit {
  model: Cobranca = {} as Cobranca;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'COBRANCA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];

  constructor(
    private service: CobrancaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
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

  get pkDisplay(): string { return String(this.model.idCobranca); }

  ngOnInit(): void {
    
    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });
    const idCobranca = this.route.snapshot.paramMap.get('idCobranca');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idCobranca) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idCobranca).subscribe({
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
        next: () => this.router.navigate(['/cobranca']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/cobranca']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/cobranca']); }

  confirmDelete(): void {
    this.service.delete(this.model.idCobranca!).subscribe({ next: () => this.router.navigate(['/cobranca']) });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
}
