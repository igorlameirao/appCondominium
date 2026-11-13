import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { UnidadeService } from './unidade.service';
import { Unidade } from './unidade.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { BlocoService } from '../bloco/bloco.service';
import { TipoUnidadeService } from '../tipounidade/tipounidade.service';
import { catchError, concatMap, finalize, from, of, tap } from 'rxjs';

@Component({
  selector: 'app-unidade-lote',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/unidade'">Unidade</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Incluir em lote</span>
          </nav>
          <h1 class="cad-titulo">Incluir unidades em lote</h1>
          <p class="cad-subtitulo">Cadastre várias unidades com o mesmo bloco e tipo, informando os números separados por vírgula</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="building" [tamanho]="16" />
              <span>Dados em lote</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="building" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Unidades semelhantes</h2>
                <p class="cad-secao__texto">Ex.: 101, 201, 301, 401 para o mesmo tipo de unidade em andares diferentes</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="loteForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <div class="form-grid">
                  <div style="grid-column: 1 / span 6; grid-row: 1" class="form-group fg-col-6">
                    <label>Bloco *</label>
                    <app-combobox-customizada
                      [options]="fk_idBloco"
                      [(value)]="idBloco"
                      name="idBloco"
                      [disabled]="!podeGravar"
                      [required]="true" />
                  </div>
                  <div style="grid-column: 7 / span 6; grid-row: 1" class="form-group fg-col-6">
                    <label>Tipo Unidade *</label>
                    <app-combobox-customizada
                      [options]="fk_idTipoUnidade"
                      [(value)]="idTipoUnidade"
                      name="idTipoUnidade"
                      [disabled]="!podeGravar"
                      [required]="true" />
                  </div>
                  <div style="grid-column: 1 / span 12; grid-row: 2" class="form-group fg-col-12">
                    <label>Números *</label>
                    <textarea
                      [(ngModel)]="numerosTexto"
                      name="numerosTexto"
                      rows="4"
                      required
                      [readonly]="!podeGravar"
                      (input)="sanitizarNumerosTexto($event)"
                      placeholder="101, 201, 301, 401, 501, 601"></textarea>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="loteForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
            <span class="cad-acoes__espaco"></span>
            <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
          </div>
        </section>
      </div>
    </div>
    <app-list-loading-modal [visible]="pageLoad.loading || saving" [message]="saving ? progressMessage : 'Aguarde, carregando...'" [delayMs]="0" />
  `,
})
export class UnidadeLoteComponent implements OnInit {
  idBloco?: number;
  idTipoUnidade?: number;
  numerosTexto = '';
  saving = false;
  progressMessage = 'Aguarde, gravando...';
  private progressAtual = 0;
  private progressTotal = 0;

  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  readonly permissionKey = 'UNIDADE';

  fk_idBloco: ComboboxOption[] = [];
  fk_idTipoUnidade: ComboboxOption[] = [];

  constructor(
    private service: UnidadeService,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private blocoService: BlocoService,
    private tipoUnidadeService: TipoUnidadeService,
  ) {}

  get podeGravar(): boolean {
    return this.permissions.can(this.permissionKey, 'Incluir');
  }

  ngOnInit(): void {
    this.pageLoad.run(this.blocoService.getPaged(1, 200), (r) => {
      this.fk_idBloco = r.items.map((x) => ({
        value: x.idBloco!,
        label: this.fkLabel_idBloco(x),
      }));
    });
    this.pageLoad.run(this.tipoUnidadeService.getPaged(1, 200), (r) => {
      this.fk_idTipoUnidade = r.items.map((x) => ({
        value: x.idTipoUnidade!,
        label: this.fkLabel_idTipoUnidade(x),
      }));
    });
    this.pageLoad.seal();
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    const numeros = this.parseNumeros(this.numerosTexto);
    if (!numeros.length) {
      this.toast.showError('Informe ao menos um número de unidade válido (separados por vírgula).');
      return;
    }
    if (this.idBloco == null || this.idTipoUnidade == null) {
      this.toast.showError('Selecione o bloco e o tipo de unidade.');
      return;
    }

    const idCondominio = this.condominioCtx.idCondominio;
    if (idCondominio == null) {
      this.toast.showError('Condomínio ativo não identificado.');
      return;
    }

    this.saving = true;
    this.progressTotal = numeros.length;
    this.progressAtual = 0;
    let gravados = 0;
    let falhas = 0;

    from(numeros)
      .pipe(
        concatMap((numero) => {
          const item: Unidade = {
            idCondominio,
            idBloco: this.idBloco,
            idTipoUnidade: this.idTipoUnidade,
            numero,
          };
          return this.service.create(item).pipe(
            tap(() => {
              gravados++;
              this.progressAtual++;
              this.progressMessage = `Gravando unidades (${this.progressAtual} de ${this.progressTotal})...`;
            }),
            catchError(() => {
              falhas++;
              this.progressAtual++;
              this.progressMessage = `Gravando unidades (${this.progressAtual} de ${this.progressTotal})...`;
              return of(null);
            }),
          );
        }),
        finalize(() => {
          this.saving = false;
          this.progressMessage = 'Aguarde, gravando...';
        }),
      )
      .subscribe({
        complete: () => {
          if (falhas === 0) {
            this.toast.showSuccess(
              gravados === 1 ? '1 unidade gravada com sucesso.' : `${gravados} unidades gravadas com sucesso.`,
            );
            this.router.navigate(['/unidade']);
            return;
          }
          if (gravados > 0) {
            this.toast.showError(`${gravados} unidade(s) gravada(s) e ${falhas} falha(s). Verifique os números e tente novamente.`);
            this.router.navigate(['/unidade']);
            return;
          }
          this.toast.showError('Não foi possível gravar as unidades. Verifique os dados e tente novamente.');
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/unidade']);
  }

  sanitizarNumerosTexto(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    const filtrado = el.value.replace(/[^\d, ]/g, '');
    if (filtrado !== el.value) {
      el.value = filtrado;
    }
    this.numerosTexto = filtrado;
  }

  private parseNumeros(texto: string): number[] {
    const vistos = new Set<number>();
    const resultado: number[] = [];
    for (const parte of texto.split(/[,\s]+/)) {
      const trecho = parte.trim();
      if (!trecho) continue;
      if (!/^\d+$/.test(trecho)) continue;
      const n = Number(trecho);
      if (!Number.isSafeInteger(n) || n <= 0) continue;
      if (vistos.has(n)) continue;
      vistos.add(n);
      resultado.push(n);
    }
    return resultado;
  }

  fkLabel_idBloco(x: { descricao?: string; idBloco?: number }): string {
    return String(x?.descricao ?? x?.idBloco ?? '');
  }

  fkLabel_idTipoUnidade(x: { descricao?: string; idTipoUnidade?: number }): string {
    return String(x?.descricao ?? x?.idTipoUnidade ?? '');
  }
}
