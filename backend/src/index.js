require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes        = require('./routes/auth');
const productRoutes     = require('./routes/products');
const categoryRoutes    = require('./routes/categories');
const stockRoutes       = require('./routes/stock');
const saleRequestRoutes = require('./routes/saleRequests');
const userRoutes        = require('./routes/users');
const { errorHandler }  = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// Always allow these known CareVale origins
const HARDCODED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://product-management-1-9h7u.onrender.com',
  'https://product-management-1xjp.onrender.com',
  'https://carevale-frontend.onrender.com',
];

// Also accept any additional origins from the environment variable
const ENV_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server requests (no origin)
    if (!origin) return cb(null, true);
    // Allow any onrender.com subdomain (covers URL changes automatically)
    if (origin.endsWith('.onrender.com')) return cb(null, true);
    // Allow localhost in any form
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return cb(null, true);
    // Allow hardcoded + env-configured origins
    if ([...HARDCODED_ORIGINS, ...ENV_ORIGINS].includes(origin)) return cb(null, true);
    // Allow carevale.co.in domains
    if (origin.endsWith('.carevale.co.in') || origin === 'https://carevale.co.in') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'carevale-api', ts: new Date().toISOString() })
);
app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/stock',         stockRoutes);
app.use('/api/sale-requests', saleRequestRoutes);
app.use('/api/users',         userRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`CareVale API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);

module.exports = app;
