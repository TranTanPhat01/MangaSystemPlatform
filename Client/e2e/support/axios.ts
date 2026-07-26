import fs from 'fs';
import https from 'https';
import path from 'path';
import dns from 'dns';
import axios from 'axios';

const localCaPath = path.resolve(process.cwd(), 'e2e/support-local-ca.pem');

if (fs.existsSync(localCaPath)) {
  axios.defaults.httpsAgent = new https.Agent({
    ca: fs.readFileSync(localCaPath),
    keepAlive: false,
    lookup(hostname, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (hostname === 'api.manga.local') {
        if ((options as dns.LookupAllOptions)?.all) {
          callback(null, [{ address: '127.0.0.1', family: 4 }] as any, 4);
          return;
        }
        callback(null, '127.0.0.1', 4);
        return;
      }
      dns.lookup(hostname, options as dns.LookupOneOptions, callback as any);
    },
  });
}

axios.interceptors.request.use(config => {
  if (typeof config.url === 'string' && config.url.startsWith('http://localhost:5200')) {
    config.url = config.url.replace('http://localhost:5200', 'https://localhost');
  }
  return config;
});

export default axios;
