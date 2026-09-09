require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = process.env.PORT || 8080;

// ============================================================
// CORS
// ============================================================
//
// FRONTEND = https://tiktok-api-com.up.railway.app
// BACKEND  = https://tiktok-api.up.railway.app
//
// The FRONTEND must be allowed to send requests to the BACKEND.
// ============================================================

const allowedOrigins = [
  "https://tiktok-api-com.up.railway.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests that don't have an Origin header
      // Example: opening the API directly in a browser
      if (!origin) {
        return callback(null, true);
      }

      // Allow our frontend
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================================
// JSON
// ============================================================

app.use(express.json());

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
    const [rows] = await pool.query("SELECT 1 AS test");

    res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      database: rows,
    });
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

// ============================================================
// SIGN UP
// USERNAME + PHONE ONLY
// ============================================================

app.post("/api/signup", async (req, res) => {
  try {
    const { username, phone } = req.body;

    console.log("=================================");
    console.log("SIGNUP REQUEST");
    console.log("Username:", username);
    console.log("Phone:", phone);
    console.log("=================================");

    // ----------------------------------------------------------
    // Validate username
    // ----------------------------------------------------------

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // ----------------------------------------------------------
    // Validate phone
    // ----------------------------------------------------------

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    // ----------------------------------------------------------
    // Check if phone already exists
    // ----------------------------------------------------------

    const [existingPhone] = await pool.query(
      "SELECT id FROM users WHERE phone = ? LIMIT 1",
      [cleanPhone]
    );

    if (existingPhone.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // ----------------------------------------------------------
    // Check if username already exists
    // ----------------------------------------------------------

    const [existingUsername] = await pool.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [cleanUsername]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This username is already registered.",
      });
    }

    // ----------------------------------------------------------
    // Create account
    // ----------------------------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO users
      (username, phone, coins)
      VALUES (?, ?, ?)
      `,
      [cleanUsername, cleanPhone, 5000]
    );

    // ----------------------------------------------------------
    // Get newly created user
    // ----------------------------------------------------------

    const [newUserRows] = await pool.query(
      `
      SELECT id, username, phone, coins
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    if (newUserRows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Account was created but could not be retrieved.",
      });
    }

    const newUser = newUserRows[0];

    // ----------------------------------------------------------
    // Create JWT token
    // ----------------------------------------------------------

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
      },
      process.env.JWT_SECRET || "development-secret",
      {
        expiresIn: "7d",
      }
    );

    console.log("SIGNUP SUCCESS:", newUser);

    // ----------------------------------------------------------
    // Return success
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: newUser,
      token: token,
    });
  } catch (error) {
    console.error("=================================");
    console.error("SIGNUP ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// ============================================================
// LOGIN
// USERNAME + PHONE ONLY
// ============================================================

app.post("/api/login", async (req, res) => {
  try {
    const { username, phone } = req.body;

    console.log("=================================");
    console.log("LOGIN REQUEST");
    console.log("Username:", username);
    console.log("Phone:", phone);
    console.log("=================================");

    // ----------------------------------------------------------
    // Validate username
    // ----------------------------------------------------------

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // ----------------------------------------------------------
    // Validate phone
    // ----------------------------------------------------------

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    // ----------------------------------------------------------
    // Find user
    // ----------------------------------------------------------

    const [users] = await pool.query(
      `
      SELECT id, username, phone, coins
      FROM users
      WHERE username = ?
      AND phone = ?
      LIMIT 1
      `,
      [cleanUsername, cleanPhone]
    );

    // ----------------------------------------------------------
    // User doesn't exist
    // ----------------------------------------------------------

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Name and phone number do not match.",
      });
    }

    const user = users[0];

    // ----------------------------------------------------------
    // Create JWT token
    // ----------------------------------------------------------

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET || "development-secret",
      {
        expiresIn: "7d",
      }
    );

    console.log("LOGIN SUCCESS:", user);

    // ----------------------------------------------------------
    // Return user
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: user,
      token: token,
    });
  } catch (error) {
    console.error("=================================");
    console.error("LOGIN ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`TikTok Clone API running on port ${PORT}`);
  console.log(`Allowed frontend: https://tiktok-api-com.up.railway.app`);
  console.log("=================================");
});