import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import figmaRoutes from './api/figma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Memory optimization settings
app.use(express.json({ limit: '50mb' })); // Increased limit for large files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add memory monitoring
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
};

// Log memory usage every 30 seconds
setInterval(logMemoryUsage, 30000);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  'https://figma-to-code-pi.vercel.app', // Vercel frontend
  'https://figma-to-code.vercel.app', // Alternative Vercel domain
];

// Add FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/figma', figmaRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Figma to Code Converter API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      figma: '/api/figma'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
