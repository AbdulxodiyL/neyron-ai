const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { cloneVoice, deleteVoice } = require('../services/ai/voiceClone.service');

// POST /api/voice/clone - upload a short audio sample and create a personal
// cloned voice (ElevenLabs Instant Voice Cloning). The resulting voice_id is
// then used for this user's story/explainer-video narration.
const uploadVoiceSample = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Audio fayl yuborilmadi', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true, clonedVoiceId: true } });

    // Replace any existing clone for this user rather than accumulating them
    if (user?.clonedVoiceId) await deleteVoice(user.clonedVoiceId);

    const voiceId = await cloneVoice(`${user?.name || 'user'}-${req.user.userId}`, req.file.buffer, req.file.mimetype, req.file.originalname);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { clonedVoiceId: voiceId, clonedVoiceName: req.body?.label || 'Mening ovozim' },
    });

    // Old cached audio was synthesized with the previous voice - clear it so
    // the next play regenerates with the new cloned voice.
    await prisma.lessonMedia.deleteMany({ where: { lesson: { teacherId: req.user.userId } } });

    return success(res, { voiceId }, 'Ovoz muvaffaqiyatli klonlandi', 201);
  } catch (err) { next(err); }
};

// GET /api/voice/profile
const getVoiceProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { clonedVoiceId: true, clonedVoiceName: true } });
    return success(res, { hasClonedVoice: !!user?.clonedVoiceId, name: user?.clonedVoiceName || null });
  } catch (err) { next(err); }
};

// DELETE /api/voice/profile
const removeVoiceProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { clonedVoiceId: true } });
    if (user?.clonedVoiceId) await deleteVoice(user.clonedVoiceId);
    await prisma.user.update({ where: { id: req.user.userId }, data: { clonedVoiceId: null, clonedVoiceName: null } });
    await prisma.lessonMedia.deleteMany({ where: { lesson: { teacherId: req.user.userId } } });
    return success(res, null, "Ovoz o'chirildi");
  } catch (err) { next(err); }
};

module.exports = { uploadVoiceSample, getVoiceProfile, removeVoiceProfile };
