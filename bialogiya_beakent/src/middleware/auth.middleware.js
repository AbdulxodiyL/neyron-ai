const { verifyAccessToken } = require('../utils/tokenService');
const { error } = require('../utils/apiResponse');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
