// jti -> { consentId, usageCount, maxUsage, ipsSeen }
const usedTokens = new Map();
const auditLog = [];

function logEvent(event) {
  const entry = { ts: new Date().toISOString(), ...event };
  auditLog.push(entry);
  const tag = event.verdict === "REPLAY_DETECTED" ? "🚨" : event.verdict === "ANOMALY" ? "⚠️" : "✅";
  console.log(`${tag} [${entry.ts}] ${event.verdict} — jti=${event.jti} ip=${event.ip} reason=${event.reason || "-"}`);
  return entry;
}

function getTokenRecord(jti) {
  return usedTokens.get(jti);
}

function registerTokenUse(jti, consentId, maxUsage, ip) {
  if (!usedTokens.has(jti)) {
    usedTokens.set(jti, { consentId, usageCount: 0, maxUsage, ipsSeen: new Set() });
  }
  const record = usedTokens.get(jti);
  record.usageCount += 1;
  record.ipsSeen.add(ip);
  return record;
}

function getAuditLog() {
  return auditLog;
}

module.exports = { getTokenRecord, registerTokenUse, logEvent, getAuditLog };