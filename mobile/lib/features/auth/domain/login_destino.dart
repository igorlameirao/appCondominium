// Espelha `login-fluxo.ts` (Angular) — decisão multi-tenant sem escolha arbitrária.

class PerfilVinculo {
  const PerfilVinculo({required this.idPerfil, required this.nome});

  final int idPerfil;
  final String nome;
}

class CondominioVinculo {
  const CondominioVinculo({
    required this.idCondominio,
    required this.nome,
    required this.perfis,
    this.dominio,
  });

  final int idCondominio;
  final String nome;
  final List<PerfilVinculo> perfis;
  final String? dominio;
}

sealed class DestinoLogin {
  const DestinoLogin();
}

final class DestinoSemVinculo extends DestinoLogin {
  const DestinoSemVinculo();
}

final class DestinoAutenticar extends DestinoLogin {
  const DestinoAutenticar({
    required this.idCondominio,
    required this.idPerfil,
    this.condominioNome,
  });

  final int idCondominio;
  final int? idPerfil;
  final String? condominioNome;
}

final class DestinoSelecionarCondominio extends DestinoLogin {
  const DestinoSelecionarCondominio();
}

final class DestinoSelecionarPerfil extends DestinoLogin {
  const DestinoSelecionarPerfil({required this.idCondominio});

  final int idCondominio;
}

DestinoLogin destinoAposCredenciais(List<CondominioVinculo> vinculos) {
  if (vinculos.isEmpty) return const DestinoSemVinculo();
  if (vinculos.length == 1) return destinoAposCondominio(vinculos.first);
  return const DestinoSelecionarCondominio();
}

/// Condomínio já definido (ex.: troca de tenant) — não abre etapa de condomínio.
DestinoLogin destinoNoTenant(
  List<CondominioVinculo> vinculos,
  int idCondominio,
) {
  CondominioVinculo? condo;
  for (final v in vinculos) {
    if (v.idCondominio == idCondominio) {
      condo = v;
      break;
    }
  }
  if (condo == null) return const DestinoSemVinculo();
  return destinoAposCondominio(condo);
}

DestinoLogin destinoAposCondominio(CondominioVinculo condo) {
  final perfis = condo.perfis;
  if (perfis.length == 1) {
    return DestinoAutenticar(
      idCondominio: condo.idCondominio,
      idPerfil: perfis.first.idPerfil,
      condominioNome: condo.nome,
    );
  }
  if (perfis.length > 1) {
    return DestinoSelecionarPerfil(idCondominio: condo.idCondominio);
  }
  return DestinoAutenticar(
    idCondominio: condo.idCondominio,
    idPerfil: null,
    condominioNome: condo.nome,
  );
}