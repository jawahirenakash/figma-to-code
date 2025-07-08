import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import figmaRoutes from './api/figma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
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
