import { useToken } from "../Token/token";

function TokenPage() {
  const {
    token,
    auditLog,
    lastResult,
    loading,
    issueToken,
    callFetchData,
    verdictColor,
  } = useToken();

  return (
    <div style={{ maxWidth: 900, margin: "0px auto ", padding: 24, fontFamily: "system-ui, sans-serif", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}> AA Token Replay Attack Detector</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Simulates an Account Aggregator consent token being reused beyond its allowed limit.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button onClick={issueToken} disabled={loading} style={btnStyle("#3b82f6")}>
          Issue Consent Token
        </button>
        <button onClick={callFetchData} disabled={loading} style={btnStyle("#8b5cf6")}>
           Fetch Data (call this 3+ times)
        </button>
      </div>

      {token && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, wordBreak: "break-all" }}>
          Active token: {token.slice(0, 40)}...
        </div>
      )}

      {lastResult && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
            background: lastResult.type === "blocked" ? "#7f1d1d" : lastResult.type === "success" ? "#14532d" : "#1e293b",
            border: `1px solid ${lastResult.type === "blocked" ? "#ef4444" : lastResult.type === "success" ? "#22c55e" : "#334155"}`,
          }}
        >
          {lastResult.message}
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Live Audit Log</h2>
      <div style={{ border: "1px solid #334155", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1e293b", textAlign: "left" }}>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Verdict</th>
              <th style={thStyle}>Token (jti)</th>
              <th style={thStyle}>IP</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                  No activity yet — issue a token and fetch data.
                </td>
              </tr>
            )}
            {auditLog.map((entry, i) => (
              <tr key={i} style={{ borderTop: "1px solid #334155" }}>
                <td style={tdStyle}>{new Date(entry.ts).toLocaleTimeString()}</td>
                <td style={{ ...tdStyle, color: verdictColor(entry.verdict), fontWeight: 600 }}>{entry.verdict}</td>
                <td style={tdStyle}>{entry.jti?.slice(0, 8)}</td>
                <td style={tdStyle}>{entry.ip}</td>
                <td style={tdStyle}>{entry.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnStyle = (color) => ({
  padding: "10px 18px",
  background: color,
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
});

const thStyle = { padding: "10px 12px", fontWeight: 600, color: "#94a3b8" };
const tdStyle = { padding: "10px 12px" };

export default TokenPage;