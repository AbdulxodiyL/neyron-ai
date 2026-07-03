const https = require('https');
const token = process.argv[2];
const services = process.argv.slice(3);
if (!token || services.length === 0) {
  console.error('Usage: node scripts/render_service_info.js <render_api_token> <serviceId> [serviceId2 ...]');
  process.exit(1);
}
let pending = services.length;
services.forEach((service) => {
  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${service}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };
  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`SERVICE ${service} STATUS ${res.statusCode}`);
      try { console.log(JSON.parse(body)); } catch (e) { console.log(body); }
      if (--pending === 0) process.exit(0);
    });
  });
  req.on('error', (err) => { console.error(`ERROR ${service} ${err.message}`); if (--pending === 0) process.exit(1); });
  req.end();
});