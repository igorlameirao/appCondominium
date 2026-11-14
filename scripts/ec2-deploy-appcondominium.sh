#!/usr/bin/env bash
# Deploy AppCondominium na EC2 (API + frontend estático).
# Invocado via AWS SSM; não altera sco-api, Nginx, DNS ou MySQL.

set -euo pipefail

: "${DEPLOY_SHA:?DEPLOY_SHA obrigatório}"
: "${AWS_DEPLOY_BUCKET:?AWS_DEPLOY_BUCKET obrigatório}"

AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-2}"
API_DIR="${API_DIR:-/var/www/appcondominium-api}"
WEB_DIR="${WEB_DIR:-/var/www/appcondominium-web}"
SERVICE_NAME="${SERVICE_NAME:-appcondominium-api}"
SCO_API_SERVICE="${SCO_API_SERVICE:-sco-api}"

S3_PREFIX="s3://${AWS_DEPLOY_BUCKET}/releases/${DEPLOY_SHA}"
WORK_DIR="$(mktemp -d)"
API_ROLLBACK="${API_DIR}.rollback"
WEB_ROLLBACK="${WEB_DIR}.rollback"
PRESERVE_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR" "$PRESERVE_DIR"
}
trap cleanup EXIT

log() {
  printf '[appcondominium-deploy] %s\n' "$*"
}

fail() {
  log "ERRO: $*"
  exit 1
}

if systemctl list-unit-files --type=service 2>/dev/null | grep -q "^${SCO_API_SERVICE}\\.service"; then
  log "SCO detectado (${SCO_API_SERVICE}); este script não o modifica."
fi

for dep in aws unzip systemctl rsync; do
  command -v "$dep" >/dev/null 2>&1 || fail "dependência ausente: ${dep}"
done

[[ -d "$API_DIR" ]] || fail "diretório da API inexistente: ${API_DIR}"
[[ -d "$WEB_DIR" ]] || fail "diretório do frontend inexistente: ${WEB_DIR}"

download_artifacts() {
  local api_zip="${WORK_DIR}/api.zip"
  local web_zip="${WORK_DIR}/frontend.zip"

  log "Baixando artefatos de ${S3_PREFIX}"
  aws s3 cp "${S3_PREFIX}/api.zip" "$api_zip"
  aws s3 cp "${S3_PREFIX}/frontend.zip" "$web_zip"
  [[ -s "$api_zip" ]] || fail "api.zip vazio ou ausente"
  [[ -s "$web_zip" ]] || fail "frontend.zip vazio ou ausente"

  unzip -tq "$api_zip" || fail "api.zip corrompido"
  unzip -tq "$web_zip" || fail "frontend.zip corrompido"

  mkdir -p "${WORK_DIR}/api" "${WORK_DIR}/web"
  unzip -q "$api_zip" -d "${WORK_DIR}/api"
  unzip -q "$web_zip" -d "${WORK_DIR}/web"

  [[ -f "${WORK_DIR}/api/AppCondominium.API.dll" ]] || fail "AppCondominium.API.dll não encontrado no pacote"
  [[ -f "${WORK_DIR}/web/index.html" ]] || fail "index.html não encontrado no pacote do frontend"
}

preserve_server_files() {
  local names=(
    "appsettings.Production.local.json"
    "appsettings.local.json"
    ".env"
  )
  for name in "${names[@]}"; do
  if [[ -f "${API_DIR}/${name}" ]]; then
      cp -a "${API_DIR}/${name}" "${PRESERVE_DIR}/"
      log "Preservando ${name}"
    fi
  done
}

backup_current_release() {
  log "Criando rollback de ${API_DIR} e ${WEB_DIR}"
  rm -rf "$API_ROLLBACK" "$WEB_ROLLBACK"
  rsync -a --delete "${API_DIR}/" "${API_ROLLBACK}/"
  rsync -a --delete "${WEB_DIR}/" "${WEB_ROLLBACK}/"
}

restore_rollback() {
  log "Restaurando versão anterior"
  [[ -d "$API_ROLLBACK" ]] || fail "backup da API inexistente; rollback manual necessário"
  [[ -d "$WEB_ROLLBACK" ]] || fail "backup do frontend inexistente; rollback manual necessário"

  rsync -a --delete "${API_ROLLBACK}/" "${API_DIR}/"
  rsync -a --delete "${WEB_ROLLBACK}/" "${WEB_DIR}/"

  if systemctl list-unit-files --type=service 2>/dev/null | grep -q "^${SERVICE_NAME}\\.service"; then
    systemctl restart "$SERVICE_NAME"
    systemctl is-active --quiet "$SERVICE_NAME" || fail "serviço ${SERVICE_NAME} inativo após rollback"
  fi
  log "Rollback concluído"
}

publish_api() {
  rsync -a --delete "${WORK_DIR}/api/" "${API_DIR}/"
  if compgen -G "${PRESERVE_DIR}/*" >/dev/null; then
    cp -a "${PRESERVE_DIR}/." "${API_DIR}/"
  fi
}

publish_web() {
  rsync -a --delete "${WORK_DIR}/web/" "${WEB_DIR}/"
}

restart_api_service() {
  if ! systemctl list-unit-files --type=service 2>/dev/null | grep -q "^${SERVICE_NAME}\\.service"; then
    fail "unit systemd ${SERVICE_NAME}.service não encontrada"
  fi
  log "Reiniciando apenas ${SERVICE_NAME}"
  systemctl restart "$SERVICE_NAME"
  sleep 2
  systemctl is-active --quiet "$SERVICE_NAME" || fail "${SERVICE_NAME} não está ativo após o restart"
  systemctl status "$SERVICE_NAME" --no-pager -l || true
}

main() {
  download_artifacts
  preserve_server_files
  backup_current_release

  if ! publish_api; then
    restore_rollback
    fail "falha ao publicar API"
  fi
  if ! publish_web; then
    restore_rollback
    fail "falha ao publicar frontend"
  fi

  if ! restart_api_service; then
    restore_rollback
    fail "falha ao reiniciar a API"
  fi

  log "Deploy concluído (SHA ${DEPLOY_SHA})"
}

main "$@"
