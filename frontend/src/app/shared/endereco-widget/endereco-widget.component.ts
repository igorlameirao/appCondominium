import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../combobox-customizada/combobox-customizada.component';
import { EnderecoService } from '../../features/endereco/endereco.service';
import { BairroService } from '../../features/bairro/bairro.service';
import { MunicipioService } from '../../features/municipio/municipio.service';
import { UFService } from '../../features/uf/uf.service';
import { Endereco } from '../../features/endereco/endereco.model';
import { Bairro } from '../../features/bairro/bairro.model';
import { Municipio } from '../../features/municipio/municipio.model';
import { UF } from '../../features/uf/uf.model';
import { mascaraCep, somenteDigitos } from '../../core/utils/documento-validator';
import { environment } from '../../../environments/environment';

/** RN-Endereço 01–08 — componente reutilizável de endereço. */
@Component({
  selector: 'app-endereco-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent],
  template: `
    <div class="end-grid">
      <div class="form-group">
        <label>CEP *</label>
        <input type="text" [(ngModel)]="cepDisplay" (focus)="cepFocused=true" (blur)="onCepBlur()" [disabled]="readonly" />
      </div>
      <div class="form-group span-2">
        <label>Logradouro</label>
        <input type="text" [(ngModel)]="logradouro" [disabled]="!manualEdit" />
      </div>
      <div class="form-group">
        <label>Número</label>
        <input type="text" [(ngModel)]="numero" (ngModelChange)="emitChange()" [disabled]="readonlyNumero" />
      </div>
      <div class="form-group">
        <label>Complemento</label>
        <input type="text" [(ngModel)]="complemento" (ngModelChange)="emitChange()" [disabled]="readonlyNumero" />
      </div>
      <div class="form-group">
        <label>UF</label>
        <app-combobox-customizada [options]="ufOptions" [(value)]="siglaUf" (valueChange)="onUfChange()" [disabled]="!manualEdit" />
      </div>
      <div class="form-group">
        <label>Município</label>
        <app-combobox-customizada [options]="municipioOptions" [(value)]="codigoIbgeMunicipio" (valueChange)="onMunicipioChange()" [disabled]="!manualEdit" />
      </div>
      <div class="form-group">
        <label>Bairro</label>
        <app-combobox-customizada [options]="bairroOptions" [(value)]="idBairro" (valueChange)="emitChange()" [disabled]="!manualEdit" />
      </div>
    </div>
    <div class="cep-list" *ngIf="cepMatches.length">
      <p>CEP encontrado — selecione:</p>
      <button type="button" *ngFor="let e of cepMatches" (click)="applyEndereco(e)">
        {{ e.logradouro }} — {{ e.cEP }}
      </button>
    </div>
  `,
  styles: [`
    .end-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; }
    .span-2 { grid-column: span 2; }
    .cep-list button { display: block; width: 100%; text-align: left; margin: 4px 0; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; cursor: pointer; }
  `]
})
export class EnderecoWidgetComponent implements OnInit {
  @Input() idEndereco: number | null | undefined = null;
  @Input() numero: string | number | undefined = '';
  @Input() complemento: string | undefined = '';
  @Input() readonly = false;
  @Input() readonlyNumero = false;
  @Output() idEnderecoChange = new EventEmitter<number | null>();
  @Output() numeroChange = new EventEmitter<string>();
  @Output() complementoChange = new EventEmitter<string>();

  cepDisplay = '';
  cepFocused = false;
  logradouro = '';
  siglaUf: string | null = null;
  codigoIbgeMunicipio: number | null = null;
  idBairro: number | null = null;
  manualEdit = false;
  cepMatches: Endereco[] = [];

  ufOptions: ComboboxOption[] = [];
  municipioOptions: ComboboxOption[] = [];
  bairroOptions: ComboboxOption[] = [];
  private ufs: UF[] = [];
  private municipios: Municipio[] = [];
  private bairros: Bairro[] = [];

  constructor(
    private enderecoSvc: EnderecoService,
    private bairroSvc: BairroService,
    private municipioSvc: MunicipioService,
    private ufSvc: UFService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    if (this.idEndereco) this.loadEndereco(this.idEndereco);
  }

  private loadLookups(): void {
    this.ufSvc.getPaged(1, 100).subscribe(r => {
      this.ufs = r.items;
      this.ufOptions = r.items.map(u => ({ value: u.siglaUF!, label: `${u.siglaUF} - ${u.estado}` }));
    });
    this.municipioSvc.getPaged(1, 500).subscribe(r => { this.municipios = r.items; this.filterMunicipios(); });
    this.bairroSvc.getPaged(1, 500).subscribe(r => { this.bairros = r.items; this.filterBairros(); });
  }

  onCepBlur(): void {
    this.cepFocused = false;
    const cep = somenteDigitos(this.cepDisplay);
    this.cepDisplay = mascaraCep(cep);
    if (cep.length !== 8) return;
    this.enderecoSvc.getPaged(1, 20, cep).subscribe(r => {
      this.cepMatches = r.items.filter(e => e.cEP?.includes(cep));
      if (this.cepMatches.length === 1) this.applyEndereco(this.cepMatches[0]);
      else if (!this.cepMatches.length) this.buscarViaCep(cep);
    });
  }

  private buscarViaCep(cep: string): void {
    this.http.get<Record<string, string>>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: data => {
        if (data['erro']) { this.manualEdit = true; return; }
        this.logradouro = data['logradouro'] ?? '';
        this.siglaUf = data['uf'] ?? null;
        this.filterMunicipios();
        const ibge = Number(data['ibge']);
        this.codigoIbgeMunicipio = ibge || null;
        this.filterBairros();
        const bairroNome = data['bairro'];
        const b = this.bairros.find(x => x.nome?.toLowerCase() === bairroNome?.toLowerCase());
        this.idBairro = b?.idBairro ?? null;
        this.manualEdit = false;
        this.gravarEnderecoNovo(cep);
      },
      error: () => { this.manualEdit = true; }
    });
  }

  applyEndereco(e: Endereco): void {
    this.idEndereco = e.idEndereco ?? null;
    this.cepDisplay = mascaraCep(e.cEP ?? '');
    this.logradouro = e.logradouro ?? '';
    this.idBairro = e.idBairro ?? null;
    const b = this.bairros.find(x => x.idBairro === e.idBairro);
    if (b) {
      this.codigoIbgeMunicipio = b.codigoIBGEMunicipio ?? null;
      const m = this.municipios.find(x => x.codigoIBGEMunicipio === b.codigoIBGEMunicipio);
      this.siglaUf = m?.siglaUF ?? null;
      this.filterMunicipios();
      this.filterBairros();
    }
    this.cepMatches = [];
    this.manualEdit = false;
    this.emitChange();
  }

  private gravarEnderecoNovo(cep: string): void {
    const body = { cEP: cep, logradouro: this.logradouro, idBairro: this.idBairro! } as Endereco;
    this.enderecoSvc.create(body).subscribe({
      next: created => {
        this.idEndereco = created.idEndereco ?? null;
        this.emitChange();
      }
    });
  }

  private loadEndereco(id: number): void {
    this.enderecoSvc.getById(id).subscribe(e => this.applyEndereco(e));
  }

  onUfChange(): void { this.filterMunicipios(); this.codigoIbgeMunicipio = null; this.idBairro = null; this.filterBairros(); this.emitChange(); }
  onMunicipioChange(): void { this.filterBairros(); this.idBairro = null; this.emitChange(); }

  private filterMunicipios(): void {
    const list = this.siglaUf ? this.municipios.filter(m => m.siglaUF === this.siglaUf) : this.municipios;
    this.municipioOptions = list.map(m => ({ value: m.codigoIBGEMunicipio!, label: m.nome ?? '' }));
  }

  private filterBairros(): void {
    const list = this.codigoIbgeMunicipio
      ? this.bairros.filter(b => b.codigoIBGEMunicipio === this.codigoIbgeMunicipio)
      : this.bairros;
    this.bairroOptions = list.map(b => ({ value: b.idBairro!, label: b.nome ?? '' }));
  }

  emitChange(): void {
    this.idEnderecoChange.emit(this.idEndereco);
    this.numeroChange.emit(String(this.numero ?? ''));
    this.complementoChange.emit(this.complemento);
  }
}
