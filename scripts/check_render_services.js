const https = require('https');
const token = process.argv[2];
const services = ['srv-d918oa8g4nts73c9fqag','srv-d918p1bsq97s73a0ru50'];

if (!token) {
  console.error('Usage: node scripts/check_render_services.js <render_api_token>');
  process.exit(1);
}

let pending = services.length;

services.forEach((service) => {
  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${service}/deploys?limit=3`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`SERVICE ${service} STATUS ${res.statusCode}`);
      try {
        console.log(JSON.parse(body));
      } catch (err) {
        console.log(body);
      }
      pending -= 1;
      if (pending === 0) process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error(`ERROR ${service}`, err.message);
    pending -= 1;
    if (pending === 0) process.exit(1);
  });

  req.end();
});
