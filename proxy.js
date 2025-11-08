const express = require('express');
const request = require('request');
const app = express();

// Servir archivos estáticos
app.use(express.static('public'));

// Proxy para PJUD
app.use('/proxy', (req, res) => {
  const targetUrl = `https://oficinajudicialvirtual.pjud.cl${req.url.replace('/proxy', '')}`;
  
  console.log('🔗 Proxying to:', targetUrl);
  
  const options = {
    url: targetUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Accept-Language': 'es-CL,es;q=0.9',
      'X-Forwarded-For': '190.110.124.130',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  };
  
  request(options)
    .on('error', (err) => {
      console.log('❌ Error:', err.message);
      res.status(500).send('Error de conexión: ' + err.message);
    })
    .pipe(res);
});

// Página principal con iframe
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Acceso PJUD - GitHub Codespaces</title>
        <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            iframe { width: 100%; height: 80vh; border: 2px solid #0366d6; }
            .info { background: #f6f8fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="info">
            <h2>🔑 Proxy para Clave Única - Chile</h2>
            <p>Este servidor actúa como intermediario desde GitHub Codespaces</p>
        </div>
        <iframe src="/proxy/" id="pjudFrame"></iframe>
        <script>
            // Recargar iframe si hay errores
            document.getElementById('pjudFrame').onload = function() {
                console.log('Iframe cargado correctamente');
            };
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Proxy corriendo en: http://localhost:' + PORT);
  console.log('📌 Accede via: https://' + process.env.CODESPACE_NAME + '-3000.app.github.dev');
});