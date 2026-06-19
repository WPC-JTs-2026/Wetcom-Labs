const { Client } = require('ssh2');

const command = process.argv[2] || "cat /var/log/firstboot/vpxd-svcs_firstboot.py_*.log | tail -n 20";

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Stream :: close');
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
      if (out.includes('Command>')) {
        stream.write('shell\n');
        out = '';
      } else if (out.includes('root@') || out.includes('#')) {
        // We are in bash!
        if (out.includes('#') && !out.includes('exit')) {
             console.log("In bash!");
             stream.write(command + '\n');
             setTimeout(() => {
                 stream.write('exit\n');
                 setTimeout(() => { stream.write('exit\n'); }, 1000);
             }, 3000);
             out = '';
        }
      }
      process.stdout.write(data);
    });
  });
}).connect({
  host: '10.106.3.205',
  port: 22,
  username: 'root',
  password: 'Wetcom01!',
  readyTimeout: 10000
});
