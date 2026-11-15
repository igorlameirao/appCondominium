import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { BairroService } from './bairro.service';
import { Bairro } from './bairro.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { MunicipioService } from '../municipio/municipio.service';
import { Municipio } from '../municipio/municipio.model';

@Component({
  selector: 'app-bairro-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/bairro'">Bairro</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Bairro</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de Bairro</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="building" [tamanho]="16" />
              <span>Dados de Bairro</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="building" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Bairro</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
          
          <div class="form-grid bairro-dados">
            <div class="form-group bairro-dados__nome">
              <label>Bairro *</label>
              <input type="text" [(ngModel)]="model.nome" name="nome" maxlength="150" [readonly]="fieldDisabled('nome')" required />
            </div>
            <div class="form-group bairro-dados__municipio">
              <label>Município *</label>
              <app-combobox-customizada
                [options]="fk_codigoIBGEMunicipio"
                [(value)]="model.codigoIBGEMunicipio"
                [disabled]="fieldDisabled('codigoIBGEMunicipio')" [required]="true" />
            </div>
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
  styles: [`
    .bairro-dados {
      grid-template-columns: 5fr 4fr;
    }
    @media (max-width: 720px) {
      .bairro-dados { grid-template-columns: 1fr; }
    }
  `],
})
export class BairroFormComponent implements OnInit {
  model: Bairro = {} as Bairro;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Bairro';
  showDeleteConfirm = false;
  readonly permissionKey = 'BAIRRO';
  canEdit = true;
  canDelete = true;
  fk_codigoIBGEMunicipio: ComboboxOption[] = [];

  constructor(
    private service: BairroService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private municipioService: MunicipioService,
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

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    this.pageLoad.run(this.municipioService.getPaged(1, 5000), r => {
      this.fk_codigoIBGEMunicipio = (r.items ?? []).map(x => this.opcaoMunicipio(x));
    });
    const idBairro = this.route.snapshot.paramMap.get('idBairro');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      
      return;
    }
    if (idBairro) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idBairro), (r) => {
        this.model = r;
        if (this.model.codigoIBGEMunicipio != null) {
          this.model.codigoIBGEMunicipio = Number(this.model.codigoIBGEMunicipio);
        }
        this.garantirMunicipioNasOpcoes();
      }, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/bairro']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/bairro']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/bairro']); }

  confirmDelete(): void {
    this.service.delete(this.model.idBairro!).subscribe({ next: () => this.router.navigate(['/bairro']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  private opcaoMunicipio(m: Municipio): ComboboxOption {
    const codigo = m.codigoIBGEMunicipio != null ? Number(m.codigoIBGEMunicipio) : 0;
    return { value: codigo, label: this.rotuloMunicipio(m) };
  }

  private rotuloMunicipio(m: Pick<Municipio, 'nome' | 'codigoIBGEMunicipio'>): string {
    const nome = m.nome?.trim();
    if (nome) return nome;
    return m.codigoIBGEMunicipio != null ? String(m.codigoIBGEMunicipio) : '';
  }

  private garantirMunicipioNasOpcoes(): void {
    const codigo = this.model.codigoIBGEMunicipio;
    if (codigo == null) return;
    if (this.fk_codigoIBGEMunicipio.some(o => Number(o.value) === Number(codigo))) return;
    this.municipioService.getById(codigo).subscribe(m => {
      if (m.codigoIBGEMunicipio == null) return;
      this.fk_codigoIBGEMunicipio = [...this.fk_codigoIBGEMunicipio, this.opcaoMunicipio(m)];
    });
  }
}
