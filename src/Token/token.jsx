import { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const BACKEND_URL = "http://localhost:3000";

export function useToken() {
  const [token, setToken] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // ADMIN LOGIN (kept for future use, not required now)
  // ==========================================

  const adminLogin = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Admin login failed");
      }

      localStorage.setItem("adminToken", data.token);

      console.log("Admin login successful");

      return data;
    } catch (err) {
      console.error("Admin login error:", err);
      throw err;
    }
  };

  // ==========================================
  // ADMIN LOGOUT
  // ==========================================

  const adminLogout = () => {
    localStorage.removeItem("adminToken");
    setAuditLog([]);
  };

  // ==========================================
  // ISSUE CONSENT TOKEN
  // ==========================================

  const issueToken = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/consent/issue-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consentId: "loan-underwriting-001",
          fiWindowDays: 90,
          maxUsage: 2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Token issue failed");
      }

      // ======================================
      // SAVE TOKEN DETAILS TO FIREBASE
      // ======================================

      await addDoc(collection(db, "tokens"), {
        consentId: "loan-underwriting-001",
        fiWindowDays: 90,
        maxUsage: 2,
        status: "ISSUED",
        createdAt: serverTimestamp(),
      });

      setToken(data.token);

      setLastResult({
        type: "info",
        message: "New consent token issued (max 2 uses allowed)",
      });

      console.log("🔥 Token details saved to Firebase");
    } catch (err) {
      console.error("Token issue error:", err);

      setLastResult({
        type: "error",
        message: err.message || "Backend not reachable.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH DATA USING CONSENT TOKEN
  // ==========================================

  const callFetchData = async () => {
    if (!token) {
      setLastResult({
        type: "error",
        message: "Issue a token first!",
      });

      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/fiu/fetch-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("Fetch response:", data);

      if (res.ok) {
        const usage = data.context?.usageCount ?? "-";
        const maxUsage = data.context?.maxUsage ?? "-";

        setLastResult({
          type: "success",
          message: `Fetch succeeded (usage ${usage}/${maxUsage})`,
          data: data,
        });
      } else {
        setLastResult({
          type: "blocked",
          message: `${data.error || "Request blocked"} (${data.action || "BLOCKED"})`,
          data: data,
        });
      }
    } catch (err) {
      console.error("Fetch data error:", err);

      setLastResult({
        type: "error",
        message: "Backend not reachable.",
      });
    } finally {
      setLoading(false);
    }

    // ========================================
    // REFRESH AUDIT LOG
    // DON'T BLOCK FETCH LOADING
    // ========================================

    refreshAuditLog().catch((err) => {
      console.error("Audit refresh failed:", err);
    });
  };

  // ==========================================
  // REFRESH AUDIT LOG (backend is public, no auth needed)
  // ==========================================

  const refreshAuditLog = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/audit-log`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Audit log fetch failed:", res.status, errorData);
        return;
      }

      const data = await res.json();

      console.log("Audit log:", data);

      if (!Array.isArray(data)) {
        console.warn("Audit log response not an array:", data);
        return;
      }

      setAuditLog([...data].reverse());
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  // ==========================================
  // VERDICT COLOR
  // ==========================================

  const verdictColor = (verdict) => {
    if (verdict === "ALLOWED") {
      return "#22c55e";
    }

    if (verdict === "REPLAY_DETECTED") {
      return "#ef4444";
    }

    if (verdict === "ANOMALY") {
      return "#f59e0b";
    }

    if (verdict === "REJECTED") {
      return "#ef4444";
    }

    return "#94a3b8";
  };

  // ==========================================
  // RETURN
  // ==========================================

  return {
    token,
    auditLog,
    lastResult,
    loading,

    issueToken,
    callFetchData,
    refreshAuditLog,

    adminLogin,
    adminLogout,

    verdictColor,
  };
}