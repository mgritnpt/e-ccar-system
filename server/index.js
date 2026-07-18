const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes imports
const authController = require('./controllers/authController');
const ccarController = require('./controllers/ccarController');
const ncrController = require('./controllers/ncrController');
const authMiddleware = require('./middleware/auth');
const upload = require('./middleware/upload');

// API Routes
// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authMiddleware, authController.me);

// 2. CCAR routes
app.post('/api/ccar', authMiddleware, ccarController.createCcar);
app.get('/api/ccar', authMiddleware, ccarController.getCcarList);
app.get('/api/ccar/:id', authMiddleware, ccarController.getCcarById);
app.post('/api/ccar/:id/step', authMiddleware, upload.single('file'), ccarController.updateCcarStep);

// 3. NCR routes
app.post('/api/ncr', authMiddleware, ncrController.createNcr);
app.get('/api/ncr', authMiddleware, ncrController.getNcrList);
app.get('/api/ncr/:id', authMiddleware, ncrController.getNcrById);
app.post('/api/ncr/:id/step', authMiddleware, upload.single('file'), ncrController.updateNcrStep);

// Fallback for client (Single Page Application support if deployed together)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'E-CCAR & E-NCR Backend API is running.' });
  });
}

// Bootstrap Server
async function startServer() {
  // 1. Initialize database (Wait for connections, run schema and seeds)
  await initDb();
  
  // 2. Start listening
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer();
