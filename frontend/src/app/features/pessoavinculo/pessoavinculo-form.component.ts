import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PessoaVinculoService } from './pessoavinculo.service';
import { PessoaVinculo } from './pessoavinculo.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { papelExcluido } from '../pessoas/pessoa-contexto-codigos';
import { PapelVinculoService } from '../papelvinculo/papelvinculo.service';
import { UnidadeService } from '../unidade/unidade.service';
import { PerfilAcessoLookupService } from '../../core/services/perfil-acesso-lookup.service';

@Component({
  selector: 'app-pessoavinculo-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent, CampoDataComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/pessoavinculo'">Vínculos</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} vínculo</h1>
          <p class="cad-subtitulo">Vínculo de pessoa com papel, unidade e vigência no condomínio</p>
        </header>
        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="users" [tamanho]="16" />
              <span>Dados do vínculo</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="users" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do vínculo</h2>
                <p class="cad-secao__texto">Pessoa, papel, unidade, vigência e perfil RBAC</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid pessoa-vinculo-dados">
          <div class="form-group pessoa-vinculo-dados__id" *ngIf="isEdit">
            <label>Id</label>
            <input type="text" [value]="pkDisplay" readonly class="readonly" />
          </div>
          <div class="form-group pessoa-vinculo-dados__pessoa" [class.pessoa-vinculo-dados__pessoa--novo]="!isEdit">
            <label>Pessoa *</label>
            <app-combobox-customizada
              [options]="fk_idPessoa"
              [(value)]="model.idPessoa"
              [disabled]="fieldDisabled('idPessoa')" [required]="true" />
          </div>
          <div class="form-group pessoa-vinculo-dados__papel">
            <label>Papel *</label>
            <app-combobox-customizada
              [options]="fk_codigoPapelVinculo"
              [(value)]="model.codigoPapelVinculo"
              [disabled]="fieldDisabled('codigoPapelVinculo')" [required]="true" />
          </div>
          <div class="form-group pessoa-vinculo-dados__unidade">
            <label>Unidade</label>
            <app-combobox-customizada
              [options]="fk_idUnidade"
              [(value)]="model.idUnidade"
              [disabled]="fieldDisabled('idUnidade')" />
          </div>
          <div class="form-group pessoa-vinculo-dados__relacionada">
            <label>Pessoa relacionada</label>
            <app-combobox-customizada
              [options]="fk_idPessoaRelacionada"
              [(value)]="model.idPessoaRelacionada"
              [disabled]="fieldDisabled('idPessoaRelacionada')" />
          </div>
          <div class="form-group pessoa-vinculo-dados__inicio">
            <label>Início da vigência *</label>
            <app-campo-data [(ngModel)]="model.dataInicio" name="dataInicio" [feedbackVisual]="true" [disabled]="fieldDisabled('dataInicio')" [required]="true" />
          </div>
          <div class="form-group pessoa-vinculo-dados__fim">
            <label>Fim da vigência</label>
            <app-campo-data [(ngModel)]="model.dataFim" name="dataFim" [feedbackVisual]="true" [disabled]="fieldDisabled('dataFim')" />
          </div>
          <div class="form-group pessoa-vinculo-dados__perfil">
            <label>Perfil RBAC</label>
            <app-combobox-customizada
              [options]="fk_idPerfil"
              [(value)]="model.idPerfil"
              [disabled]="fieldDisabled('idPerfil')" />
          </div>
          <div class="form-group pessoa-vinculo-dados__responsavel">
            <label>Responsável pela unidade *</label>
            <input type="text" [(ngModel)]="model.responsavel" name="responsavel" required [readonly]="fieldDisabled('responsavel')" />
          </div>
          <div class="form-group pessoa-vinculo-dados__obs">
            <label>Observação</label>
            <input type="text" [(ngModel)]="model.observacao" name="observacao" maxlength="500" [readonly]="fieldDisabled('observacao')" />
          </div>
          </div>
        </form></div>
          </div>
          <div class="actions form-actions cad-acoes"><button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Salvar</button>
        <span class="cad-acoes__espaco"></span>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && podeEncerrar" (click)="showEncerrarConfirm=true">Encerrar vínculo</button></div>
        </section>
      </div>
    </div>
    <div class="confirm-overlay" *ngIf="showEncerrarConfirm">
      <div class="confirm-modal">
        <p>Encerrar este vínculo? O histórico será preservado.</p>
        <button type="button" class="btn-cancelar" (click)="showEncerrarConfirm=false">Cancelar</button>
        <button type="button" class="btn-excluir" (click)="confirmEncerrar()">Encerrar</button>
      </div>
    </div>
    <p class="msg-erro cad-erro" *ngIf="formError">{{ formError }}</p>
  `
})
export class PessoaVinculoFormComponent implements OnInit {
  model: PessoaVinculo = {} as PessoaVinculo;
  isEdit = false;
  saving = false;
  formError = '';
  showEncerrarConfirm = false;
  readonly permissionKey = 'PESSOAVINCULO';
  canEdit = true;
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

  get podeEncerrar(): boolean {
    return this.isEdit && this.permissions.can(this.permissionKey, 'Alterar') && !this.jaEncerrado;
  }

  get jaEncerrado(): boolean {
    if (!this.model.dataFim) return false;
    const hoje = new Date().toISOString().slice(0, 10);
    return this.model.dataFim < hoje;
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
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
      this.fk_codigoPapelVinculo = r.items
        .filter((x: any) => this.isEdit || !papelExcluido(x.codigoPapelVinculo))
        .map((x: any) => ({
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
        value: x.idPessoa,
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
      const idPessoaQ = this.route.snapshot.queryParamMap.get('idPessoa');
      if (idPessoaQ) this.model.idPessoa = Number(idPessoaQ);
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

  confirmEncerrar(): void {
    if (!this.model.idVinculo) return;
    this.service.encerrar(this.model.idVinculo).subscribe({
      next: () => this.router.navigate(['/pessoavinculo']),
      error: (e: unknown) => {
        this.formError = (e as { error?: string })?.error ?? 'Não foi possível encerrar o vínculo.';
        this.showEncerrarConfirm = false;
      }
    });
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
