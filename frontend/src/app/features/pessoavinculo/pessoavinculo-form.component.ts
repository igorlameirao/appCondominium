import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PessoaVinculoService } from './pessoavinculo.service';
import { PessoaVinculo } from './pessoavinculo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { PapelVinculoService } from '../papelvinculo/papelvinculo.service';
import { UnidadeService } from '../unidade/unidade.service';
import { PerfilAcessoLookupService } from '../../core/services/perfil-acesso-lookup.service';

@Component({
  selector: 'app-pessoavinculo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Vínculo de Pessoa</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-6">
            <label>Pessoa *</label>
            <app-combobox-customizada
              [options]="fk_idPessoa"
              [(value)]="model.idPessoa"
              [disabled]="fieldDisabled('idPessoa')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Papel *</label>
            <app-combobox-customizada
              [options]="fk_codigoPapelVinculo"
              [(value)]="model.codigoPapelVinculo"
              [disabled]="fieldDisabled('codigoPapelVinculo')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Unidade</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Pessoa relacionada</label>
            <app-combobox-customizada
              [options]="fk_idPessoaRelacionada"
              [(value)]="model.idPessoaRelacionada"
              [disabled]="fieldDisabled('idPessoaRelacionada')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Início da vigência *</label>
            <app-campo-data [(ngModel)]="model.dataInicio" name="dataInicio" [disabled]="fieldDisabled('dataInicio')" [required]="true" />
          </div>
          <div class="form-group fg-col-2">
            <label>Fim da vigência</label>
            <app-campo-data [(ngModel)]="model.dataFim" name="dataFim" [disabled]="fieldDisabled('dataFim')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Perfil RBAC</label>
            <app-combobox-customizada
              [options]="fk_idPerfil"
              [(value)]="model.idPerfil"
              [disabled]="fieldDisabled('idPerfil')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Responsável pela unidade *</label>
            <input type="text" [(ngModel)]="model.responsavel" name="responsavel" [readonly]="fieldDisabled('responsavel')" />
          </div>
          <div class="form-group fg-col-12">
            <label>Observação</label>
            <input type="text" [(ngModel)]="model.observacao" name="observacao" maxlength="500" [readonly]="fieldDisabled('observacao')" />
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
export class PessoaVinculoFormComponent implements OnInit {
  model: PessoaVinculo = {} as PessoaVinculo;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'PESSOAVINCULO';
  canEdit = true;
  canDelete = true;
  fk_idPessoa: ComboboxOption[] = [];
  fk_codigoPapelVinculo: ComboboxOption[] = [];
  fk_idUnidade: ComboboxOption[] = [];
  fk_idPessoaRelacionada: ComboboxOption[] = [];
  fk_idPerfil: ComboboxOption[] = [];

  constructor(
    private service: PessoaVinculoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private pessoafisicaService: PessoafisicaService,
    private papelVinculoService: PapelVinculoService,
    private unidadeService: UnidadeService,
    private perfilAcessoLookup: PerfilAcessoLookupService,
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

  get pkDisplay(): string { return String(this.model.idVinculo); }

  ngOnInit(): void {
    
    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoa = r.items.map((x: any) => ({
        value: x.idPessoa,
        label: this.fkLabel_idPessoa(x)
      }));
    });

    this.papelVinculoService.getPaged(1, 200).subscribe(r => {
      this.fk_codigoPapelVinculo = r.items.map((x: any) => ({
        value: x.codigoPapelVinculo,
        label: this.fkLabel_codigoPapelVinculo(x)
      }));
    });

    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaRelacionada = r.items.map((x: any) => ({
        value: x.idPessoaRelacionada,
        label: this.fkLabel_idPessoaRelacionada(x)
      }));
    });

    this.perfilAcessoLookup.listar().subscribe(r => {
      this.fk_idPerfil = r.map(x => ({ value: x.idPerfil, label: x.descricao }));
    });
    const idVinculo = this.route.snapshot.paramMap.get('idVinculo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idVinculo) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idVinculo).subscribe({
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
        next: () => this.router.navigate(['/pessoavinculo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/pessoavinculo']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/pessoavinculo']); }

  confirmDelete(): void {
    this.service.delete(this.model.idVinculo!).subscribe({ next: () => this.router.navigate(['/pessoavinculo']) });
  }

  fkLabel_idPessoa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
  fkLabel_codigoPapelVinculo(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPapelVinculo ?? '');
  }
  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idPessoaRelacionada(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
