const buckets = new Map();

const rateLimit = ({ windowMs, max, key = (req) => req.ip }) => (req, res, next) => {
  const now = Date.now();
  const bucketKey = `${key(req)}:${req.path}`;
  const current = buckets.get(bucketKey);
  if (!current || now - current.startedAt >= windowMs) {
    buckets.set(bucketKey, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= max) {
    res.setHeader("Retry-After", Math.ceil((windowMs - (now - current.startedAt)) / 1000));
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  current.count += 1;
  return next();
};

module.exports = rateLimit;