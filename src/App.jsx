import { Routes, Route } from "react-router-dom";
import "./index.css";
import TokenPage from "./Pages/TokenPage";

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", width: "100%" }}>
      <Routes>
        <Route path="/" element={<TokenPage />} />
      </Routes>
    </div>
  );
}

export default App;