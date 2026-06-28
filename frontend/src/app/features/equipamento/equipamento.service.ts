import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Equipamento } from './equipamento.model';

@Injectable({ providedIn: 'root' })
export class EquipamentoService {
  private base = `${environment.apiUrl}/equipamento`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Equipamento>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Equipamento>>(this.base, { params });
  }

  getById(idEquipamento: number | string): Observable<Equipamento> {
    return this.http.get<Equipamento>(`${this.base}/${idEquipamento}`);
  }

  create(item: Equipamento): Observable<Equipamento> {
    return this.http.post<Equipamento>(this.base, item);
  }

  update(item: Equipamento): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idEquipamento}`, item);
  }

  delete(idEquipamento: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idEquipamento}`);
  }
}
