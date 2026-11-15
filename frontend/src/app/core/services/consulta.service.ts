import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResultadoConsultaCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: number | null;
  enderecoComplemento?: string | null;
  idBairro?: number | null;
  bairro?: string | null;
}

export interface ResultadoConsultaBanco {
  codigoBanco: string;
  nome?: string | null;
  ispb?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  constructor(private http: HttpClient) {}

  consultarCnpj(cnpj: string): Observable<ResultadoConsultaCnpj> {
    const params = new HttpParams().set('cnpj', cnpj);
    return this.http.get<ResultadoConsultaCnpj>(`${environment.apiUrl}/cnpj`, { params });
  }

  consultarBancoPorCodigo(codigo: string): Observable<ResultadoConsultaBanco> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<ResultadoConsultaBanco>(`${environment.apiUrl}/banco-codigo`, { params });
  }
}
