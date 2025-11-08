const express = require('express');
const request = require('request');
const app = express();

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache'
};

// Proxy para TODOS los recursos
app.use('/', (req, res) => {
  // Determinar el dominio objetivo basado en la URL
  let targetDomain = 'oficinajudicialvirtual.pjud.cl';
  let targetUrl = `https://${targetDomain}${req.url}`;
  
  // Si es un recurso estático, podría estar en otro dominio
  if (req.url.includes('.css') || req.url.includes('.js') || req.url.includes('.png') || req.url.includes('.jpg')) {
    // Mantener URLs absolutas como están
    if (req.url.startsWith('http')) {
      targetUrl = req.url;
    } else if (req.url.startsWith('//')) {
      targetUrl = 'https:' + req.url;
    }
  }
  
  console.log('📡 Proxy a:', targetUrl);
  
  const options = {
    url: targetUrl,
    method: req.method,
    headers: {
      ...BROWSER_HEADERS,
      'Host': new URL(targetUrl).hostname,
      'Referer': 'https://oficinajudicialvirtual.pjud.cl/',
      'X-Forwarded-For': '190.110.124.130',
      'Origin': 'https://oficinajudicialvirtual.pjud.cl'
    },
    gzip: true,
    timeout: 15000,
    followRedirect: true,
    followAllRedirects: true,
    strictSSL: false
  };

  // Manejar diferentes tipos de contenido
  const proxyRequest = request(options);
  
  proxyRequest.on('response', (response) => {
    console.log('✅', response.statusCode, req.url);
    
    // Headers seguros para todos los recursos
    const safeHeaders = { ...response.headers };
    
    // Permitir que los recursos se carguen
    delete safeHeaders['content-security-policy'];
    delete safeHeaders['x-frame-options'];
    delete safeHeaders['x-content-type-options'];
    
    // Headers CORS para recursos
    safeHeaders['access-control-allow-origin'] = '*';
    safeHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE';
    safeHeaders['access-control-allow-headers'] = '*';
    
    res.writeHead(response.statusCode, safeHeaders);
  });
  
  proxyRequest.on('error', (err) => {
    console.log('❌ Error con', req.url, ':', err.message);
    // No enviar error para recursos, solo silenciar
    if (!res.headersSent) {
      res.status(404).end();
    }
  });
  
  proxyRequest.pipe(res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Proxy completo funcionando',
    urls: {
      main: '/',
      pjud: 'https://oficinajudicialvirtual.pjud.cl/'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Proxy COMPLETO funcionando en puerto:', PORT);
  console.log('🔗 Accede via: https://' + process.env.CODESPACE_NAME + '-' + PORT + '.app.github.dev');
  console.log('📌 Debería cargar todos los estilos y recursos');
});