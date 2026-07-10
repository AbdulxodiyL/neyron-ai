const https = require('https');
const token = process.argv[2];
const services = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['srv-d918oa8g4nts73c9fqag', 'srv-d918p1bsq97s73a0ru50'];

if (!token) {
  console.error('Usage: node scripts/check_render_deploys.js <render_api_token> [serviceId ...]');
  process.exit(1);
}

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  for (const service of services) {
    const list = await get(`/v1/services/${service}/deploys?limit=5`);
    const raw = Array.isArray(list.data) ? list.data : (list.data?.data || []);
    if (!raw.length) {
      console.log(`SERVICE ${service}: no deploys found (status ${list.status})`);
      continue;
    }
    const deploy = raw[0].deploy || raw[0];
    console.log(`SERVICE ${service} -> latest deploy ${deploy.id}`);
    console.log(`  status     : ${deploy.status}`);
    console.log(`  trigger    : ${deploy.trigger}`);
    console.log(`  commit     : ${deploy.commit?.message}`);
    console.log(`  createdAt  : ${deploy.createdAt}`);
    console.log(`  finishedAt : ${deploy.finishedAt || '-'}`);
  }
})();
