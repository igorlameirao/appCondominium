/// Caminhos documentados na WebApi (`AppCondominium.API`).
/// Não invocar endpoints nesta etapa — uso futuro pelos repositórios.
abstract final class ApiPaths {
  static const authVinculos = '/api/auth/vinculos';
  static const authLogin = '/api/auth/login';
  static const authTrocarCondominio = '/api/auth/trocar-condominio';
  static const authTrocarPerfil = '/api/auth/trocar-perfil';
  static const authVinculosAtivos = '/api/auth/vinculos-ativos';
  static const authMinhasUnidades = '/api/auth/minhas-unidades';
  static const authCondominios = '/api/auth/condominios';
  static const condominio = '/api/condominio';
  static const permissao = '/api/permissao';
  static const lookup = '/api/lookup';
  static const convitesValidar = '/api/convites/validar';
  static const convitesAceitar = '/api/convites/aceitar';
  static const recuperacaoSenhaSolicitar =
      '/api/auth/recuperacao-senha/solicitar';
  static const recuperacaoSenhaValidar = '/api/auth/recuperacao-senha/validar';
  static const recuperacaoSenhaRedefinir =
      '/api/auth/recuperacao-senha/redefinir';
}
