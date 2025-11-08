const express = require('express');
const request = require('request');
const app = express();

// Middleware para permitir todo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Proxy más inteligente
app.use('/pjud', (req, res) => {
  const path = req.url.replace('/pjud', '') || '/';
  const targetUrl = `https://oficinajudicialvirtual.pjud.cl${path}`;
  
  console.log('🎯 Proxy a:', targetUrl);
  
  const options = {
    url: targetUrl,
    method: req.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-Forwarded-For': '190.110.124.130',
      'Referer': 'https://oficinajudicialvirtual.pjud.cl/',
      'Host': 'oficinajudicialvirtual.pjud.cl'
    },
    gzip: true,
    followRedirect: true,
    followAllRedirects: true
  };

  // Copiar headers del request original
  Object.keys(req.headers).forEach(key => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      options.headers[key] = req.headers[key];
    }
  });

  try {
    const proxyRequest = request(options);
    
    proxyRequest.on('response', (response) => {
      console.log('✅ Respuesta:', response.statusCode);
      
      // Copiar headers de respuesta
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      // Remover headers de seguridad que bloquean
      res.removeHeader('content-security-policy');
      res.removeHeader('x-frame-options');
    });
    
    proxyRequest.on('error', (err) => {
      console.log('❌ Error de proxy:', err.message);
      res.status(500).send(`Error de proxy: ${err.message}`);
    });
    
    proxyRequest.pipe(res);
    
  } catch (error) {
    console.log('💥 Error crítico:', error);
    res.status(500).send('Error crítico: ' + error.message);
  }
});

// Redirección directa
app.get('/', (req, res) => {
  res.redirect('/pjud/');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Proxy MEJORADO corriendo en puerto:', PORT);
  console.log('📌 URL principal: https://' + process.env.CODESPACE_NAME + '-' + PORT + '.app.github.dev');
  console.log('🎯 Acceso directo a PJUD: /pjud/');
});