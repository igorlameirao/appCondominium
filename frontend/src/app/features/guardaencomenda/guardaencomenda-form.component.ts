import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GuardaEncomendaService } from './guardaencomenda.service';
import { GuardaEncomenda } from './guardaencomenda.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';
import { LocalService } from '../local/local.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-guardaencomenda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Guarda Encomenda</h2>
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
            <label>Id Unidade *</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group">
            <label>Codigo da Encomenda *</label>
            <input type="text" [(ngModel)]="model.codigoEncomenda" name="codigoEncomenda" maxlength="255" [readonly]="fieldDisabled('codigoEncomenda')" />
          </div>
          <div class="form-group">
            <label>Id Local Armazenamento</label>
            <app-combobox-customizada
              [options]="fk_idLocal"
              [(value)]="model.idLocal"
              [disabled]="fieldDisabled('idLocal')" />
          </div>
          <div class="form-group">
            <label>Data/Hora Entrada *</label>
            <input type="date" [(ngModel)]="model.dataHoraEntrada" name="dataHoraEntrada" [readonly]="fieldDisabled('dataHoraEntrada')" />
          </div>
          <div class="form-group">
            <label>Data/Hora Saída</label>
            <input type="date" [(ngModel)]="model.dataHoraSaida" name="dataHoraSaida" [readonly]="fieldDisabled('dataHoraSaida')" />
          </div>
          <div class="form-group">
            <label>Id Colaborador Entrada *</label>
            <app-combobox-customizada
              [options]="fk_idPessoaEntrada"
              [(value)]="model.idPessoaEntrada"
              [disabled]="fieldDisabled('idPessoaEntrada')" />
          </div>
          <div class="form-group">
            <label>Retirado Por</label>
            <app-combobox-customizada
              [options]="fk_idPessoaSaida"
              [(value)]="model.idPessoaSaida"
              [disabled]="fieldDisabled('idPessoaSaida')" />
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
export class GuardaEncomendaFormComponent implements OnInit {
  model: GuardaEncomenda = {} as GuardaEncomenda;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];
  fk_idPessoaEntrada: ComboboxOption[] = [];
  fk_idPessoaSaida: ComboboxOption[] = [];

  constructor(
    private service: GuardaEncomendaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
    private localService: LocalService,
    private pessoafisicaService: PessoafisicaService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idGuardaEncomenda); }

  ngOnInit(): void {
    
    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.localService.getPaged(1, 200).subscribe(r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaEntrada = r.items.map((x: any) => ({
        value: x.idPessoaEntrada,
        label: this.fkLabel_idPessoaEntrada(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaSaida = r.items.map((x: any) => ({
        value: x.idPessoaSaida,
        label: this.fkLabel_idPessoaSaida(x)
      }));
    });
    const idGuardaEncomenda = this.route.snapshot.paramMap.get('idGuardaEncomenda');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idGuardaEncomenda) {
      this.isEdit = true;
      this.service.getById(idGuardaEncomenda).subscribe({
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
        next: () => this.router.navigate(['/guardaencomenda']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/guardaencomenda']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/guardaencomenda']); }

  confirmDelete(): void {
    this.service.delete(this.model.idGuardaEncomenda!).subscribe({ next: () => this.router.navigate(['/guardaencomenda']) });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
  fkLabel_idPessoaEntrada(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
  fkLabel_idPessoaSaida(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
