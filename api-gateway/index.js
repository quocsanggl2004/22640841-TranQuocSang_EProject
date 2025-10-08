require('dotenv').config();
const express = require("express");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();
const app = express();

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Route requests to the auth service
app.use("/auth", (req, res) => {
  proxy.web(req, res, { 
    target: "http://localhost:3001",
    changeOrigin: true,
    timeout: 5000
  });
});

// Route requests to the product service
app.use("/products", (req, res) => {
  proxy.web(req, res, { 
    target: "http://localhost:3002",
    changeOrigin: true,
    timeout: 5000
  });
});

// Route requests to the order service
app.use("/orders", (req, res) => {
  proxy.web(req, res, { 
    target: "http://localhost:3003",
    changeOrigin: true,
    timeout: 5000
  });
});

// Error handling for proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});

// Start the server
const port = process.env.API_GATEWAY_PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
  console.log(`Available routes:`);
  console.log(`- http://localhost:${port}/health`);
  console.log(`- http://localhost:${port}/auth/*`);
  console.log(`- http://localhost:${port}/products/*`);
  console.log(`- http://localhost:${port}/orders/*`);
});
