import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PessoaEnderecoItem {
  idPessoa: number;
  idEndereco: number;
  numeroEndereco?: number;
  complementoEndereco?: string;
  tipoEndereco: number;
  cep?: string;
  logradouro?: string;
  idBairro?: number;
}

export interface PessoaEnderecoUpsert {
  idEndereco?: number;
  cep?: string;
  logradouro?: string;
  idBairro?: number;
  numeroEndereco?: number;
  complementoEndereco?: string;
  tipoEndereco: number;
}

@Injectable({ providedIn: 'root' })
export class PessoaEnderecoService {
  constructor(private http: HttpClient) {}

  listar(idPessoa: number): Observable<PessoaEnderecoItem[]> {
    return this.http.get<PessoaEnderecoItem[]>(`${environment.apiUrl}/pessoas/${idPessoa}/enderecos`);
  }

  gravar(idPessoa: number, body: PessoaEnderecoUpsert): Observable<PessoaEnderecoItem> {
    return this.http.post<PessoaEnderecoItem>(`${environment.apiUrl}/pessoas/${idPessoa}/enderecos`, body);
  }

  atualizar(idPessoa: number, idEndereco: number, body: PessoaEnderecoUpsert): Observable<PessoaEnderecoItem> {
    return this.http.put<PessoaEnderecoItem>(`${environment.apiUrl}/pessoas/${idPessoa}/enderecos/${idEndereco}`, body);
  }

  remover(idPessoa: number, idEndereco: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/pessoas/${idPessoa}/enderecos/${idEndereco}`);
  }

  labelTipo(tipo: number): string {
    switch (tipo) {
      case 0: return 'Principal';
      case 1: return 'Secundário';
      case 2: return 'Inativo';
      default: return String(tipo);
    }
  }
}