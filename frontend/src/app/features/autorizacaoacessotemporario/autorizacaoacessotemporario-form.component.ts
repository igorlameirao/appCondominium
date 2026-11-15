import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutorizacaoAcessoTemporarioService } from './autorizacaoacessotemporario.service';
import { AutorizacaoAcessoTemporario } from './autorizacaoacessotemporario.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { UnidadeService } from '../unidade/unidade.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-autorizacaoacessotemporario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataHoraComponent],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="form-layout">
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} Autorização de Acesso Temporário</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>
          <div class="form-group fg-col-12">
            <label>Nome do visitante</label>
            <input type="text" [(ngModel)]="model.nomeVisitante" name="nomeVisitante" maxlength="255" [readonly]="fieldDisabled('nomeVisitante')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Unidade</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Visitante</label>
            <app-combobox-customizada
              [options]="fk_idPessoaVisitante"
              [(value)]="model.idPessoaVisitante"
              [disabled]="fieldDisabled('idPessoaVisitante')" />
          </div>
          <div class="form-group fg-col-2">
            <label>Documento do visitante</label>
            <input type="text" [(ngModel)]="model.documentoVisitante" name="documentoVisitante" maxlength="14" [readonly]="fieldDisabled('documentoVisitante')" />
          </div>
          <div class="form-group fg-col-6">
            <label>Autorizado por *</label>
            <app-combobox-customizada
              [options]="fk_idPessoaAutorizador"
              [(value)]="model.idPessoaAutorizador"
              [disabled]="fieldDisabled('idPessoaAutorizador')" />
          </div>
          <div class="form-group fg-col-4">
            <label>Início *</label>
            <app-campo-data-hora [(ngModel)]="model.dataHoraInicio" name="dataHoraInicio" [disabled]="fieldDisabled('dataHoraInicio')" [required]="true" />
          </div>
          <div class="form-group fg-col-4">
            <label>Fim *</label>
            <app-campo-data-hora [(ngModel)]="model.dataHoraFim" name="dataHoraFim" [disabled]="fieldDisabled('dataHoraFim')" [required]="true" />
          </div>
          <div class="form-group fg-col-2">
            <label>Tipo de acesso *</label>
            <select [(ngModel)]="model.tipoAcesso" name="tipoAcesso" [disabled]="fieldDisabled('tipoAcesso')" required>
              <option [ngValue]="null">Selecione…</option>
              <option [ngValue]="0">Visita</option><option [ngValue]="1">Entrega</option><option [ngValue]="2">Prestador eventual</option><option [ngValue]="3">Hóspede temporário</option>
            </select>
          </div>
          <div class="form-group fg-col-12">
            <label>Motivo</label>
            <input type="text" [(ngModel)]="model.motivo" name="motivo" maxlength="500" [readonly]="fieldDisabled('motivo')" />
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
export class AutorizacaoAcessoTemporarioFormComponent implements OnInit {
  model: AutorizacaoAcessoTemporario = {} as AutorizacaoAcessoTemporario;
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = 'AUTORIZACAOACESSOTEMPORARIO';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idPessoaVisitante: ComboboxOption[] = [];
  fk_idPessoaAutorizador: ComboboxOption[] = [];

  constructor(
    private service: AutorizacaoAcessoTemporarioService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
    private pessoafisicaService: PessoafisicaService,
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

  get pkDisplay(): string { return String(this.model.idAutorizacao); }

  ngOnInit(): void {
    
    this.unidadeService.getPaged(1, 200).subscribe(r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaVisitante = r.items.map((x: any) => ({
        value: x.idPessoaVisitante,
        label: this.fkLabel_idPessoaVisitante(x)
      }));
    });

    this.pessoafisicaService.getPaged(1, 200).subscribe(r => {
      this.fk_idPessoaAutorizador = r.items.map((x: any) => ({
        value: x.idPessoaAutorizador,
        label: this.fkLabel_idPessoaAutorizador(x)
      }));
    });
    const idAutorizacao = this.route.snapshot.paramMap.get('idAutorizacao');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idAutorizacao) {
      this.isEdit = true;
      this.refreshPermissions();
      this.service.getById(idAutorizacao).subscribe({
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
        next: () => this.router.navigate(['/autorizacaoacessotemporario']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => this.router.navigate(['/autorizacaoacessotemporario']),
        error: (e: unknown) => { this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/autorizacaoacessotemporario']); }

  confirmDelete(): void {
    this.service.delete(this.model.idAutorizacao!).subscribe({ next: () => this.router.navigate(['/autorizacaoacessotemporario']) });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idPessoaVisitante(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
  fkLabel_idPessoaAutorizador(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
