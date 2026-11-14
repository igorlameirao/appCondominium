import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsumoAguaService } from './consumoagua.service';
import { ConsumoAgua } from './consumoagua.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { UnidadeService } from '../unidade/unidade.service';
import { HidrometroService } from '../hidrometro/hidrometro.service';

@Component({
  selector: 'app-consumoagua-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataHoraComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Consumo Água</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-6">
            <label>Id Unidade *</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Id Hidrometro *</label>
            <app-combobox-customizada
              [options]="fk_idHidrometro"
              [(value)]="model.idHidrometro"
              [disabled]="fieldDisabled('idHidrometro')" />
          </div>
          <div class="form-group fg-col-4">
            <label>Data da Leitura *</label>
            <app-campo-data-hora [(ngModel)]="model.dataLeitura" name="dataLeitura" [disabled]="fieldDisabled('dataLeitura')" [required]="true" />
          </div>
          <div class="form-group fg-col-2">
            <label>Leitura do Hidrômetro *</label>
            <input type="number" [(ngModel)]="model.leituraHidrometro" name="leituraHidrometro" [readonly]="fieldDisabled('leituraHidrometro')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Consumo</label>
            <input type="number" [(ngModel)]="model.consumo" name="consumo" [readonly]="fieldDisabled('consumo')" />
          </div>
          <div class="form-group fg-col-2">
            <label>MesReferencia</label>
            <input type="text" [(ngModel)]="model.mesReferencia" name="mesReferencia" [readonly]="fieldDisabled('mesReferencia')" />
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
export class ConsumoAguaFormComponent implements OnInit {
  model: ConsumoAgua = {} as ConsumoAgua;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'CONSUMOAGUA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idHidrometro: ComboboxOption[] = [];

  constructor(
    private service: ConsumoAguaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
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

  get pkDisplay(): string { return String(this.model.idConsumo); }

  ngOnInit(): void {
    
    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.hidrometroService.getPaged(1, 200).subscribe(r => {
      this.fk_idHidrometro = r.items.map((x: any) => ({
        value: x.idHidrometro,
        label: this.fkLabel_idHidrometro(x)
      }));
    });
    const idConsumo = this.route.snapshot.paramMap.get('idConsumo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idConsumo) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idConsumo).subscribe({
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
      });
    }
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['consumo'];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => this.router.navigate(['/consumoagua']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/consumoagua']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/consumoagua']); }

  confirmDelete(): void {
    this.service.delete(this.model.idConsumo!).subscribe({ next: () => this.router.navigate(['/consumoagua']) });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idHidrometro(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idHidrometro ?? '');
  }
}
