const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://fixfast-backend.onrender.com',
      changeOrigin: true,
      secure: true,
      // El proxy quita /api del path, así que lo agregamos de vuelta
      pathRewrite: {
        '^/(.*)': '/api/$1', // Agregar /api de vuelta al path
      },
      logLevel: 'debug',
    })
  );
};

