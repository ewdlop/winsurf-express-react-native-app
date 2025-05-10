const Redis = require('ioredis');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class PerformanceOptimizationService {
  constructor() {
    // Redis cache configuration
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Redis connection error handling
    this.redisClient.on('error', (err) => {
      logger.error('Redis Connection Error', { error: err });
    });
  }

  // Implement intelligent caching mechanism
  async cacheDatabaseQuery(key, queryFn, ttl = 300) {
    try {
      // Check cache first
      const cachedData = await this.redisClient.get(key);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Execute query if not in cache
      const result = await queryFn();

      // Cache the result
      await this.redisClient.setex(key, ttl, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Cache Query Error', { 
        key, 
        error: error.message 
      });
      
      // Fallback to direct database query
      return queryFn();
    }
  }

  // Database query optimization
  optimizeMongooseQueries() {
    // Enable query result caching
    mongoose.set('toJSON', { 
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;  // Remove version key
        return ret;
      }
    });

    // Index recommendations
    this.recommendIndexes();
  }

  // Intelligent index recommendations
  recommendIndexes() {
    const indexRecommendations = {
      User: [
        { email: 1 },
        { username: 1 },
        { createdAt: -1 }
      ],
      NutritionEntry: [
        { user: 1, createdAt: -1 },
        { nutritionalProfile: 1 }
      ],
      HealthGoal: [
        { user: 1, status: 1 },
        { targetDate: 1 }
      ]
    };

    Object.entries(indexRecommendations).forEach(([modelName, indexes]) => {
      const Model = mongoose.models[modelName];
      
      if (Model) {
        indexes.forEach(index => {
          try {
            Model.collection.createIndex(index, { background: true });
            logger.info(`Created index for ${modelName}`, { index });
          } catch (error) {
            logger.warn(`Index creation failed for ${modelName}`, { 
              index, 
              error: error.message 
            });
          }
        });
      }
    });
  }

  // Bulk data processing optimization
  async bulkDataProcessing(data, processingFn, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(processingFn)
        );
        
        results.push(...batchResults);
      } catch (error) {
        logger.error('Bulk Processing Error', { 
          batchIndex: i, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Connection pool management
  configureConnectionPools() {
    // MongoDB connection pool
    mongoose.set('poolSize', 10);  // Adjust based on expected load
    
    // Redis connection pool
    this.redisClient.config('SET', 'maxmemory-policy', 'allkeys-lru');
    this.redisClient.config('SET', 'maxmemory', '2gb');
  }

  // Periodic cache and database cleanup
  async performMaintenanceTasks() {
    try {
      // Clear old cache entries
      const keysToDelete = await this.redisClient.keys('cache:*');
      if (keysToDelete.length > 0) {
        await this.redisClient.del(...keysToDelete);
        logger.info('Cleared old cache entries', { count: keysToDelete.length });
      }

      // Optimize MongoDB collections
      await mongoose.connection.db.executeDbAdminCommand({
        compact: 'User',
        force: true
      });

      logger.info('Maintenance tasks completed successfully');
    } catch (error) {
      logger.error('Maintenance Tasks Error', { error: error.message });
    }
  }

  // Start periodic maintenance
  initializePeriodicMaintenance() {
    // Run maintenance every 24 hours
    setInterval(() => this.performMaintenanceTasks(), 24 * 60 * 60 * 1000);
  }
}

module.exports = new PerformanceOptimizationService();
