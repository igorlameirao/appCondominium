import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { OfertaConcorrenciaService } from './ofertaconcorrencia.service';
import { OfertaConcorrencia } from './ofertaconcorrencia.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { FornecedorService } from '../fornecedor/fornecedor.service';
import { ConcorrenciaService } from '../concorrencia/concorrencia.service';

@Component({
  selector: 'app-ofertaconcorrencia-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CampoDataComponent, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Oferta Concorrência</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid">
            <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div style="grid-column: 3 / span 6; grid-row: 1" class="form-group fg-col-6">
              <label>Id Fornecedor *</label>
              <app-combobox-customizada
                [options]="fk_idFornecedor"
                [(value)]="model.idFornecedor"
                [disabled]="fieldDisabled('idFornecedor')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Data Validade *</label>
              <app-campo-data [(ngModel)]="model.dataValidade" name="dataValidade" [disabled]="fieldDisabled('dataValidade')" [required]="true" />
            </div>
            <div style="grid-column: 11 / span 2; grid-row: 1" class="form-group fg-col-2">
              <label>Preco *</label>
              <input type="number" [(ngModel)]="model.preco" name="preco" step="0.001" [readonly]="fieldDisabled('preco')" required />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
              <label>Descrição *</label>
              <input type="text" [(ngModel)]="model.descricao" name="descricao" [readonly]="fieldDisabled('descricao')" required />
            </div>
            <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
              <label>Id Concorrência *</label>
              <app-combobox-customizada
                [options]="fk_idConcorrencia"
                [(value)]="model.idConcorrencia"
                [disabled]="fieldDisabled('idConcorrencia')" [required]="true" />
            </div>
            <div style="grid-column: 7 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Data da Oferta *</label>
              <app-campo-data [(ngModel)]="model.dataOferta" name="dataOferta" [disabled]="fieldDisabled('dataOferta')" [required]="true" />
            </div>
            <div style="grid-column: 9 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Vencedora</label>
              <input type="text" [(ngModel)]="model.vencedora" name="vencedora" [readonly]="fieldDisabled('vencedora')" />
            </div>
            <div style="grid-column: 11 / span 2; grid-row: 3" class="form-group fg-col-2">
              <label>Desistente</label>
              <input type="text" [(ngModel)]="model.desistente" name="desistente" [readonly]="fieldDisabled('desistente')" />
            </div>
            <div style="grid-column: 1 / span 12; grid-row: 4" class="form-group fg-col-12">
              <label>Justificativa</label>
              <input type="text" [(ngModel)]="model.justificativa" name="justificativa" [readonly]="fieldDisabled('justificativa')" />
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
export class OfertaConcorrenciaFormComponent implements OnInit {
  model: OfertaConcorrencia = {} as OfertaConcorrencia;
  isEdit = false;
  saving = false;
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Oferta Concorrência';
  showDeleteConfirm = false;
  readonly permissionKey = 'OFERTACONCORRENCIA';
  canEdit = true;
  canDelete = true;
  fk_idFornecedor: ComboboxOption[] = [];
  fk_idConcorrencia: ComboboxOption[] = [];

  constructor(
    private service: OfertaConcorrenciaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private fornecedorService: FornecedorService,
    private concorrenciaService: ConcorrenciaService,
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

  get pkDisplay(): string { return String(this.model.idOfertaConcorrencia); }

  ngOnInit(): void {
    
    this.fornecedorService.getPaged(1, 200).subscribe(r => {
      this.fk_idFornecedor = r.items.map((x: any) => ({
        value: x.idFornecedor,
        label: this.fkLabel_idFornecedor(x)
      }));
    });

    this.concorrenciaService.getPaged(1, 200).subscribe(r => {
      this.fk_idConcorrencia = r.items.map((x: any) => ({
        value: x.idConcorrencia,
        label: this.fkLabel_idConcorrencia(x)
      }));
    });
    const idOfertaConcorrencia = this.route.snapshot.paramMap.get('idOfertaConcorrencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idOfertaConcorrencia) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idOfertaConcorrencia).subscribe({
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/ofertaconcorrencia']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/ofertaconcorrencia']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/ofertaconcorrencia']); }

  confirmDelete(): void {
    this.service.delete(this.model.idOfertaConcorrencia!).subscribe({ next: () => this.router.navigate(['/ofertaconcorrencia']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idFornecedor(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idFornecedor ?? '');
  }
  fkLabel_idConcorrencia(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idConcorrencia ?? '');
  }
}
