const { Client } = require('ssh2');

const HOST = '10.106.3.205';
const USER = 'root';
const PASS = 'Wetcom01!';

function tryPatch() {
  const conn = new Client();
  console.log(`[Patch] Intentando conectar por SSH a ${HOST}...`);
  
  conn.on('ready', () => {
    console.log('[Patch] Conexión SSH exitosa. Inyectando parches de timeout...');
    
    conn.shell((err, stream) => {
      if (err) {
        console.error('[Patch] Error abriendo shell:', err);
        conn.end();
        return;
      }
      
      let out = '';
      stream.on('data', (data) => {
        out += data.toString();
        if (out.includes('Command>')) {
          stream.write('shell\n');
          out = '';
        } else if (out.includes('root@') || out.includes('#')) {
          if (out.includes('#') && !out.includes('exit')) {
               console.log("[Patch] ¡Shell bash obtenido! Aplicando parches...");
               // Replace generic timeouts in firstboot scripts
               const cmds = [
                 "sed -i 's/7/60/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 "sed -i 's/timeout = 480/timeout = 3600/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 "sed -i 's/timeout = 600/timeout = 3600/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 "sed -i 's/max_retries = 20/max_retries = 100/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 "sed -i 's/max_retries = 30/max_retries = 100/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 "sed -i 's/sleep(10)/sleep(30)/g' /usr/lib/vmware-vpx/firstboot/vpxd-svcs_firstboot.py 2>/dev/null",
                 // Also patch VMDIR just in case
                 "sed -i 's/timeout = 300/timeout = 3600/g' /usr/lib/vmware-vmafd/bin/dir-cli 2>/dev/null",
                 "echo 'Patch aplicado correctamente.' > /var/log/firstboot/antigravity_patch.log",
                 "cat /var/log/firstboot/antigravity_patch.log"
               ];
               
               stream.write(cmds.join('; ') + '\n');
               
               setTimeout(() => {
                   stream.write('exit\n');
                   setTimeout(() => { stream.write('exit\n'); }, 1000);
               }, 5000);
               out = '';
          }
        }
      });
      
      stream.on('close', () => {
        console.log('[Patch] Sesión SSH cerrada. Misión cumplida.');
        conn.end();
        process.exit(0);
      });
    });
  }).on('error', (err) => {
    // Si falla la conexión, reintentar
    setTimeout(tryPatch, 10000);
  }).connect({
    host: HOST,
    port: 22,
    username: USER,
    password: PASS,
    readyTimeout: 5000
  });
}

tryPatch();
