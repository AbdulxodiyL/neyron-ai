const fs = require('fs');
const https = require('https');

try {
  const cfg = JSON.parse(fs.readFileSync('.claude/settings.json', 'utf8'));
  const token = cfg.token;
  const services = ['srv-d918oa8g4nts73c9fqag','srv-d918p1bsq97s73a0ru50'];

  function post(service) {
    const data = JSON.stringify({ clearCache: 'do_not_clear' });
    const options = {
      hostname: 'api.render.com',
      path: `/v1/services/${service}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log('SERVICE', service, 'STATUS', res.statusCode);
        try { console.log(JSON.parse(body)); } catch (e) { console.log(body); }
      });
    });

    req.on('error', e => console.error('ERROR', service, e.message));
    req.write(data);
    req.end();
  }

  services.forEach(post);
} catch (err) {
  console.error('Failed to read token or trigger deploys:', err.message);
  process.exit(1);
}
