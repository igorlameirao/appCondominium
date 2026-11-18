import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CondominioContextService } from '../services/condominio-context.service';

/** RT-Gerais 12: o header deve coincidir com o claim idCondominio do JWT. */
function idCondominioNoToken(token: string): number | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const json = JSON.parse(atob(parte.replace(/-/g, '+').replace(/_/g, '/'))) as { idCondominio?: string | number };
    const raw = json.idCondominio;
    if (raw == null || raw === '') return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const condominio = inject(CondominioContextService);
  let headers = req.headers;
  const token = auth.token;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
    const idNoToken = idCondominioNoToken(token);
    if (idNoToken != null) {
      if (condominio.idCondominio !== idNoToken) {
        condominio.setCondominio(idNoToken);
      }
      headers = headers.set('X-Id-Condominio', String(idNoToken));
    } else if (condominio.idCondominio) {
      headers = headers.set('X-Id-Condominio', String(condominio.idCondominio));
    }
  }
  return next(req.clone({ headers }));
};
