# Hug Escalas — rotas do AppCondominium

Shell comum, com o menu visível: `content-wrapper--list-hug`.

Login (`/login`) e entrada de condomínio (`/entrar`) ficam fora do hug.

| Tela | Rota | Card |
|------|------|------|
| Início | `/inicio` | `content-card-entity-form` (até 720px) |
| Permissões | `/gerenciamento-permissoes` | `content-card-entity-form` + host `form-page--wide` (até 1040px) |
| Listas CRUD | `/uf`, `/municipio`, `/bairro`, `/endereco`, `/condominio`, `/configuracaocondominio`, `/bloco`, `/tipounidade`, `/unidade`, `/hidrometro`, `/consumoagua`, `/pessoafisica`, `/pessoajuridica`, `/fornecedor`, `/tipoatividadeeconomica`, `/atividadeeconomica`, `/pessoacondominio`, `/equipamento`, `/aluguelequipamento`, `/concorrencia`, `/tipodespesa`, `/despesa`, `/ofertaconcorrencia`, `/banco`, `/dadosbancarios`, `/cobranca`, `/guardaencomenda`, `/local`, `/tipomaterial`, `/tipomaterialcondominio`, `/material`, `/alocacaomaterial`, `/estoquematerialconsumo`, `/entradasaidamaterialconsumo` | `content-card-entity-list` |
| Forms curtos | `…/novo` e `…/:id` das entidades acima, exceto as largas | `content-card-entity-form` (até 720px) |
| Forms largos | condomínio, pessoa física, pessoa jurídica, unidade, endereço, fornecedor, despesa | `content-card-entity-form` + host `form-page--wide` (até 1040px) |

Lista: altura e largura pelo conteúdo; scroll na `.table-scroll-wrapper` ao atingir o teto do wrapper.  
Form: altura pelo conteúdo; scroll no card ao atingir o teto. `max-height: 100%` do wrapper, sem `100dvh - 172px`.
