import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CondominioContextService } from '../services/condominio-context.service';
import { TenantHostService } from '../services/tenant-host.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const tenantHost = inject(TenantHostService);
  const condominioCtx = inject(CondominioContextService);

  if (!auth.isLoggedIn) {
    return router.createUrlTree([tenantHost.loginPath]);
  }

  if (
    tenantHost.isTenantHost &&
    tenantHost.idCondominio != null &&
    condominioCtx.idCondominio != null &&
    Number(tenantHost.idCondominio) !== Number(condominioCtx.idCondominio)
  ) {
    auth.logout();
    return false;
  }

  return true;
};