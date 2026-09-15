const ConnectionPool = require('./ConnectionPool');
const CacheManager = require('./CacheManager');

class DatabaseOptimizer {
  constructor(config) {
    this.pool = new ConnectionPool(config, 10);
    this.cache = new CacheManager(600, 120);
    this.queryStats = {};
  }

  async initialize() {
    await this.pool.initialize();
  }

  generateCacheKey(query, values = []) {
    return `${query}:${JSON.stringify(values)}`;
  }

  async query(queryStr, values = [], cacheEnabled = true, ttl = null) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(queryStr, values);

    if (cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const duration = Date.now() - startTime;
        this.recordQueryStats(queryStr, duration, 'CACHE');
        return { data: cached, source: 'cache', duration };
      }
    }

    try {
      const results = await this.pool.executeQuery(queryStr, values);
      const duration = Date.now() - startTime;

      if (cacheEnabled && results.length > 0) {
        this.cache.set(cacheKey, results, ttl);
      }

      this.recordQueryStats(queryStr, duration, 'DATABASE');
      return { data: results, source: 'database', duration };
    } catch (error) {
      console.error('Query Error:', error.message);
      throw error;
    }
  }

  recordQueryStats(query, duration, source) {
    if (!this.queryStats[query]) {
      this.queryStats[query] = { count: 0, totalTime: 0, sources: {} };
    }
    this.queryStats[query].count++;
    this.queryStats[query].totalTime += duration;
    this.queryStats[query].sources[source] = (this.queryStats[query].sources[source] || 0) + 1;

    console.log(`${source}: ${duration}ms`);
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.del(key);
        }
      });
    } else {
      this.cache.flush();
    }
  }

  getPerformanceStats() {
    return {
      cache: this.cache.getStats(),
      queries: this.queryStats
    };
  }

  async close() {
    await this.pool.close();
  }
}

module.exports = DatabaseOptimizer;