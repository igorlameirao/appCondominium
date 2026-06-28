# -*- coding: utf-8 -*-
"""Valida MDs/md_appCondominium.json contra o JSON Schema e regras cruzadas."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "MDs" / "md_appCondominium.json"
SCHEMA_PATH = ROOT / "MDs" / "md_appCondominium.schema.json"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def validate_cross_rules(spec: dict) -> list[str]:
    errors: list[str] = []
    entities = spec["EspecificacaoSistema"]["Entidades"]
    by_name = {e["Entidade"]: e for e in entities}
    names = set(by_name)

    for entity in entities:
        ent = entity["Entidade"]
        campo_names = [c["Campo"] for c in entity.get("Campos", [])]
        dupes = {n for n in campo_names if campo_names.count(n) > 1}
        if dupes:
            errors.append(f"{ent}: campos duplicados: {', '.join(sorted(dupes))}")

        pks = [c for c in entity.get("Campos", []) if "primary" in (c.get("Indice") or "").lower() or "primay" in (c.get("Indice") or "").lower()]
        if not pks:
            errors.append(f"{ent}: nenhuma Primary Key definida")
        elif len(pks) > 1:
            errors.append(f"{ent}: mais de uma Primary Key: {[c['Campo'] for c in pks]}")

        for c in entity.get("Campos", []):
            fk_ent = c.get("EntidadeForeignKey")
            if fk_ent and fk_ent not in names:
                errors.append(f"{ent}.{c['Campo']}: EntidadeForeignKey '{fk_ent}' não existe")

        for idx in entity.get("IndicesEspeciais", []):
            for col in idx.get("Campos", []):
                if col not in campo_names:
                    errors.append(f"{ent}: índice '{idx.get('Indice')}' referencia campo inexistente '{col}'")

        if entity.get("Gerar CRUD") == "Sim" and not entity.get("PerfisAcesso"):
            errors.append(f"{ent}: Gerar CRUD=Sim sem PerfisAcesso")

    return errors


def main() -> int:
    try:
        import jsonschema
    except ImportError:
        print("Instale: pip install jsonschema", file=sys.stderr)
        return 2

    spec = load_json(SPEC_PATH)
    schema = load_json(SCHEMA_PATH)

    validator = jsonschema.Draft202012Validator(schema)
    schema_errors = sorted(validator.iter_errors(spec), key=lambda e: list(e.path))

    cross_errors = validate_cross_rules(spec)

    if not schema_errors and not cross_errors:
        print(f"OK: {SPEC_PATH.name} válido.")
        return 0

    if schema_errors:
        print("Erros de schema:")
        for err in schema_errors:
            path = "/".join(str(p) for p in err.path) or "(raiz)"
            print(f"  - {path}: {err.message}")

    if cross_errors:
        print("Erros de consistência:")
        for msg in cross_errors:
            print(f"  - {msg}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
