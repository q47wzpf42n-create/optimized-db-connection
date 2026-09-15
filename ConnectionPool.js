const mysql = require('mysql2/promise');

class ConnectionPool {
  constructor(config, poolSize = 10) {
    this.config = config;
    this.poolSize = poolSize;
    this.pool = null;
  }

  async initialize() {
    this.pool = await mysql.createPool({
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: this.poolSize,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });
    console.log('✓ Connection pool initialized with', this.poolSize, 'connections');
  }

  async executeQuery(query, values = []) {
    if (!this.pool) await this.initialize();
    const connection = await this.pool.getConnection();
    try {
      const [results] = await connection.execute(query, values);
      return results;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✓ Connection pool closed');
    }
  }
}

module.exports = ConnectionPool;