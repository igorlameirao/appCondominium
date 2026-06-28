import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CondominioContextService } from '../services/condominio-context.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const condominio = inject(CondominioContextService);
  let headers = req.headers;
  if (auth.token) headers = headers.set('Authorization', `Bearer ${auth.token}`);
  if (condominio.idCondominio) headers = headers.set('X-Id-Condominio', String(condominio.idCondominio));
  return next(req.clone({ headers }));
};
