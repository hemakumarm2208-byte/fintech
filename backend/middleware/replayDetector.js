const jwt = require("jsonwebtoken");
const {
  getTokenRecord,
  registerTokenUse,
  logEvent,
} = require("../utils/tokenStore");

const JWT_SECRET = process.env.JWT_SECRET;

function replayDetector(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  const ip = req.headers["x-forwarded-for"] || req.ip;

  // ==========================================
  // 1. TOKEN MISSING
  // ==========================================
  if (!token) {
    logEvent({
      verdict: "REJECTED",
      jti: "-",
      ip,
      reason: "Missing consent token",
      action: "BLOCKED",
    });

    return res.status(401).json({
      error: "Missing consent token",
      action: "BLOCKED",
    });
  }

  // ==========================================
  // 2. VERIFY JWT
  // ==========================================
  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logEvent({
      verdict: "REJECTED",
      jti: "-",
      ip,
      reason: "Invalid/expired JWT",
      action: "BLOCKED",
    });

    return res.status(401).json({
      error: "Invalid or expired token",
      action: "BLOCKED",
    });
  }

  // Get token information
  const {
    jti,
    consentId,
    fiStart,
    fiEnd,
    maxUsage,
  } = payload;

  const now = Date.now();

  // ==========================================
  // 3. CHECK CONSENT WINDOW
  // ==========================================
  if (now < fiStart || now > fiEnd) {
    logEvent({
      verdict: "REPLAY_DETECTED",
      jti,
      ip,
      reason: "Fetch outside consent date range",
      action: "BLOCKED",
    });

    return res.status(403).json({
      error: "Fetch outside consented window",
      action: "BLOCKED",
    });
  }

  // ==========================================
  // 4. CHECK REPLAY / USAGE LIMIT
  // ==========================================
  const existing = getTokenRecord(jti);

  if (existing && existing.usageCount >= existing.maxUsage) {
    logEvent({
      verdict: "REPLAY_DETECTED",
      jti,
      ip,
      reason: `Reused beyond limit (${existing.maxUsage})`,
      action: "BLOCKED",
    });

    return res.status(403).json({
      error: "Token replay detected",
      action: "BLOCKED",
    });
  }

  // ==========================================
  // 5. REGISTER TOKEN USAGE
  // ==========================================
  const record = registerTokenUse(
    jti,
    consentId,
    maxUsage,
    ip
  );

  // ==========================================
  // 6. DEFAULT SUCCESS RESULT
  // ==========================================
  let verdict = "ALLOWED";
  let reason = "Valid consent token";
  let action = "ALLOWED";

  // ==========================================
  // 7. CHECK DIFFERENT IP / ANOMALY
  // ==========================================
  if (record.ipsSeen.size > 1) {
    verdict = "ANOMALY";

    reason = `Same token used from ${record.ipsSeen.size} different IPs`;

    action = "FLAGGED";
  }

  // ==========================================
  // 8. SAVE AUDIT LOG TO FIRESTORE
  // ==========================================
  logEvent({
    verdict,
    jti,
    ip,
    reason,
    action,
  });

  // ==========================================
  // 9. SEND CONTEXT TO NEXT ROUTE
  // ==========================================
  req.replayContext = {
    jti,
    consentId,
    usageCount: record.usageCount,
    maxUsage,
    verdict,
  };

  next();
}

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  replayDetector,
  JWT_SECRET,
};