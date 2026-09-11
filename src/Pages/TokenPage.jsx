
import { useState } from "react";
import { useToken } from "../Token/token";

function TokenPage() {
  const {
    token,
    auditLog,
    lastResult,
    loading,
    issueToken,
    callFetchData,
    refreshAuditLog,
    verdictColor,
    adminLogin: loginFromHook,
    adminLogout: logoutFromHook,
  } = useToken();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [adminLoggedIn, setAdminLoggedIn] = useState(
    !!localStorage.getItem("adminToken")
  );

  const [loginLoading, setLoginLoading] = useState(false);

  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  const adminLogin = async () => {
    setLoginLoading(true);

    try {
      await loginFromHook(username, password);

      setAdminLoggedIn(true);

      setUsername("");
      setPassword("");

      alert("Admin login successful!");

      await refreshAuditLog();
    } catch (error) {
      console.error("Admin login error:", error);
      alert(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // ADMIN LOGOUT
  // ==========================================

  const adminLogout = () => {
    logoutFromHook();
    setAdminLoggedIn(false);
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* ================= HEADER ================= */}

      <h1 style={{ fontSize: 28, marginBottom: 4 }}>
        AA Token Replay Attack Detector
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Simulates an Account Aggregator consent token being reused beyond
        its allowed limit.
      </p>

      {/* ================= ADMIN LOGIN ================= */}

      {!adminLoggedIn ? (
        <div
          style={{
            padding: 20,
            marginBottom: 24,
            border: "1px solid #334155",
            borderRadius: 10,
            background: "#0f172a",
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>
            Admin Login
          </h2>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={adminLogin}
            disabled={loginLoading}
            style={btnStyle("#16a34a")}
          >
            {loginLoading ? "Logging in..." : "Admin Login"}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            marginBottom: 24,
            borderRadius: 8,
            background: "#14532d",
            border: "1px solid #22c55e",
          }}
        >
          <span>✅ Admin authenticated</span>

          <button
            onClick={adminLogout}
            style={{
              ...btnStyle("#dc2626"),
              marginLeft: 12,
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* ================= TOKEN BUTTONS ================= */}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={issueToken}
          disabled={loading}
          style={btnStyle("#3b82f6")}
        >
          Issue Consent Token
        </button>

        <button
          onClick={callFetchData}
          disabled={loading || !token}
          style={btnStyle("#8b5cf6")}
        >
          Fetch Data
        </button>

        {adminLoggedIn && (
          <button
            onClick={refreshAuditLog}
            disabled={loading}
            style={btnStyle("#0891b2")}
          >
            Refresh Audit Log
          </button>
        )}
      </div>

      {/* ================= ACTIVE TOKEN ================= */}

      {token && (
        <div
          style={{
            padding: 12,
            marginBottom: 20,
            border: "1px solid #334155",
            borderRadius: 8,
            background: "#0f172a",
            fontSize: 12,
            color: "#94a3b8",
            wordBreak: "break-all",
          }}
        >
          <strong style={{ color: "#e2e8f0" }}>
            Active Token:
          </strong>{" "}
          {token.slice(0, 50)}...
        </div>
      )}

      {/* ================= LAST RESULT ================= */}

      {lastResult && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,

            background:
              lastResult.type === "blocked"
                ? "#7f1d1d"
                : lastResult.type === "success"
                ? "#14532d"
                : "#1e293b",

            border:
              lastResult.type === "blocked"
                ? "1px solid #ef4444"
                : lastResult.type === "success"
                ? "1px solid #22c55e"
                : "1px solid #334155",
          }}
        >
          <strong>{lastResult.message}</strong>

          {/* FULL FETCH DETAILS */}

          {lastResult.data && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #475569",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  fontSize: 16,
                }}
              >
                Fetch Details
              </h3>

              <div style={detailsGrid}>
                <Detail
                  label="Verdict"
                  value={
                    lastResult.data.context?.verdict ||
                    lastResult.data.action ||
                    "-"
                  }
                />

                <Detail
                  label="Action"
                  value={
                    lastResult.data.context?.action ||
                    lastResult.data.action ||
                    "-"
                  }
                />

                <Detail
                  label="JTI"
                  value={
                    lastResult.data.context?.jti ||
                    lastResult.data.jti ||
                    "-"
                  }
                />

                <Detail
                  label="Consent ID"
                  value={
                    lastResult.data.context?.consentId ||
                    lastResult.data.consentId ||
                    "-"
                  }
                />

                <Detail
                  label="Usage Count"
                  value={
                    lastResult.data.context?.usageCount ??
                    lastResult.data.usageCount ??
                    "-"
                  }
                />

                <Detail
                  label="Max Usage"
                  value={
                    lastResult.data.context?.maxUsage ??
                    lastResult.data.maxUsage ??
                    "-"
                  }
                />

                <Detail
                  label="IP Address"
                  value={
                    lastResult.data.context?.ip ||
                    lastResult.data.ip ||
                    "-"
                  }
                />

                <Detail
                  label="Reason"
                  value={
                    lastResult.data.context?.reason ||
                    lastResult.data.reason ||
                    lastResult.data.error ||
                    "-"
                  }
                />
              </div>

              {/* DUMMY DATA */}

              {lastResult.data.dummyData && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 6,
                    background: "#1e293b",
                  }}
                >
                  <strong>Financial Data</strong>

                  <p
                    style={{
                      marginBottom: 0,
                      color: "#22c55e",
                    }}
                  >
                    Balance: ₹
                    {Number(
                      lastResult.data.dummyData.balance
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= AUDIT LOG ================= */}

      <h2
        style={{
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        Live Audit Log
      </h2>

      <div
        style={{
          border: "1px solid #334155",
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 850,
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#1e293b",
                textAlign: "left",
              }}
            >
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Verdict</th>
              <th style={thStyle}>Token (JTI)</th>
              <th style={thStyle}>IP</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>

          <tbody>
            {auditLog.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {adminLoggedIn
                    ? "No activity yet — issue a token and fetch data."
                    : "Login as admin to view audit logs."}
                </td>
              </tr>
            )}

            {auditLog.map((entry, i) => (
              <tr
                key={i}
                style={{
                  borderTop:
                    "1px solid #334155",
                }}
              >
                {/* TIME */}

                <td style={tdStyle}>
                  {entry.ts
                    ? new Date(
                        entry.ts
                      ).toLocaleTimeString()
                    : "-"}
                </td>

                {/* VERDICT */}

                <td
                  style={{
                    ...tdStyle,
                    color: verdictColor(
                      entry.verdict
                    ),
                    fontWeight: 600,
                  }}
                >
                  {entry.verdict || "-"}
                </td>

                {/* JTI */}

                <td style={tdStyle}>
                  {entry.jti
                    ? `${entry.jti.slice(0, 8)}...`
                    : "-"}
                </td>

                {/* IP */}

                <td style={tdStyle}>
                  {entry.ip || "-"}
                </td>

                {/* ACTION */}

                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 600,
                  }}
                >
                  {entry.action || "-"}
                </td>

                {/* REASON */}

                <td style={tdStyle}>
                  {entry.reason || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= STATUS ================= */}

      {adminLoggedIn && (
        <p
          style={{
            marginTop: 12,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          🔥 Audit events are recorded by the backend
          and stored in Firebase.
        </p>
      )}
    </div>
  );
}

// ==========================================
// DETAIL COMPONENT
// ==========================================

function Detail({ label, value }) {
  return (
    <div
      style={{
        padding: 10,
        background: "#1e293b",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#f8fafc",
          wordBreak: "break-word",
        }}
      >
        {String(value)}
      </div>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const detailsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
};

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1e293b",
  color: "white",
  fontSize: 14,
};

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

const thStyle = {
  padding: "10px 12px",
  fontWeight: 600,
  color: "#94a3b8",
};

const tdStyle = {
  padding: "10px 12px",
};

export default TokenPage;

