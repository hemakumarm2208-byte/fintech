const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// jti -> { consentId, usageCount, maxUsage, ipsSeen }
const usedTokens = new Map();

// In-memory audit log
const auditLog = [];

// ==========================================
// LOG AUDIT EVENT
// ==========================================

async function logEvent(event) {
  const entry = {
    ts: new Date().toISOString(),
    ...event,
  };

  // Keep local copy
  auditLog.push(entry);

  // Console log
  const tag =
    event.verdict === "REPLAY_DETECTED"
      ? "🚨"
      : event.verdict === "ANOMALY"
      ? "⚠️"
      : "✅";

  console.log(
    `${tag} [${entry.ts}] ${event.verdict} — jti=${entry.jti} ip=${entry.ip} reason=${entry.reason || "-"}`
  );

  // ==========================================
  // SAVE TO FIREBASE
  // ==========================================

  try {
    const db = getFirestore();

    await db.collection("auditLogs").add({
      verdict: event.verdict || null,
      jti: event.jti || null,
      ip: event.ip || null,
      reason: event.reason || null,
      action: event.action || null,

      timestamp: FieldValue.serverTimestamp(),
    });

    console.log("🔥 Audit event saved to Firebase");
  } catch (error) {
    console.error(
      "❌ Firebase audit log save failed:",
      error.message
    );
  }

  return entry;
}

// ==========================================
// GET TOKEN RECORD
// ==========================================

function getTokenRecord(jti) {
  return usedTokens.get(jti);
}

// ==========================================
// REGISTER TOKEN USE
// ==========================================

function registerTokenUse(
  jti,
  consentId,
  maxUsage,
  ip
) {
  if (!usedTokens.has(jti)) {
    usedTokens.set(jti, {
      consentId,
      usageCount: 0,
      maxUsage,
      ipsSeen: new Set(),
    });
  }

  const record = usedTokens.get(jti);

  record.usageCount += 1;

  record.ipsSeen.add(ip);

  return record;
}

// ==========================================
// GET AUDIT LOG
// ==========================================

function getAuditLog() {
  return auditLog;
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getTokenRecord,
  registerTokenUse,
  logEvent,
  getAuditLog,
};