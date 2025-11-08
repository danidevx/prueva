const express = require('express');
const request = require('request');
const app = express();

// Headers de navegador real
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1'
};

// Proxy stealth
app.use('/', (req, res) => {
  const targetUrl = `https://oficinajudicialvirtual.pjud.cl${req.url}`;
  
  console.log('🎯 Intentando acceder a:', targetUrl);
  
  const options = {
    url: targetUrl,
    method: req.method,
    headers: {
      ...BROWSER_HEADERS,
      'Host': 'oficinajudicialvirtual.pjud.cl',
      'Referer': 'https://oficinajudicialvirtual.pjud.cl/',
      'X-Forwarded-For': '190.110.124.130'
    },
    gzip: true,
    timeout: 10000,
    followRedirect: true,
    followAllRedirects: true,
    strictSSL: false
  };

  // Manejar datos POST
  if (req.method === 'POST' && req.headers['content-type']) {
    options.headers['Content-Type'] = req.headers['content-type'];
    req.pipe(request(options)).pipe(res);
  } else {
    request(options)
      .on('response', (response) => {
        console.log('📡 Status:', response.statusCode);
        console.log('📦 Headers:', JSON.stringify(response.headers, null, 2));
        
        // Remover headers de seguridad pero mantener otros
        const safeHeaders = { ...response.headers };
        delete safeHeaders['content-security-policy'];
        delete safeHeaders['x-frame-options'];
        delete safeHeaders['x-content-type-options'];
        
        res.writeHead(response.statusCode, safeHeaders);
      })
      .on('error', (err) => {
        console.log('❌ Error:', err.message);
        res.status(500).send(`
          <h1>Error de Conexión</h1>
          <p>El servidor de Chile está bloqueando el acceso.</p>
          <p><strong>Support ID:</strong> 12052784506492765553</p>
          <p>Esto indica que hay un firewall activo bloqueando proxies.</p>
        `);
      })
      .pipe(res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🕵️  Proxy STEALTH corriendo en puerto:', PORT);
  console.log('🔗 URL: https://' + process.env.CODESPACE_NAME + '-' + PORT + '.app.github.dev');
});