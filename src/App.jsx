import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import "./App.css";

function App() {
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // =========================
  // LIVE API REQUESTS
  // =========================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "api_requests"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a, b) => {
          const timeA = a.created_at?.seconds || 0;
          const timeB = b.created_at?.seconds || 0;

          return timeB - timeA;
        });

        setRequests(data);
      },
      (error) => {
        console.error("API Requests Error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // LIVE SECURITY ALERTS
  // =========================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "security_alerts"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a, b) => {
          const timeA = a.created_at?.seconds || 0;
          const timeB = b.created_at?.seconds || 0;

          return timeB - timeA;
        });

        setAlerts(data);
      },
      (error) => {
        console.error("Security Alerts Error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // NORMAL REQUEST
  // =========================
  const generateNormalRequest = async () => {
    try {
      const score = Math.floor(Math.random() * 20) + 5;

      await addDoc(collection(db, "api_requests"), {
        third_party: "Trusted Bank",
        endpoint: "/api/accounts",
        method: "GET",
        status: "SUCCESS",
        risk: "LOW",
        risk_score: score,
        attack_type: "Normal Activity",
        source: "My Dashboard",
        time: new Date().toLocaleTimeString(),
        created_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Normal Request Error:", error);
    }
  };

  // =========================
  // SUSPICIOUS REQUEST
  // =========================
  const generateSuspiciousRequest = async () => {
    try {
      const score = Math.floor(Math.random() * 15) + 85;

      await addDoc(collection(db, "api_requests"), {
        third_party: "Unknown Partner",
        endpoint: "/api/customer-data",
        method: "GET",
        status: "BLOCKED",
        risk: "HIGH",
        risk_score: score,
        attack_type: "Suspicious Activity",
        source: "My Dashboard",
        time: new Date().toLocaleTimeString(),
        created_at: serverTimestamp(),
      });

      await addDoc(collection(db, "security_alerts"), {
        third_party: "Unknown Partner",
        endpoint: "/api/customer-data",
        risk: "HIGH",
        risk_score: score,
        attack_type: "Suspicious Activity",
        reason: "Suspicious access to sensitive customer data",
        source: "My Dashboard",
        created_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Suspicious Request Error:", error);
    }
  };

  // =========================
  // ATTACK TYPE STYLE
  // =========================
  const getAttackClass = (attack) => {
    if (!attack) return "normal";

    const value = attack.toLowerCase();

    if (value.includes("token")) return "token";
    if (value.includes("excessive")) return "excessive";
    if (value.includes("consent")) return "consent";
    if (value.includes("abnormal")) return "abnormal";

    return "normal";
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>🔐 Open Banking Security Monitor</h1>

          <p>
            AI-powered API security and third-party risk monitoring
          </p>
        </div>

        <div className="live-status">
          ● SYSTEM ONLINE
        </div>
      </header>

      <main className="container">

        {/* TITLE */}
        <section>
          <h2 className="section-title">
            Live Security Monitoring
          </h2>

          <p className="section-subtitle">
            Real-time API activity and security analysis
          </p>
        </section>

        {/* STAT CARDS */}
        <section className="stats">

          <div className="card">
            <div className="icon">📡</div>

            <h3>{requests.length}</h3>

            <p>API Requests</p>
          </div>

          <div className="card">
            <div className="icon">🚨</div>

            <h3>{alerts.length}</h3>

            <p>Security Alerts</p>
          </div>

          <div className="card">
            <div className="icon">🔑</div>

            <h3>842</h3>

            <p>Active Consents</p>
          </div>

          <div className="card">
            <div className="icon">🏢</div>

            <h3>24</h3>

            <p>Third Parties</p>
          </div>

        </section>

        {/* SIMULATOR */}
        <section className="simulator">

          <h2>API Activity Simulator</h2>

          <p>
            Generate requests to test the security monitoring system.
          </p>

          <div className="buttons">

            <button
              className="btn btn-normal"
              onClick={generateNormalRequest}
            >
              ☑️ Generate Normal Request
            </button>

            <button
              className="btn btn-suspicious"
              onClick={generateSuspiciousRequest}
            >
              🚨 Generate Suspicious Request
            </button>

          </div>

        </section>

        {/* LIVE API ACTIVITY */}
        <section className="table-card">

          <div className="table-title">

            <div>
              <h2>Live API Activity</h2>

              <p>
                Real-time data from Firebase Firestore
              </p>
            </div>

            <span>● LIVE</span>

          </div>

          {requests.length === 0 ? (

            <p>No API requests found</p>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Time</th>
                    <th>Third Party</th>
                    <th>Attack Type</th>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Risk</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {requests.map((request) => (

                    <tr key={request.id}>

                      <td>
                        {request.time || "-"}
                      </td>

                      <td>
                        {request.third_party || "-"}
                      </td>

                      <td>
                        <span
                          className={`attack-badge ${getAttackClass(
                            request.attack_type
                          )}`}
                        >
                          {request.attack_type || "Normal Activity"}
                        </span>
                      </td>

                      <td>
                        {request.endpoint || "-"}
                      </td>

                      <td>
                        {request.method || "GET"}
                      </td>

                      <td>

                        <span
                          className={`badge ${
                            request.risk?.toLowerCase()
                          }`}
                        >
                          {request.risk || "-"}
                        </span>

                      </td>

                      <td>
                        {request.risk_score ?? "-"}
                      </td>

                      <td>

                        <span
                          className={`badge ${
                            request.status?.toLowerCase()
                          }`}
                        >
                          {request.status || "-"}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* SECURITY ALERTS */}
        <section className="alerts">

          <h2>🚨 Security Alerts</h2>

          {alerts.length === 0 ? (

            <p>No security alerts found.</p>

          ) : (

            alerts.slice(0, 10).map((alert) => (

              <div className="alert" key={alert.id}>

                <div className="alert-title">
                  🚨 {alert.attack_type || "HIGH RISK ACTIVITY"}
                </div>

                <p>
                  <strong>
                    {alert.third_party || "Unknown Partner"}
                  </strong>

                  {" "}accessed{" "}

                  {alert.endpoint || "-"}
                </p>

                <p>
                  Risk Score:{" "}
                  <strong>
                    {alert.risk_score ?? "-"}
                  </strong>
                </p>

                <p>
                  {alert.reason ||
                    "Suspicious activity detected"}
                </p>

                <small>
                  Source: {alert.source || "Security System"}
                </small>

              </div>

            ))

          )}

        </section>

      </main>

    </div>
  );
}

export default App;