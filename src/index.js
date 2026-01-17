require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Import routes
const blogRoutes = require('./routes/blogs');
const journeyRoutes = require('./routes/journeys');
const uploadRoutes = require('./routes/upload');
const newsletterRoutes = require('./routes/newsletter');
const aboutRoutes = require('./routes/about');
const gearRoutes = require('./routes/gear');
const contactRoutes = require('./routes/contact');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: ['https://thesoloakash.com', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/blogs', blogRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/gear', gearRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Poetic Blog API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Poetic Blog API',
    version: '1.0.0',
    endpoints: {
      blogs: '/api/blogs',
      journeys: '/api/journeys',
      upload: '/api/upload',
      contact: '/api/contact',
      health: '/api/health',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ========================================
    Poetic Blog API Server
  ========================================
    Status: Running
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
    MongoDB: ${process.env.MONGODB_URI}
  ========================================
  `);
});
