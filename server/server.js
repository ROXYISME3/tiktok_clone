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

// FRONTEND
// https://tiktok-api-com.up.railway.app
//
// BACKEND
// https://tiktok-api.up.railway.app

const allowedOrigins = [
  "https://tiktok-api-com.up.railway.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow direct browser/API requests
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
  console.log("=================================");
  console.log("DATABASE TEST REQUEST");
  console.log("=================================");

  try {
    const [rows] = await pool.query("SELECT 1 AS test");

    console.log("DATABASE TEST SUCCESS");
    console.log(rows);

    res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      database: rows,
    });
  } catch (error) {
    console.error("=================================");
    console.error("DATABASE TEST ERROR");
    console.error(error);
    console.error("=================================");

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

    // ========================================================
    // SIGNUP REQUEST
    // ========================================================

    console.log("=================================");
    console.log("SIGNUP REQUEST");
    console.log("Username:", username);
    console.log("Phone:", phone);
    console.log("STEP 1: Request received");
    console.log("=================================");

    // ========================================================
    // VALIDATE USERNAME
    // ========================================================

    if (!username || !username.trim()) {
      console.log("SIGNUP ERROR: Username is empty");

      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    console.log("STEP 2: Username valid");

    // ========================================================
    // VALIDATE PHONE
    // ========================================================

    if (!phone || !/^09\d{9}$/.test(phone)) {
      console.log("SIGNUP ERROR: Invalid phone number");

      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    console.log("STEP 3: Phone valid");

    // ========================================================
    // CLEAN DATA
    // ========================================================

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    console.log("STEP 4: Checking phone in database");

    // ========================================================
    // CHECK PHONE
    // ========================================================

    const [existingPhone] = await pool.query(
      "SELECT id FROM users WHERE phone = ? LIMIT 1",
      [cleanPhone]
    );

    console.log("STEP 5: Phone database check completed");
    console.log("Existing phone:", existingPhone.length);

    if (existingPhone.length > 0) {
      console.log("SIGNUP ERROR: Phone already registered");

      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // ========================================================
    // CHECK USERNAME
    // ========================================================

    console.log("STEP 6: Checking username in database");

    const [existingUsername] = await pool.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [cleanUsername]
    );

    console.log("STEP 7: Username database check completed");
    console.log("Existing username:", existingUsername.length);

    if (existingUsername.length > 0) {
      console.log("SIGNUP ERROR: Username already registered");

      return res.status(409).json({
        success: false,
        message: "This username is already registered.",
      });
    }

    // ========================================================
    // CREATE ACCOUNT
    // ========================================================

    console.log("STEP 8: Creating account");

    const [result] = await pool.query(
      `
      INSERT INTO users
      (username, phone, coins)
      VALUES (?, ?, ?)
      `,
      [cleanUsername, cleanPhone, 5000]
    );

    console.log("STEP 9: Account created");
    console.log("Inserted ID:", result.insertId);

    // ========================================================
    // GET NEW USER
    // ========================================================

    console.log("STEP 10: Getting newly created user");

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
      console.log("SIGNUP ERROR: User could not be retrieved");

      return res.status(500).json({
        success: false,
        message: "Account was created but could not be retrieved.",
      });
    }

    const newUser = newUserRows[0];

    console.log("STEP 11: New user retrieved");
    console.log(newUser);

    // ========================================================
    // CREATE JWT
    // ========================================================

    console.log("STEP 12: Creating JWT");

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

    console.log("STEP 13: JWT created");

    // ========================================================
    // SIGNUP SUCCESS
    // ========================================================

    console.log("=================================");
    console.log("SIGNUP SUCCESS");
    console.log("User:", newUser);
    console.log("=================================");

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: newUser,
      token: token,
    });
  } catch (error) {
    // ========================================================
    // SIGNUP ERROR
    // ========================================================

    console.error("=================================");
    console.error("SIGNUP ERROR");
    console.error("Message:", error.message);
    console.error("Full error:", error);
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

    // ========================================================
    // LOGIN REQUEST
    // ========================================================

    console.log("=================================");
    console.log("LOGIN REQUEST");
    console.log("Username:", username);
    console.log("Phone:", phone);
    console.log("STEP 1: Login request received");
    console.log("=================================");

    // ========================================================
    // VALIDATE USERNAME
    // ========================================================

    if (!username || !username.trim()) {
      console.log("LOGIN ERROR: Username is empty");

      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    console.log("STEP 2: Username valid");

    // ========================================================
    // VALIDATE PHONE
    // ========================================================

    if (!phone || !/^09\d{9}$/.test(phone)) {
      console.log("LOGIN ERROR: Invalid phone");

      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    console.log("STEP 3: Phone valid");

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    // ========================================================
    // FIND USER
    // ========================================================

    console.log("STEP 4: Searching user in database");

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

    console.log("STEP 5: User search completed");
    console.log("Users found:", users.length);

    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (users.length === 0) {
      console.log("LOGIN ERROR: Username and phone do not match");

      return res.status(401).json({
        success: false,
        message: "Name and phone number do not match.",
      });
    }

    const user = users[0];

    // ========================================================
    // CREATE JWT
    // ========================================================

    console.log("STEP 6: Creating JWT");

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

    // ========================================================
    // LOGIN SUCCESS
    // ========================================================

    console.log("=================================");
    console.log("LOGIN SUCCESS");
    console.log("User:", user);
    console.log("=================================");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: user,
      token: token,
    });
  } catch (error) {
    // ========================================================
    // LOGIN ERROR
    // ========================================================

    console.error("=================================");
    console.error("LOGIN ERROR");
    console.error("Message:", error.message);
    console.error("Full error:", error);
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
  console.log("Backend: https://tiktok-api.up.railway.app");
  console.log(
    "Frontend: https://tiktok-api-com.up.railway.app"
  );
  console.log("=================================");
});