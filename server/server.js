require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const net = require("net");

const pool = require("./db");

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = process.env.PORT || 8080;

// ============================================================
// SECURITY SETTINGS
// ============================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "development-secret-change-this";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_WINDOW_MINUTES = 15;

// ============================================================
// TRUST RAILWAY PROXY
// ============================================================

app.set("trust proxy", 1);

// ============================================================
// ALLOWED FRONTEND ORIGINS
// ============================================================

const allowedOrigins = [
  "https://tiktok-api.up.railway.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================================
// JSON
// ============================================================

app.use(express.json());

// ============================================================
// GET CLIENT IP
// ============================================================

function getClientIP(req) {
  let ip = req.ip;

  if (!ip) {
    const forwarded = req.headers["x-forwarded-for"];

    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    }
  }

  if (!ip) {
    ip = req.socket.remoteAddress;
  }

  if (!ip) {
    return "Unknown";
  }

  // Convert IPv6 localhost format
  if (ip === "::1") {
    return "127.0.0.1";
  }

  // Convert IPv4-mapped IPv6
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
}

// ============================================================
// RECORD LOGIN ATTEMPT
// ============================================================

async function recordLoginAttempt({
  name,
  phone,
  ip,
  status,
  userAgent,
}) {
  try {
    await pool.query(
      `
      INSERT INTO login_attempts
      (
        name,
        phone,
        ip_address,
        status,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        name || null,
        phone || null,
        ip,
        status,
        userAgent || null,
      ]
    );

    console.log(
      `SECURITY LOG: ${status} | IP: ${ip} | Name: ${name || "Unknown"}`
    );
  } catch (error) {
    console.error(
      "SECURITY LOG DATABASE ERROR:",
      error.message
    );
  }
}

// ============================================================
// CHECK BRUTE FORCE
// ============================================================

async function checkBruteForce(ip) {
  try {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS failedAttempts
      FROM login_attempts
      WHERE ip_address = ?
      AND status = 'FAILED'
      AND attempt_time >= DATE_SUB(
        NOW(),
        INTERVAL ${BLOCK_WINDOW_MINUTES} MINUTE
      )
      `,
      [ip]
    );

    const failedAttempts =
      Number(rows[0]?.failedAttempts || 0);

    return {
      blocked:
        failedAttempts >= MAX_FAILED_ATTEMPTS,

      failedAttempts,
    };
  } catch (error) {
    console.error(
      "BRUTE FORCE CHECK ERROR:",
      error.message
    );

    // Fail open so a database logging problem
    // does not accidentally lock everyone out.
    return {
      blocked: false,
      failedAttempts: 0,
    };
  }
}

// ============================================================
// BASIC API TEST
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TikTok Clone API is running!",
  });
});

// ============================================================
// DATABASE TEST
// ============================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT 1 AS test"
    );

    return res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      database: rows,
    });
  } catch (error) {
    console.error(
      "DATABASE TEST ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

// ============================================================
// SIGN UP
// NAME + PHONE ONLY
// ============================================================

app.post("/api/signup", async (req, res) => {
  try {
    const { username, phone } = req.body;

    // --------------------------------------------------------
    // VALIDATE USERNAME
    // --------------------------------------------------------

    if (
      !username ||
      typeof username !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE PHONE
    // --------------------------------------------------------

    if (
      !phone ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your phone number.",
      });
    }

    const cleanUsername =
      username.trim();

    const cleanPhone =
      phone.trim();

    // --------------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------------

    if (cleanUsername.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE FORMAT
    // --------------------------------------------------------

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 numbers.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE DUPLICATE
    // --------------------------------------------------------

    const [existingPhone] =
      await pool.query(
        "SELECT id FROM users WHERE phone = ? LIMIT 1",
        [cleanPhone]
      );

    if (existingPhone.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already registered.",
      });
    }

    // --------------------------------------------------------
    // CHECK USERNAME DUPLICATE
    // --------------------------------------------------------

    const [existingUsername] =
      await pool.query(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [cleanUsername]
      );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This username is already registered.",
      });
    }

    // --------------------------------------------------------
    // CREATE NORMAL USER
    // --------------------------------------------------------

    const [result] =
      await pool.query(
        `
        INSERT INTO users
        (
          username,
          phone,
          coins,
          role
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          cleanUsername,
          cleanPhone,
          5000,
          "user",
        ]
      );

    // --------------------------------------------------------
    // GET NEW USER
    // --------------------------------------------------------

    const [newUserRows] =
      await pool.query(
        `
        SELECT
          id,
          username,
          phone,
          coins,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

    if (newUserRows.length === 0) {
      return res.status(500).json({
        success: false,
        message:
          "Account was created but could not be retrieved.",
      });
    }

    const newUser =
      newUserRows[0];

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user: newUser,
      token,
    });

  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// ============================================================
// LOGIN
// NAME + PHONE ONLY
// WITH SECURITY LOGGING
// ============================================================

app.post("/api/login", async (req, res) => {
  const ip = getClientIP(req);

  const userAgent =
    req.headers["user-agent"] || "Unknown";

  const username =
    typeof req.body?.username === "string"
      ? req.body.username.trim()
      : "";

  const phone =
    typeof req.body?.phone === "string"
      ? req.body.phone.trim()
      : "";

  console.log(
    "================================="
  );

  console.log("LOGIN REQUEST");

  console.log("Name:", username);

  console.log("Phone:", phone);

  console.log("IP:", ip);

  console.log(
    "================================="
  );

  try {
    // ========================================================
    // BRUTE FORCE CHECK
    // ========================================================

    const bruteForce =
      await checkBruteForce(ip);

    if (bruteForce.blocked) {
      await recordLoginAttempt({
        name: username,
        phone,
        ip,
        status: "BLOCKED",
        userAgent,
      });

      return res.status(429).json({
        success: false,
        blocked: true,
        message:
          "Too many failed login attempts. Please try again later.",
      });
    }

    // ========================================================
    // VALIDATE USERNAME
    // ========================================================

    if (!username) {
      await recordLoginAttempt({
        name: username,
        phone,
        ip,
        status: "FAILED",
        userAgent,
      });

      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // ========================================================
    // VALIDATE PHONE
    // ========================================================

    if (!phone) {
      await recordLoginAttempt({
        name: username,
        phone,
        ip,
        status: "FAILED",
        userAgent,
      });

      return res.status(400).json({
        success: false,
        message:
          "Please enter your phone number.",
      });
    }

    // ========================================================
    // PHONE FORMAT
    // ========================================================

    if (!/^09\d{9}$/.test(phone)) {
      await recordLoginAttempt({
        name: username,
        phone,
        ip,
        status: "FAILED",
        userAgent,
      });

      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 numbers.",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const [users] =
      await pool.query(
        `
        SELECT
          id,
          username,
          phone,
          coins,
          role
        FROM users
        WHERE username = ?
        AND phone = ?
        LIMIT 1
        `,
        [username, phone]
      );

    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (users.length === 0) {
      await recordLoginAttempt({
        name: username,
        phone,
        ip,
        status: "FAILED",
        userAgent,
      });

      return res.status(401).json({
        success: false,
        message:
          "Name and phone number do not match.",
      });
    }

    // ========================================================
    // USER FOUND
    // ========================================================

    const user = users[0];

    // ========================================================
    // RECORD SUCCESS
    // ========================================================

    await recordLoginAttempt({
      name: user.username,
      phone: user.phone,
      ip,
      status: "SUCCESS",
      userAgent,
    });

    // ========================================================
    // CREATE JWT
    // ========================================================

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "LOGIN SUCCESS:",
      user.username,
      "| IP:",
      ip,
      "| Role:",
      user.role
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user,
      token,
    });

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "LOGIN ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "================================="
    );

    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
});

// ============================================================
// AUTHENTICATE TOKEN
// ============================================================

function authenticateToken(req, res, next) {
  const authHeader =
    req.headers.authorization;

  const token =
    authHeader &&
    authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// ============================================================
// ADMIN AUTHORIZATION
// ============================================================

async function requireAdmin(
  req,
  res,
  next
) {
  try {
    if (!req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required.",
      });
    }

    const [rows] =
      await pool.query(
        `
        SELECT
          id,
          username,
          phone,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [req.user.id]
      );

    if (
      rows.length === 0 ||
      rows[0].role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Administrator access required.",
      });
    }

    req.admin = rows[0];

    next();

  } catch (error) {
    console.error(
      "ADMIN AUTH ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify administrator access.",
    });
  }
}

// ============================================================
// SECURITY LOGIN LOGS
// ============================================================

app.get(
  "/api/admin/security-logs",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [rows] =
        await pool.query(
          `
          SELECT
            id,
            name,
            phone,
            ip_address,
            status,
            attempt_time,
            user_agent
          FROM login_attempts
          ORDER BY attempt_time DESC
          LIMIT 200
          `
        );

      return res.status(200).json({
        success: true,
        logs: rows,
      });

    } catch (error) {
      console.error(
        "SECURITY LOGS ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve security logs.",
      });
    }
  }
);

// ============================================================
// SECURITY SUMMARY
// ============================================================

app.get(
  "/api/admin/security-summary",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [rows] =
        await pool.query(
          `
          SELECT
            SUM(
              CASE
                WHEN status = 'SUCCESS'
                THEN 1
                ELSE 0
              END
            ) AS successful,

            SUM(
              CASE
                WHEN status = 'FAILED'
                THEN 1
                ELSE 0
              END
            ) AS failed,

            SUM(
              CASE
                WHEN status = 'BLOCKED'
                THEN 1
                ELSE 0
              END
            ) AS blocked

          FROM login_attempts
          `
        );

      const summary =
        rows[0] || {};

      return res.status(200).json({
        success: true,

        successful:
          Number(
            summary.successful || 0
          ),

        failed:
          Number(
            summary.failed || 0
          ),

        blocked:
          Number(
            summary.blocked || 0
          ),
      });

    } catch (error) {
      console.error(
        "SECURITY SUMMARY ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve security summary.",
      });
    }
  }
);

// ============================================================
// PORT CHECKER
// ============================================================
// This checks ONLY the server's localhost.
// It does not scan arbitrary remote machines.
// ============================================================

app.post(
  "/api/admin/port-check",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const selectedPort =
      Number(req.body?.port);

    if (
      !Number.isInteger(selectedPort) ||
      selectedPort < 1 ||
      selectedPort > 65535
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Port must be a number from 1 to 65535.",
      });
    }

    const socket =
      new net.Socket();

    let finished = false;

    const finish = (open) => {
      if (finished) {
        return;
      }

      finished = true;

      socket.destroy();

      return res.status(200).json({
        success: true,
        port: selectedPort,
        host: "127.0.0.1",
        open,
      });
    };

    socket.setTimeout(2000);

    socket.once(
      "connect",
      () => finish(true)
    );

    socket.once(
      "timeout",
      () => finish(false)
    );

    socket.once(
      "error",
      () => finish(false)
    );

    socket.connect(
      selectedPort,
      "127.0.0.1"
    );
  }
);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================="
    );

    console.log(
      `TikTok Clone API running on port ${PORT}`
    );

    console.log(
      "Security features enabled."
    );

    console.log(
      "================================="
    );
  }
);