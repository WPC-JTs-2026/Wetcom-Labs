#!/usr/bin/env bash
#
# deploy.sh
#
# Full deployment script for Wetcom Labs.
# Generates stage-specific terraform.tfvars.json from a single global.tfvars.json,
# performs validation, and runs Terraform steps (init, plan, apply) for each stage.
#

set -euo pipefail

# ==========================================
# Configurable Variables
# ==========================================
PYTHON_BIN="python3"
GENERATE_SCRIPT="generate_tfvars.py"
GLOBAL_VARS_NAME="global.tfvars.json"
MAX_ATTEMPTS=2
RETRY_DELAY=30

# Locate paths relative to script location
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "${ROOT_DIR}")"
GLOBAL_VARS_PATH="${ROOT_DIR}/${GLOBAL_VARS_NAME}"
GENERATE_SCRIPT_PATH="${PARENT_DIR}/${GENERATE_SCRIPT}"

# ==========================================
# Initial Validation
# ==========================================
if [ ! -f "${GLOBAL_VARS_PATH}" ]; then
  echo "ERROR: Global variables file not found at: ${GLOBAL_VARS_PATH}"
  exit 1
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "ERROR: '${PYTHON_BIN}' is required but not found in PATH."
  exit 1
fi

# ==========================================
# Step 0: Generate stage-specific tfvars
# ==========================================
echo "==> Generating terraform.tfvars.json files from ${GLOBAL_VARS_NAME}..."
if ! "${PYTHON_BIN}" "${GENERATE_SCRIPT_PATH}" "${GLOBAL_VARS_PATH}"; then
  echo "ERROR: Failed to run ${GENERATE_SCRIPT_PATH}"
  exit 1
fi

# ==========================================
# Helper: Validate stage requirements
# ==========================================
validate_stage_requirements() {
  local stage="$1"
  local stage_config_path="${ROOT_DIR}/${stage}/terraform.tfvars.json"

  if [ ! -f "${stage_config_path}" ]; then
    echo "ERROR: Config file not found: ${stage_config_path}"
    return 1
  fi

  resolve_path() {
    local path="$1"
    local stage_dir="$2"
    
    # If absolute path, return it directly
    if [[ "$path" = /* ]]; then
      echo "$path"
      return 0
    fi
    
    # If relative path, try ROOT_DIR first, then stage_dir
    if [ -e "${ROOT_DIR}/${path}" ]; then
      echo "${ROOT_DIR}/${path}"
    elif [ -e "${stage_dir}/${path}" ]; then
      echo "${stage_dir}/${path}"
    else
      echo "$path"  # Return original path if not found
    fi
  }

  case "${stage}" in
    stage1)
      echo "==> Validating requirements for stage1..."
      local esxi_ovf_path
      esxi_ovf_path=$("${PYTHON_BIN}" -c "import json; cfg=json.load(open('${stage_config_path}')); print(cfg.get('esxi_ovf_local_path', ''))")
      
      if [ -z "${esxi_ovf_path}" ]; then
        echo "ERROR: esxi_ovf_local_path is not configured in stage1"
        return 1
      fi

      esxi_ovf_path=$(resolve_path "${esxi_ovf_path}" "${ROOT_DIR}/stage1")

      if [ ! -f "${esxi_ovf_path}" ]; then
        echo "ERROR: ESXi OVF template not found at: ${esxi_ovf_path}"
        echo "  Please ensure it is placed in:"
        echo "    - ${ROOT_DIR}/.templates/wpc-esxi-8u3-template.ova"
        echo "    - ${ROOT_DIR}/stage1/.templates/wpc-esxi-8u3-template.ova"
        return 1
      fi
      echo "  ✓ ESXi OVF template found: ${esxi_ovf_path}"
      ;;

    stage2)
      echo "==> Validating requirements for stage2..."
      local vcsa_extract_path
      vcsa_extract_path=$("${PYTHON_BIN}" -c "import json; cfg=json.load(open('${stage_config_path}')); print(cfg.get('vcsa_exctract_path', ''))")
      
      if [ -z "${vcsa_extract_path}" ]; then
        echo "ERROR: vcsa_exctract_path is not configured in stage2"
        return 1
      fi

      vcsa_extract_path=$(resolve_path "${vcsa_extract_path}" "${ROOT_DIR}/stage2")

      if [ ! -d "${vcsa_extract_path}" ]; then
        echo "ERROR: vCenter extraction directory not found: ${vcsa_extract_path}"
        echo "  Please extract the vCenter ISO to:"
        echo "    - ${vcsa_extract_path}"
        echo "    - ${ROOT_DIR}/stage2/vcsa_iso_extract"
        return 1
      fi

      # Check for either vcsa-deploy or vcsa-deploy.bin
      if [ ! -f "${vcsa_extract_path}/vcsa-cli-installer/lin64/vcsa-deploy" ] && \
         [ ! -f "${vcsa_extract_path}/vcsa-cli-installer/lin64/vcsa-deploy.bin" ]; then
        echo "ERROR: CLI installer not found in: ${vcsa_extract_path}/vcsa-cli-installer/lin64/"
        return 1
      fi
      echo "  ✓ vCenter extraction directory validated successfully"
      ;;

    stage3)
      echo "==> Validating requirements for stage3..."
      echo "  ✓ No external file requirements for stage3"
      ;;

    *)
      echo "ERROR: Unknown stage: ${stage}"
      return 1
      ;;
  esac

  return 0
}

# ==========================================
# Helper: Retry failure handler
# ==========================================
handle_failure() {
  local stage="$1"
  local attempt="$2"
  
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    echo "ERROR: Stage ${stage} failed after ${MAX_ATTEMPTS} attempts."
    return 1
  fi
  
  echo "==> Warning: Attempt ${attempt} failed. Waiting ${RETRY_DELAY} seconds before retrying..."
  sleep "${RETRY_DELAY}"
  return 0
}

# ==========================================
# Deployment Execution Engine
# ==========================================
deploy_stage() {
  local stage="$1"
  local stage_dir="${ROOT_DIR}/${stage}"
  
  echo
  echo "=========================================================="
  echo " Deploying Stage: ${stage}"
  echo "=========================================================="

  if ! validate_stage_requirements "${stage}"; then
    echo "ERROR: Validation failed for stage ${stage}"
    exit 1
  fi

  pushd "${stage_dir}" >/dev/null

  local attempt=1
  while true; do
    # Clean previous state files if retrying or restarting (preserve existing behavior)
    rm -f *.tfstate*

    if [ "${attempt}" -gt 1 ]; then
      echo "==> Retrying ${stage} (Attempt ${attempt}/${MAX_ATTEMPTS})..."
    fi

    # 1. Init Step
    echo "==> [${stage}] Step 1: init"
    if ! terraform init -input=false; then
      handle_failure "${stage}" "${attempt}" || exit 1
      attempt=$((attempt + 1))
      continue
    fi

    # 2. Plan Step
    echo "==> [${stage}] Step 2: plan"
    if ! terraform plan -input=false; then
      handle_failure "${stage}" "${attempt}" || exit 1
      attempt=$((attempt + 1))
      continue
    fi

    # 3. Apply Step
    echo "==> [${stage}] Step 3: apply"
    if ! terraform apply -auto-approve -input=false; then
      handle_failure "${stage}" "${attempt}" || exit 1
      attempt=$((attempt + 1))
      continue
    fi

    echo "==> [${stage}] Completed successfully."
    break
  done

  popd >/dev/null
}

# ==========================================
# Stage Blocks (Init -> Plan -> Apply)
# ==========================================

# --- STAGE 1 ---
deploy_stage "stage1"

# --- STAGE 2 ---
deploy_stage "stage2"

# --- STAGE 3 ---
deploy_stage "stage3"

echo
echo "==> All deployment stages completed successfully."
