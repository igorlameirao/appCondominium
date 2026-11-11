"""Validates FOREIGN KEY definitions in database/schema.sql before MySQL apply."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "database" / "schema.sql"

CREATE_TABLE = re.compile(
    r"CREATE TABLE IF NOT EXISTS `(?P<table>[^`]+)` \((?P<body>.*?)\) ENGINE=InnoDB",
    re.S | re.I,
)
COL_LINE = re.compile(
    r"^\s*`(?P<name>[^`]+)`\s+(?P<type>.+?)\s*,?\s*$",
    re.I,
)
FK_LINE = re.compile(
    r"CONSTRAINT `(?P<name>[^`]+)` FOREIGN KEY \((?P<local>[^)]+)\)\s+"
    r"REFERENCES `(?P<ref_table>[^`]+)` \((?P<ref>[^)]+)\)",
    re.I,
)

# PK composta: FKs externas devem usar todas as colunas (exceto tabelas de junção abaixo).
COMPOSITE_PK = {
    "PessoaEndereco": ("IdPessoa", "IdEndereco"),
    "FornecedorAtividade": ("IdPessoa", "CodigoAtividadeEconomica"),
    "PessoaCondominio": ("IdPessoa", "IdCondominio"),
    "DadosBancarios": ("Conta", "CodigoBanco", "Agencia"),
    "TipoMaterialCondominio": ("IdTipoMaterial", "IdCondominio"),
    "PerfilPermissao": ("IdPerfil", "IdPermissionKey"),
    "PessoaPermissaoExcecao": ("IdPessoa", "IdCondominio", "IdPermissionKey"),
    "PessoaUnidade": ("IdPessoa", "IdUnidade"),
}

# Junção: duas FKs simples para as entidades pai (padrão válido no schema).
JUNCTION_DUAL_FK = frozenset(
    {
        "PessoaEndereco",
        "FornecedorAtividade",
        "TipoMaterialCondominio",
        "PerfilPermissao",
        "PessoaPermissaoExcecao",
    }
)


def split_cols(raw: str) -> list[str]:
    return [c.strip().strip("`") for c in raw.split(",")]


def normalize_type(sql_type: str) -> str:
    t = " ".join(sql_type.upper().split())
    for token in (" NOT NULL", " NULL", " AUTO_INCREMENT"):
        t = t.replace(token, "")
    return t.strip()


def parse_columns(body: str) -> dict[str, str]:
    cols: dict[str, str] = {}
    for line in body.splitlines():
        line = line.rstrip()
        if not line.strip().startswith("`"):
            continue
        upper = line.upper()
        if any(
            kw in upper
            for kw in ("PRIMARY KEY", "CONSTRAINT", " UNIQUE KEY", " KEY `", " KEY idx_", " FOREIGN KEY")
        ):
            continue
        m = COL_LINE.match(line)
        if not m:
            continue
        cols[m.group("name")] = normalize_type(m.group("type"))
    return cols


def parse_schema(text: str) -> tuple[dict[str, dict[str, str]], list[dict]]:
    tables: dict[str, dict[str, str]] = {}
    fks: list[dict] = []

    for m in CREATE_TABLE.finditer(text):
        table = m.group("table")
        body = m.group("body")
        tables[table] = parse_columns(body)
        for fm in FK_LINE.finditer(body):
            fks.append(
                {
                    "name": fm.group("name"),
                    "table": table,
                    "local_cols": split_cols(fm.group("local")),
                    "ref_table": fm.group("ref_table"),
                    "ref_cols": split_cols(fm.group("ref")),
                }
            )

    return tables, fks


def validate() -> list[str]:
    text = SCHEMA.read_text(encoding="utf-8")
    tables, fks = parse_schema(text)
    errors: list[str] = []

    composite_fks = [fk for fk in fks if len(fk["ref_cols"]) > 1]

    for fk in fks:
        if len(fk["local_cols"]) != len(fk["ref_cols"]):
            errors.append(
                f"{fk['table']}.{fk['name']}: colunas FK {fk['local_cols']} != "
                f"referência {fk['ref_cols']} em `{fk['ref_table']}`"
            )
            continue

        ref_table = fk["ref_table"]
        if ref_table not in tables:
            errors.append(f"{fk['table']}.{fk['name']}: tabela `{ref_table}` não existe no schema")
            continue

        for lc, rc in zip(fk["local_cols"], fk["ref_cols"]):
            if lc not in tables[fk["table"]]:
                errors.append(f"{fk['table']}.{fk['name']}: coluna local `{lc}` inexistente")
                continue
            if rc not in tables[ref_table]:
                errors.append(
                    f"{fk['table']}.{fk['name']}: coluna `{ref_table}`.`{rc}` inexistente"
                )
                continue
            lt = tables[fk["table"]][lc]
            rt = tables[ref_table][rc]
            if lt != rt:
                errors.append(
                    f"{fk['table']}.{fk['name']}: `{lc}` ({lt}) incompatible com "
                    f"`{ref_table}`.`{rc}` ({rt})"
                )

    for fk in fks:
        pk = COMPOSITE_PK.get(fk["ref_table"])
        if not pk or fk["ref_table"] in JUNCTION_DUAL_FK:
            continue
        if tuple(fk["ref_cols"]) == pk:
            continue
        if len(fk["ref_cols"]) == 1 and fk["ref_cols"][0] in pk:
            errors.append(
                f"{fk['table']}.{fk['name']}: FK parcial para `{fk['ref_table']}` "
                f"(PK {pk}) — use FK composta com {pk}"
            )

    expected_composite = {
        ("AlocacaoMaterial", "fk_AlocacaoMaterial_IdPessoa"): ("IdPessoa", "IdCondominio"),
        ("EntradaSaidaMaterialConsumo", "fk_EntradaSaidaMaterialConsumo_IdPessoa"): (
            "IdPessoa",
            "IdCondominio",
        ),
        ("GuardaEncomenda", "fk_GuardaEncomenda_IdPessoaSaida"): ("IdPessoaSaida", "IdUnidade"),
    }
    by_name = {(fk["table"], fk["name"]): fk for fk in fks}
    for key, local in expected_composite.items():
        fk = by_name.get(key)
        if not fk:
            errors.append(f"FK composta ausente: {key[0]}.{key[1]}")
        elif tuple(fk["local_cols"]) != local:
            errors.append(
                f"{key[0]}.{key[1]}: esperado local {local}, encontrado {tuple(fk['local_cols'])}"
            )

    if not composite_fks:
        errors.append("Nenhuma FK composta encontrada — revisão incompleta.")

    return errors


def main() -> int:
    if not SCHEMA.is_file():
        print(f"Arquivo não encontrado: {SCHEMA}", file=sys.stderr)
        return 1
    errors = validate()
    if errors:
        print("Falhas na validação de FKs:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"OK: {SCHEMA.name} — FKs simples e compostas consistentes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
