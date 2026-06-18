const fs = require('fs');
const path = require('path');

const DEFAULT_GLOBAL_TFVARS_PATH = "terraform/global.tfvars.json";
const STAGES = ["stage1", "stage2", "stage3"];

// Stage mappings
const STAGE1_MAPPING = {
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
    "esxi_cpu_count": "esxi_cpu_count",
    "esxi_memory_mb": "esxi_memory_mb",
    "esxi_disk_size_gb": "esxi_disk_size_gb",
    "esxi_ip_subnet": "esxi_ip_subnet",
    "esxi_ip_start_offset": "esxi_ip_start_offset",
    "esxi_hosts_info": (g) => {
        const info = (g.esxi_hosts && g.esxi_hosts.info) || [];
        if (info.length === 0) {
            const subnet = g.esxi_ip_subnet || "10.106.3";
            const offset = Number(g.esxi_ip_start_offset) || 201;
            const password = g.esxi_password || "Wetcom01!";
            return [
                { user: "root", password: password, address: `${subnet}.${offset}` },
                { user: "root", password: password, address: `${subnet}.${offset + 1}` }
            ];
        }
        return info.map(host => ({
            user: (g.esxi_hosts && g.esxi_hosts.user) || "root",
            password: (g.esxi_hosts && g.esxi_hosts.password) || g.esxi_password || "Wetcom01!",
            address: host.address
        }));
    }
};

const STAGE2_MAPPING = {
    "esxi_deploy_host": (g) => {
        const info = (g.esxi_hosts && g.esxi_hosts.info) || [];
        if (info.length > 0 && info[0].address) {
            return info[0].address;
        }
        const subnet = g.esxi_ip_subnet || "10.106.3";
        const offset = Number(g.esxi_ip_start_offset) || 201;
        return `${subnet}.${offset}`;
    },
    "esxi_password": "esxi_hosts.password",
    "vcsa_netmask": "nested_vcenter.vcsa_netmask",
    "vcsa_gateway": "nested_vcenter.vcsa_gateway",
    "vcsa_dns": "nested_vcenter.vcsa_dns",
    "vcsa_ip": "nested_vcenter.vcsa_ip",
    "vcsa_fqdn": "nested_vcenter.vcsa_fqdn",
    "vcsa_password": "nested_vcenter.vcsa_password"
};

const STAGE3_MAPPING = {
    "vsphere_server": "nested_vcenter.vcsa_ip",
    "vsphere_user": "nested_vcenter.vsphere_user",
    "vsphere_password": "nested_vcenter.vsphere_password",
    "datacenter_name": "nested_vcenter.datacenter_name",
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
    "hosts_info": (g) => {
        const info = (g.esxi_hosts && g.esxi_hosts.info) || [];
        if (info.length === 0) {
            const subnet = g.esxi_ip_subnet || "10.106.3";
            const offset = Number(g.esxi_ip_start_offset) || 201;
            const password = g.esxi_password || "Wetcom01!";
            return [
                { user: "root", password: password, address: `${subnet}.${offset}` },
                { user: "root", password: password, address: `${subnet}.${offset + 1}` }
            ];
        }
        return info.map(host => ({
            user: (g.esxi_hosts && g.esxi_hosts.user) || "root",
            password: (g.esxi_hosts && g.esxi_hosts.password) || g.esxi_password || "Wetcom01!",
            address: host.address
        }));
    },
    "iscsi_network_config": (g) => {
        const info = (g.esxi_hosts && g.esxi_hosts.info) || [];
        const netmask = (g.common_network && g.common_network.network_netmask) || g.esxi_netmask || "255.255.255.0";
        if (info.length === 0) {
            const subnet = g.esxi_ip_subnet || "10.106.3";
            const offset = Number(g.esxi_ip_start_offset) || 201;
            return [
                { host_address: `${subnet}.${offset}`, iscsi_ip: `${subnet}.${offset + 2}`, iscsi_netmask: netmask },
                { host_address: `${subnet}.${offset + 1}`, iscsi_ip: `${subnet}.${offset + 3}`, iscsi_netmask: netmask }
            ];
        }
        return info.map(host => ({
            host_address: host.address,
            iscsi_ip: host.iscsi_ip,
            iscsi_netmask: netmask
        }));
    }
};

const STAGE_MAPPINGS = {
    "stage1": STAGE1_MAPPING,
    "stage2": STAGE2_MAPPING,
    "stage3": STAGE3_MAPPING
};

function getNestedVal(data, pathStr) {
    const parts = pathStr.split('.');
    let current = data;
    let foundNested = true;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            foundNested = false;
            break;
        }
    }
    if (foundNested && current !== undefined && current !== null) {
        return current;
    }

    const keyMap = {
        "playground_vcenter.vsphere_server": "vsphere_server",
        "playground_vcenter.vsphere_user": "vsphere_user",
        "playground_vcenter.vsphere_password": "vsphere_password",
        "playground_vcenter.datacenter_name": "datacenter_name",
        "playground_vcenter.cluster_name": "cluster_name",
        "playground_vcenter.datastore_name": "datastore_name",
        "playground_vcenter.network_name": "network_name",
        "playground_vcenter.vm_domain": "vm_domain",
        "playground_vcenter.vm_folder_path": "vm_folder_path",
        "playground_vcenter.resource_pool_name": "resource_pool_name",
        "local_files.esxi_ovf_local_path": "esxi_ovf_local_path",
        "esxi_hosts.esxi_name_prefix": "esxi_name_prefix",
        "esxi_hosts.esxi_deploy_host": "esxi_deploy_host",
        "common_network.network_netmask": "esxi_netmask",
        "common_network.network_gateway": "esxi_gateway",
        "common_network.network_dns": "esxi_dns",
        "esxi_hosts.password": "esxi_password",
        "truenas.deploy": "deploy_truenas",
        "truenas.template_name": "truenas_template_name",
        "truenas.vm_prefix": "truenas_vm_prefix",
        "truenas.ip": "truenas_vm_ip",
        "nested_vcenter.vcsa_netmask": "vcsa_netmask",
        "nested_vcenter.vcsa_gateway": "vcsa_gateway",
        "nested_vcenter.vcsa_dns": "vcsa_dns",
        "nested_vcenter.vcsa_ip": "vcsa_ip",
        "nested_vcenter.vcsa_fqdn": "vcsa_fqdn",
        "nested_vcenter.vcsa_password": "vcsa_password",
        "local_files.vcsa_exctract_path": "vcsa_exctract_path",
        "nested_vcenter.vsphere_user": "vsphere_user",
        "nested_vcenter.vsphere_password": "vcsa_password",
        "nested_vcenter.datacenter_name": "datacenter_name",
        "truenas.chap_user": "truenas_chap_user",
        "truenas.chap_pass": "truenas_chap_pass",
        "truenas.iscsi_enabled": "iscsi_enabled",
        "truenas.vswitch_name": "vswitch_name",
        "truenas.vswitch_uplink": "vswitch_uplink",
        "truenas.network_portgroup": "network_portgroup",
        "truenas.vmkernel_interface": "vmkernel_interface",
        "truenas.nfs_enabled": "nfs_enabled",
        "truenas.nfs_datastore_name": "nfs_datastore_name",
        "truenas.nfs_remote_path": "nfs_remote_path",
        "truenas.nfs_access_mode": "nfs_access_mode"
    };

    const flatKey = keyMap[pathStr];
    if (flatKey && data && flatKey in data && data[flatKey] !== undefined && data[flatKey] !== null) {
        return data[flatKey];
    }

    const lastPart = parts[parts.length - 1];
    if (data && lastPart in data && data[lastPart] !== undefined && data[lastPart] !== null) {
        return data[lastPart];
    }

    return undefined;
}

function parseVariablesTf(variablesTfPath) {
    if (!fs.existsSync(variablesTfPath)) {
        throw new Error(`Variables file not found: ${variablesTfPath}`);
    }
    const content = fs.readFileSync(variablesTfPath, 'utf8');
    const variables = {};
    const regex = /\bvariable\s+"([^"]+)"\s*\{/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        const startIdx = regex.lastIndex;
        
        let braceCount = 1;
        let endIdx = startIdx;
        while (braceCount > 0 && endIdx < content.length) {
            const char = content[endIdx];
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
            }
            endIdx++;
        }
        
        const blockContent = content.substring(startIdx, endIdx - 1);
        
        // Clean comments
        const lines = blockContent.split(/\r?\n/).map(line => {
            return line.split('#')[0].split('//')[0].trim();
        }).filter(line => line.length > 0);
        const cleanBlock = lines.join('\n');
        
        const hasDefault = /\bdefault\s*=/.test(cleanBlock);
        variables[varName] = {
            required: !hasDefault
        };
    }
    return variables;
}

function generateStageTfvars(stage, globalVars, variablesTfPath, outputPath) {
    const declaredVars = parseVariablesTf(variablesTfPath);
    const mapping = STAGE_MAPPINGS[stage];
    if (!mapping) {
        throw new Error(`No mapping defined for stage: ${stage}`);
    }
    
    const stageVars = {};
    
    for (const [varName, info] of Object.entries(declaredVars)) {
        const isRequired = info.required;
        
        if (varName in mapping) {
            const mapTarget = mapping[varName];
            let val;
            if (typeof mapTarget === 'function') {
                val = mapTarget(globalVars);
            } else {
                val = getNestedVal(globalVars, mapTarget);
            }
            
            if (val !== undefined && val !== null) {
                stageVars[varName] = val;
            } else if (isRequired) {
                throw new Error(`Required variable '${varName}' in stage '${stage}' resolved to null/missing in global vars using key '${mapTarget}'.`);
            }
        } else if (isRequired) {
            throw new Error(`Required variable '${varName}' in stage '${stage}' has no mapping defined in STAGE_MAPPINGS and lacks a default value.`);
        }
    }
    
    // Sort keys
    const sortedVars = {};
    Object.keys(stageVars).sort().forEach(key => {
        sortedVars[key] = stageVars[key];
    });
    
    const jsonData = JSON.stringify(sortedVars, null, 2);
    
    if (fs.existsSync(outputPath)) {
        const existingContent = fs.readFileSync(outputPath, 'utf8');
        if (existingContent === jsonData) {
            console.log(`[${stage}] Output ${outputPath} is up-to-date (no change).`);
            return;
        }
    }
    
    fs.writeFileSync(outputPath, jsonData, 'utf8');
    console.log(`[${stage}] Generated ${outputPath}`);
}

function main() {
    let globalVarsPath = DEFAULT_GLOBAL_TFVARS_PATH;
    let stageFilter = null;
    
    const args = process.argv.slice(2);
    if (args.length > 0) {
        if (STAGES.includes(args[0])) {
            stageFilter = args[0];
            if (args.length > 1) {
                globalVarsPath = args[1];
            }
        } else {
            globalVarsPath = args[0];
        }
    }
    
    if (!fs.existsSync(globalVarsPath)) {
        const scriptDir = __dirname;
        const alternativePath = path.join(scriptDir, globalVarsPath);
        if (fs.existsSync(alternativePath)) {
            globalVarsPath = alternativePath;
        } else {
            console.error(`ERROR: Global tfvars file not found at ${globalVarsPath}`);
            process.exit(1);
        }
    }
    
    let globalVars;
    try {
        globalVars = JSON.parse(fs.readFileSync(globalVarsPath, 'utf8'));
    } catch (e) {
        console.error(`ERROR: Failed to parse JSON from ${globalVarsPath}: ${e.message}`);
        process.exit(1);
    }
    
    const scriptDir = __dirname;
    const stagesToProcess = stageFilter ? [stageFilter] : STAGES;
    
    for (const stage of stagesToProcess) {
        const variablesTf = path.join(scriptDir, "terraform", stage, "variables.tf");
        const outputJson = path.join(scriptDir, "terraform", stage, "terraform.tfvars.json");
        
        try {
            generateStageTfvars(stage, globalVars, variablesTf, outputJson);
        } catch (e) {
            console.error(`ERROR occurred while processing ${stage}: ${e.message}`);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    main();
}
