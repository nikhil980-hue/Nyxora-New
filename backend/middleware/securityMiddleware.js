import crypto from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import '../config/firebase.js';

const buckets = new Map();
const WINDOW_MS = Math.max(1000, Number(process.env.NYXORA_RATE_LIMIT_WINDOW_MS || 60000));
const MAX_REQUESTS = Math.max(10, Number(process.env.NYXORA_RATE_LIMIT_MAX || 120));

function clientKey(req) {
  return String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim().slice(0, 100);
}

export function nyxoraSecurityMiddleware(req, res, next) {
  const requestId = crypto.randomUUID();
  req.nyxoraRequestId = requestId;
  res.setHeader('X-Nyxora-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const key = clientKey(req);
  const now = Date.now();
  const bucket = buckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start >= WINDOW_MS) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > MAX_REQUESTS) return res.status(429).json({ success: false, error: 'Too many requests. Please retry later.', requestId });

  const contentLength = Number(req.headers['content-length'] || 0);
  const maxBytes = Math.max(1024 * 1024, Number(process.env.NYXORA_MAX_REQUEST_BYTES || 25 * 1024 * 1024));
  if (contentLength > maxBytes) return res.status(413).json({ success: false, error: 'Request payload is too large.', requestId });

  next();
}

export async function optionalFirebaseAuth(req, res, next) {
  const required = String(process.env.NYXORA_REQUIRE_AUTH || 'false').toLowerCase() === 'true';
  const authorization = String(req.headers.authorization || '');
  if (!authorization) {
    if (required) return res.status(401).json({ success: false, error: 'Authentication required.', requestId: req.nyxoraRequestId });
    return next();
  }
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  try {
    req.nyxoraAuthToken = token;
    req.nyxoraUser = await getAuth().verifyIdToken(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid authentication token.', requestId: req.nyxoraRequestId });
  }
}
