require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { initializeApp, cert } = require("firebase-admin/app");

const {
  replayDetector,
  JWT_SECRET,
} = require("./middleware/replayDetector");

// IMPORTANT:
// getAuditLog is from tokenStore.js
const {
  getAuditLog,
} = require("./utils/tokenStore");

const adminAuth = require("./middleware/adminAuth");

// ===============================
// Firebase Admin SDK
// ===============================

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

// ===============================
// Express App
// ===============================

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// Health Check
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "AA Token Replay Attack Detector backend is running",
  });
});

// ===============================
// Admin Login
// ===============================

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      error: "Invalid admin credentials",
    });
  }

  const token = jwt.sign(
    {
      role: "admin",
      username,
    },
    JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.json({
    message: "Admin login successful",
    token,
  });
});

// ===============================
// Issue Consent Token
// ===============================

app.post("/consent/issue-token", (req, res) => {
  const {
    consentId = "consent-" + uuidv4().slice(0, 8),
    fiWindowDays = 90,
    maxUsage = 3,
  } = req.body || {};

  const now = Date.now();
  const jti = uuidv4();

  const payload = {
    jti,
    consentId,
    fiStart: now,
    fiEnd: now + fiWindowDays * 24 * 60 * 60 * 1000,
    maxUsage,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });

  res.json({
    token,
    payload,
  });
});

// ===============================
// FIU Fetch Data
// ===============================

app.get("/fiu/fetch-data", replayDetector, (req, res) => {
  res.json({
    message: "Data fetched successfully",

    context: req.replayContext,

    dummyData: {
      balance: 45210.5,
    },
  });
});

// ===============================
// Admin Audit Log
// ===============================

app.get("/admin/audit-log", adminAuth, (req, res) => {
  try {
    const logs = getAuditLog();

    res.json(logs);
  } catch (error) {
    console.error("Audit log error:", error);

    res.status(500).json({
      error: "Failed to fetch audit logs",
    });
  }
});

// ===============================
// Start Server
// ===============================

app.listen(3000, () => {
  console.log("=================================");
  console.log("Backend running on port 3000");
  console.log("Admin login: POST /admin/login");
  console.log("Audit log: GET /admin/audit-log");
  console.log("=================================");
});