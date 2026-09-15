const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

class CompressedResponse {
  static async compressData(data, method = 'gzip') {
    const jsonData = JSON.stringify(data);
    
    if (method === 'gzip') {
      return await gzip(jsonData);
    } else if (method === 'deflate') {
      return await deflate(jsonData);
    }
    return Buffer.from(jsonData);
  }

  static calculateCompressionRatio(original, compressed) {
    const ratio = ((1 - compressed.length / original.length) * 100).toFixed(2);
    return {
      original: original.length,
      compressed: compressed.length,
      ratio: `${ratio}%`
    };
  }

  static async compressAndOptimize(data) {
    const original = JSON.stringify(data);
    const compressed = await gzip(original);
    const stats = this.calculateCompressionRatio(original, compressed);
    
    return {
      data: compressed,
      encoding: 'gzip',
      stats
    };
  }
}

module.exports = CompressedResponse;