#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGES=(stage1 stage2 stage3)

echo "==> Generando archivos terraform.tfvars.json desde global.tfvars.json..."
if command -v python3 &>/dev/null; then
  python3 "${ROOT_DIR}/../generate_tfvars.py" "${ROOT_DIR}/global.tfvars.json"
elif command -v python &>/dev/null; then
  python "${ROOT_DIR}/../generate_tfvars.py" "${ROOT_DIR}/global.tfvars.json"
else
  echo "ERROR: Se requiere Python para generar las variables."
  exit 1
fi

for stage in "${STAGES[@]}"; do
  echo
  echo "==> Ejecutando deploy para ${stage}"
  pushd "${ROOT_DIR}/${stage}" >/dev/null

  max_attempts=2
  attempt=1
  while true; do
    if [ "${attempt}" -gt 1 ]; then
      echo "Intento ${attempt}/${max_attempts} para ${stage}"
    fi
    if terraform init -input=false && terraform apply -auto-approve; then
      echo "==> Completado ${stage}"
      break
    fi

    if [ "${attempt}" -ge "${max_attempts}" ]; then
      echo "==> ${stage} falló después de ${attempt} intentos"
      popd >/dev/null
      exit 1
    fi

    echo "==> ${stage} falló. Esperando 30s antes de reintentar..."
    sleep 30
    attempt=$((attempt + 1))
  done

  popd >/dev/null
done
