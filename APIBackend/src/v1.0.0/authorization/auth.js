const { verifyToken } = require('../config/jwtConfig');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Access denied' });

  const token = header.split(' ')[1]; // Bearer <token>

  try {
    const verificationResult = verifyToken(token);
    req.user = verificationResult.payload;
    req.userName = verificationResult.user;
    delete require.cache[require.resolve('../data/accounts.json')];
    const accounts = require('../data/accounts.json');
    if (!accounts.find(acc => acc.username === req.userName)) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    next();
  } catch (err) {
    console.log('Token verification error in auth():', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  const accounts = require('../data/accounts.json');
  if (!header) return res.status(401).json({ message: 'No token provided' });
  const token = header.split(' ')[1]; // Bearer <token>
  try {
    const verificationResult = verifyToken(token);
    req.user = verificationResult.payload;
    req.userName = verificationResult.user;
    const account = accounts.find(acc => acc.username === req.userName);
    if (!account || !account.isAdmin) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  auth,
  authAdmin
};