import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./dashboard/dashboard";
import TokenPage from "./Pages/TokenPage";
import AnomalyAlerts from "./AnomalyAlerts";

import "./App.css";

function App() {
  return (
    <Routes>

      {/* Default page */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Token pages */}
      <Route
        path="/token"
        element={<TokenPage />}
      />

      <Route
        path="/token-page"
        element={<TokenPage />}
      />

      {/* Anomaly Alerts */}
      <Route
        path="/anomaly-alerts"
        element={<AnomalyAlerts />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
}

export default App;