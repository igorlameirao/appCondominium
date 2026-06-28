import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfiguracaoCondominio } from '../../features/configuracaocondominio/configuracaocondominio.model';

export interface MunicipioResumo {
  codigoIBGEMunicipio: number;
  nome: string;
  siglaUF: string;
}

export interface BairroResumo {
  idBairro: number;
  nome: string;
  codigoIBGEMunicipio: number;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private base = `${environment.apiUrl}/lookup`;

  constructor(private http: HttpClient) {}

  municipiosPorUf(siglaUF: string): Observable<MunicipioResumo[]> {
    return this.http.get<MunicipioResumo[]>(`${this.base}/municipios-por-uf/${encodeURIComponent(siglaUF)}`);
  }

  bairrosPorMunicipio(codigoIbge: number): Observable<BairroResumo[]> {
    return this.http.get<BairroResumo[]>(`${this.base}/bairros-por-municipio/${codigoIbge}`);
  }

  configuracaoPorCondominio(idCondominio: number): Observable<ConfiguracaoCondominio> {
    return this.http.get<ConfiguracaoCondominio>(`${this.base}/configuracao-por-condominio/${idCondominio}`);
  }

  condominioResumo(idCondominio: number): Observable<{ idCondominio: number; nome: string }> {
    return this.http.get<{ idCondominio: number; nome: string }>(`${this.base}/condominio-resumo/${idCondominio}`);
  }
}
