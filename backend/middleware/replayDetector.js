const jwt = require("jsonwebtoken");

const {
  getTokenRecord,
  registerTokenUse,
  logEvent,
} = require("../utils/tokenStore");

const JWT_SECRET = process.env.JWT_SECRET;

async function replayDetector(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const ip =
    req.headers["x-forwarded-for"] || req.ip;

  // ==========================================
  // 1. CHECK AUTHORIZATION HEADER
  // ==========================================

  if (!authHeader.startsWith("Bearer ")) {
    await logEvent({
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

  const token = authHeader.slice(7).trim();

  if (!token) {
    await logEvent({
      verdict: "REJECTED",
      jti: "-",
      ip,
      reason: "Empty consent token",
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
    console.error(
      "JWT verification failed:",
      err.message
    );

    await logEvent({
      verdict: "REJECTED",
      jti: "-",
      ip,
      reason: `Invalid/expired JWT: ${err.message}`,
      action: "BLOCKED",
    });

    return res.status(401).json({
      error: "Invalid or expired token",
      action: "BLOCKED",
    });
  }

  // ==========================================
  // 3. READ PAYLOAD
  // ==========================================

  const {
    jti,
    consentId,
    fiStart,
    fiEnd,
    maxUsage,
  } = payload;

  console.log(
    "========== CONSENT TOKEN DEBUG =========="
  );
  console.log("jti:", jti);
  console.log("consentId:", consentId);
  console.log("fiStart:", fiStart);
  console.log("fiEnd:", fiEnd);
  console.log("maxUsage:", maxUsage);
  console.log("current:", Date.now());
  console.log(
    "========================================="
  );

  // ==========================================
  // 4. VALIDATE PAYLOAD
  // ==========================================

  if (
    !jti ||
    !consentId ||
    fiStart === undefined ||
    fiEnd === undefined ||
    maxUsage === undefined
  ) {
    await logEvent({
      verdict: "REJECTED",
      jti: jti || "-",
      ip,
      reason: "Invalid consent token payload",
      action: "BLOCKED",
    });

    return res.status(403).json({
      error: "Invalid consent token",
      action: "BLOCKED",
    });
  }

  const start = Number(fiStart);
  const end = Number(fiEnd);
  const usageLimit = Number(maxUsage);
  const now = Date.now();

  // ==========================================
  // 5. CHECK CONSENT WINDOW
  // ==========================================

  if (now < start || now > end) {
    console.log(
      "❌ CONSENT WINDOW FAILED"
    );

    await logEvent({
      verdict: "REPLAY_DETECTED",
      jti,
      ip,
      reason:
        "Fetch outside consent date range",
      action: "BLOCKED",
    });

    return res.status(403).json({
      error:
        "Fetch outside consented window",
      action: "BLOCKED",
    });
  }

  // ==========================================
  // 6. CHECK TOKEN USAGE
  // ==========================================

  const existing = getTokenRecord(jti);

  console.log(
    "========== USAGE DEBUG =========="
  );
  console.log("existing:", existing);
  console.log("usageLimit:", usageLimit);
  console.log(
    "================================="
  );

  if (
    existing &&
    Number(existing.usageCount) >=
      Number(existing.maxUsage)
  ) {
    console.log(
      "🚨 REPLAY DETECTED"
    );

    await logEvent({
      verdict: "REPLAY_DETECTED",
      jti,
      ip,
      reason: `Reused beyond limit (${existing.maxUsage})`,
      action: "BLOCKED",
    });

    return res.status(403).json({
      error:
        "Token replay detected",
      action: "BLOCKED",
      jti,
      consentId,
      usageCount:
        existing.usageCount,
      maxUsage:
        existing.maxUsage,
    });
  }

  // ==========================================
  // 7. REGISTER TOKEN USAGE
  // ==========================================

  const record =
    registerTokenUse(
      jti,
      consentId,
      usageLimit,
      ip
    );

  // ==========================================
  // 8. ANOMALY DETECTION
  // ==========================================

  let verdict = "ALLOWED";
  let reason =
    "Valid consent token";
  let action = "ALLOWED";

  if (record.ipsSeen.size > 1) {
    verdict = "ANOMALY";

    reason =
      `Same token used from ${record.ipsSeen.size} different IPs`;

    action = "FLAGGED";
  }

  // ==========================================
  // 9. AUDIT LOG → FIREBASE
  // ==========================================

  await logEvent({
    verdict,
    jti,
    ip,
    reason,
    action,
  });

  // ==========================================
  // 10. SEND FULL CONTEXT TO FRONTEND
  // ==========================================

  req.replayContext = {
    jti,
    consentId,
    usageCount:
      record.usageCount,
    maxUsage:
      record.maxUsage,
    verdict,
    ip,
    reason,
    action,
    fiStart: start,
    fiEnd: end,
  };

  next();
}

module.exports = {
  replayDetector,
  JWT_SECRET,
};