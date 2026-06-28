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

## Regra de Ouro — RT-Gerais 12

Toda operação vinculada a `IdCondominio` usa o contexto global:

- **API:** `ICondominioContext` + middleware JWT/header `X-Id-Condominio`
- **Angular:** `CondominioContextService` (sessionStorage)
- **Flutter:** `UsuarioLogado.idCondominio` + header nas requisições

## Pré-requisitos

- .NET 8 SDK
- MySQL (localhost, user `root`, senha `mysql`)
- Node.js 18+
- Flutter 3.x (opcional, para o app)

## Backend

```powershell
cd WebApi
dotnet run --project AppCondominium.API
```

Swagger: http://localhost:5000/swagger

Criar banco:

```powershell
mysql -u root -pmysql < database\schema.sql
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
- **Login condomínio** em `/entrar?idCondominio=N` (RT-Gerais 13)
- **IdCondominio** oculto nos formulários quando a regra da entidade exige contexto global (RT-Gerais 12)

Regenerar telas após alterar o JSON:

```powershell
python tools\generate_from_spec.py
```

## Observações

- Formulários **customizados** (não sobrescritos pelo gerador): `uf-form`, `municipio-form`, `configuracaocondominio-form`.
- Demais regras específicas (FotoEmbedding, cálculos de área no Condomínio) podem exigir ajustes manuais nos `*-form.component.ts` gerados.
- O layout web replica o shell premium do projeto SCO (`styles-premium-shell.css`, listas paginadas RT-Gerais 02–11).
