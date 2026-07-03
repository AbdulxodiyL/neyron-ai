const https = require('https');
const token = process.argv[2];
const deployId = process.argv[3];

if (!token || !deployId) {
  console.error('Usage: node scripts/render_deploy_details.js <render_api_token> <deploy_id>');
  process.exit(1);
}

const options = {
  hostname: 'api.render.com',
  path: `/v1/deploys/${deployId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`STATUS ${res.statusCode}`);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (err) {
      console.log(body);
    }
  });
});

req.on('error', (err) => { console.error(err.message); process.exit(1); });
req.end();
