import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnderecoService } from './endereco.service';
import { Endereco } from './endereco.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';
import { BairroService } from '../bairro/bairro.service';

@Component({
  selector: 'app-endereco-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, EnderecoWidgetComponent],
  host: { class: 'form-page' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Endereço</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="grid grid-id" *ngIf="isEdit">
            <div class="form-group">
              <label>Id</label>
              <input type="text" [value]="pkDisplay" readonly class="readonly" />
            </div>
          </div>
          <div class="grid grid-2">
                      <app-endereco-widget
            [(idEndereco)]="model.idEndereco"
            [readonly]="isEdit && !canEdit" />

          <div class="form-group">
            <label>CEP *</label>
            <input type="text" [(ngModel)]="model.cEP" name="cEP" [readonly]="fieldDisabled('cEP')" />
          </div>
          <div class="form-group">
            <label>Logradouro *</label>
            <input type="text" [(ngModel)]="model.logradouro" name="logradouro" maxlength="100" [readonly]="fieldDisabled('logradouro')" />
          </div>
          <div class="form-group">
            <label>Id Bairro *</label>
            <app-combobox-customizada
              [options]="fk_idBairro"
              [(value)]="model.idBairro"
              [disabled]="fieldDisabled('idBairro')" />
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
export class EnderecoFormComponent implements OnInit {
  model: Endereco = {} as Endereco;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  canEdit = true;
  canDelete = true;
  fk_idBairro: ComboboxOption[] = [];

  constructor(
    private service: EnderecoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private bairroService: BairroService,
  ) {
    this.canEdit = this.permissions.canEdit();
    this.canDelete = this.permissions.canDelete();
  }

  get pkDisplay(): string { return String(this.model.idEndereco); }

  ngOnInit(): void {
    
    this.bairroService.getPaged(1, 200).subscribe(r => {
      this.fk_idBairro = r.items.map((x: any) => ({
        value: x.idBairro,
        label: this.fkLabel_idBairro(x)
      }));
    });
    const idEndereco = this.route.snapshot.paramMap.get('idEndereco');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      
      return;
    }
    if (idEndereco) {
      this.isEdit = true;
      this.service.getById(idEndereco).subscribe({
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
        next: () => this.router.navigate(['/endereco']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/endereco']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/endereco']); }

  confirmDelete(): void {
    this.service.delete(this.model.idEndereco!).subscribe({ next: () => this.router.navigate(['/endereco']) });
  }

  fkLabel_idBairro(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idBairro ?? '');
  }
}
