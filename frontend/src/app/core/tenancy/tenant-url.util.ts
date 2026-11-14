/** Remove o prefixo do tenant da URL exibida no navegador (para roteamento interno). */
export function stripTenantPrefix(url: string, slug: string | null): string {
  if (!slug) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  const prefix = `/${slug}`;
  if (normalized === prefix) return '/';
  if (normalized.startsWith(`${prefix}/`)) return normalized.slice(prefix.length) || '/';
  return normalized;
}

/** Adiciona o prefixo do tenant à URL serializada pelo Angular Router. */
export function prefixTenantUrl(url: string, slug: string | null): string {
  if (!slug) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  if (normalized === '/') return `/${slug}/`;
  return `/${slug}${normalized}`;
}

export function firstPathSegment(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg ? seg.trim().toLowerCase() : null;
}