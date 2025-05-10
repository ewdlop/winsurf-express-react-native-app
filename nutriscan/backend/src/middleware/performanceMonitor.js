const os = require('os');
const v8 = require('v8');
const logger = require('../utils/logger');

class PerformanceMonitor {
  // Request performance tracking middleware
  static requestTracker() {
    return (req, res, next) => {
      const startTime = process.hrtime();
      const startMemory = process.memoryUsage();

      // Capture request details
      const requestDetails = {
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      };

      // Modify response end to track performance
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = process.hrtime(startTime);
        const durationMs = duration[0] * 1000 + duration[1] / 1e6;
        const endMemory = process.memoryUsage();

        const performanceMetrics = {
          ...requestDetails,
          responseTime: durationMs,
          status: res.statusCode,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed
          }
        };

        // Log performance metrics
        if (durationMs > 1000) {
          logger.warn('Slow Request Detected', performanceMetrics);
        } else {
          logger.debug('Request Performance', performanceMetrics);
        }

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // System resource monitoring
  static systemResourceMonitor() {
    return (req, res, next) => {
      const systemMetrics = {
        cpu: {
          usage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usagePercentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        v8: {
          heapStatistics: v8.getHeapStatistics(),
          heapSpaceStatistics: v8.getHeapSpaceStatistics()
        },
        uptime: {
          system: os.uptime(),
          process: process.uptime()
        }
      };

      // Log system metrics periodically or on specific conditions
      if (systemMetrics.memory.usagePercentage > 80 || 
          systemMetrics.cpu.usage[0] > os.cpus().length) {
        logger.warn('High Resource Utilization', systemMetrics);
      }

      // Attach system metrics to request for potential logging or analysis
      req.systemMetrics = systemMetrics;
      next();
    };
  }

  // Database query performance tracking
  static queryPerformanceTracker(mongoose) {
    const originalExec = mongoose.Query.prototype.exec;

    mongoose.Query.prototype.exec = function() {
      const startTime = process.hrtime();
      const queryOptions = this.getQuery();

      return originalExec.apply(this).then((result) => {
        const duration = process.hrtime(startTime);
        const durationMs = duration[0] * 1000 + duration[1] / 1e6;

        const queryMetrics = {
          model: this.model.modelName,
          operation: this.op,
          query: queryOptions,
          duration: durationMs,
          resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
        };

        // Log slow queries
        if (durationMs > 200) {
          logger.warn('Slow Database Query', queryMetrics);
        } else {
          logger.debug('Database Query Performance', queryMetrics);
        }

        return result;
      });
    };
  }

  // Memory leak detection and warning
  static memoryLeakDetector() {
    const checkInterval = 5 * 60 * 1000; // Every 5 minutes
    let previousMemoryUsage = process.memoryUsage().heapUsed;

    const memoryLeakCheck = () => {
      const currentMemoryUsage = process.memoryUsage().heapUsed;
      const memoryDiff = currentMemoryUsage - previousMemoryUsage;

      if (memoryDiff > 50 * 1024 * 1024) { // 50MB increase
        logger.warn('Potential Memory Leak Detected', {
          memoryIncrease: memoryDiff,
          currentMemoryUsage
        });
      }

      previousMemoryUsage = currentMemoryUsage;
    };

    // Start periodic memory leak checks
    const intervalId = setInterval(memoryLeakCheck, checkInterval);

    // Cleanup on process exit
    process.on('exit', () => clearInterval(intervalId));

    return (req, res, next) => next();
  }

  // Comprehensive performance insights
  static performanceInsights() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const totalDuration = Date.now() - startTime;
        const performanceInsights = {
          requestPath: req.path,
          method: req.method,
          totalRequestTime: totalDuration,
          systemLoad: os.loadavg(),
          memoryUsage: process.memoryUsage()
        };

        // Log comprehensive performance insights
        logger.info('Performance Insights', performanceInsights);
      });

      next();
    };
  }
}

module.exports = PerformanceMonitor;
