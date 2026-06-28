class Perfil {
  int? indice;
  String? nome;
  String? mensagem;
  Perfil({this.indice, this.nome, this.mensagem});
}

List<Perfil> perfis() {
  List<Perfil> list = [];
  list.add(Perfil(
      indice: 0,
      nome: 'Locatário',
      mensagem: 'Será necessária aprovação da administração.'));
  list.add(Perfil(
      indice: 1,
      nome: 'Proprietario',
      mensagem: 'Será necessária aprovação da administração.'));
  list.add(Perfil(
      indice: 2,
      nome: 'Síndico',
      mensagem:
          'Será necessária aprovação do síndico anterior ou de documentação.'));
  list.add(Perfil(
      indice: 3,
      nome: 'Sub-sindico',
      mensagem: 'Será necessária aprovação do síndico.'));
  list.add(Perfil(
      indice: 4,
      nome: 'Conselheiro',
      mensagem: 'Será necessária aprovação da síndico.'));
  list.add(Perfil(
      indice: 5,
      nome: 'Funcionario Administrativo',
      mensagem: 'Será necessária aprovação do síndico.'));
  list.add(Perfil(
      indice: 6,
      nome: 'Funcionario Manutenção',
      mensagem: 'Será necessária aprovação da administração.'));
  list.add(Perfil(
      indice: 7,
      nome: 'visitante',
      mensagem: 'Será necessária aprovação do locatário.'));
  list.add(Perfil(
      indice: 8,
      nome: 'Prestador de Serviço',
      mensagem: 'Será necessária aprovação da locatário ou da administração.'));
  return list;
}
