import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PessoaJuridicaService } from './pessoajuridica.service';
import { PessoaJuridica } from './pessoajuridica.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-pessoajuridica-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Pessoa Jurídica</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-2">
            
          <div class="form-group">
            <label>IdPessoa *</label>
            <input type="number" [(ngModel)]="model.idPessoa" name="idPessoa" [readonly]="fieldDisabled('idPessoa')" />
          </div>
          <div class="form-group">
            <label>IdResponsavel *</label>
            <app-combobox-customizada
              [options]="fk_idResponsavel"
              [(value)]="model.idResponsavel"
              [disabled]="fieldDisabled('idResponsavel')" />
          </div>
          <div class="form-group">
            <label>Nome Fantasia</label>
            <input type="text" [(ngModel)]="model.nomeFantasia" name="nomeFantasia" maxlength="255" [readonly]="fieldDisabled('nomeFantasia')" />
          </div>
          <div class="form-group">
            <label>Data de Fundacao</label>
            <input type="date" [(ngModel)]="model.dataFundacao" name="dataFundacao" [readonly]="fieldDisabled('dataFundacao')" />
          </div>
          <div class="form-group">
            <label>Inscrição Estadual</label>
            <input type="text" [(ngModel)]="model.inscricaoEstadual" name="inscricaoEstadual" maxlength="40" [readonly]="fieldDisabled('inscricaoEstadual')" />
          </div>
          <div class="form-group">
            <label>Inscrição Municipal</label>
            <input type="text" [(ngModel)]="model.inscricaoMunicipal" name="inscricaoMunicipal" maxlength="40" [readonly]="fieldDisabled('inscricaoMunicipal')" />
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
export class PessoaJuridicaFormComponent implements OnInit {
  model: PessoaJuridica = {} as PessoaJuridica;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idResponsavel: ComboboxOption[] = [];

  constructor(
    private service: PessoaJuridicaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private pessoafisicaService: PessoafisicaService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idPessoa); }

  ngOnInit(): void {
    
    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idResponsavel = r.items.map((x: any) => ({
        value: x.idResponsavel,
        label: this.fkLabel_idResponsavel(x)
      }));
    });
    const idPessoa = this.route.snapshot.paramMap.get('idPessoa');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      
      return;
    }
    if (idPessoa) {
      this.isEdit = true;
      this.service.getById(idPessoa).subscribe({
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
        next: () => this.router.navigate(['/pessoajuridica']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/pessoajuridica']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoajuridica']); }

  confirmDelete(): void {
    this.service.delete(this.model.idPessoa!).subscribe({ next: () => this.router.navigate(['/pessoajuridica']) });
  }

  fkLabel_idResponsavel(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
