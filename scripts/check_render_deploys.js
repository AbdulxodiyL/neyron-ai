const https = require('https');
const token = process.argv[2];
const deploys = ['dep-d93rvvpkh4rs73dtqmj0','dep-d93rvvuq1p3s73a7l3eg'];

if (!token) {
  console.error('Usage: node scripts/check_render_deploys.js <render_api_token>');
  process.exit(1);
}

let pending = deploys.length;

deploys.forEach((id) => {
  const options = {
    hostname: 'api.render.com',
    path: `/v1/deploys/${id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`DEPLOY ${id} STATUS ${res.statusCode}`);
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
    console.error(`ERROR ${id}`, err.message);
    pending -= 1;
    if (pending === 0) process.exit(1);
  });

  req.end();
});
