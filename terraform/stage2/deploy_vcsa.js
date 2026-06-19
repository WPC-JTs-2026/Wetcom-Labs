const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

const jsonPath = path.resolve(__dirname, process.argv[2].replace(/"/g, ''));
const extractPoint = path.resolve(__dirname, process.argv[3].replace(/"/g, ''));
const ipDestino = process.argv[4].replace(/"/g, '');

if (!jsonPath || !process.argv[3] || !ipDestino) {
  console.error("Usage: node deploy_vcsa.js <jsonPath> <extractPoint> <ipDestino>");
  process.exit(1);
}

const isWin = process.platform === "win32";

// Resolve installer path
const installerSubPath = isWin 
  ? path.join("vcsa-cli-installer", "win32", "vcsa-deploy.exe")
  : path.join("vcsa-cli-installer", "lin64", "vcsa-deploy.bin");

const installerPath = path.resolve(extractPoint, installerSubPath);

// Validations
if (!fs.existsSync(extractPoint)) {
  console.error(`ERROR: La carpeta de extracción ${extractPoint} no existe.`);
  process.exit(1);
}

if (!fs.existsSync(installerPath)) {
  console.error(`ERROR: El instalador CLI no se encontró en ${installerPath}.`);
  process.exit(1);
}

// Helper to wait for SSH port
function waitPort(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    console.log(`Esperando a que el host ESXi ${host} acepte conexiones en el puerto ${port}...`);
    
    function tryConnect() {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      
      socket.on('connect', () => {
        socket.destroy();
        console.log(`[OK] ¡El equipo ${host} acepta conexiones en el puerto ${port}!`);
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout: El host ESXi ${host} no respondió en el puerto ${port} después de 3 minutos.`));
        } else {
          setTimeout(tryConnect, 10000);
        }
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout: El host ESXi ${host} no respondió en el puerto ${port} después de 3 minutos.`));
        } else {
          setTimeout(tryConnect, 10000);
        }
      });
      
      socket.connect(port, host);
    }
    
    tryConnect();
  });
}

async function run() {
  // Wait for ESXi HTTPS port (3 minutes timeout)
  await waitPort(ipDestino, 443, 180000);

  // Set Linux specific permissions
  if (!isWin) {
    console.log("Configurando permisos de ejecución para Linux...");
    const lin64Dir = path.resolve(extractPoint, "vcsa-cli-installer", "lin64");
    
    // chmod +x on installer
    fs.chmodSync(installerPath, '755');
    
    // chmod +x on .so files and ovftool
    try {
      const execSync = require('child_process').execSync;
      execSync(`chmod +x "${lin64Dir}"/*.so 2>/dev/null || true`);
      execSync(`find "${extractPoint}" -name "*.bin" -o -name "ovftool" | xargs chmod +x 2>/dev/null || true`);
    } catch (e) {
      console.log("Warning adjusting permissions: " + e.message);
    }
  }

  console.log(`Ejecutando instalador en ${installerPath} ...`);
  
  const args = [
    'install',
    '--no-ssl-certificate-verification',
    '--accept-eula',
    '--acknowledge-ceip',
    jsonPath
  ];

  const env = { ...process.env };
  if (!isWin) {
    const lin64Dir = path.resolve(extractPoint, "vcsa-cli-installer", "lin64");
    env.LD_LIBRARY_PATH = `${lin64Dir}:${lin64Dir}/lib:${lin64Dir}/lib/deps`;
  }

  const proc = spawn(installerPath, args, {
    env,
    stdio: 'inherit'
  });

  proc.on('close', (code) => {
    if (code === 0) {
      console.log("vCenter instalado exitosamente.");
      process.exit(0);
    } else {
      console.error(`ERROR: El instalador finalizó con código de salida ${code}`);
      process.exit(code);
    }
  });

  proc.on('error', (err) => {
    console.error("ERROR al lanzar el instalador:", err);
    process.exit(1);
  });
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
