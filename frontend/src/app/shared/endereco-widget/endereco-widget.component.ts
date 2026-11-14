import { Component, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../combobox-customizada/combobox-customizada.component';
import { ListLoadingModalComponent } from '../list-loading-modal/list-loading-modal.component';
import { EnderecoService } from '../../features/endereco/endereco.service';
import { BairroService } from '../../features/bairro/bairro.service';
import { MunicipioService } from '../../features/municipio/municipio.service';
import { UFService } from '../../features/uf/uf.service';
import { map, Observable, of, throwError, timeout } from 'rxjs';
import { Endereco } from '../../features/endereco/endereco.model';
import { Bairro } from '../../features/bairro/bairro.model';
import { Municipio } from '../../features/municipio/municipio.model';
import { UF } from '../../features/uf/uf.model';
import { mascaraCep, somenteDigitos } from '../../core/utils/documento-validator';
import { ToastService } from '../../core/services/toast.service';

const UF_NOMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
};

interface ViaCep {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
}

/** RN-Endereço 01–08 — componente reutilizável de endereço. */
@Component({
  selector: 'app-endereco-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, ListLoadingModalComponent],
  template: `
    <app-list-loading-modal [visible]="carregando" message="Aguarde, carregando..." [delayMs]="0" />
    <app-list-loading-modal [visible]="cepLoading" message="Aguarde, consultando o CEP..." />
    <div class="form-grid">
      <div style="grid-column: 1 / span 2; grid-row: 1" class="form-group fg-col-2">
        <label>CEP *</label>
        <input type="text" name="cEP" [ngModel]="cepDisplay" (ngModelChange)="onCepModel($event)"
          (focus)="onCepFocus()" (blur)="onCepBlur()" [disabled]="readonly"
          [attr.maxlength]="cepFocused ? 8 : 10" required />
      </div>
      <div style="grid-column: 3 / span 10; grid-row: 1" class="form-group fg-col-10">
        <label>Logradouro *</label>
        <input type="text" [value]="logradouro" (input)="onLogradouro($any($event.target).value)"
          [disabled]="readonly" maxlength="100" required />
      </div>
      <div style="grid-column: 1 / span 2; grid-row: 2" class="form-group fg-col-2">
        <label>Número{{ numeroObrigatorio ? ' *' : '' }}</label>
        <input type="text" name="numeroEndereco" [(ngModel)]="numero" (ngModelChange)="emitChange()" [disabled]="readonlyNumero" [required]="numeroObrigatorio" />
      </div>
      <div style="grid-column: 3 / span 10; grid-row: 2" class="form-group fg-col-10">
        <label>Complemento</label>
        <input type="text" [value]="complemento" (input)="onComplemento($any($event.target).value)"
          [disabled]="readonlyNumero" maxlength="255" />
      </div>
      <div style="grid-column: 1 / span 6; grid-row: 3" class="form-group fg-col-6">
        <label>UF</label>
        <app-combobox-customizada [options]="ufOptions" [(value)]="siglaUf"
          (valueChange)="onUfChange()" (blurCommit)="onUfCommit($event)"
          [disabled]="readonly" placeholder="Digite para filtrar a UF..." />
      </div>
      <div style="grid-column: 7 / span 6; grid-row: 3" class="form-group fg-col-6">
        <label>Município</label>
        <app-combobox-customizada [options]="municipioOptions" [(value)]="codigoIbgeMunicipio"
          (valueChange)="onMunicipioChange()" (blurCommit)="onMunicipioCommit($event)"
          [disabled]="readonly" placeholder="Digite para filtrar o município..." />
      </div>
      <div style="grid-column: 1 / span 6; grid-row: 4" class="form-group fg-col-6">
        <label>Bairro *</label>
        <app-combobox-customizada [options]="bairroOptions" [(value)]="bairroSelecionado"
          (valueChange)="onBairroChange()" (blurCommit)="onBairroCommit($event)"
          [disabled]="readonly" [required]="true" placeholder="Digite para filtrar o bairro..." />
      </div>
    </div>
    <div class="cep-list" *ngIf="cepMatches.length">
      <p>CEP encontrado — selecione:</p>
      <button type="button" *ngFor="let e of cepMatches" (click)="applyEndereco(e)">
        {{ e.logradouro }} — {{ e.cep }}
      </button>
    </div>
    <div class="cep-list" *ngIf="viaCepOpcoes.length">
      <p>CEP encontrado — selecione:</p>
      <button type="button" *ngFor="let e of viaCepOpcoes" (click)="aplicarViaCep(e, cepDigitos())">
        {{ e.logradouro }} — {{ e.bairro }} — {{ e.localidade }}/{{ e.uf }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .cep-list button { display: block; width: 100%; text-align: left; margin: 4px 0; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; cursor: pointer; }
  `]
})
export class EnderecoWidgetComponent implements OnInit, OnChanges {
  /** vinculo: reaproveita ou grava um endereço e devolve o id. cadastro: edita o próprio endereço. */
  @Input() modo: 'vinculo' | 'cadastro' = 'vinculo';
  @Input() idEndereco: number | null | undefined = null;
  @Input() cep: string | null | undefined = '';
  @Input() logradouroVinculo: string | null | undefined = '';
  @Input() numero: string | number | undefined = '';
  @Input() complemento: string | undefined = '';
  @Input() idBairro: number | null | undefined = null;
  @Input() readonly = false;
  @Input() readonlyNumero = false;
  @Input() numeroObrigatorio = false;
  @Output() idEnderecoChange = new EventEmitter<number | null>();
  @Output() cepChange = new EventEmitter<string>();
  @Output() logradouroChange = new EventEmitter<string>();
  @Output() numeroChange = new EventEmitter<string>();
  @Output() complementoChange = new EventEmitter<string>();
  @Output() idBairroChange = new EventEmitter<number | null>();

  cepDisplay = '';
  cepFocused = false;
  logradouro = '';
  bairroSelecionado: number | string | null = null;
  siglaUf: string | null = null;
  codigoIbgeMunicipio: number | null = null;
  manualEdit = true;
  cepMatches: Endereco[] = [];
  viaCepOpcoes: ViaCep[] = [];
  cepLoading = false;
  /** Edição: cobre a tela até UF, município e bairro do registro estarem visíveis. */
  carregando = false;

  ufOptions: ComboboxOption[] = [];
  municipioOptions: ComboboxOption[] = [];
  bairroOptions: ComboboxOption[] = [];
  private ufs: UF[] = [];
  private municipios: Municipio[] = [];
  private bairros: Bairro[] = [];
  private sincronizando = false;
  private ultimoCepEmitido = '';
  /** CEP (só dígitos) no momento do focus — evita nova busca se o valor não mudou. */
  private cepDigitosNoFocus = '';
  private ultimaSiglaUf: string | null = null;
  private ultimoCodigoIbgeMunicipio: number | null = null;
  private idEnderecoResolvido: number | null = null;
  private listasPendentes = 3;
  private filaInicial = 0;
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);

  constructor(
    private enderecoSvc: EnderecoService,
    private bairroSvc: BairroService,
    private municipioSvc: MunicipioService,
    private ufSvc: UFService
  ) {}

  ngOnInit(): void {
    this.cepDisplay = mascaraCep(this.cep ?? '');
    this.logradouro = this.logradouroVinculo ?? '';
    this.bairroSelecionado = this.idBairro ?? null;
    this.loadLookups();
    this.resolverEnderecoVinculo(this.idEndereco);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idEndereco']) this.resolverEnderecoVinculo(this.idEndereco);
    if (this.modo !== 'cadastro') return;
    if (changes['cep'] && !this.cepFocused && somenteDigitos(this.cep ?? '') !== this.ultimoCepEmitido) {
      const digits = somenteDigitos(this.cep ?? '');
      this.cepDisplay = mascaraCep(digits);
      this.ultimoCepEmitido = digits;
    }
    if (changes['logradouroVinculo'] && (this.logradouroVinculo ?? '') !== this.logradouro) {
      this.logradouro = this.logradouroVinculo ?? '';
    }
    if (changes['idBairro']) this.resolverBairroInicial(this.idBairro ?? null);
  }

  cepDigitos(): string {
    return somenteDigitos(this.cepDisplay).slice(0, 8);
  }

  /** Grava o endereço do vínculo, se ainda não houver id, e devolve esse id. */
  persistirVinculo(): Observable<number> {
    if (this.idEndereco != null) return of(this.idEndereco);
    const cep = this.cepDigitos();
    const logradouro = this.logradouro.trim();
    if (cep.length !== 8 || !logradouro || this.idBairro == null) {
      return throwError(() => new Error('endereco'));
    }
    const body = { cep, logradouro, idBairro: this.idBairro } as Endereco;
    return this.enderecoSvc.create(body).pipe(
      map(created => {
        const id = created.idEndereco;
        if (id == null) throw new Error('endereco');
        this.idEndereco = id;
        this.emitChange();
        return id;
      })
    );
  }

  onCepFocus(): void {
    this.cepFocused = true;
    this.cepDigitosNoFocus = this.cepDigitos();
    this.cepDisplay = this.cepDigitosNoFocus;
  }

  onLogradouro(value: string): void {
    this.logradouro = value;
    this.emitChange();
  }

  onComplemento(value: string): void {
    this.complemento = value ?? '';
    this.emitChange();
  }

  onCepModel(value: string): void {
    const digits = somenteDigitos(value).slice(0, 8);
    this.cepDisplay = this.cepFocused ? digits : mascaraCep(digits);
  }

  onCepBlur(): void {
    this.cepFocused = false;
    const cep = this.cepDigitos();
    this.cepDisplay = mascaraCep(cep);
    this.emitChange();
    if (this.readonly || cep.length !== 8) return;
    if (cep === this.cepDigitosNoFocus) return;
    this.cepLoading = true;
    this.cepMatches = [];
    this.viaCepOpcoes = [];
    this.enderecoSvc.getPaged(1, 20, cep).pipe(timeout(2500)).subscribe({
      next: r => {
        this.cepMatches = (r.items ?? []).filter(e => somenteDigitos(e.cep ?? '') === cep);
        this.viaCepOpcoes = [];
        if (this.cepMatches.length === 1) {
          this.applyEndereco(this.cepMatches[0]);
          this.cepLoading = false;
        } else if (!this.cepMatches.length) {
          this.buscarViaCep(cep);
        } else {
          this.cepLoading = false;
        }
      },
      error: () => this.buscarViaCep(cep)
    });
  }

  private loadLookups(): void {
    this.ufSvc.getPaged(1, 100).subscribe({
      next: r => {
        this.ufs = r.items ?? [];
        this.ufOptions = this.ufs.map(u => ({ value: u.siglaUF!, label: `${u.siglaUF} — ${u.estado}` }));
        this.aplicarBairro(this.idBairro ?? null);
        this.marcarListaPronta();
      },
      error: () => this.marcarListaPronta()
    });
    this.municipioSvc.getPaged(1, 500).subscribe({
      next: r => {
        this.municipios = r.items ?? [];
        this.aplicarBairro(this.idBairro ?? null);
        this.marcarListaPronta();
      },
      error: () => this.marcarListaPronta()
    });
    this.bairroSvc.getPaged(1, 500).subscribe({
      next: r => {
        this.bairros = r.items ?? [];
        this.aplicarBairro(this.idBairro ?? null);
        this.marcarListaPronta();
      },
      error: () => this.marcarListaPronta()
    });
  }

  /** Vínculo: busca o endereço quando o id chega na edição. */
  private resolverEnderecoVinculo(id: number | null | undefined): void {
    if (this.modo !== 'vinculo' || id == null || id === this.idEnderecoResolvido) return;
    this.idEnderecoResolvido = id;
    this.ocuparInicial();
    this.enderecoSvc.getById(id).subscribe({
      next: e => this.applyEndereco(e, () => this.liberarInicial()),
      error: () => this.liberarInicial()
    });
  }

  /** Cadastro: espera o bairro (e a UF/município derivados) antes de liberar a tela. */
  private resolverBairroInicial(id: number | null): void {
    if (id == null) {
      this.aplicarBairro(null);
      return;
    }
    this.ocuparInicial();
    this.aplicarBairro(id, () => this.liberarInicial());
  }

  private ocuparInicial(): void {
    this.filaInicial++;
    this.carregando = true;
  }

  private liberarInicial(): void {
    this.filaInicial = Math.max(0, this.filaInicial - 1);
    this.atualizarCarregando();
  }

  private marcarListaPronta(): void {
    this.listasPendentes = Math.max(0, this.listasPendentes - 1);
    this.atualizarCarregando();
  }

  private atualizarCarregando(): void {
    if (this.filaInicial === 0 && this.listasPendentes === 0) this.carregando = false;
  }

  private buscarViaCep(cep: string): void {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => {
        if (!response.ok) throw new Error('cep');
        return response.json() as Promise<ViaCep | ViaCep[]>;
      })
      .then(data => this.zone.run(() => {
        const lista = (Array.isArray(data) ? data : [data]).filter(item => item && !item.erro);
        if (!lista.length) {
          this.manualEdit = true;
          this.toast.showError('CEP não encontrado.');
          return;
        }
        if (lista.length > 1) {
          this.viaCepOpcoes = lista;
          return;
        }
        this.aplicarViaCep(lista[0], cep);
      }))
      .catch(() => this.zone.run(() => {
        this.manualEdit = true;
        this.toast.showError('Não foi possível consultar o CEP.');
      }))
      .finally(() => this.zone.run(() => { this.cepLoading = false; }));
  }

  aplicarViaCep(data: ViaCep, cep: string): void {
    this.viaCepOpcoes = [];
    this.cepMatches = [];
    this.logradouro = data.logradouro ?? this.logradouro;
    if (!this.complemento && data.complemento) this.complemento = data.complemento;
    const sigla = (data.uf ?? '').toUpperCase();
    const ibge = String(data.ibge ?? '');
    this.garantirUf(sigla, ibge, () => {
      this.garantirMunicipio(ibge, data.localidade ?? '', sigla, () => {
        this.garantirBairro(data.bairro ?? '', Number(ibge), () => {
          this.manualEdit = true;
          if (this.modo === 'vinculo') this.gravarEnderecoNovo(cep);
          else this.emitChange();
        });
      });
    });
  }

  private garantirUf(sigla: string, ibge: string, done: () => void): void {
    if (!sigla) { done(); return; }
    this.siglaUf = sigla;
    const naLista = this.ufs.find(u => u.siglaUF === sigla);
    if (naLista) {
      this.atualizarOpcoesUf();
      done();
      return;
    }
    this.ufSvc.getById(sigla).subscribe({
      next: uf => {
        this.incluirUf(uf);
        done();
      },
      error: () => {
        const body: UF = {
          siglaUF: sigla,
          estado: UF_NOMES[sigla] ?? sigla,
          codigoIBGE: Number(ibge.slice(0, 2)) || undefined
        };
        this.ufSvc.create(body).subscribe({
          next: created => {
            this.incluirUf(created?.siglaUF ? created : body);
            done();
          },
          error: () => {
            this.incluirUf(body);
            done();
          }
        });
      }
    });
  }

  private incluirUf(uf: UF): void {
    if (!this.ufs.some(u => u.siglaUF === uf.siglaUF)) this.ufs.push(uf);
    this.atualizarOpcoesUf();
  }

  private atualizarOpcoesUf(): void {
    this.ufOptions = this.ufs.map(u => ({ value: u.siglaUF!, label: `${u.siglaUF} — ${u.estado}` }));
  }

  private garantirMunicipio(ibge: string, nome: string, sigla: string, done: () => void): void {
    const codigo = Number(ibge);
    if (!codigo) { done(); return; }
    this.codigoIbgeMunicipio = codigo;
    const naLista = this.municipios.find(m => Number(m.codigoIBGEMunicipio) === codigo);
    if (naLista) {
      this.filterMunicipios();
      done();
      return;
    }
    this.municipioSvc.getById(codigo).subscribe({
      next: municipio => {
        this.incluirMunicipio(municipio);
        done();
      },
      error: () => {
        const body: Municipio = { codigoIBGEMunicipio: codigo, nome, siglaUF: sigla };
        this.municipioSvc.create(body).subscribe({
          next: created => {
            this.incluirMunicipio(created?.codigoIBGEMunicipio != null ? created : body);
            done();
          },
          error: () => {
            this.incluirMunicipio(body);
            done();
          }
        });
      }
    });
  }

  private incluirMunicipio(municipio: Municipio): void {
    const codigo = Number(municipio.codigoIBGEMunicipio);
    if (!this.municipios.some(m => Number(m.codigoIBGEMunicipio) === codigo)) {
      this.municipios.push(municipio);
    }
    this.filterMunicipios();
  }

  private garantirBairro(nome: string, codigoMunicipio: number, done: () => void): void {
    const nomeBusca = nome.trim();
    const existente = this.bairros.find(b => this.mesmoBairro(b, nomeBusca, codigoMunicipio));
    if (existente) {
      this.aplicarBairro(existente.idBairro ?? null);
      done();
      return;
    }
    if (!nomeBusca || !codigoMunicipio) { done(); return; }
    this.bairroSvc.getPaged(1, 50, nomeBusca, codigoMunicipio).subscribe({
      next: r => {
        const achado = (r.items ?? []).find(b => this.mesmoBairro(b, nomeBusca, codigoMunicipio));
        if (achado) {
          this.usarBairro(achado);
          done();
          return;
        }
        this.criarBairro(nomeBusca, codigoMunicipio, done);
      },
      error: () => this.criarBairro(nomeBusca, codigoMunicipio, done)
    });
  }

  private criarBairro(nome: string, codigoMunicipio: number, done: () => void): void {
    const body: Bairro = { nome, codigoIBGEMunicipio: codigoMunicipio };
    this.bairroSvc.create(body).subscribe({
      next: created => {
        this.usarBairro(created?.idBairro ? created : body);
        if (!created?.idBairro) this.bairroSelecionado = nome;
        done();
      },
      error: () => {
        this.idBairro = null;
        this.bairroSelecionado = nome;
        this.siglaUf = this.municipios.find(m => Number(m.codigoIBGEMunicipio) === codigoMunicipio)?.siglaUF ?? this.siglaUf;
        done();
      }
    });
  }

  private usarBairro(bairro: Bairro): void {
    if (bairro.idBairro != null && !this.bairros.some(b => b.idBairro === bairro.idBairro)) {
      this.bairros.push(bairro);
    }
    this.aplicarBairro(bairro.idBairro ?? null);
  }

  private mesmoBairro(bairro: Bairro, nome: string, codigoMunicipio: number): boolean {
    return Number(bairro.codigoIBGEMunicipio) === codigoMunicipio
      && this.normalizarNome(bairro.nome ?? '') === this.normalizarNome(nome);
  }

  private normalizarNome(valor: string): string {
    return valor.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
  }

  applyEndereco(e: Endereco, done: () => void = () => {}): void {
    if (this.modo === 'vinculo') this.idEndereco = e.idEndereco ?? null;
    this.cepDisplay = mascaraCep(e.cep ?? '');
    this.logradouro = e.logradouro ?? '';
    this.aplicarBairro(e.idBairro ?? null, done);
    this.cepMatches = [];
    this.manualEdit = true;
    this.emitChange();
  }

  private gravarEnderecoNovo(cep: string): void {
    if (!this.idBairro) {
      this.emitChange();
      return;
    }
    const body = { cep, logradouro: this.logradouro, idBairro: this.idBairro } as Endereco;
    this.enderecoSvc.create(body).subscribe({
      next: created => {
        this.idEndereco = created.idEndereco ?? null;
        this.emitChange();
      },
      error: () => this.toast.showError('Não foi possível gravar o endereço localizado pelo CEP.')
    });
  }

  onUfChange(): void {
    if (this.sincronizando) return;
    this.aplicarFiltroUf(true);
  }

  onUfCommit(sigla: number | string | null): void {
    if (this.sincronizando) return;
    if (typeof sigla === 'string') this.siglaUf = sigla;
    else if (sigla == null) this.siglaUf = null;
    this.aplicarFiltroUf(true);
  }

  onMunicipioChange(): void {
    if (this.sincronizando) return;
    this.aplicarFiltroMunicipio(true);
  }

  onMunicipioCommit(codigo: number | string | null): void {
    if (this.sincronizando) return;
    if (codigo == null || codigo === '') {
      this.codigoIbgeMunicipio = null;
    } else {
      this.codigoIbgeMunicipio = Number(codigo);
    }
    this.aplicarFiltroMunicipio(true);
  }

  private aplicarFiltroUf(limparDependentesSeMudou: boolean): void {
    const uf = this.siglaUf;
    if (limparDependentesSeMudou && uf !== this.ultimaSiglaUf) {
      this.codigoIbgeMunicipio = null;
      this.bairroSelecionado = null;
      this.idBairro = null;
      this.ultimoCodigoIbgeMunicipio = null;
      this.ultimaSiglaUf = uf;
    }
    this.filterMunicipios();
    this.filterBairros();
    this.emitChange();
  }

  private aplicarFiltroMunicipio(limparBairroSeMudou: boolean): void {
    const codigo = this.codigoIbgeMunicipio;
    if (limparBairroSeMudou && codigo !== this.ultimoCodigoIbgeMunicipio) {
      this.bairroSelecionado = null;
      this.idBairro = null;
      this.ultimoCodigoIbgeMunicipio = codigo;
    }
    this.filterBairros();
    this.emitChange();
  }

  onBairroChange(): void {
    if (this.sincronizando) return;
    this.confirmarBairroSelecionado();
  }

  onBairroCommit(valor: number | string | null): void {
    if (this.sincronizando) return;
    if (valor == null || valor === '') {
      this.bairroSelecionado = null;
      this.idBairro = null;
    } else if (typeof valor === 'number') {
      this.bairroSelecionado = valor;
    } else {
      this.bairroSelecionado = valor;
    }
    this.confirmarBairroSelecionado();
  }

  private confirmarBairroSelecionado(): void {
    if (typeof this.bairroSelecionado === 'number') {
      this.aplicarBairro(this.bairroSelecionado);
    } else {
      this.idBairro = null;
    }
    this.emitChange();
  }

  private aplicarBairro(id: number | null, done: () => void = () => {}): void {
    if (id == null) {
      this.sincronizando = true;
      this.idBairro = null;
      this.bairroSelecionado = null;
      this.filterBairros();
      this.sincronizando = false;
      done();
      return;
    }
    const local = this.bairros.find(x => x.idBairro === id);
    if (local) {
      this.aplicarBairroRegistro(local, done);
      return;
    }
    this.bairroSvc.getById(id).subscribe({
      next: b => {
        if (b.idBairro != null && !this.bairros.some(x => x.idBairro === b.idBairro)) {
          this.bairros.push(b);
        }
        this.aplicarBairroRegistro(b, done);
      },
      error: () => {
        this.sincronizando = true;
        this.idBairro = id;
        this.bairroSelecionado = id;
        this.filterBairros();
        this.sincronizando = false;
        done();
      }
    });
  }

  private aplicarBairroRegistro(bairro: Bairro, done: () => void = () => {}): void {
    this.sincronizando = true;
    this.idBairro = bairro.idBairro ?? null;
    this.bairroSelecionado = this.idBairro;
    const codigoMunicipio = bairro.codigoIBGEMunicipio != null ? Number(bairro.codigoIBGEMunicipio) : null;
    if (codigoMunicipio == null) {
      this.filterBairros();
      this.sincronizando = false;
      done();
      return;
    }
    this.ensureMunicipioCarregado(codigoMunicipio, () => {
      this.codigoIbgeMunicipio = codigoMunicipio;
      const municipio = this.municipios.find(x => Number(x.codigoIBGEMunicipio) === codigoMunicipio);
      this.siglaUf = municipio?.siglaUF ?? this.siglaUf;
      this.filterMunicipios();
      this.filterBairros();
      this.ultimaSiglaUf = this.siglaUf;
      this.ultimoCodigoIbgeMunicipio = codigoMunicipio;
      this.sincronizando = false;
      done();
    });
  }

  private ensureMunicipioCarregado(codigo: number, done: () => void): void {
    if (this.municipios.some(m => Number(m.codigoIBGEMunicipio) === codigo)) {
      done();
      return;
    }
    this.municipioSvc.getById(codigo).subscribe({
      next: m => {
        if (m.codigoIBGEMunicipio != null && !this.municipios.some(x => Number(x.codigoIBGEMunicipio) === Number(m.codigoIBGEMunicipio))) {
          this.municipios.push(m);
        }
        done();
      },
      error: () => done()
    });
  }

  private filterMunicipios(): void {
    if (!this.siglaUf) {
      this.municipioOptions = [];
      return;
    }
    const list = this.municipios.filter(m => m.siglaUF === this.siglaUf);
    this.municipioOptions = list.map(m => ({
      value: Number(m.codigoIBGEMunicipio),
      label: m.nome ?? String(m.codigoIBGEMunicipio ?? '')
    }));
  }

  private filterBairros(): void {
    if (this.codigoIbgeMunicipio == null) {
      this.bairroOptions = [];
      return;
    }
    const codigo = Number(this.codigoIbgeMunicipio);
    const list = this.bairros.filter(b => Number(b.codigoIBGEMunicipio) === codigo);
    this.bairroOptions = list.map(b => ({ value: b.idBairro!, label: b.nome ?? '' }));
  }

  emitChange(): void {
    const digits = this.cepDigitos();
    this.ultimoCepEmitido = digits;
    this.cepChange.emit(digits);
    this.logradouroChange.emit(this.logradouro);
    this.idBairroChange.emit(this.idBairro ?? null);
    this.idEnderecoChange.emit(this.idEndereco ?? null);
    this.numeroChange.emit(String(this.numero ?? ''));
    this.complementoChange.emit(this.complemento ?? '');
  }
}
