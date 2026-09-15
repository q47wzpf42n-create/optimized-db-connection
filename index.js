require('dotenv').config();
const express = require('express');
const compression = require('compression');
const DatabaseOptimizer = require('./DatabaseOptimizer');
const CompressedResponse = require('./CompressedResponse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'testdb'
};

const optimizer = new DatabaseOptimizer(dbConfig);

app.listen(PORT, async () => {
  try {
    await optimizer.initialize();
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});

// Route: Lấy dữ liệu với caching
app.get('/api/data', async (req, res) => {
  try {
    const query = 'SELECT * FROM users LIMIT 10';
    const result = await optimizer.query(query, [], true, 600);
    
    res.json({
      success: true,
      source: result.source,
      duration: `${result.duration}ms`,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Tìm kiếm user
app.get('/api/users/:id', async (req, res) => {
  try {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await optimizer.query(query, [req.params.id], true, 600);
    
    res.json({
      success: true,
      source: result.source,
      duration: `${result.duration}ms`,
      data: result.data[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Thống kê performance
app.get('/api/stats', (req, res) => {
  const stats = optimizer.getPerformanceStats();
  res.json(stats);
});

// Route: Xóa cache
app.post('/api/cache/clear', (req, res) => {
  optimizer.invalidateCache();
  res.json({ message: 'Cache cleared' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down gracefully...');
  await optimizer.close();
  process.exit(0);
});

module.exports = app;