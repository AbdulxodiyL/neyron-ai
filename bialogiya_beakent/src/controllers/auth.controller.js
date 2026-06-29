const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenService');
const { success, error } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'Username and password required', 400);

    const user = await prisma.user.findUnique({
      where: { username },
      include: { group: { select: { id: true, name: true } } },
    });

    if (!user || !user.isActive) return error(res, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLogin: new Date() },
    });

    const { passwordHash, refreshTokenHash: _rth, ...safeUser } = user;
    const userOut = { ...safeUser, streak: { current: safeUser.streakCurrent, longest: safeUser.streakLongest, lastActiveDate: safeUser.streakLastDate } };
    return success(res, { user: userOut, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.refreshTokenHash) return error(res, 'Invalid token', 401);

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) return error(res, 'Invalid token', 401);

    const tokens = generateTokens(user.id, user.role);
    const newHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHash } });

    return success(res, tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.userId }, data: { refreshTokenHash: null } });
    return success(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, username: true, email: true, role: true,
        avatar: true, language: true, xp: true, coins: true, level: true,
        streakCurrent: true, streakLongest: true, streakLastDate: true,
        achievements: true, isActive: true, lastLogin: true, createdAt: true,
        groupId: true, teacherId: true,
        group: { select: { id: true, name: true, subject: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    if (!user) return error(res, 'User not found', 404);
    const userOut = { ...user, streak: { current: user.streakCurrent, longest: user.streakLongest, lastActiveDate: user.streakLastDate } };
    return success(res, userOut);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, getMe };
