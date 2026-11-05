const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');

const cors = require('cors');
const app = express();
// Enable CORS for development frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Connect to Database
connectDB();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration with MongoStore fallback
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'skillswap_secure_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
};

// Use MongoStore for persistent sessions if MONGO_URI is set
if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
  try {
    sessionOptions.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: 'native',
    });
  } catch (err) {
    console.warn('[Session Store Warning] Could not attach MongoStore, falling back to MemoryStore:', err.message);
  }
}

app.use(session(sessionOptions));

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    platform: 'SkillSwap API',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static assets from frontend folder
const frontendPath = path.join(__dirname, '../frontend');

// ─── Server-side Admin Page Protection ──────────────────────────────────────
// These routes MUST come BEFORE express.static so that a direct URL hit to
// /admin.html or /admin is validated against the session on the server.
// Students and unauthenticated users are redirected to /admin-login.html.
const User = require('./models/User');

async function serveAdminPage(req, res) {
  try {
    // Must have an active session
    if (!req.session || !req.session.userId) {
      return res.redirect('/admin-login.html');
    }

    const user = await User.findById(req.session.userId).select('role isBanned');
    if (!user || user.role !== 'admin' || user.isBanned) {
      // Destroy invalid/student session before redirecting
      req.session.destroy(() => { });
      return res.redirect('/admin-login.html');
    }

    // Verified admin – serve the page
    return res.sendFile(path.join(frontendPath, 'admin.html'));
  } catch (err) {
    return res.redirect('/admin-login.html');
  }
}

app.get('/admin.html', serveAdminPage);
app.get('/admin', serveAdminPage);
// ────────────────────────────────────────────────────────────────────────────

app.use(express.static(frontendPath));

// Fallback for unknown API routes – must come BEFORE the wildcard HTML route
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Default route: send index.html for all non-API, non-static paths
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SkillSwap Server is running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`🛡️  Admin Portal: http://localhost:${PORT}/admin-login.html`);
  console.log(`====================================================`);
});

