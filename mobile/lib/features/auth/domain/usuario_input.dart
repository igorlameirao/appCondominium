/// Normalização mínima do identificador — a API aceita e-mail e CPF com ou sem máscara.
String normalizarUsuario(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return trimmed;
  if (trimmed.contains('@')) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

bool usuarioPreenchido(String raw) => raw.trim().isNotEmpty;