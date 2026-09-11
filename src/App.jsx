import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./dashboard/dashboard";
import AnomalyAlerts from "./AnomalyAlerts";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/anomaly-alerts" element={<AnomalyAlerts />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;