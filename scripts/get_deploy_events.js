const https = require('https');
const token = process.argv[2];
const deployId = process.argv[3];
if (!token || !deployId) {
  console.error('Usage: node get_deploy_events.js <token> <deployId>');
  process.exit(1);
}
const options = {
  hostname: 'api.render.com',
  path: `/v1/deploys/${deployId}/events`,
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` },
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.stringify(JSON.parse(body), null, 2)); } catch (e) { console.log(body); }
  });
});
req.on('error', (e) => console.error('ERROR', e.message));
req.end();
