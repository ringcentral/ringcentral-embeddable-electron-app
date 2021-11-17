const path = require('path');
const fs = require('fs');

const apiData = {
  ringcentralClientId: process.env.RINGCENTRAL_CLIENT_ID,
  ringcentralServer: process.env.RINGCENTRAL_SERVER,
};

fs.writeFileSync(
  path.join(process.cwd(), 'api.json'),
  JSON.stringify(apiData, null, 2),
);
