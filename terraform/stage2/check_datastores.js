const https = require('https');

const username = 'root';
const password = 'Wetcom01!';
const host = '10.106.3.150';

const agent = new https.Agent({  
  rejectUnauthorized: false
});

function request(method, path, headers = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
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
    console.log("Authenticating to ESXi...");
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const loginRes = await request('POST', '/api/session', {
      'Authorization': `Basic ${auth}`
    });
    
    const token = JSON.parse(loginRes.body);
    console.log("Authenticated! Token acquired.");

    console.log("Listing Datastores...");
    const dsRes = await request('GET', '/api/vcenter/datastore', {
      'vmware-api-session-id': token
    });

    const ds = JSON.parse(dsRes.body);
    console.log("Datastores:", JSON.stringify(ds, null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
