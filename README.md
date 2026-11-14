# AppCondominium

Sistema de Administração de Condomínios gerado a partir de `MDs/md_appCondominium.json`.

## Estrutura

| Pasta | Tecnologia | Descrição |
|-------|------------|-----------|
| `WebApi/` | .NET 8 | API REST (Clean Architecture) |
| `frontend/` | Angular 18 | Painel web (layout estilo SCO) |
| `AppCondominium/` | Flutter | App mobile moradores/síndico |
| `database/schema.sql` | MySQL | Script de criação das tabelas |
| `tools/generate_from_spec.py` | Python | Gerador de entidades/CRUD a partir do JSON |

## Multi-tenant — RT-Gerais 12 e 13

O tenant é a entidade **Condomínio** (`IdCondominio`). Cada sessão autenticada opera em um único condomínio ativo. O usuário pode trocar o tenant em `POST /api/auth/trocar-condominio` quando tiver vínculo (`PessoaCondominio` ou `PessoaUnidade`).

### Identificação na URL (RT-Gerais 13)

| Contexto | Padrão |
|----------|--------|
| Plataforma (administração) | `https://appcondominium.com.br/login` — escolha do condomínio no login |
| Condomínio (moradores/síndico) | `https://appcondominium.com.br/{identificador}/entrar` |

O campo **Dominio** do condomínio guarda o **identificador estável** do primeiro segmento da URL (ex.: `residencial-verde`). A API resolve em `GET /api/lookup/condominio-por-dominio?slug={identificador}`. O matching legado por subdomínio/host ainda funciona via `?host=` durante migração.

- **Angular:** `TenantHostService` resolve o slug na inicialização; `TenantUrlSerializer` prefixa/desprefixa a URL automaticamente.
- **Isolamento:** JWT `idCondominio`, header `X-Id-Condominio` e o slug da URL precisam coincidir; divergência encerra a sessão no frontend.

### Camadas

- **API:** `ICondominioContext` + middleware JWT. O header `X-Id-Condominio` deve coincidir com o claim. Resolução de slug: `AppCondominium.Application.Tenancy.CondominioTenantMatcher`.
- **EF:** global query filters por `CurrentTenantId` nas entidades de escopo `Condominio` e filtros indiretos (`pessoafisica`, `PessoaJuridica`, `Pessoa`, `PessoaUnidade`).
- **Spec:** `EscopoTenant` = `Global` | `Condominio` | `Indireto` em `MDs/md_appCondominium.json`.
- **Angular (sessão):** `CondominioContextService` (sessionStorage)
- **Flutter:** `UsuarioLogado.idCondominio` + header nas requisições (API direta; deep links web usam o mesmo identificador na URL)

### Nginx (SPA + API)

Ver `MDs/nginx-path-tenant.example.conf`: `try_files` para o Angular em qualquer `/{identificador}/...` e proxy `/api/` para a API .NET.

## Pré-requisitos

- .NET 8 SDK
- MySQL (mesmo servidor RDS do SCO; schema `condominium`)
- Node.js 18+
- Flutter 3.x (opcional, para o app)

## Backend

Connection string e JWT **não** ficam no Git (mesmo modelo do SCO). Copie `WebApi/AppCondominium.API/appsettings.Example.json` e configure User Secrets:

```powershell
cd WebApi\AppCondominium.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Port=3306;Database=condominium;User=...;Password=...;AllowLoadLocalInfile=true;"
dotnet user-secrets set "Jwt:Key" "GERE_UMA_CHAVE_ALEATORIA_COM_NO_MINIMO_32_CHARS"
```

Produção: variáveis `ConnectionStrings__DefaultConnection` e `Jwt__Key`.

Arquivos (fotos, imagens do condomínio, documento de oferta e procuração) ficam no **S3**, não em colunas BLOB. A chave segue `app-condominium/{ambiente}/condominios/{id}/funcionalidades/...` ou, para a foto da pessoa física, `app-condominium/{ambiente}/plataforma/funcionalidades/pessoas-fisicas/{idPessoa}/foto-perfil/`. `FotoEmbedding` permanece no banco para o reconhecimento facial.

```powershell
cd WebApi\AppCondominium.API
dotnet user-secrets set "Storage:S3:Bucket" "NOME_DO_BUCKET"
dotnet user-secrets set "Storage:S3:Region" "us-east-2"
dotnet user-secrets set "Storage:S3:EnvironmentPrefix" "dev"
# AWS local: use perfil em ~/.aws/credentials (ex.: AWS_PROFILE=appcondominium-dev)
# MinIO local (opcional):
dotnet user-secrets set "Storage:S3:ServiceUrl" "http://localhost:9000"
dotnet user-secrets set "Storage:S3:AccessKey" "minioadmin"
dotnet user-secrets set "Storage:S3:SecretKey" "minioadmin"
```

O bucket permanece privado. A API entrega os bytes. Para copiar BLOBs já gravados e depois apagar as colunas:

```powershell
cd WebApi
dotnet run --project AppCondominium.Tools -- migrate-blobs-to-s3
dotnet run --project AppCondominium.Tools -- migrate-blobs-to-s3 --drop-columns
```

O script equivalente está em `database/migrations/20261111_drop_blob_columns.sql`. Instalações novas usam `database/schema.sql` já sem essas colunas.

```powershell
cd WebApi
dotnet run --project AppCondominium.API
```

Swagger: http://localhost:5000/swagger

Criar banco (ajuste o nome do schema para `condominium` se necessário):

```powershell
mysql -h SEU_HOST -u SEU_USER -p < database\schema.sql
```

## Frontend web

```powershell
cd frontend
npm install
npm start
```

Login: http://localhost:4200/login (usuário, senha, condomínio — RT-Gerais 13)

## App Flutter

```powershell
cd AppCondominium
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api/
```

## Regenerar código a partir do JSON

```powershell
python tools\generate_from_spec.py
```

## Frontend Web — telas implementadas

- **Listas** paginadas com filtro (RT-Gerais 02–08) para as 34 entidades CRUD
- **Formulários** de inclusão (`/entidade/novo`) e edição (`/entidade/:id`) com Gravar, Cancelar e Excluir (RT-Gerais 09–10)
- **Combobox customizada** digitável com paginação local (RT-Gerais 07)
- **Máscaras CPF/CNPJ** com validação (RN-Gerais 14/15)
- **Componente de endereço** com CEP, ViaCEP e cascata UF → Município → Bairro (RN-Endereço)
- **Login condomínio** em `/{identificador}/entrar` ou `/entrar?idCondominio=N` (RT-Gerais 13)
- **IdCondominio** oculto nos formulários quando a regra da entidade exige contexto global (RT-Gerais 12)

Regenerar telas após alterar o JSON:

```powershell
python tools\generate_from_spec.py
```

## Observações

- Formulários **customizados** (não sobrescritos pelo gerador): `uf-form`, `municipio-form`, `configuracaocondominio-form`.
- Demais regras específicas (FotoEmbedding no S3 + InsightFace, cálculos de área no Condomínio) podem exigir ajustes manuais nos `*-form.component.ts` gerados.
- O layout web replica o shell premium do projeto SCO (`styles-premium-shell.css`, listas paginadas RT-Gerais 02–11).
