# Hug — upload e pré-visualização de imagem

Contrato visual e de integração do padrão aprovado em **Configuração do Condomínio** (`configuracaocondominio-form.component.ts`).

## Quando aplicar

- Qualquer tela de cadastro ou edição com **upload, substituição ou remoção** de imagem.
- Pedidos de **«aplicar Hug-Estilo-AppCondominium»**: se a tela tiver campo de imagem, usar este padrão **sem instrução adicional**.
- **Não** substituir componentes com requisitos incompatíveis (ex.: crop obrigatório, multi-arquivo, assinatura) sem avaliar antes.

## Componentes oficiais

| Peça | Caminho | Função |
|------|---------|--------|
| Upload (usar na tela) | `frontend/src/app/shared/hug-image-upload/hug-image-upload.component.ts` | Wrapper sobre `app-hug-file-upload` com `[modoImagem]="true"` |
| Motor compartilhado | `frontend/src/app/shared/hug-file-upload/hug-file-upload.component.ts` | Seleção, validação, drag-and-drop |
| Prévia (interno) | `frontend/src/app/shared/hug-file-preview/hug-file-preview.component.ts` | Quadro, placeholder, barra de ações |
| Legado | `hug-image-preview` | Mantido; novas telas usam `hug-file-preview` |
| Modal ampliado | `frontend/src/app/shared/modal-imagem-visualizacao/` | Visualizar em tela cheia |
| Estilos | `frontend/src/styles/cadastro.css` (`.hug-img-*`, `.hug-img-upload-grid`) | Tokens alinhados a `--cad-campo-*` |
| Legado | `app-upload-imagem-cad` | Encaminha para Hug; **deprecated** |

## Padrão obrigatório (UI)

1. **Card** (`[varianteCard]="true"`): contorno suave, cantos 10px, fundo branco.
2. **Quadro de prévia**: fundo neutro `#f1f5f9`, borda `#cbd5e1`, imagem com `object-fit: contain` (transparência preservada).
3. **Placeholder**: ícone + «Nenhuma imagem» + «Clique ou arraste para enviar».
4. **Seleção**: clique na zona vazia ou drag-and-drop no corpo do card.
5. **Ações abaixo da imagem** (nunca sobrepostas): **Visualizar** (`eye`), **Substituir** (`upload`), **Remover** (`trash`), com `title` e `aria-label`.
6. **Rodapé do card**: formatos, tamanho máximo (MB) e dimensões recomendadas (`metaFormatos`, `maxMb`, `dimensaoRecomendada`).
7. **Pré-visualização imediata** no cliente (`URL.createObjectURL` ou URL existente) **antes** de Salvar.
8. **Estados**: `carregando`, `disabled`, `somenteLeitura`, `invalido` + mensagem `erro` de validação local (formato/tamanho).

## API do `app-hug-image-upload`

| Input / Output | Descrição |
|----------------|-----------|
| `label` | Título do campo |
| `previewUrl` | URL da imagem atual ou nova (blob/data/http) |
| `accept`, `maxMb`, `metaFormatos`, `dimensaoRecomendada` | Restrições e texto do rodapé |
| `layout` | `'paisagem'` (16:9) ou `'quadrado'` (1:1) |
| `iconeZona` | Ícone do placeholder (`image`, `building`, …) |
| `varianteCard` | `true` em formulários cad-* |
| `obrigatorio`, `invalido` | Asterisco e borda de erro |
| `disabled`, `somenteLeitura`, `carregando` | Bloqueio de edição; somente leitura mantém Visualizar |
| `exibirVisualizar`, `exibirSubstituir`, `exibirRemover` | Ocultar ações quando necessário |
| `(arquivoSelecionado)` | `File` escolhido — atualizar preview local |
| `(removido)` | Usuário removeu na UI — **persistir só no Salvar** |

## Persistência (contrato de formulário)

Referência: `configuracaocondominio-form.component.ts`.

1. Manter flags/arquivos em memória (`Map` de pendentes, flags de remoção).
2. `(removido)` limpa preview e marca remoção; **não** chamar API de delete imediato.
3. `(arquivoSelecionado)` gera `blob:` local e associa ao campo lógico.
4. No **Salvar**, enviar arquivos novos e instruções de remoção conforme contrato da entidade.
5. Inclusão vs edição: carregar `previewUrl` da API na edição; inclusão começa sem URL.

## Vários uploads na mesma linha

Envolver os `app-hug-image-upload` em:

```html
<div class="hug-img-upload-grid">
  <app-hug-image-upload [varianteCard]="true" layout="paisagem" ... />
  <app-hug-image-upload [varianteCard]="true" layout="quadrado" ... />
</div>
```

- Grid `1.45fr | 1fr`, `align-items: stretch`, cards com `height: 100%`.
- `[varianteCard]="true"` ativa `alinharAlturaPar` (quadros e meta alinhados).
- Em `≤720px`: uma coluna, `aspect-ratio` natural nos quadros.

Proporção do grid pode repetir `config-condominio-form__imagens` ou usar só `.hug-img-upload-grid`.

## Exemplo mínimo

```html
<app-hug-image-upload
  label="Logotipo"
  layout="quadrado"
  [varianteCard]="true"
  [previewUrl]="previewLogo"
  [disabled]="!canEdit || saving"
  [carregando]="loadingLogo"
  metaFormatos="Formatos: PNG ou WEBP"
  dimensaoRecomendada="512 × 512"
  [maxMb]="2"
  (arquivoSelecionado)="onLogo($event)"
  (removido)="onLogoRemovido()" />
```

## Regra permanente para Agents

Ao aplicar **Hug-Estilo-AppCondominium**:

1. Procurar `type="file"`, `upload`, `imagem`, `foto`, `logo`, `ícone` no template.
2. Substituir markup/CSS local por `app-hug-image-upload` (não duplicar HTML/CSS).
3. Se ≥2 imagens lado a lado, usar `.hug-img-upload-grid`.
4. Preservar API, permissões (`canEdit`) e fluxo de Salvar da entidade.
5. Rule Cursor: `.cursor/rules/hug-estilo-AppCondominium.mdc` (seção Upload de imagem).

## Referência visual aprovada

`frontend/src/app/features/configuracaocondominio/configuracaocondominio-form.component.ts` — **não alterar o visual** dessa tela ao evoluir o componente compartilhado; validar regressão visual após mudanças em `cadastro.css` ou nos shareds.
