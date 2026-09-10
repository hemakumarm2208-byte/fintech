import React, { useState } from "react";
import "./dashboard.css";

function Dashboard() {
  const [apiRequests, setApiRequests] = useState(1248);
  const [alerts, setAlerts] = useState(8);

  const [activities, setActivities] = useState([
    {
      id: 1,
      time: "16:28:01",
      thirdParty: "ABC Finance",
      endpoint: "/api/accounts",
      method: "GET",
      status: "SUCCESS",
      risk: "LOW",
      score: 12,
    },
    {
      id: 2,
      time: "16:28:05",
      thirdParty: "XYZ Pay",
      endpoint: "/api/transactions",
      method: "GET",
      status: "SUCCESS",
      risk: "MEDIUM",
      score: 48,
    },
    {
      id: 3,
      time: "16:28:12",
      thirdParty: "FastLoan",
      endpoint: "/api/customer-data",
      method: "GET",
      status: "BLOCKED",
      risk: "HIGH",
      score: 87,
    },
  ]);

  // Simulate normal API request
  const normalRequest = () => {
    const newActivity = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      thirdParty: "ABC Finance",
      endpoint: "/api/accounts",
      method: "GET",
      status: "SUCCESS",
      risk: "LOW",
      score: Math.floor(Math.random() * 30),
    };

    setActivities((prev) => [newActivity, ...prev]);
    setApiRequests((prev) => prev + 1);
  };

  // Simulate suspicious request
  const suspiciousRequest = () => {
    const newActivity = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      thirdParty: "Unknown Partner",
      endpoint: "/api/customer-data",
      method: "GET",
      status: "BLOCKED",
      risk: "HIGH",
      score: Math.floor(Math.random() * 15) + 85,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setApiRequests((prev) => prev + 1);
    setAlerts((prev) => prev + 1);
  };

  return (
    <div className="dashboard">

      {/* Header */}
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

      {/* Statistics */}
      <section className="stats-container">

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <p>Total API Requests</p>
            <h2>{apiRequests}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div>
            <p>Security Alerts</p>
            <h2>{alerts}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔐</div>
          <div>
            <p>Active Consents</p>
            <h2>842</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div>
            <p>Third Parties</p>
            <h2>24</h2>
          </div>
        </div>

      </section>

      {/* Simulator */}
      <section className="simulator">

        <div>
          <h2>API Activity Simulator</h2>
          <p>
            Generate simulated API activity to test real-time monitoring.
          </p>
        </div>

        <div className="buttons">

          <button
            className="normal-btn"
            onClick={normalRequest}
          >
            + Normal Request
          </button>

          <button
            className="danger-btn"
            onClick={suspiciousRequest}
          >
            ⚠ Suspicious Request
          </button>

        </div>

      </section>

      {/* Main Content */}
      <div className="content-grid">

        {/* Live API Activity */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h2>🔴 Live API Activity</h2>
              <p>Real-time API requests</p>
            </div>

            <span className="live-badge">
              LIVE
            </span>
          </div>

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Time</th>
                  <th>Third Party</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>

                {activities.map((activity) => (

                  <tr key={activity.id}>

                    <td>{activity.time}</td>

                    <td>
                      <strong>
                        {activity.thirdParty}
                      </strong>
                    </td>

                    <td>
                      <code>
                        {activity.endpoint}
                      </code>
                    </td>

                    <td>
                      {activity.method}
                    </td>

                    <td>
                      <span
                        className={
                          activity.status === "SUCCESS"
                            ? "status success"
                            : "status blocked"
                        }
                      >
                        {activity.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`risk ${activity.risk.toLowerCase()}`}
                      >
                        {activity.risk}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {activity.score}%
                      </strong>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* Security Alerts */}
        <section className="panel alerts-panel">

          <div className="panel-header">

            <div>
              <h2>🚨 Security Alerts</h2>
              <p>Latest suspicious events</p>
            </div>

            <span className="alert-count">
              {alerts}
            </span>

          </div>

          <div className="alert-item critical">

            <div className="alert-title">
              <strong>High Risk Activity</strong>
              <span>NOW</span>
            </div>

            <p>
              Suspicious API request detected from
              Unknown Partner.
            </p>

            <small>
              Risk Score: 91%
            </small>

          </div>

          <div className="alert-item warning">

            <div className="alert-title">
              <strong>Excessive Data Access</strong>
              <span>2 min ago</span>
            </div>

            <p>
              Unusual number of transaction requests.
            </p>

            <small>
              Risk Score: 82%
            </small>

          </div>

          <div className="alert-item critical">

            <div className="alert-title">
              <strong>Consent Violation</strong>
              <span>5 min ago</span>
            </div>

            <p>
              Third party requested data outside consent scope.
            </p>

            <small>
              Risk Score: 95%
            </small>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Dashboard;