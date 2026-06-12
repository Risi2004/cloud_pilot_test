import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Analysis from './models/Analysis.js';

// Route Imports
import analyzeRoutes from './routes/analyzeRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import deploymentRoutes from './routes/deploymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import readinessRoutes from './routes/readinessRoutes.js';
import risksRoutes from './routes/risksRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Load Env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main Service Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/recommend', recommendationRoutes);
app.use('/api/deployment-plan', deploymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/readiness', readinessRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/report', reportRoutes);

// Dashboard Statistics Route
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const totalAnalyses = await Analysis.countDocuments();
    
    // Aggregation for platforms
    const vercelCount = await Analysis.countDocuments({ 'recommendation.frontend': 'Vercel' });
    const renderCount = await Analysis.countDocuments({ 'recommendation.backend': 'Render' });
    
    const recentProjects = await Analysis.find()
      .select('githubUrl framework database recommendation complexity dockerized envVariables createdAt')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      totalAnalyses,
      vercelCount,
      renderCount,
      recentProjects
    });
  } catch (error) {
    console.error(`Dashboard Stats Error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// Root Ping Route
app.get('/', (req, res) => {
  res.send('CloudPilot API is running...');
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
server.timeout = 310000;
server.requestTimeout = 310000;
