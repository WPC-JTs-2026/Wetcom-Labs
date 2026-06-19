const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('esxcli storage filesystem list', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Maintenance mode disabled. Code: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('keyboard-interactive', (name, inst, lang, prompts, finish) => {
  finish(['Wetcom01!']);
}).on('error', (err) => {
  console.error('Error:', err.message);
}).connect({
  host: '10.106.3.150',
  port: 22,
  username: 'root',
  password: 'Wetcom01!',
  tryKeyboard: true,
  readyTimeout: 10000
});
