import { environment } from '../../../environments/environment';
import { ConfiguracaoCondominio } from '../configuracaocondominio/configuracaocondominio.model';

/** Arte fixa à esquerda do login (identidade AppCondominium). */
export const LOGIN_ARTE_LATERAL_PADRAO = '/assets/login/condominio-login.jpg';

/** Painel direito do card de login quando não há ImagemLogin. */
export const LOGIN_PAINEL_IMAGEM_PADRAO = '/assets/login/logo-appcondominium.jpg';

/** Ícone ao lado do título no menu lateral. */
export const SIDEBAR_ICONE_PADRAO = '/assets/login/LogoAppCondominium_sidebar.png';

function versaoCacheBust(): string {
  return String(Date.now());
}

export function urlImagemCondominio(
  idCondominio: number,
  tipo: 'imagem-login' | 'imagem-icone',
  versao?: string
): string {
  const base = `${environment.apiUrl}/lookup/condominios/${idCondominio}/${tipo}`;
  const v = versao ?? versaoCacheBust();
  return `${base}?v=${encodeURIComponent(v)}`;
}

export function urlImagemLoginPainel(
  idCondominio: number,
  cfg: ConfiguracaoCondominio | null | undefined
): string | null {
  if (cfg == null || cfg.temImagemLogin === false) return null;
  return urlImagemCondominio(idCondominio, 'imagem-login');
}

export function urlImagemIconeSidebar(
  idCondominio: number,
  cfg: ConfiguracaoCondominio | null | undefined
): string | null {
  if (cfg == null || cfg.temImagemIcone === false) return null;
  return urlImagemCondominio(idCondominio, 'imagem-icone');
}