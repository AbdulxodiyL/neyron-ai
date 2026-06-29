// Transform Prisma `id` fields to `_id` for frontend compatibility
const transformIds = (data) => {
  if (Array.isArray(data)) return data.map(transformIds);
  if (data && typeof data === 'object' && !(data instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = transformIds(v);
    }
    if ('id' in out && !('_id' in out)) out._id = out.id;
    return out;
  }
  return data;
};

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data: transformIds(data) });
};

const error = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { success, error };
