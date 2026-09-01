const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const file = path.join(__dirname, '.env.local');
  if (!fs.existsSync(file)) {
    return;
  }

  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const target = process.env.API_PROXY_TARGET || 'http://localhost:3000';
const authGate = process.env.AUTH_GATE || '';

if (!authGate) {
  console.warn(
    '[proxy] AUTH_GATE vacío: POST /login fallará. Copia .env.example a .env.local y pega el AUTH del backend.',
  );
}

const proxyToApi = {
  target,
  secure: false,
  changeOrigin: true,
};

module.exports = {
  '/api': proxyToApi,
  '/health': proxyToApi,
  '/login': {
    ...proxyToApi,
    bypass(req) {
      if (req.method !== 'POST') {
        return '/index.html';
      }
    },
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq, req) => {
        const url = req.url || '';
        if (url === '/login' || url.startsWith('/login?')) {
          if (authGate) {
            proxyReq.setHeader('auth', authGate);
          }
        }
      });
    },
  },
};
