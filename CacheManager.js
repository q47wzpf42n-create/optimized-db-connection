const NodeCache = require('node-cache');

class CacheManager {
  constructor(stdTTL = 600, checkperiod = 120) {
    this.cache = new NodeCache({ stdTTL, checkperiod });
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  set(key, value, ttl = null) {
    this.cache.set(key, value, ttl);
    this.stats.sets++;
    console.log(`Cache SET: ${key}`);
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      this.stats.hits++;
      console.log(`✓ Cache HIT: ${key}`);
    } else {
      this.stats.misses++;
      console.log(`✗ Cache MISS: ${key}`);
    }
    return value;
  }

  del(key) {
    this.cache.del(key);
    console.log(`Cache DEL: ${key}`);
  }

  flush() {
    this.cache.flushAll();
    console.log('Cache flushed completely');
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      keys: this.cache.keys().length
    };
  }
}

module.exports = CacheManager;