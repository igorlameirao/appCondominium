import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { CondominioService } from './condominio.service';
import { Condominio } from './condominio.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';

@Component({
  selector: 'app-condominio-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent, DocumentoInputComponent, EnderecoWidgetComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/condominio'">Condomínio</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Condomínio</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de condomínio</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'dados'" [attr.aria-selected]="aba === 'dados'" (click)="aba = 'dados'">
              <app-icone nome="building" [tamanho]="16" />
              <span>Dados do Condomínio</span>
            </button>
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="aba === 'endereco'" [attr.aria-selected]="aba === 'endereco'" (click)="aba = 'endereco'">
              <app-icone nome="map-pin" [tamanho]="16" />
              <span>Endereço</span>
            </button>
          </div>
          <div class="cad-conteudo">
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          <div role="tabpanel" [hidden]="aba !== 'dados'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="building" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do Condomínio</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
          <div class="form-grid">
            <div class="form-group fg-col-2">
              <label>Id</label>
              <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
            </div>
            <div class="form-group fg-col-4">
              <label>Data Inativação</label>
              <app-campo-data-hora [(ngModel)]="model.dataInativacao" name="dataInativacao" [disabled]="fieldDisabled('dataInativacao')" [feedbackVisual]="true" />
            </div>
            <div class="form-group fg-col-3">
              <label>Área Total Unidades</label>
              <input type="number" [(ngModel)]="model.areaTotalUnidades" name="areaTotalUnidades" step="0.001" [readonly]="fieldDisabled('areaTotalUnidades')" />
            </div>
            <div class="form-group fg-col-3">
              <label>Quantidade Total Unidades</label>
              <input type="number" [(ngModel)]="model.quantidadeTotalUnidades" name="quantidadeTotalUnidades" [readonly]="fieldDisabled('quantidadeTotalUnidades')" />
            </div>
            <div class="form-group fg-col-12">
              <label>Nome *</label>
              <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="255" [readonly]="fieldDisabled('nome')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>CNPJ</label>
              <app-documento-input [(ngModel)]="model.cNPJ" name="cNPJ" tipo="cnpj" [disabled]="fieldDisabled('cNPJ')" />
            </div>
            <div class="form-group fg-col-3">
              <label>Área Terreno *</label>
              <input type="number" [(ngModel)]="model.areaTerreno" name="areaTerreno" step="0.001" [readonly]="fieldDisabled('areaTerreno')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Área Total Edificada *</label>
              <input type="number" [(ngModel)]="model.areaTotalEdificada" name="areaTotalEdificada" step="0.001" [readonly]="fieldDisabled('areaTotalEdificada')" required />
            </div>
            <div class="form-group fg-col-3">
              <label>Ativo *</label>
              <input type="number" [(ngModel)]="model.ativo" name="ativo" [readonly]="fieldDisabled('ativo')" required />
            </div>
            <div class="form-group fg-col-12">
              <label>Domínio *</label>
              <input type="text" [(ngModel)]="model.dominio" name="dominio" maxlength="255" [readonly]="fieldDisabled('dominio')" required />
            </div>
          </div>
          </div>
          <div role="tabpanel" [hidden]="aba !== 'endereco'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Endereço</h2>
                <p class="cad-secao__texto">Informe o endereço do condomínio</p>
              </div>
            </div>
            <app-endereco-widget
              [(idEndereco)]="model.idEndereco"
              [(numero)]="model.numeroEndereco"
              [(complemento)]="model.complementoEndereco"
              [readonly]="isEdit && !canEdit" />
          </div>
        </form></div>
          </div>
          <div class="actions form-actions cad-acoes">
        <button type="submit" class="btn-gravar" form="entityForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
        <span class="cad-acoes__espaco"></span>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
        </section>
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
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />
  `,
})
export class CondominioFormComponent implements OnInit {
  model: Condominio = {} as Condominio;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Condomínio';
  showDeleteConfirm = false;
  readonly permissionKey = 'CONDOMINIO';
  canEdit = true;
  canDelete = true;
  aba: 'dados' | 'endereco' = 'dados';
  private readonly camposDados = new Set([
    'dataInativacao', 'areaTotalUnidades', 'quantidadeTotalUnidades', 'nome', 'cNPJ',
    'areaTerreno', 'areaTotalEdificada', 'ativo', 'dominio'
  ]);
  

  constructor(
    private service: CondominioService,
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

  get pkDisplay(): string { return String(this.model.idCondominio); }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    const idCondominio = this.route.snapshot.paramMap.get('idCondominio');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idCondominio) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idCondominio), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['areaTotalUnidades','quantidadeTotalUnidades','cNPJ','dominio','ativo'];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.aba = this.abaDoErro(f);
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/condominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/condominio']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  private abaDoErro(f: NgForm): 'dados' | 'endereco' {
    const nomes = Object.keys(f.controls);
    const dadosInvalido = nomes.some(nome => this.camposDados.has(nome) && f.controls[nome].invalid);
    if (dadosInvalido) return 'dados';
    const enderecoInvalido = nomes.some(nome => !this.camposDados.has(nome) && f.controls[nome].invalid);
    return enderecoInvalido ? 'endereco' : 'dados';
  }

  cancel(): void { this.router.navigate(['/condominio']); }

  confirmDelete(): void {
    this.service.delete(this.model.idCondominio!).subscribe({ next: () => this.router.navigate(['/condominio']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
