const { prisma } = require('../config/db');

const XP_REWARDS = {
  lesson_view: 10,
  homework_submit: 20,
  homework_on_time: 10,
  quiz_complete: 25,
  quiz_perfect: 50,
  test_complete: 40,
  test_passed: 40,
  test_perfect: 100,
  daily_streak: 15,
  streak_7_days: 100,
  streak_30_days: 500,
  flashcard_session: 5,
  ai_chat: 3,
};

const COIN_REWARDS = {
  lesson_view: 2,
  homework_submit: 5,
  test_passed: 10,
  quiz_perfect: 15,
  daily_streak: 3,
};

const calculateLevel = (xp) => Math.max(1, Math.floor(Math.sqrt(xp / 100)));

const awardXP = async (userId, xpAmount, action = '') => {
  const coinAmount = COIN_REWARDS[action] || 0;
  if (xpAmount === 0 && coinAmount === 0) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streakCurrent = user.streakCurrent;
  let streakLongest = user.streakLongest;
  let bonusXP = 0;

  if (user.streakLastDate) {
    const last = new Date(user.streakLastDate); last.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - last) / 86400000);
    if (diff === 1) {
      streakCurrent += 1;
      if (streakCurrent > streakLongest) streakLongest = streakCurrent;
      if (streakCurrent === 7) bonusXP += XP_REWARDS.streak_7_days;
      if (streakCurrent === 30) bonusXP += XP_REWARDS.streak_30_days;
    } else if (diff > 1) {
      streakCurrent = 1;
    }
  } else {
    streakCurrent = 1;
  }

  const newXP = user.xp + xpAmount + bonusXP;
  const newCoins = user.coins + coinAmount;
  const newLevel = calculateLevel(newXP);
  const oldLevel = user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP, coins: newCoins, level: newLevel, streakCurrent, streakLongest, streakLastDate: today },
  });

  if (newLevel > oldLevel) {
    await prisma.notification.create({
      data: { userId, type: 'achievement', title: `Level Up! Level ${newLevel}`, message: `You reached Level ${newLevel}. Keep going!` },
    });
  }

  return { xpGained: xpAmount + bonusXP, coinsGained: coinAmount, newXP, newLevel };
};

module.exports = { awardXP, calculateLevel, XP_REWARDS };
