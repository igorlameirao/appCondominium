# -*- coding: utf-8 -*-
"""Gera entidades, repositórios, controllers e telas Angular a partir de md_appCondominium.json."""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "MDs" / "md_appCondominium.json"
SRC = ROOT / "WebApi"
FE = ROOT / "frontend" / "src" / "app" / "features"


def load_spec():
    with open(SPEC_PATH, encoding="utf-8") as f:
        return json.load(f)["EspecificacaoSistema"]


def pascal(s):
    if not s:
        return s
    parts = re.split(r"[_\s]+", s)
    return "".join(p[:1].upper() + p[1:] for p in parts if p)


def camel(s):
    p = pascal(s)
    return p[:1].lower() + p[1:] if p else s


def is_pk(campo):
    idx = (campo.get("Indice") or "").lower()
    return "primary" in idx or "primay" in idx


def is_fk(campo):
    return "foreign key" in (campo.get("Indice") or "").lower() or campo.get("EntidadeForeignKey")


def is_auto_inc(campo):
    td = (campo.get("TipoDado") or "").lower()
    return "auto incremental" in td


def has_id_condominio(entity):
    return any(c["Campo"] == "IdCondominio" for c in entity.get("Campos", []))


def escopo_tenant(entity):
    if entity.get("EscopoTenant"):
        return entity["EscopoTenant"]
    return "Condominio" if has_id_condominio(entity) else "Global"


def tenant_filter_csharp(entity):
    """Corpo de ApplyCondominioFilter. Vazio = catálogo global."""
    escopo = escopo_tenant(entity)
    if escopo == "Global":
        return ""
    if escopo == "Condominio":
        return """        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
"""
    vinculo = entity.get("VinculoTenant") or ""
    if vinculo == "Unidade":
        return """        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => _ctx.Set<Unidade>().Any(u => u.IdUnidade == e.IdUnidade && u.IdCondominio == tenantId));
"""
    if vinculo == "Fornecedor":
        return """        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => _ctx.Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == tenantId));
"""
    if vinculo == "Cobranca":
        return """        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => _ctx.Set<Cobranca>().Any(c => c.IdCobranca == e.IdCobranca && c.IdCondominio == tenantId));
"""
    return """        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e =>
            _ctx.Set<PessoaCondominio>().Any(v => v.IdPessoa == e.IdPessoa && v.IdCondominio == tenantId)
            || _ctx.Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == tenantId)
            || _ctx.Set<Unidade>().Any(u => _ctx.Set<PessoaUnidade>().Any(pu => pu.IdUnidade == u.IdUnidade && pu.IdPessoa == e.IdPessoa) && u.IdCondominio == tenantId));
"""


def assigns_tenant_id(entity):
    return escopo_tenant(entity) == "Condominio" and has_id_condominio(entity)


def hide_id_condominio_ui(entity):
    for r in entity.get("Regras", []):
        if "RT-Gerais 12" in r.get("Descricao", "") or "IdCondominio não deve ser exibido" in r.get("Descricao", ""):
            return True
    return has_id_condominio(entity) and entity["Entidade"] != "Condominio"


def csharp_type(campo):
    td = (campo.get("TipoDado") or "").upper()
    if "BLOB" in td or "BINARY" in td:
        return "byte[]?"
    if "JSON" in td:
        return "string?"
    if "DATE" in td and "DATETIME" not in td:
        return "DateOnly?"
    if "DATETIME" in td or "TIMESTAMP" in td:
        return "DateTime?"
    if "DECIMAL" in td or "NUMERIC" in td:
        return "decimal?"
    if "BIGINT" in td:
        return "ulong?"
    if "MEDIUMINT" in td or ("INT" in td and "TINY" not in td):
        return "uint?"
    if "TINYINT" in td or "BOOL" in td:
        return "byte?"
    if "CHAR" in td or "VARCHAR" in td or "TEXT" in td:
        return "string?"
    return "string?"


def mysql_type(campo):
    td = campo.get("TipoDado") or ""
    t = td.upper()
    if "AUTO INCREMENTAL" in t:
        base = "INT UNSIGNED NOT NULL AUTO_INCREMENT"
        if "BIGINT" in t:
            base = "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT"
        return base
    if "BIGINT" in t:
        return "BIGINT UNSIGNED" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "MEDIUMINT" in t:
        return "MEDIUMINT UNSIGNED" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "DECIMAL" in t:
        m = re.search(r"DECIMAL\((\d+),(\d+)\)", t)
        if m:
            return f"DECIMAL({m.group(1)},{m.group(2)}) UNSIGNED" + (
                " NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL"
            )
    if "VARCHAR" in t:
        m = re.search(r"VARCHAR\((\d+)\)", t, re.I)
        n = m.group(1) if m else "255"
        return f"VARCHAR({n})" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "CHAR(2)" in t or "CHAR (2)" in t:
        return "CHAR(2) NOT NULL"
    if "CHAR(7)" in t:
        return "CHAR(7) NULL"
    if "CHAR(14)" in t:
        return "CHAR(14) NULL"
    if "DATETIME" in t:
        return "DATETIME" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "DATE" in t:
        return "DATE" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "BOOLEAN" in t:
        return "TINYINT(1)" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    m = re.search(r"CHAR\((\d+)\)", t, re.I)
    if m:
        return f"CHAR({m.group(1)})" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "MEDIUMBLOB" in t:
        return "MEDIUMBLOB NULL"
    if "BLOB" in t:
        return "BLOB NULL"
    if "JSON" in t:
        return "JSON NULL"
    if "TINYINT" in t:
        return "TINYINT UNSIGNED" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    if "INT" in t and "BIGINT" not in t and "MEDIUMINT" not in t and "TINYINT" not in t and "SMALLINT" not in t:
        return "INT UNSIGNED" + (" NOT NULL" if campo.get("Obrigatorio") == "Sim" else " NULL")
    return "VARCHAR(255) NULL"


def list_columns(entity):
    seen = set()
    cols = []
    for c in entity["Campos"]:
        if c["Campo"] in seen:
            continue
        if is_pk(c) and is_auto_inc(c):
            continue
        if c["Campo"] == "IdCondominio" and hide_id_condominio_ui(entity):
            continue
        if c["Campo"] in ("Senha", "Foto", "FotoEmbedding", "ImagemLogin", "ImagemIcone"):
            continue
        if "BLOB" in (c.get("TipoDado") or "").upper():
            continue
        seen.add(c["Campo"])
        cols.append(c)
    if len(cols) < 2:
        for c in entity["Campos"]:
            if c["Campo"] not in seen and "BLOB" not in (c.get("TipoDado") or "").upper():
                cols.append(c)
                seen.add(c["Campo"])
            if len(cols) >= 5:
                break
    return cols[:6]


def uses_endereco_widget(entity):
    if entity["Entidade"] == "Endereco":
        return False
    names = {c["Campo"] for c in entity["Campos"]}
    return "IdEndereco" in names


def skip_form_field(entity, c):
    if is_pk(c) and is_auto_inc(c):
        return True
    if c["Campo"] in ("Foto", "FotoEmbedding", "ImagemLogin", "ImagemIcone"):
        return True
    if "BLOB" in (c.get("TipoDado") or "").upper() and "CHAR" not in (c.get("TipoDado") or "").upper():
        return True
    if c["Campo"] == "IdCondominio" and hide_id_condominio_ui(entity):
        return True
    if uses_endereco_widget(entity) and c["Campo"] in ("IdEndereco", "NumeroEndereco", "ComplementoEndereco"):
        return True
    return False


def readonly_on_edit(entity, c):
    if is_pk(c) and is_auto_inc(c):
        return True
    desc = " ".join(r.get("Descricao", "") for r in entity.get("Regras", [])).lower()
    if c["Campo"].lower() in desc and "somente leitura" in desc:
        return True
    for r in entity.get("Regras", []):
        d = r.get("Descricao", "")
        if c["Campo"] in d and ("somente leitura" in d.lower() or "não editável" in d.lower() or "nao editavel" in d.lower()):
            return True
    return False


def field_grid_class(campo):
    """Espelha frontend/src/app/shared/form-layout/form-field-span.ts."""
    label = campo.get("RotuloCampo") or campo.get("Campo") or ""
    name = campo.get("Campo") or ""
    blob = f"{label} {name}"
    td = (campo.get("TipoDado") or "").upper()
    if is_pk(campo):
        return "fg-col-2"
    if re.search(r"nome|descri", blob, re.I):
        return "fg-col-12"
    if "DATETIME" in td or "TIMESTAMP" in td:
        return "fg-col-4"
    if "DATE" in td:
        return "fg-col-2"
    if documento_tipo(campo):
        return "fg-col-3"
    if "TEXT" in td:
        return "fg-col-12"
    m = re.search(r"(?:VAR)?CHAR\((\d+)\)", td)
    if m:
        n = int(m.group(1))
        if n <= 25:
            return "fg-col-2"
        if n <= 50:
            return "fg-col-3"
        if n <= 100:
            return "fg-col-6"
        return "fg-col-12"
    if is_fk(campo) and not is_pk(campo):
        return "fg-col-6"
    if any(tok in td for tok in ("INT", "DECIMAL", "NUMERIC", "BOOL", "TINYINT", "FLOAT", "DOUBLE")):
        return "fg-col-2"
    return "fg-col-6"


def _span(campo, html):
    cls = field_grid_class(campo)
    return html.replace('<div class="form-group">', f'<div class="form-group {cls}">', 1)


def _rank_form_html(html, pk_names):
    if html.lstrip().startswith("<app-"):
        return 2
    names = re.findall(r'(?:name="|model\.)(\w+)', html)
    label_m = re.search(r"<label>([^<]*)", html)
    label = label_m.group(1) if label_m else ""
    identifier = "pkDisplay" in html or any(n in pk_names for n in names)
    if identifier:
        return 0
    if re.search(r"nome|descri", f"{label} {' '.join(names)}", re.I):
        return 1
    return 2


def documento_tipo(campo):
    n = campo["Campo"].upper()
    if n == "CNPJ" or n == "CPFCNPJ":
        return "cnpj" if n == "CNPJ" else "cpfcnpj"
    if n == "CPF":
        return "cpf"
    if "CNPJ" in n:
        return "cnpj"
    if "CPF" in n:
        return "cpf"
    return None


def fk_service_name(fk_entity: str) -> str:
    """Entidades sem CRUD usam serviço da especialização mais próxima."""
    m = {
        "Pessoa": "Pessoafisica",
        "PessoaFisica": "Pessoafisica",
        "pessoafisica": "Pessoafisica",
        "PessoaUnidade": "Pessoafisica",
    }
    return m.get(fk_entity, pascal(fk_entity))


def fk_service_folder(fk_entity: str) -> str:
    return fk_service_name(fk_entity).lower()


def form_fields_for_entity(entity):
    seen = set()
    fields = []
    for c in entity["Campos"]:
        if c["Campo"] in seen or skip_form_field(entity, c):
            continue
        seen.add(c["Campo"])
        fields.append(c)
    return fields


def route_params(entity):
    return [camel(c["Campo"]) for c in pk_fields(entity)]


def route_path_suffix(entity):
    pks = pk_fields(entity)
    return "/".join("{" + camel(c["Campo"]) + "}" for c in pks)


def pk_fields(entity):
    pks = [c for c in entity["Campos"] if is_pk(c)]
    if not pks:
        pks = [entity["Campos"][0]]
    return pks


def write(path, content):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("  wrote", path.relative_to(ROOT))


def gen_entity(entity):
    name = pascal(entity["Entidade"])
    lines = [f"namespace AppCondominium.Domain.Entities;", "", f"public class {name}", "{"]
    seen = set()
    for c in entity["Campos"]:
        cn = pascal(c["Campo"])
        if cn in seen:
            continue
        seen.add(cn)
        ct = csharp_type(c)
        lines.append(f"    public {ct} {cn} {{ get; set; }}")
    lines.append("}")
    write(SRC / "AppCondominium.Domain" / "Entities" / "Generated" / f"{name}.cs", "\n".join(lines))


def gen_repository(entity):
    name = pascal(entity["Entidade"])
    route = camel(entity["Entidade"])
    filt_fields = []
    seen_f = set()
    for c in entity["Campos"]:
        if c.get("Filtro") == "Sim" and c["Campo"] not in seen_f:
            seen_f.add(c["Campo"])
            filt_fields.append(c)
    filter_search = ""
    if filt_fields:
        checks = []
        for c in filt_fields:
            fn = pascal(c["Campo"])
            ct = csharp_type(c)
            if "string" in ct:
                checks.append(f"(e.{fn} != null && e.{fn}.Contains(filter))")
        if checks:
            filter_search = f"""
        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => {" || ".join(checks)});
"""

    pk = pk_fields(entity)
    pk_types = ", ".join(csharp_type(c) for c in pk)
    pk_names = ", ".join(pascal(c["Campo"]) for c in pk)
    set_cond = ""
    if assigns_tenant_id(entity):
        set_cond = """        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
"""
    apply_filter = tenant_filter_csharp(entity)

    content = f"""using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class {name}Repository
{{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public {name}Repository(AppDbContext ctx, ICondominioContext condominio)
    {{
        _ctx = ctx;
        _condominio = condominio;
    }}

    private IQueryable<{name}> BaseQuery() => _ctx.Set<{name}>();

    private IQueryable<{name}> ApplyCondominioFilter(IQueryable<{name}> query)
    {{
{apply_filter}        return query;
    }}

    public async Task<PagedResult<{name}>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {{
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());
{filter_search}
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<{name}> {{ Items = items, TotalCount = total, Page = page, PageSize = pageSize }};
    }}

    public async Task<{name}?> GetByIdAsync({", ".join(f"{csharp_type(c)} {camel(c['Campo'])}" for c in pk)}, CancellationToken ct = default)
    {{
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => {" && ".join(f"e.{pascal(c['Campo'])} == {camel(c['Campo'])}" for c in pk)}, ct);
    }}

    public async Task<{name}> AddAsync({name} entity, CancellationToken ct = default)
    {{
{set_cond}
        await _ctx.Set<{name}>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }}

    public async Task UpdateAsync({name} entity, CancellationToken ct = default)
    {{
{set_cond}        _ctx.Set<{name}>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }}

    public async Task<bool> DeleteAsync({", ".join(f"{csharp_type(c)} {camel(c['Campo'])}" for c in pk)}, CancellationToken ct = default)
    {{
        var e = await GetByIdAsync({", ".join(camel(c["Campo"]) for c in pk)}, ct);
        if (e == null) return false;
        _ctx.Set<{name}>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }}
}}
"""
    write(SRC / "AppCondominium.Infrastructure" / "Repositories" / "Generated" / f"{name}Repository.cs", content)


def gen_controller(entity):
    name = pascal(entity["Entidade"])
    route = entity["Entidade"].lower()
    pk = pk_fields(entity)
    pk_route = "/".join("{" + camel(c["Campo"]) + "}" for c in pk)
    pk_params_get = ", ".join(f"[FromRoute] {csharp_type(c)} {camel(c['Campo'])}" for c in pk)

    content = f"""using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/{route}")]
[Authorize]
[PermissionResource("{entity['Entidade'].upper()}")]
public class {name}Controller : ControllerBase
{{
    private readonly {name}Repository _repo;

    public {name}Controller({name}Repository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<{name}>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{pk_route}")]
    public async Task<ActionResult<{name}>> GetById({pk_params_get}, CancellationToken ct = default)
    {{
        var item = await _repo.GetByIdAsync({", ".join(camel(c["Campo"]) for c in pk)}, ct);
        return item == null ? NotFound() : Ok(item);
    }}

    [HttpPost]
    public async Task<ActionResult<{name}>> Create([FromBody] {name} entity, CancellationToken ct = default)
    {{
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new {{ {", ".join(f'{camel(c["Campo"])} = created.{pascal(c["Campo"])}' for c in pk)} }}, created);
    }}

    [HttpPut("{pk_route}")]
    public async Task<IActionResult> Update({pk_params_get}, [FromBody] {name} entity, CancellationToken ct = default)
    {{
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }}

    [HttpDelete("{pk_route}")]
    public async Task<IActionResult> Delete({pk_params_get}, CancellationToken ct = default)
        => await _repo.DeleteAsync({", ".join(camel(c["Campo"]) for c in pk)}, ct) ? NoContent() : NotFound();
}}
"""
    write(SRC / "AppCondominium.API" / "Controllers" / "Generated" / f"{name}Controller.cs", content)


def gen_angular_list(entity):
    name = pascal(entity["Entidade"])
    kebab = re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower().replace("--", "-")
    folder = entity["Entidade"].lower()
    cols = list_columns(entity)
    pk = pk_fields(entity)[0]
    pk_camel = camel(pk["Campo"])

    ths = "".join(f"<th>{c.get('RotuloCampo', c['Campo'])}</th>" for c in cols)
    tds = "".join(
        f'<td>{{{{ item.{camel(c["Campo"])} }}}}</td>' for c in cols
    )

    content = f"""import {{ Component, OnInit }} from '@angular/core';
import {{ CommonModule }} from '@angular/common';
import {{ FormsModule }} from '@angular/forms';
import {{ Router }} from '@angular/router';
import {{ PaginationComponent }} from '../../shared/pagination/pagination.component';
import {{ ListLoadingModalComponent }} from '../../shared/list-loading-modal/list-loading-modal.component';
import {{ PagedResult }} from '../../core/models/paged-result';
import {{ {name}Service }} from './{folder}.service';
import {{ {name} }} from './{folder}.model';

@Component({{
  selector: 'app-{folder}-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ListLoadingModalComponent],
  template: `
    <div class="list-page">
      <div class="list-header">
        <h2>{entity.get("RotuloEntidade", name)}</h2>
        <div class="filter-row">
          <label>Filtro:</label>
          <input type="text" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" />
          <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
        </div>
        <div class="top-actions">
          <app-pagination
            [page]="page" [totalPages]="totalPages" [totalCount]="totalCount"
            [hasPreviousPage]="paged?.hasPreviousPage ?? false" [hasNextPage]="paged?.hasNextPage ?? false"
            (novo)="goNovo()" [showPagination]="false" [showNovo]="true" [alignRight]="true" />
        </div>
      </div>
      <div class="table-scroll-wrapper">
        <div class="table-container">
          <table *ngIf="paged?.items?.length; else empty">
            <thead><tr>{ths}</tr></thead>
            <tbody>
              <tr *ngFor="let item of paged?.items" (click)="goEdit(item)" class="row-click">
                {tds}
              </tr>
            </tbody>
          </table>
          <ng-template #empty><p *ngIf="!loading" class="empty">Nenhum registro encontrado.</p></ng-template>
        </div>
      </div>
      <div class="list-footer">
        <app-pagination
          [page]="page" [totalPages]="totalPages" [totalCount]="totalCount"
          [hasPreviousPage]="paged?.hasPreviousPage ?? false" [hasNextPage]="paged?.hasNextPage ?? false"
          (pageChange)="loadPage($event)" [showPagination]="true" [showNovo]="false" [alignRight]="true" />
      </div>
    </div>
    <app-list-loading-modal [visible]="loading" />
  `
}})
export class {name}ListComponent implements OnInit {{
  paged: PagedResult<{name}> | null = null;
  loading = false;
  page = 1;
  pageSize = 20;
  filterText = '';
  get totalCount(): number {{ return this.paged?.totalCount ?? 0; }}
  get totalPages(): number {{ return this.paged?.totalPages ?? 0; }}

  constructor(private service: {name}Service, private router: Router) {{}}

  ngOnInit(): void {{ this.loadPage(1); }}

  applyFilter(): void {{ this.page = 1; this.loadPage(1); }}

  loadPage(p: number): void {{
    this.page = p;
    this.loading = true;
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.service.getPaged(this.page, this.pageSize, f).subscribe({{
      next: (r) => {{ this.paged = r; this.loading = false; }},
      error: () => {{
        this.paged = {{ items: [], totalCount: 0, page: 1, pageSize: this.pageSize, totalPages: 0, hasPreviousPage: false, hasNextPage: false }};
        this.loading = false;
      }}
    }});
  }}

  goNovo(): void {{ this.router.navigate(['/{folder}', 'novo']); }}
  goEdit(item: {name}): void {{
    this.router.navigate(['/{folder}', {", ".join(f"item.{camel(c['Campo'])}" for c in pk_fields(entity))}]);
  }}
}}
"""
    write(FE / folder / f"{folder}-list.component.ts", content)


def gen_angular_service(entity):
    name = pascal(entity["Entidade"])
    folder = entity["Entidade"].lower()
    route = entity["Entidade"].lower()
    pk = pk_fields(entity)
    pk_camel = camel(pk[0]["Campo"])
    pk_args_ts = ", ".join(f"{camel(c['Campo'])}: number | string" for c in pk)
    pk_url_ts = "/".join(f"${{{camel(c['Campo'])}}}" for c in pk)
    pk_url_item_ts = "/".join(f"${{item.{camel(c['Campo'])}}}" for c in pk)

    content = f"""import {{ Injectable }} from '@angular/core';
import {{ HttpClient, HttpParams }} from '@angular/common/http';
import {{ Observable }} from 'rxjs';
import {{ environment }} from '../../../environments/environment';
import {{ PagedResult }} from '../../core/models/paged-result';
import {{ {name} }} from './{folder}.model';

@Injectable({{ providedIn: 'root' }})
export class {name}Service {{
  private base = `${{environment.apiUrl}}/{route}`;

  constructor(private http: HttpClient) {{}}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<{name}>> {{
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<{name}>>(this.base, {{ params }});
  }}

  getById({pk_args_ts}): Observable<{name}> {{
    return this.http.get<{name}>(`${{this.base}}/{pk_url_ts}`);
  }}

  create(item: {name}): Observable<{name}> {{
    return this.http.post<{name}>(this.base, item);
  }}

  update(item: {name}): Observable<void> {{
    return this.http.put<void>(`${{this.base}}/{pk_url_item_ts}`, item);
  }}

  delete({pk_args_ts}): Observable<void> {{
    return this.http.delete<void>(`${{this.base}}/{pk_url_ts}`);
  }}
}}
"""
    write(FE / folder / f"{folder}.service.ts", content)


def gen_angular_model(entity):
    name = pascal(entity["Entidade"])
    folder = entity["Entidade"].lower()
    lines = [f"export interface {name} {{"]
    seen = set()
    for c in entity["Campos"]:
        cn = camel(c["Campo"])
        if cn in seen:
            continue
        seen.add(cn)
        ct = "string"
        td = (c.get("TipoDado") or "").upper()
        if "INT" in td or "DECIMAL" in td or "TINYINT" in td:
            ct = "number"
        if "DATE" in td:
            ct = "string"
        lines.append(f"  {cn}?: {ct};")
    lines.append("}")
    write(FE / folder / f"{folder}.model.ts", "\n".join(lines))


SQL_EXTRA_TABLES = frozenset(
    {"PessoaEndereco", "PessoaUnidade", "FornecedorAtividade", "CobrancaDetalhe",
     "PermissionKey", "PerfilPermissao", "PessoaPermissaoExcecao"}
)

FK_ENTITY_ALIASES = {
    "PessoaFisica": "pessoafisica",
    "Pessoafisica": "pessoafisica",
}


def should_include_sql_table(entity):
    if entity.get("Gerar CRUD") == "Sim":
        return True
    return entity["Entidade"] in ("PerfilAcesso", "Pessoa") or entity["Entidade"] in SQL_EXTRA_TABLES


def merge_indice(a, b):
    parts = []
    seen = set()
    for raw in (a or "", b or ""):
        for p in re.split(r"[,;]\s*", raw):
            p = p.strip()
            if p and p.lower() not in seen:
                seen.add(p.lower())
                parts.append(p)
    return ", ".join(parts)


def is_sql_fk(campo):
    if not campo.get("EntidadeForeignKey"):
        return False
    idx = (campo.get("Indice") or "").lower()
    return "foreign key" in idx or "primary key e foreign key" in idx


def dedupe_campos(entity):
    order = []
    by_name = {}
    for c in entity["Campos"]:
        name = c["Campo"]
        if name not in by_name:
            by_name[name] = dict(c)
            order.append(name)
        else:
            cur = by_name[name]
            dup_fk_on_pk = is_pk(cur) and is_sql_fk(c)
            if not dup_fk_on_pk:
                cur["Indice"] = merge_indice(cur.get("Indice"), c.get("Indice"))
                if c.get("EntidadeForeignKey"):
                    cur["EntidadeForeignKey"] = c["EntidadeForeignKey"]
            if c.get("Obrigatorio") == "Sim":
                cur["Obrigatorio"] = "Sim"
    return [by_name[n] for n in order]


def resolve_fk_table(fk_entity):
    return FK_ENTITY_ALIASES.get(fk_entity, fk_entity)


def pk_field_names(entity):
    cols = dedupe_campos(entity)
    pks = [c["Campo"] for c in cols if is_pk(c)]
    if pks:
        return pks
    if entity["Entidade"] == "PessoaEndereco":
        return ["IdPessoa", "IdEndereco"]
    return []


def is_unique_field(campo):
    idx = (campo.get("Indice") or "").lower()
    return "unique" in idx and "primary" not in idx and "primay" not in idx


def is_regular_index_field(campo):
    idx = (campo.get("Indice") or "").strip().lower()
    return idx == "index"


def mysql_col_type(campo, pk_names):
    if is_auto_inc(campo) and campo["Campo"] in pk_names:
        return mysql_type(campo)
    td = campo.get("TipoDado") or ""
    if "auto incremental" in td.lower():
        t = td.upper().replace(" - AUTO INCREMENTAL", "").replace("AUTO INCREMENTAL", "").strip()
        fake = dict(campo)
        fake["TipoDado"] = t
        return mysql_type(fake)
    return mysql_type(campo)


def mysql_fk_storage_type(ref_campo, fk_campo):
    """Same storage class as referenced column, without AUTO_INCREMENT on the FK side."""
    fake = dict(ref_campo)
    td = (fake.get("TipoDado") or "").upper()
    if "AUTO INCREMENTAL" in td:
        fake["TipoDado"] = (
            td.replace(" - AUTO INCREMENTAL", "")
            .replace("AUTO INCREMENTAL", "")
            .strip()
        )
    sql = mysql_type(fake)
    sql = re.sub(r"\s+(NOT NULL|NULL)\s*$", "", sql.strip())
    if fk_campo.get("Obrigatorio") == "Sim":
        return f"{sql} NOT NULL"
    return f"{sql} NULL"


def mysql_col_type_for_table(campo, pk_names, entities_by_name):
    """FK columns use the same MySQL type as the referenced primary key (avoids error 3780)."""
    ref_ent = campo.get("EntidadeForeignKey")
    if ref_ent and is_sql_fk(campo) and campo["Campo"] not in pk_names:
        ref_table = resolve_fk_table(ref_ent)
        ref = entities_by_name.get(ref_ent) or entities_by_name.get(ref_table)
        if ref:
            ref_pk = pk_field_names(ref)
            ref_cols = dedupe_campos(ref)
            ref_campo = next((c for c in ref_cols if c["Campo"] == campo["Campo"]), None)
            if ref_campo is None and ref_pk:
                ref_campo = next((c for c in ref_cols if c["Campo"] == ref_pk[0]), None)
            if ref_campo is not None:
                return mysql_fk_storage_type(ref_campo, campo)
    return mysql_col_type(campo, pk_names)


def fk_ref_columns(ref_entity, entities_by_name):
    resolved = resolve_fk_table(ref_entity)
    ref = entities_by_name.get(ref_entity) or entities_by_name.get(resolved)
    if not ref:
        return []
    return pk_field_names(ref) or [dedupe_campos(ref)[0]["Campo"]]


def fk_local_columns(fk_campo, ref_cols, entity_col_names):
    """Maps referencing columns for simple and composite foreign keys."""
    if len(ref_cols) <= 1:
        return [fk_campo["Campo"]]
    fk_col = fk_campo["Campo"]
    local = []
    for ref_col in ref_cols:
        if ref_col in entity_col_names:
            local.append(ref_col)
        elif ref_col.startswith("Id") and fk_col.startswith("Id") and ref_col[2:] in fk_col:
            local.append(fk_col)
        elif ref_col.startswith("Codigo") and fk_col == ref_col:
            local.append(fk_col)
        elif fk_col == ref_col:
            local.append(fk_col)
        else:
            raise ValueError(
                f"FK {fk_col} -> ({', '.join(ref_cols)}): cannot map referenced column `{ref_col}`"
            )
    return local


def table_fk_dependencies(entity, entities_by_name):
    deps = set()
    for c in dedupe_campos(entity):
        ref_ent = c.get("EntidadeForeignKey")
        if ref_ent and is_sql_fk(c):
            deps.add(resolve_fk_table(ref_ent))
    deps.discard(entity["Entidade"])
    return deps


def sort_tables_for_fk(tables, entities_by_name):
    """Referenced tables appear before dependents (e.g. Local before GuardaEncomenda)."""
    by_name = {e["Entidade"]: e for e in tables}
    order_index = {e["Entidade"]: i for i, e in enumerate(tables)}
    in_degree = {e["Entidade"]: 0 for e in tables}
    graph = {e["Entidade"]: set() for e in tables}

    for e in tables:
        tn = e["Entidade"]
        for dep in table_fk_dependencies(e, entities_by_name):
            if dep in by_name and dep != tn:
                graph[dep].add(tn)
                in_degree[tn] += 1

    queue = sorted(
        (n for n, deg in in_degree.items() if deg == 0),
        key=lambda n: order_index[n],
    )
    sorted_names = []
    while queue:
        n = queue.pop(0)
        sorted_names.append(n)
        for m in sorted(graph[n], key=lambda x: order_index[x]):
            in_degree[m] -= 1
            if in_degree[m] == 0:
                queue.append(m)
                queue.sort(key=lambda x: order_index[x])

    for e in tables:
        if e["Entidade"] not in sorted_names:
            sorted_names.append(e["Entidade"])

    return [by_name[n] for n in sorted_names]


def gen_sql(entities):
    entities_by_name = {e["Entidade"]: e for e in entities}
    tables = sort_tables_for_fk(
        [e for e in entities if should_include_sql_table(e)],
        entities_by_name,
    )

    lines = [
        "-- AppCondominium schema gerado (PK, FK, UNIQUE, INDEX)",
        "CREATE DATABASE IF NOT EXISTS condominium CHARACTER SET utf8mb4;",
        "USE condominium;",
        "",
        "SET FOREIGN_KEY_CHECKS = 0;",
        "",
    ]

    for entity in tables:
        tn = entity["Entidade"]
        cols = dedupe_campos(entity)
        pk_names = pk_field_names(entity)
        col_defs = []
        unique_singles = []
        indexes = []
        fks = []

        for c in cols:
            col_defs.append(
                f"  `{c['Campo']}` {mysql_col_type_for_table(c, pk_names, entities_by_name)}"
            )

        if pk_names:
            col_defs.append(f"  PRIMARY KEY ({', '.join('`'+p+'`' for p in pk_names)})")

        for c in cols:
            if is_unique_field(c) and c["Campo"] not in pk_names:
                uq = f"uq_{tn}_{c['Campo']}"[:64]
                unique_singles.append(f"  UNIQUE KEY `{uq}` (`{c['Campo']}`)")

        for spec in entity.get("IndicesEspeciais", []):
            idx_name = (spec.get("Indice") or f"uq_{tn}").replace(" ", "_")[:64]
            idx_cols = spec.get("Campos") or []
            if not idx_cols:
                continue
            cols_sql = ", ".join(f"`{x}`" for x in idx_cols)
            tipo = (spec.get("Tipo") or "").lower()
            if "candidate" in tipo or "unique" in tipo:
                unique_singles.append(f"  UNIQUE KEY `{idx_name}` ({cols_sql})")
            else:
                indexes.append(f"  KEY `{idx_name}` ({cols_sql})")

        for c in cols:
            if is_regular_index_field(c) and c["Campo"] not in pk_names:
                iname = f"idx_{tn}_{c['Campo']}"[:64]
                indexes.append(f"  KEY `{iname}` (`{c['Campo']}`)")

        entity_col_names = {c["Campo"] for c in cols}
        for c in cols:
            ref_ent = c.get("EntidadeForeignKey")
            if not ref_ent or not is_sql_fk(c):
                continue
            ref_table = resolve_fk_table(ref_ent)
            ref_cols = fk_ref_columns(ref_ent, entities_by_name)
            if not ref_cols:
                continue
            local_cols = fk_local_columns(c, ref_cols, entity_col_names)
            if len(ref_cols) == 1:
                ref_sql = f"`{ref_table}` (`{ref_cols[0]}`)"
            else:
                ref_sql = f"`{ref_table}` ({', '.join('`'+x+'`' for x in ref_cols)})"
            fk_name = f"fk_{tn}_{c['Campo']}"[:64]
            local_sql = ", ".join(f"`{x}`" for x in local_cols)
            fks.append(
                f"  CONSTRAINT `{fk_name}` FOREIGN KEY ({local_sql}) REFERENCES {ref_sql}"
                f" ON UPDATE CASCADE ON DELETE RESTRICT"
            )

        constraints = col_defs + unique_singles + indexes + fks
        lines.append(f"CREATE TABLE IF NOT EXISTS `{tn}` (")
        lines.append(",\n".join(constraints))
        lines.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;")
        lines.append("")

        for r in entity.get("RegistrosAdicionadosAutomaticamente", []):
            desc = r.replace("'", "''")
            lines.append(f"INSERT IGNORE INTO `{tn}` (Descricao) VALUES ('{desc}');")

    lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    lines.append("")
    write(ROOT / "database" / "schema.sql", "\n".join(lines))


def gen_dbcontext(entities):
    sets = "\n".join(
        f"    public DbSet<{pascal(e['Entidade'])}> {pascal(e['Entidade'])} {{ get; set; }} = null!;"
        for e in entities
        if e.get("Gerar CRUD") == "Sim"
    )
    content = f"""using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext : DbContext
{{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {{ }}

{sets}
}}
"""
    write(SRC / "AppCondominium.Infrastructure" / "Persistence" / "AppDbContext.Generated.cs", content)
    gen_entity_keys(entities)
    gen_tenant_filters(entities)


def gen_entity_keys(entities):
    lines = []
    for e in entities:
        if e.get("Gerar CRUD") != "Sim":
            continue
        name = pascal(e["Entidade"])
        pks = pk_fields(e)
        if len(pks) == 1:
            lines.append(f"        modelBuilder.Entity<{name}>().HasKey(e => e.{pascal(pks[0]['Campo'])});")
        else:
            cols = ", ".join(f"e.{pascal(c['Campo'])}" for c in pks)
            lines.append(f"        modelBuilder.Entity<{name}>().HasKey(e => new {{ {cols} }});")
    body = "\n".join(lines)
    content = f"""using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{{
    partial void ConfigureEntityKeys(ModelBuilder modelBuilder)
    {{
{body}
    }}
}}
"""
    write(SRC / "AppCondominium.Infrastructure" / "Persistence" / "AppDbContext.Keys.Generated.cs", content)


def gen_tenant_filters(entities):
    lines = []
    for e in entities:
        if e.get("Gerar CRUD") != "Sim":
            continue
        name = pascal(e["Entidade"])
        escopo = escopo_tenant(e)
        if escopo == "Condominio" and has_id_condominio(e):
            lines.append(f"        modelBuilder.Entity<{name}>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);")
        elif escopo == "Indireto" and (e.get("VinculoTenant") or "") == "PessoaCondominio":
            lines.append(
                f"        modelBuilder.Entity<{name}>().HasQueryFilter(e =>"
                f" Set<PessoaCondominio>().Any(v => v.IdPessoa == e.IdPessoa && v.IdCondominio == CurrentTenantId)"
                f" || Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == CurrentTenantId)"
                f" || Set<Unidade>().Any(u => Set<PessoaUnidade>().Any(pu => pu.IdUnidade == u.IdUnidade && pu.IdPessoa == e.IdPessoa) && u.IdCondominio == CurrentTenantId));"
            )
        elif escopo == "Indireto" and e.get("VinculoTenant") == "Fornecedor":
            lines.append(
                f"        modelBuilder.Entity<{name}>().HasQueryFilter(e =>"
                f" Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == CurrentTenantId));"
            )
    body = "\n".join(lines)
    content = f"""using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{{
    partial void ConfigureTenantQueryFilters(ModelBuilder modelBuilder)
    {{
{body}
    }}
}}
"""
    write(SRC / "AppCondominium.Infrastructure" / "Persistence" / "AppDbContext.TenantFilters.Generated.cs", content)


def gen_di(entities):
    regs = "\n".join(
        f"        services.AddScoped<{pascal(e['Entidade'])}Repository>();"
        for e in entities
        if e.get("Gerar CRUD") == "Sim"
    )
    content = f"""using AppCondominium.Infrastructure.Repositories.Generated;
using Microsoft.Extensions.DependencyInjection;

namespace AppCondominium.Infrastructure;

public static partial class DependencyInjection
{{
    static partial void RegisterGeneratedRepositories(IServiceCollection services)
    {{
{regs}
    }}
}}
"""
    write(SRC / "AppCondominium.Infrastructure" / "DependencyInjection.Generated.cs", content)


def gen_angular_form(entity):
    name = pascal(entity["Entidade"])
    folder = entity["Entidade"].lower()
    pk_list = pk_fields(entity)
    fields = form_fields_for_entity(entity)
    fk_entities = []
    fk_services_added = set()
    perfil_lookup = False
    imports_extra = []
    load_fk_lines = []
    form_html = []
    model_init = []
    seen_model = set()

    if uses_endereco_widget(entity):
        imports_extra.append("import { EnderecoWidgetComponent } from '../../shared/endereco-widget/endereco-widget.component';")
        ent_fields = {c["Campo"] for c in entity["Campos"]}
        widget_lines = ['          <app-endereco-widget class="fg-col-12"', '            [(idEndereco)]="model.idEndereco"']
        if "NumeroEndereco" in ent_fields:
            widget_lines.append('            [(numero)]="model.numeroEndereco"')
        if "ComplementoEndereco" in ent_fields:
            widget_lines.append('            [(complemento)]="model.complementoEndereco"')
        widget_lines.append('            [readonly]="isEdit && !canEdit" />')
        form_html.append("\n".join(widget_lines) + "\n")

    for c in fields:
        cn = camel(c["Campo"])
        if cn in seen_model:
            continue
        seen_model.add(cn)
        label = c.get("RotuloCampo", c["Campo"])
        req = " *" if c.get("Obrigatorio") == "Sim" else ""
        ro = readonly_on_edit(entity, c)
        doc_t = documento_tipo(c)

        if c.get("Enum"):
            opts = "".join(f'<option [ngValue]="{i}">{e}</option>' for i, e in enumerate(c["Enum"]))
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <select [(ngModel)]="model.{cn}" name="{cn}" [disabled]="fieldDisabled('{cn}')" required>
              <option [ngValue]="null">Selecione…</option>
              {opts}
            </select>
          </div>"""))
            continue

        if is_fk(c) and c.get("EntidadeForeignKey") and not is_pk(c):
            fk_raw = c["EntidadeForeignKey"]
            fk = fk_service_name(fk_raw)
            fk_folder = fk_service_folder(fk_raw)
            if fk_folder == folder:
                continue
            if fk_raw == "PerfilAcesso":
                perfil_lookup = True
                form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <app-combobox-customizada
              [options]="fk_{cn}"
              [(value)]="model.{cn}"
              [disabled]="fieldDisabled('{cn}')" />
          </div>"""))
                continue
            fk_entities.append((fk, fk_folder, cn))
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <app-combobox-customizada
              [options]="fk_{cn}"
              [(value)]="model.{cn}"
              [disabled]="fieldDisabled('{cn}')" />
          </div>"""))
            continue

        if doc_t:
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <app-documento-input [(ngModel)]="model.{cn}" name="{cn}" tipo="{doc_t}" [disabled]="fieldDisabled('{cn}')" />
          </div>"""))
            continue

        td_up = (c.get("TipoDado") or "").upper()
        if "DATE" in td_up:
            tag = "app-campo-data-hora" if ("DATETIME" in td_up or "TIMESTAMP" in td_up) else "app-campo-data"
            req_attr = ' [required]="true"' if c.get("Obrigatorio") == "Sim" else ""
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <{tag} [(ngModel)]="model.{cn}" name="{cn}" [disabled]="fieldDisabled('{cn}')"{req_attr} />
          </div>"""))
            continue

        if "DECIMAL" in (c.get("TipoDado") or "").upper() or ("INT" in (c.get("TipoDado") or "").upper()):
            inp = "number"
            step = ' step="0.001"' if "DECIMAL" in (c.get("TipoDado") or "").upper() else ""
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <input type="{inp}" [(ngModel)]="model.{cn}" name="{cn}"{step} [readonly]="fieldDisabled('{cn}')" />
          </div>"""))
            continue

        if c["Campo"] == "CorPadrao":
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}</label>
            <input type="color" [(ngModel)]="model.{cn}" name="{cn}" />
          </div>"""))
            continue

        if c["Campo"] == "Senha":
            form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}</label>
            <input type="password" [(ngModel)]="model.{cn}" name="{cn}" autocomplete="new-password" />
          </div>"""))
            continue

        maxlen = ""
        m = re.search(r"VARCHAR\((\d+)\)", c.get("TipoDado", ""), re.I)
        if m:
            maxlen = f' maxlength="{m.group(1)}"'
        form_html.append(_span(c, f"""
          <div class="form-group">
            <label>{label}{req}</label>
            <input type="text" [(ngModel)]="model.{cn}" name="{cn}"{maxlen} [readonly]="fieldDisabled('{cn}')" />
          </div>"""))

    for fk, fk_folder, cn in fk_entities:
        svc_key = fk_folder
        if svc_key not in fk_services_added:
            fk_services_added.add(svc_key)
            imports_extra.append(
                f"import {{ {fk}Service }} from '../{fk_folder}/{fk_folder}.service';"
            )
        load_fk_lines.append(f"""
    this.{camel(fk)}Service.getPaged(1, 200).subscribe(r => {{
      this.fk_{cn} = r.items.map((x: any) => ({{
        value: x.{cn},
        label: this.fkLabel_{cn}(x)
      }}));
    }});""")

    pk_display = ""
    if any(is_auto_inc(c) for c in pk_list):
        pk_display = """
          <div class="form-group fg-col-2">
            <label>Id</label>
            <input type="text" [value]="isEdit ? pkDisplay : ''" readonly class="readonly" />
          </div>"""
    if pk_display:
        form_html.insert(0, pk_display)
    pk_names = {camel(c["Campo"]) for c in pk_list}
    form_body = "".join(
        html for _, html in sorted(enumerate(form_html), key=lambda iv: (_rank_form_html(iv[1], pk_names), iv[0]))
    )
    date_imports = []
    date_symbols = []
    if "app-campo-data-hora" in form_body:
        date_imports.append("import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';")
        date_symbols.append("CampoDataHoraComponent")
    if re.search(r"app-campo-data(?!-hora)", form_body):
        date_imports.append("import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';")
        date_symbols.append("CampoDataComponent")
    date_import_block = ("\n".join(date_imports) + "\n") if date_imports else ""
    date_symbol_list = (", " + ", ".join(date_symbols)) if date_symbols else ""
    host_class = "form-page form-page--wide" if (len(fields) > 6 or "app-campo-data-hora" in form_body) else "form-page"

    route_read = "\n    ".join(
        f"const {camel(c['Campo'])} = this.route.snapshot.paramMap.get('{camel(c['Campo'])}');"
        for c in pk_list
    )
    get_by_id_call = f"this.service.getById({', '.join(camel(c['Campo']) for c in pk_list)})"
    delete_args = ", ".join(f"this.model.{camel(c['Campo'])}!" for c in pk_list)
    delete_call = f"this.service.delete({delete_args})"
    pk_display_get = " + ' / ' + ".join(
        f"String(this.model.{camel(c['Campo'])})" for c in pk_list
    ) if pk_list else "''"

    fk_label_methods = []
    for fk, fk_folder, cn in fk_entities:
        fk_label_methods.append(f"""
  fkLabel_{cn}(x: any): string {{
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.id{fk} ?? '');
  }}""")

    fk_option_decls = "\n  ".join(f"fk_{cn}: ComboboxOption[] = [];" for _, _, cn in fk_entities)
    if perfil_lookup:
        fk_option_decls = (fk_option_decls + "\n  " if fk_option_decls else "") + "fk_idPerfil: ComboboxOption[] = [];"
        imports_extra.append("import { PerfilAcessoLookupService } from '../../core/services/perfil-acesso-lookup.service';")
        load_fk_lines.append("""
    this.perfilAcessoLookup.listar().subscribe(r => {
      this.fk_idPerfil = r.map(x => ({ value: x.idPerfil, label: x.descricao }));
    });""")
    fk_ctor_seen = set()
    fk_ctor_lines = []
    for fk, fk_folder, _ in fk_entities:
        if fk_folder in fk_ctor_seen:
            continue
        fk_ctor_seen.add(fk_folder)
        fk_ctor_lines.append(f"private {camel(fk)}Service: {fk}Service,")
    if perfil_lookup:
        fk_ctor_lines.append("private perfilAcessoLookup: PerfilAcessoLookupService,")
    fk_service_decls = "\n    ".join(fk_ctor_lines)

    hide_cond = has_id_condominio(entity) and hide_id_condominio_ui(entity)

    content = f"""import {{ Component, OnInit }} from '@angular/core';
import {{ CommonModule }} from '@angular/common';
import {{ FormsModule, NgForm }} from '@angular/forms';
import {{ ActivatedRoute, Router }} from '@angular/router';
import {{ {name}Service }} from './{folder}.service';
import {{ {name} }} from './{folder}.model';
import {{ ComboboxCustomizadaComponent, ComboboxOption }} from '../../shared/combobox-customizada/combobox-customizada.component';
import {{ DocumentoInputComponent }} from '../../shared/documento-input/documento-input.component';
import {{ PermissionService }} from '../../core/services/permission.service';
import {{ CondominioContextService }} from '../../core/services/condominio-context.service';
{date_import_block}{chr(10).join(imports_extra)}

@Component({{
  selector: 'app-{folder}-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent, DocumentoInputComponent{date_symbol_list}{', EnderecoWidgetComponent' if uses_endereco_widget(entity) else ''}],
  host: {{ class: '{host_class}' }},
  template: `
    <div class="form-layout">
      <h2>{{{{ isEdit ? 'Editar' : 'Novo' }}}} {entity.get("RotuloEntidade", name)}</h2>
      <div class="form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            {form_body}
          </div>
        </form>
      </div>
      <div class="actions form-actions">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Gravar</button>
        <button type="button" class="btn-cancelar" (click)="cancel()">Cancelar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
      <div class="msg-erro" *ngIf="formError">{{{{ formError }}}}</div>
    </div>
    <div class="confirm-overlay" *ngIf="showDeleteConfirm">
      <div class="confirm-modal">
        <p>Deseja realmente excluir este registro?</p>
        <button type="button" class="btn-cancelar" (click)="showDeleteConfirm=false">Cancelar</button>
        <button type="button" class="btn-excluir" (click)="confirmDelete()">Excluir</button>
      </div>
    </div>
  `
}})
export class {name}FormComponent implements OnInit {{
  model: {name} = {{}} as {name};
  isEdit = false;
  saving = false;
  formError = '';
  showDeleteConfirm = false;
  readonly permissionKey = '{entity["Entidade"].upper()}';
  canEdit = true;
  canDelete = true;
  {fk_option_decls}

  constructor(
    private service: {name}Service,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService{',' if fk_service_decls else ''}
    {fk_service_decls}
  ) {{
    this.refreshPermissions();
  }}

  get podeGravar(): boolean {{
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }}

  private refreshPermissions(): void {{
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }}

  get pkDisplay(): string {{ return {pk_display_get}; }}

  ngOnInit(): void {{
    {chr(10).join(load_fk_lines)}
    {route_read}
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {{
      this.isEdit = false;
      this.refreshPermissions();
      {"this.model.idCondominio = this.condominioCtx.idCondominio!;" if hide_cond else ""}
      return;
    }}
    if ({' && '.join(camel(c['Campo']) for c in pk_list)}) {{
      this.isEdit = true;
      this.refreshPermissions();
      {get_by_id_call}.subscribe({{
        next: (r) => this.model = r,
        error: () => this.formError = 'Registro não encontrado.'
      }});
    }}
  }}

  fieldDisabled(field: string): boolean {{
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [{','.join(repr(camel(c['Campo'])) for c in fields if readonly_on_edit(entity, c))}];
    return roFields.includes(field);
  }}

  submit(f: NgForm): void {{
    if (!f.valid) {{ this.formError = 'Preencha os campos obrigatórios.'; return; }}
    this.saving = true;
    this.formError = '';
    if (this.isEdit) {{
      this.service.update(this.model).subscribe({{
        next: () => this.router.navigate(['/{folder}']),
        error: (e: unknown) => {{ this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; }},
        complete: () => this.saving = false
      }});
    }} else {{
      this.service.create(this.model).subscribe({{
        next: () => this.router.navigate(['/{folder}']),
        error: (e: unknown) => {{ this.formError = (e as any)?.error?.title ?? (e as any)?.message ?? 'Erro ao gravar'; this.saving = false; }},
        complete: () => this.saving = false
      }});
    }}
  }}

  cancel(): void {{ this.router.navigate(['/{folder}']); }}

  confirmDelete(): void {{
    {delete_call}.subscribe({{ next: () => this.router.navigate(['/{folder}']) }});
  }}
{''.join(fk_label_methods)}
}}
"""
    write(FE / folder / f"{folder}-form.component.ts", content)


def gen_angular_routes_file(crud_entities):
    lines = []
    for e in crud_entities:
        folder = e["Entidade"].lower()
        name = pascal(e["Entidade"])
        suffix = route_path_suffix(e)
        lines.append(f"  {{ path: '{folder}', loadComponent: () => import('./features/{folder}/{folder}-list.component').then(m => m.{name}ListComponent) }},")
        lines.append(f"  {{ path: '{folder}/novo', loadComponent: () => import('./features/{folder}/{folder}-form.component').then(m => m.{name}FormComponent) }},")
        lines.append(f"  {{ path: '{folder}/{suffix}', loadComponent: () => import('./features/{folder}/{folder}-form.component').then(m => m.{name}FormComponent) }},")
    write(FE.parent / "entity-routes.generated.ts", "\n".join(lines))


def main():
    spec = load_spec()
    entities = spec["Entidades"]
    crud_entities = [e for e in entities if e.get("Gerar CRUD") == "Sim"]
    print(f"Gerando {len(crud_entities)} entidades CRUD...")
    for e in crud_entities:
        print(e["Entidade"])
        gen_entity(e)
        gen_repository(e)
        gen_controller(e)
        gen_angular_model(e)
        gen_angular_service(e)
        gen_angular_list(e)
        if e["Entidade"] not in ("UF", "Municipio", "Endereco", "ConfiguracaoCondominio"):
            gen_angular_form(e)
    gen_dbcontext(crud_entities)
    gen_di(crud_entities)
    gen_sql(entities)
    gen_angular_routes_file(crud_entities)
    print("Concluído.")


if __name__ == "__main__":
    main()
