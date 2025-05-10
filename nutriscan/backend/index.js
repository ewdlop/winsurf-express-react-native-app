const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./src/routes/auth');
const nutritionRoutes = require('./src/routes/nutrition');
const foodScanningRoutes = require('./src/routes/foodScanning');
const mealPlanningRoutes = require('./src/routes/mealPlanning');
const healthGoalRoutes = require('./src/routes/healthGoals');
const socialRoutes = require('./src/routes/social');
const nutritionInsightsRoutes = require('./src/routes/nutritionInsights');
const aiRecommendationRoutes = require('./src/routes/aiRecommendations');
const socialProfileRoutes = require('./src/routes/socialProfile');
const communityFeedRoutes = require('./src/routes/communityFeed');
const achievementsRoutes = require('./src/routes/achievements');
const leaderboardRoutes = require('./src/routes/leaderboard');
const rewardsRoutes = require('./src/routes/rewards');
const referralRoutes = require('./src/routes/referrals');
const userEngagementRoutes = require('./src/routes/userEngagement');
const recommendationRoutes = require('./src/routes/recommendations');
const healthRiskAssessmentRoutes = require('./src/routes/healthRiskAssessment');
const { errorHandler } = require('./src/middleware/errorHandler');
const PerformanceMonitor = require('./src/middleware/performanceMonitor');
const performanceOptimizationService = require('./src/services/performanceOptimizationService');

// Performance Optimization Initialization
performanceOptimizationService.optimizeMongooseQueries();
performanceOptimizationService.configureConnectionPools();
performanceOptimizationService.initializePeriodicMaintenance();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance Monitoring Middleware
app.use(PerformanceMonitor.requestTracker());
app.use(PerformanceMonitor.systemResourceMonitor());
app.use(PerformanceMonitor.performanceInsights());
app.use(PerformanceMonitor.memoryLeakDetector());

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`, {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('MongoDB connected successfully'))
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'NutriScan Backend is running' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Nutrition routes
app.use('/api/nutrition', nutritionRoutes);

// Food Scanning routes
app.use('/api/food', foodScanningRoutes);

// Meal Planning routes
app.use('/api/meal-plans', mealPlanningRoutes);

// Health Goal routes
app.use('/api/health-goals', healthGoalRoutes);

// Social routes
app.use('/api/social', socialRoutes);

// Nutrition Insights routes
app.use('/api/nutrition', nutritionInsightsRoutes);

// AI Recommendation routes
app.use('/api/ai-recommendations', aiRecommendationRoutes);
app.use('/api/social-profile', socialProfileRoutes);
app.use('/api/community-feed', communityFeedRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/engagement', userEngagementRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/health-risk', healthRiskAssessmentRoutes);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`NutriScan Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;
