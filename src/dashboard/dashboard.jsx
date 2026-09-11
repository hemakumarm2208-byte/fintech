import React from "react";
import { useState, useEffect } from "react";
import { subscribeToAlerts, addAlert } from "../firebase";
import { useToken } from "../Token/token";
import "./dashboard.css";

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((firebaseAlerts) => {
      setAlerts(firebaseAlerts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const {
    token,
    auditLog,
    lastResult,
    loading: tokenLoading,
    issueToken,
    callFetchData,
    verdictColor,
  } = useToken();

  // 🔥 Simulate attack — same logic as AnomalyAlerts.jsx
  const handleSimulateAttack = async () => {
    setSimulating(true);
    const apps = ["MoneyTracker", "PayApp", "SavingsPlus", "CreditScore"];
    const randomApp = apps[Math.floor(Math.random() * apps.length)];
    const multiplier = (Math.random() * 20 + 5).toFixed(1);
    const currentPull = Math.floor(Math.random() * 1500 + 500);
    const normalAvg = Math.floor(currentPull / multiplier);

    const severityLevels = ["High", "Medium", "Low"];
    const randomSeverity = severityLevels[Math.floor(Math.random() * severityLevels.length)];

    const newAlert = {
      fiu_name: randomApp,
      severity: randomSeverity,
      time_window: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason: `average data pulled per request was ${multiplier}x higher than normal average (${currentPull} vs ~${normalAvg})`,
      risk_score: Math.floor(Math.random() * 30 + 70),
      timestamp: Date.now()
    };

    await addAlert(newAlert);
    setSimulating(false);
  };

  const highCount = alerts.filter((a) => a.severity === "High").length;
  const mediumCount = alerts.filter((a) => a.severity === "Medium").length;
  const appsAffected = new Set(alerts.map((a) => a.fiu_name)).size;
  const recentActivities = alerts.slice(0, 10);

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div>
          <h1>Open Banking Security Monitor</h1>
          <p>Real-Time API Security & Consent Monitoring</p>
        </div>
        <div className="live-status">
          <span className="live-dot"></span>
          LIVE MONITORING
        </div>
      </header>

      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div><p>Total Alerts</p><h2>{alerts.length}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div><p>High Risk Alerts</p><h2>{highCount}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div><p>Medium Risk Alerts</p><h2>{mediumCount}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div><p>Apps Flagged</p><h2>{appsAffected}</h2></div>
        </div>
      </section>

      {/* Token Consent Simulator */}
      <section className="simulator">
        <div>
          <h2>AA Token Replay Attack Detector</h2>
          <p>Simulates an Account Aggregator consent token being reused beyond its allowed limit.</p>
        </div>
        <div className="buttons">
          <button className="normal-btn" onClick={issueToken} disabled={tokenLoading}>
            Issue Consent Token
          </button>
          <button className="danger-btn" onClick={callFetchData} disabled={tokenLoading}>
            Fetch Data (call this 3+ times)
          </button>
        </div>
        {lastResult && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 8,
            background: lastResult.type === "blocked" ? "#fee2e2" : lastResult.type === "success" ? "#dcfce7" : "#e2e8f0",
            color: "#1e293b", fontWeight: 500,
          }}>
            {lastResult.message}
          </div>
        )}
      </section>

      {/* Anomaly Attack Simulator */}
      <section className="simulator">
        <div>
          <h2>Behavioral Anomaly Simulator</h2>
          <p>Generate a simulated anomaly alert to test the live monitoring feed.</p>
        </div>
        <div className="buttons">
          <button className="danger-btn" onClick={handleSimulateAttack} disabled={simulating}>
            {simulating ? "Simulating…" : "Simulate Anomaly Attack"}
          </button>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div><h2>🔴 Live Alert Activity</h2><p>Real-time anomaly alerts</p></div>
            <span className="live-badge">LIVE</span>
          </div>
          <div className="table-container">
            {loading ? (
              <p style={{ padding: "16px" }}>Connecting to secure cloud database…</p>
            ) : recentActivities.length === 0 ? (
              <p style={{ padding: "16px" }}>No alerts yet. Traffic is within normal range.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Time</th><th>App</th><th>Severity</th><th>Reason</th><th>Risk Score</th></tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.time_window}</td>
                      <td><strong>{activity.fiu_name}</strong></td>
                      <td><span className={`risk ${activity.severity?.toLowerCase()}`}>{activity.severity}</span></td>
                      <td>{activity.reason}</td>
                      <td><strong>{activity.risk_score}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel alerts-panel">
          <div className="panel-header">
            <div><h2>🔑 Token Audit Log</h2><p>Consent token usage events</p></div>
            <span className="alert-count">{auditLog.length}</span>
          </div>
          {auditLog.length === 0 && (
            <p style={{ padding: "16px", color: "#64748b" }}>No activity yet — issue a token and fetch data.</p>
          )}
          {auditLog.slice(0, 5).map((entry, i) => (
            <div className={`alert-item ${entry.verdict === "REPLAY_DETECTED" ? "critical" : "warning"}`} key={i}>
              <div className="alert-title">
                <strong style={{ color: verdictColor(entry.verdict) }}>{entry.verdict}</strong>
                <span>{new Date(entry.ts).toLocaleTimeString()}</span>
              </div>
              <p>{entry.reason || "-"}</p>
              <small>IP: {entry.ip}</small>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;