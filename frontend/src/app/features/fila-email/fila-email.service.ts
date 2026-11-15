import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import {
  EmailQueueDetalhe,
  EmailQueueFiltros,
  EmailQueueListItem,
  EmailQueueReprocessarResultado
} from './fila-email.model';

@Injectable({ providedIn: 'root' })
export class FilaEmailService {
  private readonly base = `${environment.apiUrl}/fila-email`;

  constructor(private http: HttpClient) {}

  getPaged(page = 1, pageSize = 20, filtros?: EmailQueueFiltros): Observable<PagedResult<EmailQueueListItem>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filtros?.status?.trim()) params = params.set('status', filtros.status.trim());
    if (filtros?.destinatario?.trim()) params = params.set('destinatario', filtros.destinatario.trim());
    if (filtros?.assunto?.trim()) params = params.set('assunto', filtros.assunto.trim());
    if (filtros?.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params = params.set('dataFim', filtros.dataFim);
    return this.http.get<PagedResult<EmailQueueListItem>>(this.base, { params });
  }

  getById(id: number): Observable<EmailQueueDetalhe> {
    return this.http.get<EmailQueueDetalhe>(`${this.base}/${id}`);
  }

  reprocessar(id: number): Observable<EmailQueueReprocessarResultado> {
    return this.http.post<EmailQueueReprocessarResultado>(`${this.base}/${id}/reprocessar`, {});
  }

  resetarTentativas(id: number): Observable<EmailQueueReprocessarResultado> {
    return this.http.post<EmailQueueReprocessarResultado>(`${this.base}/${id}/resetar-tentativas`, {});
  }
}