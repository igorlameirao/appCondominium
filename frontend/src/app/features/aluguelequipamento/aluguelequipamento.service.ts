import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { AluguelEquipamento } from './aluguelequipamento.model';

@Injectable({ providedIn: 'root' })
export class AluguelEquipamentoService {
  private base = `${environment.apiUrl}/aluguelequipamento`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<AluguelEquipamento>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<AluguelEquipamento>>(this.base, { params });
  }

  getById(idAluguelEquipamento: number | string): Observable<AluguelEquipamento> {
    return this.http.get<AluguelEquipamento>(`${this.base}/${idAluguelEquipamento}`);
  }

  create(item: AluguelEquipamento): Observable<AluguelEquipamento> {
    return this.http.post<AluguelEquipamento>(this.base, item);
  }

  update(item: AluguelEquipamento): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idAluguelEquipamento}`, item);
  }

  delete(idAluguelEquipamento: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idAluguelEquipamento}`);
  }
}
