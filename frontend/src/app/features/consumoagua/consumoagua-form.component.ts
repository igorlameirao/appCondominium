import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConsumoAguaService } from './consumoagua.service';
import { ConsumoAgua } from './consumoagua.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';
import { HidrometroService } from '../hidrometro/hidrometro.service';
import { Hidrometro } from '../hidrometro/hidrometro.model';

const MESES_REFERENCIA = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

@Component({
  selector: 'app-consumoagua-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/consumoagua'">Consumo Água</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Consumo Água</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de consumo água</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Consumo Água</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Consumo Água</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-blocos consumoagua-dados">
                <div class="form-grid consumoagua-dados__linha consumoagua-dados__linha--1">
                  <div class="form-group">
                    <label>Unidade *</label>
                    <app-combobox-customizada
                      [options]="fk_idUnidade"
                      [(value)]="model.idUnidade"
                      (valueChange)="onUnidadeChange()"
                      [disabled]="fieldDisabled('idUnidade')" [required]="true" />
                  </div>
                  <div class="form-group">
                    <label>Hidrômetro *</label>
                    <app-combobox-customizada
                      [options]="hidrometroOptions"
                      [(value)]="model.idHidrometro"
                      (valueChange)="onHidrometroChange()"
                      [disabled]="fieldDisabled('idHidrometro')" [required]="true" />
                  </div>
                  <div class="form-group consumoagua-dados__data-leitura">
                    <div class="consumoagua-data-leitura-rotulos">
                      <label class="consumoagua-data-leitura-rotulos__data">Data da Leitura *</label>
                      <label class="consumoagua-data-leitura-rotulos__hora">Hora</label>
                    </div>
                    <app-campo-data-hora
                      [(ngModel)]="model.dataLeitura"
                      (ngModelChange)="onDataLeituraChange()"
                      name="dataLeitura"
                      [disabled]="fieldDisabled('dataLeitura')"
                      [required]="true"
                      [feedbackVisual]="true" />
                  </div>
                </div>
                <div class="form-grid consumoagua-dados__linha consumoagua-dados__linha--2">
                  <div class="form-group">
                    <label>Leitura do Hidrômetro *</label>
                    <input
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      [(ngModel)]="model.leituraHidrometro"
                      (ngModelChange)="onLeituraChange($event)"
                      name="leituraHidrometro"
                      [readonly]="fieldDisabled('leituraHidrometro')"
                      required />
                  </div>
                  <div class="form-group">
                    <label>Consumo</label>
                    <input
                      type="number"
                      [(ngModel)]="model.consumo"
                      name="consumo"
                      class="readonly"
                      readonly
                      tabindex="-1"
                      aria-readonly="true" />
                  </div>
                  <div class="form-group consumoagua-dados__mes-ref">
                    <div class="consumoagua-mes-ref__rotulos" id="consumoagua-mes-ref-label">
                      <label class="consumoagua-mes-ref__rotulos__mes">Mês de Referência</label>
                      <label class="consumoagua-mes-ref__rotulos__ano">Ano de Referência</label>
                    </div>
                    <div
                      class="consumoagua-mes-ref__campos"
                      role="group"
                      aria-labelledby="consumoagua-mes-ref-label">
                      <div class="consumoagua-mes-ref__campo">
                        <app-combobox-customizada
                          [options]="mesReferenciaMesOptions"
                          [(value)]="refMes"
                          (valueChange)="onRefMesAnoChange()"
                          [disabled]="fieldDisabled('mesReferencia')"
                          placeholder="Selecione"
                          ariaLabel="Mês de referência" />
                      </div>
                      <div class="consumoagua-mes-ref__campo">
                        <app-combobox-customizada
                          [options]="mesReferenciaAnoOptions"
                          [(value)]="refAno"
                          (valueChange)="onRefMesAnoChange()"
                          [disabled]="fieldDisabled('mesReferencia')"
                          placeholder="Selecione"
                          ariaLabel="Ano de referência" />
                      </div>
                    </div>
                    <input type="hidden" [(ngModel)]="model.mesReferencia" name="mesReferencia" />
                  </div>
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
    .consumoagua-dados {
      gap: 12px;
    }
    .consumoagua-dados__linha--1 {
      grid-template-columns: minmax(0, 40%) minmax(0, 35%) minmax(0, 25%);
    }
    .consumoagua-dados__linha--2 {
      grid-template-columns: minmax(0, 35%) minmax(0, 30%) minmax(0, 35%);
      align-items: end;
    }
    .consumoagua-dados__data-leitura,
    .consumoagua-dados__mes-ref {
      min-width: 0;
    }
    .consumoagua-data-leitura-rotulos {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .consumoagua-data-leitura-rotulos label {
      margin-bottom: 4px;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .consumoagua-data-leitura-rotulos__data {
      flex: 1 1 auto;
      min-width: 0;
    }
    .consumoagua-data-leitura-rotulos__hora {
      flex: 0 0 5.25rem;
      width: 5.25rem;
      text-align: left;
      white-space: nowrap;
    }
    .consumoagua-mes-ref__rotulos,
    .consumoagua-mes-ref__campos {
      display: grid;
      grid-template-columns: minmax(0, 0.92fr) minmax(5.5rem, 1.08fr);
      gap: 8px;
      width: 100%;
      min-width: 0;
    }
    .consumoagua-mes-ref__rotulos {
      align-items: flex-end;
      margin-bottom: 4px;
    }
    .consumoagua-mes-ref__rotulos label {
      margin-bottom: 0;
      min-height: 0;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .consumoagua-mes-ref__rotulos__mes {
      min-width: 0;
    }
    .consumoagua-mes-ref__rotulos__ano {
      white-space: nowrap;
    }
    .consumoagua-mes-ref__campos {
      align-items: end;
    }
    .consumoagua-mes-ref__campo {
      min-width: 0;
    }
    @media (max-width: 720px) {
      .consumoagua-dados__linha--1,
      .consumoagua-dados__linha--2 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ConsumoAguaFormComponent implements OnInit {
  model: ConsumoAgua = {} as ConsumoAgua;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Consumo Água';
  showDeleteConfirm = false;
  readonly permissionKey = 'CONSUMOAGUA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  hidrometroOptions: ComboboxOption[] = [];
  readonly mesReferenciaMesOptions: ComboboxOption[] = MESES_REFERENCIA.map((nome, i) => ({
    value: i + 1,
    label: nome,
  }));
  mesReferenciaAnoOptions: ComboboxOption[] = [];
  refMes?: number;
  refAno?: number;
  private hidrometrosAll: Hidrometro[] = [];
  private consumosHistorico: ConsumoAgua[] = [];
  private mesReferenciaManual = false;

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

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();
    this.mesReferenciaAnoOptions = this.gerarOpcoesAno();

    this.pageLoad.run(this.unidadeService.getPaged(1, 200), r => {
      this.fk_idUnidade = r.items.map((x: { idUnidade?: number; descricao?: string; nome?: string }) => ({
        value: x.idUnidade!,
        label: this.fkLabel_idUnidade(x),
      }));
    });

    this.pageLoad.run(this.hidrometroService.getPaged(1, 500), r => {
      this.hidrometrosAll = r.items;
      this.atualizarHidrometrosFiltrados();
    });

    this.pageLoad.run(this.service.getPaged(1, 500), r => {
      this.consumosHistorico = r.items;
      this.atualizarConsumoCalculado();
    });

    const idConsumo =
      this.route.snapshot.paramMap.get('idConsumoAgua') ??
      this.route.snapshot.paramMap.get('idConsumo');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idConsumo) {
      this.isEdit = true;
      this.mesReferenciaManual = true;
      this.refreshPermissions();
      this.pageLoad.run(
        this.service.getById(idConsumo),
        (registro) => {
          this.model = registro;
          this.carregarMesReferenciaDoModelo();
          this.atualizarHidrometrosFiltrados();
        },
        () => this.toast.showError('Registro não encontrado.'),
      );
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (field === 'consumo') return true;
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = ['consumo'];
    return roFields.includes(field);
  }

  onUnidadeChange(): void {
    const idHidro = this.model.idHidrometro;
    this.atualizarHidrometrosFiltrados();
    if (idHidro != null && !this.hidrometroOptions.some(o => o.value === idHidro)) {
      this.model.idHidrometro = undefined;
    }
    this.atualizarConsumoCalculado();
  }

  onHidrometroChange(): void {
    this.atualizarConsumoCalculado();
  }

  onDataLeituraChange(): void {
    this.preencherMesReferenciaSeAplicavel();
  }

  onRefMesAnoChange(): void {
    if (this.refMes != null || this.refAno != null) {
      this.mesReferenciaManual = true;
    }
    this.aplicarMesReferenciaNoModelo();
  }

  onLeituraChange(valor: number | null): void {
    if (valor != null && (!Number.isFinite(valor) || valor < 0)) {
      this.model.leituraHidrometro = Math.max(0, Math.floor(Math.abs(valor)));
    } else if (valor != null && !Number.isInteger(valor)) {
      this.model.leituraHidrometro = Math.max(0, Math.floor(valor));
    }
    this.atualizarConsumoCalculado();
  }

  private atualizarHidrometrosFiltrados(): void {
    const idUnidade = this.model.idUnidade;
    const fonte =
      idUnidade != null
        ? this.hidrometrosAll.filter(h => h.idUnidade === idUnidade)
        : this.hidrometrosAll;
    this.hidrometroOptions = fonte.map(h => ({
      value: h.idHidrometro!,
      label: this.fkLabel_idHidrometro(h),
    }));
  }

  private preencherMesReferenciaSeAplicavel(): void {
    if (this.mesReferenciaManual) return;
    const partes = this.partesDataLeitura(this.model.dataLeitura);
    if (!partes) return;
    this.refAno = partes.ano;
    this.refMes = partes.mes;
    this.garantirAnoNaLista(this.refAno);
    this.aplicarMesReferenciaNoModelo();
  }

  private partesDataLeitura(dataLeitura?: string): { ano: number; mes: number } | null {
    if (!dataLeitura?.trim()) return null;
    const norm = dataLeitura.trim().replace(' ', 'T');
    const segmentos = norm.split('T')[0]?.split('-');
    if (segmentos?.length !== 3 || segmentos[0].length !== 4 || segmentos[1].length !== 2) {
      return null;
    }
    const ano = parseInt(segmentos[0], 10);
    const mes = parseInt(segmentos[1], 10);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) return null;
    return { ano, mes };
  }

  private carregarMesReferenciaDoModelo(): void {
    const mr = this.model.mesReferencia?.trim();
    if (!mr) {
      this.refMes = undefined;
      this.refAno = undefined;
      return;
    }
    const match = mr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return;
    const ano = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    if (mes < 1 || mes > 12) return;
    this.refAno = ano;
    this.refMes = mes;
    this.garantirAnoNaLista(ano);
  }

  private aplicarMesReferenciaNoModelo(): void {
    if (this.refMes != null && this.refAno != null) {
      const mm = String(this.refMes).padStart(2, '0');
      this.model.mesReferencia = `${this.refAno}-${mm}`;
      return;
    }
    this.model.mesReferencia = undefined;
  }

  private gerarOpcoesAno(): ComboboxOption[] {
    const atual = new Date().getFullYear();
    const opcoes: ComboboxOption[] = [];
    for (let ano = atual - 30; ano <= atual + 10; ano++) {
      opcoes.push({ value: ano, label: String(ano) });
    }
    return opcoes.reverse();
  }

  private garantirAnoNaLista(ano: number): void {
    if (this.mesReferenciaAnoOptions.some(o => o.value === ano)) return;
    this.mesReferenciaAnoOptions = [
      { value: ano, label: String(ano) },
      ...this.mesReferenciaAnoOptions,
    ].sort((a, b) => Number(b.value) - Number(a.value));
  }

  private atualizarConsumoCalculado(): void {
    if (this.isEdit) return;
    const idHidrometro = this.model.idHidrometro;
    const leituraAtual = this.model.leituraHidrometro;
    if (idHidrometro == null || leituraAtual == null) {
      this.model.consumo = undefined;
      return;
    }
    const anteriores = this.consumosHistorico
      .filter(c => c.idHidrometro === idHidrometro && c.idConsumo !== this.model.idConsumo)
      .sort((a, b) => this.ordenarPorDataLeitura(b, a));
    const ultima = anteriores[0];
    if (ultima?.leituraHidrometro == null) {
      this.model.consumo = leituraAtual;
      return;
    }
    let diff = leituraAtual - ultima.leituraHidrometro;
    if (diff < 0) {
      const leituras = anteriores
        .slice(0, 3)
        .map(c => c.leituraHidrometro!)
        .concat(leituraAtual);
      if (this.leiturasDecrescentes(leituras)) {
        diff = diff * -1;
      }
    }
    this.model.consumo = diff < 0 ? undefined : diff;
  }

  private ordenarPorDataLeitura(a: ConsumoAgua, b: ConsumoAgua): number {
    const ta = a.dataLeitura ? Date.parse(a.dataLeitura.replace(' ', 'T')) : 0;
    const tb = b.dataLeitura ? Date.parse(b.dataLeitura.replace(' ', 'T')) : 0;
    return ta - tb;
  }

  private leiturasDecrescentes(valores: number[]): boolean {
    if (valores.length < 2) return false;
    for (let i = 0; i < valores.length - 1; i++) {
      if (valores[i] <= valores[i + 1]) return false;
    }
    return true;
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    if (!this.isEdit) {
      this.atualizarConsumoCalculado();
    }
    this.aplicarMesReferenciaNoModelo();
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => {
          this.toast.showSuccess('Alterações salvas com sucesso.');
          this.router.navigate(['/consumoagua']);
        },
        error: (e: unknown) => {
          this.toast.showError(this.mensagemErroApi(e));
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => {
          this.toast.showSuccess(this.entityTitle + ' gravado com sucesso.');
          this.router.navigate(['/consumoagua']);
        },
        error: (e: unknown) => {
          this.toast.showError(this.mensagemErroApi(e));
          this.saving = false;
        },
        complete: () => (this.saving = false),
      });
    }
  }

  private mensagemErroApi(e: unknown): string {
    return (
      (typeof (e as { error?: unknown })?.error === 'string' ? (e as { error: string }).error : null) ??
      (e as { error?: { title?: string; message?: string } })?.error?.title ??
      (e as { error?: { title?: string; message?: string } })?.error?.message ??
      (e as { message?: string })?.message ??
      'Não foi possível salvar. Tente novamente.'
    );
  }

  cancel(): void {
    this.router.navigate(['/consumoagua']);
  }

  confirmDelete(): void {
    this.service.delete(this.model.idConsumo!).subscribe({
      next: () => this.router.navigate(['/consumoagua']),
      error: () => this.toast.showError('Não foi possível excluir. Tente novamente.'),
    });
  }

  fkLabel_idUnidade(x: { descricao?: string; nome?: string; siglaUF?: string; cep?: string; idUnidade?: number }): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }

  fkLabel_idHidrometro(x: Hidrometro): string {
    return String(x?.numeroSerie ?? x?.idHidrometro ?? '');
  }
}
