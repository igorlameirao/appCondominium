import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantHostService } from '../services/tenant-host.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const tenantHost = inject(TenantHostService);
  if (auth.isLoggedIn) return true;
  return router.createUrlTree([tenantHost.loginPath]);
};
