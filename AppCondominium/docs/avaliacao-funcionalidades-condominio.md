# Avaliação do sistema de administração condominial

**Escopo da avaliação:** inspeção do código Flutter disponível neste repositório em 16/11/2026. O backend/API não está presente aqui. Portanto, “implementado” significa comprovado no aplicativo; funcionalidades que dependem de endpoints externos precisam de validação à parte.

## Resumo executivo

O projeto está no estágio de fundação de um aplicativo: autenticação e sessão por condomínio, cadastro/recuperação de conta e uma tela inicial com atalhos planejados. Ainda não há evidência no cliente de fluxos completos para gestão financeira, operação do condomínio, comunicação, reservas ou governança. O menu apresenta vários desses temas, mas a maioria dos itens não tem ação ou tela associada; alguns valores do painel financeiro são textos fixos de demonstração.

**Leitura geral:** base inicial de acesso e navegação — não um sistema de administração condominial funcional/completo ainda.

## O que o código já tem

| Área | Estado observado | Evidência / observação |
|---|---|---|
| Aplicativo Flutter | Implementado | Estrutura multiplataforma, tema claro/escuro conforme brilho do dispositivo, componentes visuais reutilizáveis. |
| Login e sessão | Parcialmente implementado | Login via API, armazenamento de token e dados da sessão; autenticação biométrica está representada por serviço/dependência, mas o fluxo completo precisa ser confirmado. |
| Cadastro e recuperação de conta | Parcialmente implementado | Repositório possui pedidos de cadastro, registro, esqueci/reset de senha, alteração e exclusão de conta. São chamadas à API, sem validação end-to-end neste repositório. |
| Multi-condomínio | Parcialmente implementado | A sessão inclui condomínio ativo, há busca de condomínios e troca autenticada; interface da home permite trocar informando ID numérico. Revisar UX para seleção por nome/endereço. |
| Perfis e permissões | Parcialmente implementado | Perfis previstos: locatário, proprietário, síndico, subsíndico, conselheiro, administrativo, manutenção, visitante e prestador. O cliente consulta permissões para exibir alguns atalhos. Exigir autorização também no backend. |
| Mensagens | Modelo apenas | Existe modelo simples de mensagem (remetente, destinatário, título, texto e lida); não foi encontrado fluxo de envio/caixa de entrada. |
| Quadro de avisos | Placeholder | O cartão existe, sem conteúdo funcional conectado. |
| Cobrança/boleto | Placeholder | Cartão exibe números/datas/situação fixos; não há evidência de emissão, consulta ou pagamento integrado. |
| Leituras de hidrômetro | Atalho | Exibido sob permissão, mas não há tela/fluxo ou modelo de leitura neste cliente. |
| Contas do condomínio | Atalho | Exibido sob permissão; nenhum fluxo financeiro encontrado. |
| Reclamações, veículos, visitantes, prestadores | Atalhos | Sem telas ou operações correspondentes encontradas. |
| Blocos, unidades e tipos de unidade | Atalhos | Sem cadastro/edição/consulta funcional encontrada. |
| Assembleia e votação | Atalhos | Sem agenda, pauta, presença, quórum, votação ou ata implementados no cliente. |
| Licitação, equipamento, rateio, banco e despesas | Atalhos | Sem fluxos funcionais identificados. |
| Relatórios e administração de usuários | Não encontrados | Nenhum fluxo de relatórios, auditoria ou gestão de acessos foi localizado. |

## Avaliação dos itens que já aparecem no menu

Os itens atuais são bons pontos de partida, mas devem ser tratados como **ideias/atalhos**, até haver telas, regras, dados persistidos, permissões, estados de erro e testes de integração:

- **Boleto/cobrança:** evoluir para segunda via, código de barras/PIX, histórico, comprovantes, inadimplência e conciliação.
- **Contas, banco, despesas e rateio:** reunir sob módulo financeiro com orçamento, contas a pagar/receber, fluxo de caixa, prestação de contas e trilha de aprovação.
- **Hidrômetro:** registrar leitura por unidade, foto, consumo, alertas de variação e cálculo de rateio, se aplicável.
- **Livro de reclamações:** transformar em solicitações/chamados com categoria, prioridade, responsável, SLA, anexos e histórico visível ao morador.
- **Mensagens e quadro de avisos:** criar comunicados segmentados por bloco/unidade/perfil, confirmação de leitura, anexos e notificações.
- **Veículos, visitantes e prestadores:** controlar autorizações, validade, unidade anfitriã, placa/documento, registro de entrada/saída e histórico de acesso.
- **Blocos, unidades e tipos:** incluir cadastro de ocupantes e proprietários, fração ideal, contatos, vagas, documentos e histórico de vínculo.
- **Assembleia e votação:** convocação, pauta/documentos, procurações, lista de presença, quórum, votos auditáveis, ata e exportação.
- **Licitação:** ampliar para compras/cotações com fornecedores, comparação de propostas, aprovações e contrato/nota anexos.
- **Equipamentos:** converter para inventário e manutenção preventiva/corretiva, garantias, manuais, inspeções e ordens de serviço.

## Ideias para uma cobertura mais completa

### 1. Cadastro e estrutura

- Condomínios, torres/blocos, unidades, áreas comuns, frações ideais e vagas de garagem.
- Pessoas e vínculos: proprietário, morador, locatário, dependente, procurador, funcionário e prestador.
- Convites, validação de vínculo, aprovação administrativa, mudança/entrada/saída e histórico de ocupação.
- Documentos por unidade e condomínio, com validade, versões e controle de acesso.

### 2. Financeiro e prestação de contas

- Plano de contas, orçamento anual, previsão mensal e comparação orçado × realizado.
- Geração e distribuição de cobranças, regras por fração/unidade, fundos e rateios extraordinários.
- Integração bancária e meios de pagamento, PIX/boleto, baixa automática e conciliação.
- Contas a pagar, vencimentos, recorrências, anexos fiscais e fluxo de aprovação por alçada.
- Inadimplência, acordos, juros/multa configuráveis, notificações e exportação para contabilidade.
- Fluxo de caixa, saldo por conta/fundo, demonstrativos e prestação de contas por período.
- Importação/exportação contábil e trilha de auditoria para alterações financeiras.

### 3. Operação, manutenção e patrimônio

- Chamados e ocorrências, com categorias, prioridade, SLA, atribuição, comentários, anexos e satisfação.
- Ordens de serviço, agenda de manutenção preventiva, inspeções e leitura de medidores.
- Inventário de equipamentos/ativos, localização, responsável, custo, garantia e vida útil.
- Compras e contratos: cotações, fornecedores, aprovações, vigência, reajuste, renovação e alertas.
- Controle de chaves, áreas técnicas e rotinas/checklists de funcionários.
- Gestão de obras/reformas em unidades: solicitação, documentos, aprovação, período e regras de acesso.

### 4. Moradores e áreas comuns

- Reserva de salão, churrasqueira, quadra e outros espaços, com disponibilidade, regras, taxa e cancelamento.
- Encomendas/entregas: registro pela portaria, aviso, retirada e comprovante.
- Cadastro de animais, veículos, bicicletas e contatos de emergência, conforme necessidade do condomínio.
- Mudanças, entregas volumosas e autorização de entrada agendadas.
- Pesquisa de satisfação, enquetes e canal de sugestões.

### 5. Portaria e segurança

- Livro de ocorrências da portaria e passagem de turno.
- Pré-autorização de visitantes com QR code ou código temporário, validade e revogação.
- Registro de prestadores, veículos e entregas com consulta rápida e trilha de acesso.
- Integração opcional com controle de acesso/interfone, respeitando limitações do fornecedor.
- Procedimentos de emergência, contatos úteis e comunicação de incidentes.

### 6. Governança e comunicação

- Calendário, convocação e gestão completa de assembleias, atas, procurações, quóruns e votações.
- Central de documentos: convenção, regimento, atas, apólices, contratos, laudos e certidões.
- Avisos segmentados, notificações push/e-mail, confirmação de leitura e histórico pesquisável.
- Canal privado para síndico/conselho/administração com tarefas, decisões e pendências.
- Registro de reclamações/infrações e advertências com evidências, prazos e contestação.

### 7. Administração, dados e experiência

- Painel por perfil com tarefas pendentes, vencimentos, chamados críticos e indicadores financeiros/operacionais.
- Busca global, filtros, exportação CSV/PDF e relatórios agendados.
- Permissões configuráveis por ação e escopo (condomínio, bloco, unidade), com segregação de dados.
- Log de auditoria: quem alterou, o quê, quando e valor anterior/novo; histórico imutável para ações críticas.
- Notificações configuráveis, acessibilidade, suporte a baixa conectividade e versões mobile/web para perfis administrativos.
- Backup, retenção, recuperação de conta, gestão de dispositivos/sessões e monitoramento de falhas.

## Prioridade sugerida

| Fase | Entregas sugeridas | Por que |
|---|---|---|
| **P0 — Fundamentos** | Modelo de condomínio/unidade/pessoa; vínculo e aprovação de usuários; permissões no servidor; notificações; auditoria; estados de erro/vazio/carregamento. | Sem estrutura confiável e acesso seguro, os módulos ficam inconsistentes e dados podem ser expostos. |
| **P1 — Valor diário** | Comunicados; chamados/ocorrências; documentos; visitantes/prestadores; reservas de áreas comuns; encomendas. | Resolve interações frequentes de moradores, portaria e administração. |
| **P2 — Gestão do síndico** | Financeiro completo; cobranças; despesas/aprovações; contratos, compras e manutenção; relatórios e prestação de contas. | Maior impacto administrativo e financeiro, demanda regras e integração robustas. |
| **P3 — Governança e integrações** | Assembleias/votações; controle de acesso; contabilidade/bancos; automações e análises avançadas. | Requer processos estabilizados, integração externa e requisitos de auditoria bem definidos. |

## Decisões de produto que vale definir

1. O público principal é morador, síndico/administradora ou ambos? Isso define navegação e prioridades.
2. O sistema atende condomínios residenciais, comerciais ou mistos?
3. Quais meios de cobrança, bancos, contabilidade e controle de acesso serão integrados?
4. O financeiro será apenas consulta/prestação de contas ou também execução e aprovação de pagamentos?
5. Assembleias e votação terão validade formal pretendida? Regras de identificação, procuração, quórum e auditoria devem ser definidas com assessoria adequada.
6. Quais dados pessoais são indispensáveis e por quanto tempo serão guardados? Planejar consentimento/base legal, finalidade, retenção, acesso, exportação e exclusão conforme LGPD.

## Próximo passo recomendado

Montar um catálogo de requisitos com uma linha por funcionalidade, identificando **perfil**, **problema resolvido**, **fluxo principal**, **dados**, **permissões**, **dependências**, **prioridade** e **critério de aceite**. Em seguida, fechar o escopo do MVP em torno de cadastro/vínculos, comunicação, chamados e documentos; validar financeiramente o caminho de cobrança antes de iniciar integrações bancárias.

## Catálogo inicial de requisitos

Este catálogo transforma as ideias em itens verificáveis. **Prioridade:** P0 = base obrigatória; P1 = MVP de uso diário; P2 = gestão administrativa/financeira; P3 = evolução e integrações. **Estado** é avaliado pelo cliente Flutter deste repositório: “Não implementado” significa que não foi encontrado fluxo funcional no app. Perfis são sugestões; a administradora de cada condomínio deve poder configurar permissões por ação e escopo.

### A. Acesso, condomínio e estrutura

#### CAT-001 — Autenticação e recuperação de acesso
- **Estado atual:** Parcial: chamadas de login/cadastro/senha existem; validar o fluxo completo e o backend.
- **Perfis:** todos os usuários.
- **Fluxo:** entrar, encerrar sessão, recuperar senha, alterar credenciais e revogar sessões/dispositivos.
- **Dados:** identificador, hash de senha (servidor), fatores de autenticação, sessões, datas e eventos de segurança.
- **Permissões:** usuário gerencia sua conta; administração não consulta senha; ações críticas exigem reautenticação.
- **Dependências/prioridade:** API de identidade e política de sessão; **P0**.
- **Aceite:** usuário consegue entrar/sair e recuperar acesso; respostas não revelam se um e-mail existe; sessão expirada não acessa dados privados; eventos relevantes ficam registrados.

#### CAT-002 — Condomínios e troca de contexto
- **Estado atual:** Parcial: sessão guarda condomínio ativo e há busca/troca; home solicita ID numérico.
- **Perfis:** usuários vinculados a um ou mais condomínios.
- **Fluxo:** pesquisar condomínio autorizado, selecionar, confirmar contexto e visualizar o nome ativo.
- **Dados:** identificador, nome, endereço, unidades, status e vínculos do usuário.
- **Permissões:** só selecionar condomínios associados à conta; todas as consultas e gravações ficam limitadas ao contexto ativo.
- **Dependências/prioridade:** cadastro e vínculo de pessoa; **P0**.
- **Aceite:** usuário vê somente condomínios autorizados; troca atualiza sessão e telas; API rejeita requisição com condomínio não autorizado.

#### CAT-003 — Cadastro de blocos, unidades, frações e vagas
- **Estado atual:** Não implementado; há apenas atalhos no menu.
- **Perfis:** administrador da administradora e síndico.
- **Fluxo:** cadastrar/importar estrutura, editar, inativar sem apagar histórico e consultar por bloco/unidade.
- **Dados:** blocos, unidades, tipo, fração ideal, área, vagas e status.
- **Permissões:** leitura conforme escopo; criação/edição restrita à administração autorizada.
- **Dependências/prioridade:** CAT-002 e regras de rateio; **P0**.
- **Aceite:** unidades não duplicam dentro do condomínio; mudanças preservam histórico; frações e totais podem ser conferidos/exportados.

#### CAT-004 — Pessoas, vínculos e aprovação
- **Estado atual:** Parcial: cadastro de conta e lista de perfis existem, sem gestão de vínculo demonstrada.
- **Perfis:** proprietário, morador/locatário, dependente, procurador, funcionário e prestador; aprovadores definidos pelo condomínio.
- **Fluxo:** convidar/solicitar vínculo, anexar comprovação, aprovar/rejeitar, registrar mudança e encerrar vínculo.
- **Dados:** pessoa, contato, unidade, tipo de vínculo, vigência, status e documentos estritamente necessários.
- **Permissões:** aprovação por síndico/administrador; pessoa consulta e atualiza dados próprios; escopo de unidade.
- **Dependências/prioridade:** CAT-003; **P0**.
- **Aceite:** vínculo só libera acesso depois da aprovação configurada; encerramento remove acesso futuro sem eliminar registros históricos.

#### CAT-005 — Perfis, permissões e auditoria
- **Estado atual:** Parcial: perfis e verificação local de permissões; a regra de servidor precisa ser confirmada.
- **Perfis:** administrador do sistema, administradora, síndico, conselho, funcionário, morador e prestador.
- **Fluxo:** conceder permissões por ação e escopo, revisar, expirar e revogar.
- **Dados:** usuário, papel, permissão, escopo, concessor, vigência e log de alterações.
- **Permissões:** menor privilégio; validação obrigatória no servidor; usuário não concede a si mesmo acesso superior.
- **Dependências/prioridade:** CAT-002; **P0**.
- **Aceite:** operações sem autorização são recusadas pela API mesmo se chamadas fora do app; log identifica autor, ação, data e escopo.

### B. Comunicação e serviços ao morador

#### CAT-006 — Comunicados e notificações
- **Estado atual:** Placeholder: cartão de avisos sem conteúdo conectado.
- **Perfis:** administração publica; moradores e funcionários recebem conforme público-alvo.
- **Fluxo:** redigir, anexar, selecionar destinatários, publicar/agendar, notificar e acompanhar leitura.
- **Dados:** título, texto, anexos, público, autor, datas e recibos de leitura.
- **Permissões:** publicar por papel/escopo; destinatário acessa apenas avisos dirigidos a ele.
- **Dependências/prioridade:** CAT-005 e serviço de push/e-mail; **P1**.
- **Aceite:** mensagem chega ao público configurado; leitura pode ser consultada; edição/remoção fica auditada.

#### CAT-007 — Solicitações, reclamações e ocorrências
- **Estado atual:** Placeholder: atalho de livro de reclamações sem fluxo localizado.
- **Perfis:** morador abre e acompanha; funcionário atende; síndico/admin supervisiona.
- **Fluxo:** abrir solicitação, categorizar/priorizar, atribuir, comentar, anexar evidência, resolver e reabrir/avaliar.
- **Dados:** protocolo, unidade, categoria, prioridade, descrição, anexos, responsável, SLA, status e histórico.
- **Permissões:** solicitante vê chamados próprios/unidade; equipe vê os atribuídos ou de seu escopo.
- **Dependências/prioridade:** CAT-004, notificações; **P1**.
- **Aceite:** cada chamado tem protocolo e histórico; mudanças de status notificam interessados; dados de outras unidades não são expostos.

#### CAT-008 — Central de documentos
- **Estado atual:** Não implementado.
- **Perfis:** administração publica; moradores, conselho e funcionários acessam documentos permitidos.
- **Fluxo:** enviar, classificar, versionar, definir acesso/validade e consultar/baixar.
- **Dados:** arquivo, categoria, versão, datas, autor, validade e escopo.
- **Permissões:** acesso por categoria e perfil; downloads de documentos sensíveis são registrados.
- **Dependências/prioridade:** armazenamento seguro, CAT-005; **P1**.
- **Aceite:** usuário encontra versões válidas; arquivo substituído mantém histórico; acesso negado fora do escopo.

#### CAT-009 — Reservas de áreas comuns
- **Estado atual:** Não implementado.
- **Perfis:** morador reserva; administração configura recursos e regras.
- **Fluxo:** consultar disponibilidade, solicitar, aprovar se necessário, pagar taxa quando aplicável, cancelar e registrar vistoria.
- **Dados:** espaço, calendário, unidade, solicitante, regras, taxa, status e ocorrências.
- **Permissões:** limites por unidade e papel; administração bloqueia períodos/manutenção.
- **Dependências/prioridade:** CAT-004, notificações e regras de cobrança opcionais; **P1**.
- **Aceite:** não há reservas conflitantes; regras e custos aparecem antes da confirmação; cancelamento atualiza disponibilidade e histórico.

#### CAT-010 — Visitantes, prestadores, veículos e encomendas
- **Estado atual:** Apenas atalhos para visitantes, veículos e prestadores.
- **Perfis:** morador autoriza; portaria valida entrada/saída; administração consulta relatórios.
- **Fluxo:** pré-autorizar visitante/serviço/veículo, validar código ou documento, registrar entrada/saída e notificar morador; registrar e confirmar retirada de encomenda.
- **Dados:** anfitrião/unidade, nome, placa quando aplicável, validade, motivo, eventos de acesso e comprovante de entrega.
- **Permissões:** portaria acessa somente dados necessários durante a operação; retenção configurável.
- **Dependências/prioridade:** CAT-004; eventual integração de acesso; **P1**.
- **Aceite:** autorização expira/revoga; acesso fica registrado; encomenda só é marcada como retirada com confirmação e autor.

#### CAT-011 — Mudanças, reformas e cadastro de bens
- **Estado atual:** Não implementado.
- **Perfis:** morador solicita; administração aprova; portaria verifica agenda.
- **Fluxo:** solicitar mudança/reforma, anexar documentos, selecionar período, aprovar, acompanhar execução e concluir.
- **Dados:** unidade, período, tipo, prestadores, documentos, aprovações e observações.
- **Permissões:** morador atua na própria unidade; administração decide conforme regulamento.
- **Dependências/prioridade:** CAT-004, documentos e agenda da portaria; **P2**.
- **Aceite:** solicitação só é confirmada após aprovações requeridas; conflitos de agenda são sinalizados; decisão e evidências permanecem registradas.

### C. Operação, manutenção e fornecedores

#### CAT-012 — Ativos, equipamentos e hidrômetros
- **Estado atual:** Atalhos de equipamento e hidrômetro, sem telas/fluxos encontrados.
- **Perfis:** manutenção registra; administração gerencia inventário; morador pode consultar dados publicados.
- **Fluxo:** cadastrar ativo/medidor, registrar leitura e foto, acompanhar consumo, alertar variação e atualizar estado.
- **Dados:** ativo, localização, número de série, garantia, leitura, unidade, data, evidência e histórico.
- **Permissões:** escrita para equipe autorizada; leitura conforme escopo.
- **Dependências/prioridade:** CAT-003; **P2**.
- **Aceite:** leituras são cronológicas e não sobrescritas; anomalias geram alerta configurável; ativo relaciona-se a ordens de serviço.

#### CAT-013 — Manutenção preventiva e ordens de serviço
- **Estado atual:** Não implementado.
- **Perfis:** administração planeja; manutenção executa; síndico acompanha.
- **Fluxo:** criar plano recorrente, gerar ordem, atribuir responsável, registrar execução, peças, custo, evidências e aceite.
- **Dados:** ativo/área, tarefa, recorrência, prazos, responsável, materiais, custo e conclusão.
- **Permissões:** criação/aprovação por papel; execução restrita ao responsável/equipe.
- **Dependências/prioridade:** CAT-012; **P2**.
- **Aceite:** tarefas vencidas aparecem no painel; conclusão exige data e responsável; histórico de manutenção acompanha o ativo.

#### CAT-014 — Fornecedores, cotações, compras e contratos
- **Estado atual:** Atalho de licitação sem fluxo funcional localizado.
- **Perfis:** administração solicita; fornecedores enviam propostas; síndico/conselho aprova conforme alçada.
- **Fluxo:** abrir cotação, convidar fornecedores, comparar propostas, aprovar compra, anexar nota/contrato e controlar vigência/reajuste.
- **Dados:** fornecedor, propostas, escopo, valores, justificativa, aprovações, contrato, vencimentos e anexos.
- **Permissões:** segregação entre solicitante/aprovador quando exigido; visibilidade conforme papel.
- **Dependências/prioridade:** CAT-005, plano de contas; **P2**.
- **Aceite:** decisão guarda propostas e justificativa; limites de aprovação são aplicados; alertas antecipam vencimento/renovação.

#### CAT-015 — Rotinas da equipe e livro de portaria
- **Estado atual:** Não implementado.
- **Perfis:** funcionários e portaria registram; supervisão acompanha.
- **Fluxo:** passagem de turno, checklist, ocorrência, entrega de chaves e pendência para próximo turno.
- **Dados:** funcionário, turno, checklist, observações, ocorrência, horário e responsável.
- **Permissões:** equipe registra no próprio escopo; supervisores consultam histórico.
- **Dependências/prioridade:** CAT-005 e categorias configuráveis; **P2**.
- **Aceite:** turno pode ser encerrado com pendências explícitas; registros identificam autor/horário; incidente crítico gera aviso ao responsável.

### D. Financeiro e prestação de contas

#### CAT-016 — Plano de contas, orçamento e rateios
- **Estado atual:** Atalhos de contas/rateio, sem fluxo funcional; cartão de cobrança contém valores de demonstração.
- **Perfis:** administradora prepara; síndico/conselho revisa; moradores consultam demonstrativos publicados.
- **Fluxo:** configurar contas/fundos, aprovar orçamento, lançar previsão e distribuir rateios pelas regras aprovadas.
- **Dados:** categorias, períodos, valores, frações/regras, fundos e aprovações.
- **Permissões:** escrituração restrita; consulta financeira conforme papel e unidade.
- **Dependências/prioridade:** CAT-003, regras contábeis do condomínio; **P2**.
- **Aceite:** total distribuído confere com total rateado; regra usada é visível; mudança de rateio é auditada e recalculável.

#### CAT-017 — Cobranças, pagamentos e inadimplência
- **Estado atual:** Placeholder visual; nenhum fluxo de boleto/PIX encontrado.
- **Perfis:** administradora gera; morador consulta/paga; síndico acompanha agregados e inadimplência conforme escopo.
- **Fluxo:** emitir cobrança, disponibilizar boleto/PIX, registrar baixa, conciliar, emitir comprovante e tratar acordo/atraso.
- **Dados:** unidade, competência, vencimento, valores, encargos, identificador do pagamento, status e comprovantes.
- **Permissões:** morador vê apenas suas unidades; regras de encargos e acordos são configuráveis e autorizadas.
- **Dependências/prioridade:** CAT-016, provedor/banco, segurança; **P2**.
- **Aceite:** status reflete retorno de pagamento ou conciliação; segunda via corresponde à cobrança correta; estorno/ajuste exige justificativa e log.

#### CAT-018 — Contas a pagar e aprovação de despesas
- **Estado atual:** Atalhos de banco e despesas, sem fluxo identificado.
- **Perfis:** funcionário/administradora lança; aprovadores autorizam; síndico acompanha.
- **Fluxo:** registrar despesa, anexar nota, classificar, aprovar por alçada, pagar e conciliar.
- **Dados:** fornecedor, competência, vencimento, categoria, valor, documento fiscal, aprovadores e pagamento.
- **Permissões:** alçadas configuráveis; separação entre cadastro e aprovação em despesas acima do limite definido.
- **Dependências/prioridade:** CAT-005, CAT-014 e integração bancária opcional; **P2**.
- **Aceite:** pagamento não é liberado sem aprovações requeridas; documentos ficam vinculados; atrasos e duplicidades são sinalizados.

#### CAT-019 — Contas bancárias, caixa e conciliação
- **Estado atual:** Atalho de banco sem fluxo funcional localizado.
- **Perfis:** financeiro opera; síndico/conselho consulta conforme autorização.
- **Fluxo:** importar extrato ou receber retorno bancário, associar lançamentos, conciliar diferenças e fechar período.
- **Dados:** conta, saldo, transações, referência, origem e ajustes de conciliação.
- **Permissões:** credenciais bancárias nunca são exibidas; acesso mínimo e trilha de ação.
- **Dependências/prioridade:** integração bancária/provedor e CAT-017/018; **P2**.
- **Aceite:** cada item fica conciliado, pendente ou justificado; saldo do período é rastreável ao extrato e aos lançamentos.

#### CAT-020 — Demonstrativos e prestação de contas
- **Estado atual:** Não implementado; existe componente visual de gráfico, sem evidência de relatório conectado.
- **Perfis:** administração prepara; síndico/conselho aprova; moradores consultam versões publicadas.
- **Fluxo:** fechar período, gerar demonstrativos, anexar documentos, revisar/aprovar, publicar e exportar.
- **Dados:** receitas, despesas, saldos, orçamento, documentos e aprovações.
- **Permissões:** publicação por autorizados; dados individualizados de inadimplência restritos.
- **Dependências/prioridade:** CAT-016 a CAT-019; **P2**.
- **Aceite:** relatório identifica período e fonte; valores totalizam com o razão; versão publicada permanece preservada e exportável.

### E. Governança, relatórios e qualidade do serviço

#### CAT-021 — Assembleias, presença, procurações e votação
- **Estado atual:** Atalhos de assembleia/voto, sem fluxo encontrado.
- **Perfis:** administração convoca; síndico conduz; condôminos participam; secretário registra ata.
- **Fluxo:** convocar, publicar pauta/documentos, verificar elegibilidade/procuração, registrar presença/quórum, votar e publicar ata.
- **Dados:** convocação, participantes, representação, pauta, votos, quórum, resultado e ata.
- **Permissões:** elegibilidade e pesos conforme regra configurada; resultado e trilha acessíveis aos autorizados.
- **Dependências/prioridade:** CAT-004 e decisão sobre validade/requisitos; **P3**.
- **Aceite:** sistema mostra regra de quórum aplicada; voto só é aceito de participante elegível; resultado pode ser reconstituído por trilha auditável.

#### CAT-022 — Pesquisas e enquetes
- **Estado atual:** Não implementado.
- **Perfis:** administração/síndico cria; público definido responde.
- **Fluxo:** criar pergunta, definir público e prazo, coletar resposta, encerrar e divulgar resultado agregado.
- **Dados:** pergunta, opções, público, prazo e respostas.
- **Permissões:** autoria restrita; anonimato ou identificação explícitos antes da resposta.
- **Dependências/prioridade:** CAT-005 e notificações; **P3**.
- **Aceite:** usuário responde apenas uma vez quando a regra assim exigir; encerramento bloqueia novas respostas; resultado respeita privacidade configurada.

#### CAT-023 — Painel, pesquisa e relatórios
- **Estado atual:** Não implementado como painel operacional; existem apenas atalhos e componentes genéricos.
- **Perfis:** conteúdo varia para morador, síndico, conselho, administrativo e manutenção.
- **Fluxo:** apresentar pendências e indicadores; filtrar por período/bloco; abrir item de origem; exportar relatório autorizado.
- **Dados:** agregados financeiros, chamados, reservas, manutenção e prazos.
- **Permissões:** indicadores e exportações respeitam o mesmo escopo das fontes.
- **Dependências/prioridade:** módulos de origem e CAT-005; **P2**, após módulos base.
- **Aceite:** cada indicador mostra período e definição; valor abre registros que o compõem; exportação não inclui dados fora do escopo.

#### CAT-024 — Privacidade, retenção e solicitações de dados
- **Estado atual:** Não identificado no cliente.
- **Perfis:** titular de dados solicita acesso/correção; encarregado/administrador atende; sistema aplica políticas.
- **Fluxo:** informar finalidade e aviso de privacidade, controlar retenção, atender solicitações e registrar compartilhamentos/incidentes.
- **Dados:** finalidades, categorias, prazos, consentimentos quando aplicáveis, solicitações e evidências de atendimento.
- **Permissões:** acesso mínimo; dados pessoais só para finalidades autorizadas; exclusão considera obrigações de retenção.
- **Dependências/prioridade:** desenho de dados e orientação jurídica/privacidade; **P0** como requisito transversal.
- **Aceite:** cada categoria tem finalidade e retenção definidas; solicitações têm protocolo/prazo/status; exportação/exclusão respeita vínculos e obrigações aplicáveis.

#### CAT-025 — Confiabilidade, suporte e acessibilidade
- **Estado atual:** App multiplataforma e tema claro/escuro; acessibilidade, uso offline e observabilidade não foram demonstrados.
- **Perfis:** todos; suporte técnico e administração de plataforma.
- **Fluxo:** informar erro com protocolo, recuperar operação, sincronizar ações pendentes quando aplicável e acompanhar disponibilidade.
- **Dados:** versão do app, erro técnico sem conteúdo sensível, estado de sincronização e protocolo de suporte.
- **Permissões:** telemetria minimizada; equipe de suporte não acessa conteúdo pessoal sem autorização.
- **Dependências/prioridade:** arquitetura da API, política de suporte e testes de acessibilidade; **P0** (qualidade contínua).
- **Aceite:** telas têm estados de carregamento/erro/vazio; campos e ações podem ser operados com leitor de tela; falha de rede não duplica lançamentos; suporte recebe protocolo sem segredo/token.

## MVP recomendado a partir do catálogo

1. **Fundação:** CAT-001 a CAT-005 e CAT-024, com autenticação, vínculo aprovado, estrutura do condomínio e autorização validada no servidor.
2. **Uso diário:** CAT-006 a CAT-010, para comunicação, chamados, documentos, reservas e portaria.
3. **Operação administrativa:** CAT-012 a CAT-015 e CAT-016 a CAT-020, priorizando manutenção e financeiro depois de validar regras e integrações.
4. **Governança e escala:** CAT-021 a CAT-023 e integrações de acesso/contabilidade, após os fluxos principais estarem estáveis.

Antes de iniciar CAT-017 a CAT-021, registrar as regras específicas do condomínio, alçadas e requisitos de auditoria. Onde o catálogo usa “configurável”, produto deve definir quais opções o síndico/administradora pode realmente alterar.

