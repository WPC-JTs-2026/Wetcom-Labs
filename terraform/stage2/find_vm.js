const https = require('https');

const username = 'ilucero';
const password = 'Ilucero06';
const vcenter = 'vcenter-001.playground.net';

const agent = new https.Agent({  
  rejectUnauthorized: false
});

function request(method, path, headers = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: vcenter,
      port: 443,
      path: path,
      method: method,
      headers: headers,
      agent: agent
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ headers: res.headers, body: data });
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    console.log("Authenticating to vCenter...");
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const loginRes = await request('POST', '/api/session', {
      'Authorization': `Basic ${auth}`
    });
    
    // The session token is returned in the body as a JSON string (a UUID)
    const token = JSON.parse(loginRes.body);
    console.log("Authenticated! Token acquired.");

    console.log("Listing VMs...");
    const vmRes = await request('GET', '/api/vcenter/vm', {
      'vmware-api-session-id': token
    });

    console.log("Triggering reset on vm-11655...");
    const resetRes = await request('POST', '/api/vcenter/vm/vm-11655/action/reset', {
      'vmware-api-session-id': token
    });

    console.log("Reset result:", resetRes.statusCode || "Done");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
