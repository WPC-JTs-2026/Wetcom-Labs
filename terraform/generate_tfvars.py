#!/usr/bin/env python3
"""
generate_tfvars.py

Generates stage-specific terraform.tfvars.json files from a single global.tfvars.json.
This ensures a single source of truth for variables across all deployment stages.
"""

import sys
import os
import json
import re
from typing import Dict, Any, Set, Callable, Union

# Default paths relative to the terraform/ directory
DEFAULT_GLOBAL_TFVARS_PATH = "global.tfvars.json"
STAGES = ["stage1", "stage2", "stage3"]

# Dictionaries at the top of the file mapping TF variables to global keys or custom loaders
STAGE1_MAPPING: Dict[str, Union[str, Callable[[Dict[str, Any]], Any]]] = {
    "vsphere_server": "playground_vcenter.vsphere_server",
    "vsphere_user": "playground_vcenter.vsphere_user",
    "vsphere_password": "playground_vcenter.vsphere_password",
    "datacenter_name": "playground_vcenter.datacenter_name",
    "cluster_name": "playground_vcenter.cluster_name",
    "datastore_name": "playground_vcenter.datastore_name",
    "network_name": "playground_vcenter.network_name",
    "vm_domain": "playground_vcenter.vm_domain",
    "vm_folder_path": "playground_vcenter.vm_folder_path",
    "resource_pool_name": "playground_vcenter.resource_pool_name",
    "esxi_ovf_local_path": "local_files.esxi_ovf_local_path",
    "esxi_name_prefix": "esxi_hosts.esxi_name_prefix",
    "esxi_deploy_host": "esxi_hosts.esxi_deploy_host",
    "esxi_netmask": "common_network.network_netmask",
    "esxi_gateway": "common_network.network_gateway",
    "esxi_dns": "common_network.network_dns",
    "esxi_password": "esxi_hosts.password",
    "deploy_truenas": "truenas.deploy",
    "truenas_template_name": "truenas.template_name",
    "truenas_vm_prefix": "truenas.vm_prefix",
    "truenas_vm_ip": "truenas.ip",
    "truenas_vm_gateway": "common_network.network_gateway",
    "truenas_vm_netmask": lambda g: 24,
    "esxi_hosts_info": lambda g: [
        {
            "user": g.get("esxi_hosts", {}).get("user"),
            "password": g.get("esxi_hosts", {}).get("password"),
            "address": host.get("address")
        }
        for host in g.get("esxi_hosts", {}).get("info", [])
    ]
}

STAGE2_MAPPING: Dict[str, Union[str, Callable[[Dict[str, Any]], Any]]] = {
    "esxi_deploy_host": lambda g: g.get("esxi_hosts", {}).get("info", [{}])[0].get("address"),
    "esxi_password": "esxi_hosts.password",
    "vcsa_netmask": "nested_vcenter.vcsa_netmask",
    "vcsa_gateway": "nested_vcenter.vcsa_gateway",
    "vcsa_dns": "nested_vcenter.vcsa_dns",
    "vcsa_ip": "nested_vcenter.vcsa_ip",
    "vcsa_fqdn": "nested_vcenter.vcsa_fqdn",
    "vcsa_password": "nested_vcenter.vcsa_password",
    "vcsa_exctract_path": "local_files.vcsa_exctract_path",
}

STAGE3_MAPPING: Dict[str, Union[str, Callable[[Dict[str, Any]], Any]]] = {
    "vsphere_server": "nested_vcenter.vcsa_ip",
    "vsphere_user": "nested_vcenter.vsphere_user",
    "vsphere_password": "nested_vcenter.vsphere_password",
    "cluster_name": "playground_vcenter.cluster_name",
    "truenas_ip": "truenas.ip",
    "truenas_chap_user": "truenas.chap_user",
    "truenas_chap_pass": "truenas.chap_pass",
    "iscsi_enabled": "truenas.iscsi_enabled",
    "vswitch_name": "truenas.vswitch_name",
    "vswitch_uplink": "truenas.vswitch_uplink",
    "network_portgroup": "truenas.network_portgroup",
    "vmkernel_interface": "truenas.vmkernel_interface",
    "nfs_enabled": "truenas.nfs_enabled",
    "nfs_datastore_name": "truenas.nfs_datastore_name",
    "nfs_remote_path": "truenas.nfs_remote_path",
    "nfs_access_mode": "truenas.nfs_access_mode",
    "hosts_info": lambda g: [
        {
            "user": g.get("esxi_hosts", {}).get("user"),
            "password": g.get("esxi_hosts", {}).get("password"),
            "address": host.get("address")
        }
        for host in g.get("esxi_hosts", {}).get("info", [])
    ],
    "iscsi_network_config": lambda g: [
        {
            "host_address": host.get("address"),
            "iscsi_ip": host.get("iscsi_ip"),
            "iscsi_netmask": g.get("common_network", {}).get("network_netmask")
        }
        for host in g.get("esxi_hosts", {}).get("info", [])
    ]
}

STAGE_MAPPINGS: Dict[str, Dict[str, Union[str, Callable[[Dict[str, Any]], Any]]]] = {
    "stage1": STAGE1_MAPPING,
    "stage2": STAGE2_MAPPING,
    "stage3": STAGE3_MAPPING
}


def get_nested_val(data: Dict[str, Any], path: str) -> Any:
    """Resolves a dot-separated path in a nested dictionary."""
    parts = path.split('.')
    current = data
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def parse_variables_tf(variables_tf_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Parses variables.tf and returns a dictionary of declared variables,
    indicating whether each is required (i.e. has no default value).
    """
    if not os.path.isfile(variables_tf_path):
        raise FileNotFoundError(f"Variables file not found: {variables_tf_path}")
        
    with open(variables_tf_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    variables = {}
    matches = list(re.finditer(r'\bvariable\s+"([^"]+)"\s*\{', content))
    for match in matches:
        var_name = match.group(1)
        start_idx = match.end()
        
        # Balance braces to extract the content of the variable definition block
        brace_count = 1
        end_idx = start_idx
        while brace_count > 0 and end_idx < len(content):
            char = content[end_idx]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
            end_idx += 1
            
        block_content = content[start_idx:end_idx-1]
        
        # Clean comments to prevent false positives in "default" matching
        lines = []
        for line in block_content.splitlines():
            line_clean = line.split('#')[0].split('//')[0].strip()
            if line_clean:
                lines.append(line_clean)
        clean_block = "\n".join(lines)
        
        # Detect if 'default' attribute is set
        has_default = bool(re.search(r'\bdefault\s*=', clean_block))
        
        variables[var_name] = {
            "required": not has_default
        }
        
    return variables


def generate_stage_tfvars(
    stage: str,
    global_vars: Dict[str, Any],
    variables_tf_path: str,
    output_path: str
) -> None:
    """Generates the terraform.tfvars.json file for a given stage."""
    declared_vars = parse_variables_tf(variables_tf_path)
    mapping = STAGE_MAPPINGS.get(stage)
    if mapping is None:
        raise ValueError(f"No mapping defined for stage: {stage}")
        
    stage_vars: Dict[str, Any] = {}
    
    for var_name, info in declared_vars.items():
        is_required = info["required"]
        
        if var_name in mapping:
            map_target = mapping[var_name]
            if callable(map_target):
                val = map_target(global_vars)
            else:
                val = get_nested_val(global_vars, map_target)
                
            if val is not None:
                stage_vars[var_name] = val
            elif is_required:
                raise ValueError(
                    f"Required variable '{var_name}' in stage '{stage}' "
                    f"resolved to None/missing in global vars using key '{map_target}'."
                )
        elif is_required:
            raise ValueError(
                f"Required variable '{var_name}' in stage '{stage}' "
                f"has no mapping defined in STAGE_MAPPINGS and lacks a default value."
            )
            
    # Write the tfvars file in an idempotent manner
    # Sort keys for deterministic output
    json_data = json.dumps(stage_vars, indent=2, sort_keys=True)
    
    # Read existing content if file exists to check if update is needed
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()
        if existing_content == json_data:
            print(f"[{stage}] Output {output_path} is up-to-date (no change).")
            return
            
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(json_data)
    print(f"[{stage}] Generated {output_path}")


def main() -> None:
    """Main execution entry point."""
    # First CLI argument is the path to global.tfvars.json (optional)
    # Second is an optional stage restriction (if deploy.sh wants to generate one by one)
    global_vars_path = DEFAULT_GLOBAL_TFVARS_PATH
    stage_filter = None
    
    if len(sys.argv) > 1:
        if sys.argv[1] in STAGES:
            # Usage: python3 generate_tfvars.py [stage] [global_tfvars_path]
            stage_filter = sys.argv[1]
            if len(sys.argv) > 2:
                global_vars_path = sys.argv[2]
        else:
            # Usage: python3 generate_tfvars.py [global_tfvars_path]
            global_vars_path = sys.argv[1]
            
    if not os.path.isfile(global_vars_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        alternative_path = os.path.join(script_dir, global_vars_path)
        if os.path.isfile(alternative_path):
            global_vars_path = alternative_path
        else:
            print(f"ERROR: Global tfvars file not found at {global_vars_path}", file=sys.stderr)
            sys.exit(1)
            
    try:
        with open(global_vars_path, 'r', encoding='utf-8') as f:
            global_vars = json.load(f)
    except Exception as e:
        print(f"ERROR: Failed to parse JSON from {global_vars_path}: {e}", file=sys.stderr)
        sys.exit(1)
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    terraform_dir = script_dir
    
    stages_to_process = [stage_filter] if stage_filter else STAGES
    
    for stage in stages_to_process:
        variables_tf = os.path.join(terraform_dir, stage, "variables.tf")
        output_json = os.path.join(terraform_dir, stage, "terraform.tfvars.json")
        
        try:
            generate_stage_tfvars(stage, global_vars, variables_tf, output_json)
        except Exception as e:
            print(f"ERROR raising while processing {stage}: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
