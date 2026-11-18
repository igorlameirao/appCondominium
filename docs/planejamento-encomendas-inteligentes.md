# Encomendas Inteligentes — Planejamento

**Projeto:** AppCondominium  
**Status:** Planejamento aprovado (direção funcional) — **sem implementação**  
**Última revisão:** 2026-11-18 (autorizações na Fase 1, permissões RBAC, passaporte CSPRNG, schema `GuardaEncomenda` em dev)

---

## 1. Diagnóstico (código atual)

| Camada | Existe hoje | Lacuna |
|--------|-------------|--------|
| MySQL | `GuardaEncomenda` (8 colunas) | Destinatário, situação, passaporte, autorizações, eventos |
| API | CRUD gerado `api/guardaencomenda` | Sem service de negócio; RN só em metadata |
| Angular | Lista + form único recebimento/retirada | Sem fluxo portaria nem destinatário morador |
| Flutter | Demo Home; preferências `ENCOMENDA_*` | Sem feature encomendas |
| Notificações | `PessoaPreferenciaNotificacao` + UI + catálogo | **Envio** em recebimento/retirada pendente |
| Push | Dependências mobile | Sem backend FCM |

**Decisão mantida:** destinatário **obrigatório** (morador ativo na unidade); notificação **somente** ao destinatário (`IPreferenciaNotificacaoService` / `ENCOMENDA_RECEBIDA` e `ENCOMENDA_RETIRADA`).

---

## 2. Recebimento

- Obrigatório: unidade + destinatário (`IdVinculoDestinatario`, papel Morador ativo na unidade).
- Servidor: **código operacional** da encomenda (ver §11), data/hora entrada, colaborador responsável.
- Opcional: foto (S3), local armazenamento, transportadora, rastreio.
- UI: ao trocar unidade, limpar destinatário.
- Backend: validar tenant, vínculo e condomínio.

---

## 3. Identificação na retirada

O QR Code é **credencial compartilhável**, gerada por morador autenticado. A **validação do código não conclui** a retirada.

| Modalidade | Nome do retirante | Documento |
|---|---|---|
| Próprio destinatário **com** QR | Automático (destinatário) | Não obrigatório |
| Terceiro **com** QR | Obrigatório (nome completo) | Opcional |
| Próprio destinatário **sem** QR | Automático | Conferência presencial obrigatória |
| Terceiro **sem** QR + autorização válida | Obrigatório | Conferência presencial obrigatória |

- Conferência adicional em caso de suspeita.
- Não armazenar CPF/documento desnecessariamente; persistir documento só se informado e pertinente (LGPD).
- Registrar em cada retirada: `MetodoValidacao`, `TipoRetirante`, `ConferenciaPresencial`, funcionário, data/hora.

---

## 4. Autorizações de terceiros

- **Pontual:** uma encomenda; encerra ao usar.
- **Permanente:** encomendas do morador concedente; revogação e validade opcional.
- Terceiro **não** precisa ser morador nem cadastro completo (`IdPessoa` opcional + nome).
- **Sem QR:** autorização válida + identificação presencial (matriz acima).
- **Com QR válido:** **dispensa** autorização adicional — o passaporte já autoriza a retirada.
- Administração: app morador (Fase 5) e portaria (Fase 2), com rastreio de origem.
- **Fase 1 (backend):** modelo `EncomendaAutorizacaoRetirada`, regras pontual/permanente, APIs de criar/listar/revogar e validação na retirada sem QR — **pré-requisito da Fase 2** (telas portaria de terceiros sem passaporte).

---

## 5. Passaporte de retirada (credencial única)

1. Morador seleciona uma, várias ou todas as pendentes.
2. Define validade: 2h, 6h, **24h (padrão)**, 48h.
3. Servidor gera **uma única credencial numérica de 8 dígitos** com gerador **criptograficamente seguro** (CSPRNG, ex.: `RandomNumberGenerator` / equivalente), sem expor `IdGuardaEncomenda` nem dados sensíveis. **Unicidade global:** entre passaportes em situação válida (Ativo), o valor de 8 dígitos (via hash) não pode colidir em **nenhum condomínio**; em colisão rara, **regenerar** antes de persistir. **Concorrência:** criação do passaporte em transação com verificação de unicidade (índice único em `CredencialHash` ou política equivalente).
4. **QR Code e código numérico são a mesma credencial** — não existem dois tokens independentes. O QR codifica o valor de 8 dígitos (payload mínimo); o app também exibe os 8 dígitos para digitação ou compartilhamento.
5. **Portaria (Angular):** escanear o QR **preenche automaticamente** o campo do código e dispara **validação**; digitação manual permitida; em seguida identificar retirante → selecionar volumes → **confirmar** (confirmação explícita do porteiro; validação **não** conclui a retirada).

**Segurança:** persistir no banco apenas **hash** da credencial (não o valor em claro); cancelamento pelo morador; expiração automática; retirada parcial conforme §6.

**Limite de validação (aprovado):** contador por **porteiro autenticado** (`IdPessoa` do funcionário logado). Máximo **5 tentativas inválidas** em janela deslizante de **15 minutos** (QR e digitação manual passam pelo **mesmo** endpoint/regra no backend). Ao atingir o limite, **bloquear somente** a validação de passaportes **daquele porteiro** por **15 minutos** — sem afetar login, outros porteiros, o posto em si nem retiradas **presenciais sem QR**.

| Camada | Comportamento |
|--------|----------------|
| Backend | Rejeitar validação com código HTTP/mensagem de bloqueio; registrar tentativa inválida e evento de bloqueio (auditoria) |
| Angular | Após cada erro, informar tentativas restantes; **destaque** quando restarem **2** ou **1**; ao bloquear, mensagem explicativa + **tempo de espera** restante até liberar nova validação |

**Auditoria:** persistir tentativas inválidas e início/fim de bloqueio (porteiro, data/hora, origem QR ou manual, sem gravar credencial em claro).

**Rastreabilidade:** morador gerador, itens vinculados, datas, nome terceiro se aplicável, funcionário confirmador, método de validação; eventos de geração, cancelamento, expiração e utilização (total/parcial).

---

## 6. Retirada em lote

- Um passaporte pode agrupar várias `GuardaEncomenda`.
- Porteiro confirma volumes **efetivamente** entregues.
- **Parcial:** itens entregues → `Retirado`; demais permanecem pendentes no passaporte até entrega, cancelamento ou expiração.
- Impedir retirada duplicada (idempotência por item + situação encomenda).
- Leitura do QR **nunca** fecha a operação sozinha.

---

## 7. Modelo de dados (resumo)

**Ambiente de desenvolvimento:** não há registros de encomendas em produção. Permitida **reestruturação direta** da tabela/entidade `GuardaEncomenda` (novas colunas, remoção de campos legados do CRUD gerado) **sem** migração de dados nem compatibilidade retroativa com o formulário monolítico atual. Manter o **padrão do projeto:** scripts em `database/migrations/` e ferramentas em `AppCondominium.Tools`, alinhando [`MDs/md_appCondominium.json`](../MDs/md_appCondominium.json) quando o gerador for atualizado.

**`GuardaEncomenda` (estender ou redefinir):** `IdVinculoDestinatario`, `Situacao`, opcionais logísticos, retirada (`TipoRetirante`, `NomeRetirante`, `DocumentoRetirante` opcional, `MetodoValidacao`, `ConferenciaPresencial`, `IdAutorizacaoRetirada`, `IdPassaporteRetirada`, `IdPessoaFuncionarioRetirada`).

**Novas tabelas:**

- `EncomendaEvento` — append-only.
- `EncomendaAutorizacaoRetirada` — pontual/permanente.
- `EncomendaPassaporteRetirada` — `CredencialHash` (8 dígitos), validade, gerador, situação; **índice único** em `CredencialHash` para passaportes ativos (unicidade global).
- `EncomendaPassaporteValidacaoTentativa` (ou eventos em `EncomendaEvento`) — tentativas inválidas e bloqueios por porteiro, para auditoria e cálculo da janela 15 min.
- `EncomendaSequenciaCodigo` (ou equivalente) — controle `ENC-AAAA-NNNNNN` por `IdCondominio` + ano, com lock transacional.
- Configuração de **retenção** estendida em `ConfiguracaoCondominio` (ou tabela filha) — ver §12.
- `EncomendaPassaporteItem` — vínculo passaporte ↔ encomenda (Pendente/Retirado).

Não duplicar `PessoaPreferenciaNotificacao`. Log de envio reutiliza fila/e-mail existente.

---

## 8. API, permissões e UX (resumo)

**Isolamento e RBAC**

- **Multi-tenant:** todas as consultas e mutações filtradas por `ICondominioContext` / condomínio ativo (padrão existente em repositórios gerados).
- **Portaria:** `PermissionResource("GUARDAENCOMENDA")` — receber, retirar, validar passaporte, registrar autorizações na portaria, listar pendentes do **condomínio ativo**; validar vínculo ativo do colaborador (`IdPessoaEntrada`) conforme RN01.
- **Morador:** `EncomendaMoradorController` — **sem** `GUARDAENCOMENDA`; escopo restrito a encomendas cujo destinatário é vínculo do usuário nas unidades autorizadas pelo JWT; operações de passaporte e autorizações **somente** como concedente; proibir acesso por `IdGuardaEncomenda` de outro morador/condomínio.
- **Validação de vínculos:** destinatário morador ativo na unidade; retirada manual valida autorização do concedente e unidade; passaporte gerado apenas pelo morador dono das encomendas selecionadas.

**Superfícies**

- **Padrão:** `EncomendaNegocioController` + `EncomendaMoradorController` (como `PessoaVinculoNegocioController`).
- **Angular:** pendentes, receber, retirar (QR e manual), autorizações, histórico/comprovante — `hug-estilo-AppCondominium.mdc`.
- **Flutter (Fase 5):** encomendas, QR, share nativo, **gerenciamento de autorizações pelo morador** — `hug-estilo-mobile.mdc`.

---

## 9. Fases de implementação

1. **Modelo, regras e API de negócio** — migration(ies) `GuardaEncomenda` + tabelas novas; `ENC-AAAA-NNNNNN`; receber/retirar manual; `EncomendaEvento`; **`EncomendaAutorizacaoRetirada` (pontual/permanente) com APIs completas**; testes de tenant e vínculos.  
   **Aceite:** receber com destinatário; retirar próprio/terceiro sem QR com autorização via API; revogar autorização; código encomenda único sob concorrência; schema sem exigência de dados legados.

2. **Angular operacional** — lista, receber, retirar sem QR (matriz §3), cadastro/gestão de autorizações na portaria consumindo APIs da Fase 1.  
   **Aceite:** Fase 2 não implementa regras duplicadas; terceiro sem QR bloqueado sem auth válida; apenas condomínio ativo; `GUARDAENCOMENDA` respeitado.

3. **E-mail ao destinatário (preferências).**  
   **Aceite:** só destinatário; `AtivoEmail`; falha não reverte recebimento.

4. **Push FCM** (projeto Firebase AppCondominium; Android + iOS/APNs — §10).  
   **Aceite:** conforme §10.

5. **Flutter morador** — minhas encomendas, detalhe; **UI de autorizações pontuais/permanentes** (consome APIs Fase 1); ainda sem passaporte (Fase 6).  
   **Aceite:** morador vê só suas unidades/encomendas; não acessa dados de terceiros.

6. **Passaporte** (8 dígitos CSPRNG + QR), lote, parcial, leitor Angular.  
   **Aceite:** unicidade global do passaporte ativo; hash no banco; rate limit por porteiro (5/15 min, bloqueio 15 min só na validação); mensagens de tentativas restantes e alertas em 2/1; QR e manual no mesmo backend; auditoria de falhas/bloqueios; retirada sem QR e demais porteiros inalterados; confirmação explícita do porteiro.

7. **Lembretes, reenvio, limpeza automática** de histórico e fotografias S3 (§12), respeitando pendentes/preservação — e melhorias complementares.  
   **Aceite:** job aplica prazos por condomínio; não remove pendentes; auditoria da execução.

---

## 10. Notificações Push (decisão aprovada)

- **Projeto Firebase exclusivo** AppCondominium (não compartilhar projeto/credenciais com SCO de forma indiscriminada).
- **Android e iOS desde o lançamento** do módulo push (FCM + **APNs** configurado no console Firebase).
- **Backend:** `FirebaseAdmin` + `PushDispositivo` (ou equivalente); credenciais e JSON de serviço armazenados de forma **segura na AWS** (Secrets Manager/Parameter Store ou padrão já usado no deploy — **sem** tela Angular para configurar Firebase).
- **Reaproveitamento:** na implementação, **analisar** a solução existente no **SCO** (`ControleOcorrencias` — referência local: dependência `FirebaseAdmin` em artefatos de build) e portar apenas padrões compatíveis (registro de token, envio assíncrono, desativação de token inválido).
- **Orquestrador de encomendas** consulta `PessoaPreferenciaNotificacao` (`AtivoPush` / `AtivoEmail`) — sem nova tabela de preferências.

**Aceite Fase 4:** push de teste em Android e iOS; preferências respeitadas; credenciais fora do repositório e fora da UI web.

---

## 11. Código operacional da encomenda (decisão aprovada)

| Regra | Especificação |
|--------|----------------|
| Formato | `ENC-AAAA-NNNNNN` (ex.: `ENC-2026-000001`) |
| Geração | Automática no recebimento; **sequencial por condomínio e ano** |
| Ano civil | Reinício da sequência a cada ano (`AAAA`) |
| Unicidade | Não reutilizar códigos; garantir em **operações simultâneas** (transação/lock por `IdCondominio` + ano) |
| Expansão | Após `NNNNNN`, ampliar largura numérica (7+ dígitos) sem mudar o prefixo `ENC-` |
| PK interna | `IdGuardaEncomenda` permanece identificador técnico; `CodigoEncomenda` é o código exibido na portaria e apps |

**Aceite Fase 1 (código encomenda):** dois recebimentos concorrentes no mesmo condomínio não geram `CodigoEncomenda` duplicado.

---

## 12. Retenção de dados (decisão aprovada)

**UI:** aba em **Configurações do Condomínio → Retenção de Dados** (`cad-*` / [`hug-estilo-AppCondominium.mdc`](../.cursor/rules/hug-estilo-AppCondominium.mdc)).

| Campo | Opções | Padrão sugerido |
|--------|--------|-----------------|
| Retenção do histórico de encomendas | N meses ou **indeterminado** | **24 meses** |
| Retenção das fotografias (S3) | N meses ou **indeterminado** | **3 meses** |

- Configuração **por condomínio**; permissão administrativa; **auditoria** de alterações (evento/quem/quando).
- **Job de limpeza (Fase 7):** processo automático periódico que aplica os prazos configurados — purga ou anonimiza histórico elegível e remove objetos de foto no S3 quando vencidos; **não** purgar encomendas **pendentes** nem itens em investigação/preservação legal; registrar execução em auditoria.
- **Indeterminado:** reter até política futura ou obrigação legal; documentar base LGPD na tela (texto orientativo, não jurídico).

Relaciona-se à Fase 7 e a políticas já citadas em [`AppCondominium/docs/avaliacao-funcionalidades-condominio.md`](../AppCondominium/docs/avaliacao-funcionalidades-condominio.md) (CAT-024).

---

## 13. Pendências residuais

| Tema | Nota |
|------|------|
| Levantamento SCO | Mapear classes/workers FCM no repositório SCO antes da Fase 4 (não está integralmente neste workspace) |

**Fora do MVP:** API WhatsApp; etiqueta impressa na recepção.

---

## 14. Referências

- [`docs/planejamento/modulo-banners-app.md`](planejamento/modulo-banners-app.md) — formato de planejamento  
- [`MDs/md_appCondominium.json`](../MDs/md_appCondominium.json) — RN `GuardaEncomenda`  
- Plano Cursor: `revisão_encomendas_inteligentes_4dd4ec31.plan.md`