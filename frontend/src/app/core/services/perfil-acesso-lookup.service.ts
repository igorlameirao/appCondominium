import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerfilAcessoLookupService {
  constructor(private http: HttpClient) {}

  listar(): Observable<{ idPerfil: number; descricao: string }[]> {
    return this.http.get<{ idPerfil: number; descricao: string }[]>(
      `${environment.apiUrl}/Permissao/opcoes-perfil`
    );
  }
}
