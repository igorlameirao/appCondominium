# Hug — upload de arquivo (imagem e PDF)

Contrato para anexos genéricos. Imagens exclusivas continuam em `hug-imagem-upload.referencia.md`.

## Quando aplicar

- Campos com **PDF** e/ou **imagem** no mesmo controle.
- Comprovantes, documentos comprobatórios, anexos de cadastro.

## Componentes

| Peça | Caminho |
|------|---------|
| Upload (usar na tela) | `shared/hug-file-upload/hug-file-upload.component.ts` |
| Prévia | `shared/hug-file-preview/hug-file-preview.component.ts` |
| Utilitários MIME | `shared/hug-file-upload/hug-arquivo.util.ts` |
| Modal (imagem + PDF) | `shared/modal-arquivo-visualizacao/` — `iframe` para PDF, `img` para imagem; Baixar / Nova aba no cabeçalho |
| Imagens só | `app-hug-image-upload` → wrapper de `app-hug-file-upload` com `[modoImagem]="true"` |
| Estilos | `styles/cadastro.css` (classes `.hug-img-*` compartilhadas) |

## Exemplo — documento comprobatório

```html
<app-hug-file-upload
  label="Documento comprobatório"
  layout="paisagem"
  [varianteCard]="true"
  [compacta]="true"
  accept="application/pdf,image/jpeg,image/png"
  metaFormatos="Formatos: PDF, JPG ou PNG"
  [maxMb]="8"
  [previewUrl]="previewUrl"
  [previewMime]="previewMime"
  [nomeArquivo]="nomeArquivo"
  [exibirBaixar]="!!previewUrl"
  [disabled]="!canEdit || saving"
  (arquivoSelecionado)="onArquivo($event)"
  (removido)="onRemover()" />
```

## Persistência

Igual ao upload de imagem: pendências em memória, API no Salvar, `blobComTipo` ao hidratar preview da API.
