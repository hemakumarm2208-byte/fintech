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

  const issueToken = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/consent/issue-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consentId: "loan-underwriting-001",
            fiWindowDays: 90,
            maxUsage: 2,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Token issue failed");
      }

      // Save token metadata to Firebase
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
        message:
          "New consent token issued (max 2 uses allowed)",
      });
    } catch (err) {
      console.error(err);

      setLastResult({
        type: "error",
        message:
          err.message || "Backend not reachable.",
      });
    }

    setLoading(false);
  };

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
      const res = await fetch(
        `${BACKEND_URL}/fiu/fetch-data`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setLastResult({
          type: "success",
          message: `Fetch succeeded (usage ${data.context.usageCount}/${data.context.maxUsage})`,
        });
      } else {
        setLastResult({
          type: "blocked",
          message: `${data.error} (${data.action})`,
        });
      }
    } catch (err) {
      console.error(err);

      setLastResult({
        type: "error",
        message: "Backend not reachable.",
      });
    }

    await refreshAuditLog();
    setLoading(false);
  };

  const ALLOWED_VERDICTS = [
    "ALLOWED",
    "REPLAY_DETECTED",
    "ANOMALY",
  ];

  const refreshAuditLog = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/audit-log`
      );

      const data = await res.json();

      // Show audit logs in UI
      setAuditLog([...data].reverse());

      // Save latest audit log to Firebase
      if (data.length > 0) {
        const latestLog = data[data.length - 1];

        if (
          ALLOWED_VERDICTS.includes(
            latestLog.verdict
          )
        ) {
          await addDoc(collection(db, "auditLogs"), {
            verdict: latestLog.verdict,
            jti: latestLog.jti || null,
            ip: latestLog.ip || null,
            reason: latestLog.reason || null,
            action: latestLog.action || null,
            createdAt: serverTimestamp(),
          });

          console.log(
            "Audit log saved to Firebase"
          );
        } else {
          console.warn(
            "Skipped Firebase save — unknown verdict:",
            latestLog.verdict
          );
        }
      }
    } catch (err) {
      console.error(
        "Audit log error:",
        err
      );
    }
  };

  const verdictColor = (verdict) => {
    if (verdict === "ALLOWED")
      return "#22c55e";

    if (verdict === "REPLAY_DETECTED")
      return "#ef4444";

    if (verdict === "ANOMALY")
      return "#f59e0b";

    return "#94a3b8";
  };

  return {
    token,
    auditLog,
    lastResult,
    loading,
    issueToken,
    callFetchData,
    verdictColor,
  };
}