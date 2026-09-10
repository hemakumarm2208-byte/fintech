import { useState, useEffect } from "react";
import { addAlert, subscribeToAlerts } from "./firebase";
import "./AnomalyAlerts.css";

function AnomalyAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastScan, setLastScan] = useState(new Date());

  // 1. Firebase-la irundhu real-time data edukka
  useEffect(() => {
    const unsubscribe = subscribeToAlerts((firebaseAlerts) => {
      setAlerts(firebaseAlerts);
      setLoading(false);
      setLastScan(new Date());
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  // 2. Attack Simulate panni Firebase-ku anuppa
  const handleSimulateAttack = async () => {
    setSimulating(true);
    const apps = ["MoneyTracker", "PayApp", "SavingsPlus", "CreditScore"];
    const randomApp = apps[Math.floor(Math.random() * apps.length)];
    const multiplier = (Math.random() * 20 + 5).toFixed(1);
    const currentPull = Math.floor(Math.random() * 1500 + 500);
    const normalAvg = Math.floor(currentPull / multiplier);

    // Random severity generate panna (High, Medium, Low)
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

    await addAlert(newAlert); // Cloud-ku anupudhu!
    setSimulating(false);
  };

  // 3. Stats calculate panna (Corrected logic for counts)
  const highCount = alerts.filter((a) => a.severity === "High" || a.severity === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.severity === "Medium" || a.severity === "MEDIUM").length;
  const lowCount = alerts.filter((a) => a.severity === "Low" || a.severity === "LOW").length;
  const appsAffected = new Set(alerts.map((a) => a.fiu_name)).size;

  const formatTime = (date) =>
    date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className="console">
      <div className="console-inner">
        <header className="console-header">
          <div className="console-title-group">
            <h1>SentinelAA</h1>
            <p className="console-subtitle">Behavioral anomaly monitoring — Account Aggregator API traffic</p>
          </div>
          <div className="live-status">
            <span className="pulse-dot" />
            last scan {formatTime(lastScan)}
          </div>
        </header>

        <section className="stat-strip">
          <div className="stat-cell">
            <div className={`stat-value ${highCount > 0 ? "critical" : "ok"}`}>{highCount}</div>
            <div className="stat-label">High severity</div>
          </div>
          <div className="stat-cell">
            <div className={`stat-value ${mediumCount > 0 ? "warning" : "ok"}`}>{mediumCount}</div>
            <div className="stat-label">Medium severity</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value ok">{appsAffected}</div>
            <div className="stat-label">Apps flagged</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value ok">{alerts.length}</div>
            <div className="stat-label">Total alerts</div>
          </div>
        </section>

        <div className="controls">
          <button className="btn" onClick={() => window.location.reload()}>Rescan traffic</button>
          <button className="btn btn-primary" onClick={handleSimulateAttack} disabled={simulating}>
            {simulating ? "Simulating…" : "Simulate attack"}
          </button>
        </div>

        {loading && <div className="state-panel">Connecting to secure cloud database…</div>}

        {!loading && alerts.length === 0 && (
          <div className="state-panel">No anomalies in the current window. Traffic is within normal range.</div>
        )}

        {!loading && alerts.length > 0 && (
          <>
            <p className="log-heading">{alerts.length} alerts, ranked by risk score</p>
            <div className="alert-log">
              {alerts.map((alert) => (
                <div className="alert-row" key={alert.id}>
                  <div className={`severity-bar ${alert.severity}`} />
                  <div className="alert-content">
                    <div className="alert-top-line">
                      <span className="alert-app">{alert.fiu_name}</span>
                      <span className="alert-meta">
                        <span className={`severity-tag ${alert.severity}`}>{alert.severity}</span>
                        {alert.time_window}
                      </span>
                    </div>
                    <p className="alert-reason">{alert.reason}</p>
                    <div className="risk-bar-track">
                      <div className={`risk-bar-fill ${alert.severity}`} style={{ width: `${alert.risk_score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnomalyAlerts;