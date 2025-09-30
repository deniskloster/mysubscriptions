const ALLOWED_IPS = ['213.142.147.2', '37.1.223.44', '92.124.145.88', '127.0.0.1', '::1'];

/**
 * Middleware to check IP whitelist
 */
function ipWhitelistMiddleware(req, res, next) {
  // Temporarily disabled IP check for debugging
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  const ip = clientIp.split(',')[0].trim().replace('::ffff:', '');
  console.log(`Admin access from IP: ${ip}`);

  // if (!ALLOWED_IPS.includes(ip)) {
  //   console.log(`Access denied for IP: ${ip}`);
  //   return res.status(403).json({ error: 'Access denied: IP not allowed' });
  // }

  next();
}

/**
 * Middleware to check admin credentials
 */
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized: No credentials provided' });
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }

  next();
}

module.exports = {
  ipWhitelistMiddleware,
  adminAuthMiddleware
};
