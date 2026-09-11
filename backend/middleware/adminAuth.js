const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function adminAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";

  const token = authHeader.replace("Bearer ", "");

  // Token missing
  if (!token) {
    return res.status(401).json({
      error: "Admin authentication required",
    });
  }

  try {
    // Verify token
    const payload = jwt.verify(token, JWT_SECRET);

    // Check admin role
    if (payload.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    // Store admin information
    req.admin = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired admin token",
    });
  }
}

module.exports = adminAuth;