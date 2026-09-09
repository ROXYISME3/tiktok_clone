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
// YOUR RAILWAY URLS
// ============================================================
//
// BACKEND:
// https://tiktok-api-com.up.railway.app
//
// FRONTEND:
// https://tiktok-api.up.railway.app
//
// ============================================================

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
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      // Allow the frontend
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

    return res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      database: rows,
    });
  } catch (error) {
    console.error("=================================");
    console.error("DATABASE TEST ERROR");
    console.error("Message:", error.message);
    console.error("=================================");

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
  console.log("=================================");
  console.log("SIGNUP REQUEST");
  console.log("=================================");

  try {
    // --------------------------------------------------------
    // GET DATA
    // --------------------------------------------------------

    const { username, phone } = req.body;

    console.log("Username:", username);
    console.log("Phone:", phone);

    // --------------------------------------------------------
    // VALIDATE USERNAME
    // --------------------------------------------------------

    if (!username || typeof username !== "string") {
      console.log("SIGNUP ERROR: Username missing");

      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE PHONE
    // --------------------------------------------------------

    if (!phone || typeof phone !== "string") {
      console.log("SIGNUP ERROR: Phone missing");

      return res.status(400).json({
        success: false,
        message: "Please enter your phone number.",
      });
    }

    // --------------------------------------------------------
    // CLEAN DATA
    // --------------------------------------------------------

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    console.log("Clean username:", cleanUsername);
    console.log("Clean phone:", cleanPhone);

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
      console.log("SIGNUP ERROR: Invalid phone format");

      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    console.log("STEP 1: Input validation successful");

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    console.log("STEP 2: Checking phone...");

    const [existingPhone] = await pool.query(
      "SELECT id FROM users WHERE phone = ? LIMIT 1",
      [cleanPhone]
    );

    console.log("Phone records found:", existingPhone.length);

    if (existingPhone.length > 0) {
      console.log("SIGNUP ERROR: Phone already registered");

      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // --------------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------------

    console.log("STEP 3: Checking username...");

    const [existingUsername] = await pool.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [cleanUsername]
    );

    console.log("Username records found:", existingUsername.length);

    if (existingUsername.length > 0) {
      console.log("SIGNUP ERROR: Username already registered");

      return res.status(409).json({
        success: false,
        message: "This username is already registered.",
      });
    }

    // --------------------------------------------------------
    // CREATE ACCOUNT
    // --------------------------------------------------------

    console.log("STEP 4: Creating account...");

    const [result] = await pool.query(
      `
      INSERT INTO users
      (username, phone, coins)
      VALUES (?, ?, ?)
      `,
      [cleanUsername, cleanPhone, 5000]
    );

    console.log("STEP 5: Account created.");
    console.log("New user ID:", result.insertId);

    // --------------------------------------------------------
    // GET NEW USER
    // --------------------------------------------------------

    const [newUserRows] = await pool.query(
      `
      SELECT
        id,
        username,
        phone,
        coins
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    if (newUserRows.length === 0) {
      console.log("SIGNUP ERROR: Could not retrieve new user.");

      return res.status(500).json({
        success: false,
        message: "Account was created but could not be retrieved.",
      });
    }

    const newUser = newUserRows[0];

    console.log("STEP 6: New user retrieved.");
    console.log(newUser);

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

    const jwtSecret =
      process.env.JWT_SECRET || "development-secret";

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    console.log("STEP 7: Token created.");

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

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
// NAME + PHONE ONLY
// ============================================================

app.post("/api/login", async (req, res) => {
  console.log("=================================");
  console.log("LOGIN REQUEST");
  console.log("=================================");

  try {
    // --------------------------------------------------------
    // GET DATA
    // --------------------------------------------------------

    const { username, phone } = req.body;

    console.log("Username:", username);
    console.log("Phone:", phone);

    // --------------------------------------------------------
    // VALIDATE USERNAME
    // --------------------------------------------------------

    if (!username || typeof username !== "string") {
      console.log("LOGIN ERROR: Username missing");

      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE PHONE
    // --------------------------------------------------------

    if (!phone || typeof phone !== "string") {
      console.log("LOGIN ERROR: Phone missing");

      return res.status(400).json({
        success: false,
        message: "Please enter your phone number.",
      });
    }

    // --------------------------------------------------------
    // CLEAN DATA
    // --------------------------------------------------------

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();

    // --------------------------------------------------------
    // VALIDATE PHONE FORMAT
    // --------------------------------------------------------

    if (!/^09\d{9}$/.test(cleanPhone)) {
      console.log("LOGIN ERROR: Invalid phone format");

      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 digits.",
      });
    }

    console.log("STEP 1: Login input valid");

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    console.log("STEP 2: Searching database...");

    const [users] = await pool.query(
      `
      SELECT
        id,
        username,
        phone,
        coins
      FROM users
      WHERE username = ?
      AND phone = ?
      LIMIT 1
      `,
      [cleanUsername, cleanPhone]
    );

    console.log("STEP 3: Database search complete.");
    console.log("Users found:", users.length);

    // --------------------------------------------------------
    // USER NOT FOUND
    // --------------------------------------------------------

    if (users.length === 0) {
      console.log("LOGIN ERROR: User not found.");

      return res.status(401).json({
        success: false,
        message: "Name and phone number do not match.",
      });
    }

    // --------------------------------------------------------
    // USER FOUND
    // --------------------------------------------------------

    const user = users[0];

    console.log("STEP 4: User found.");
    console.log(user);

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

    const jwtSecret =
      process.env.JWT_SECRET || "development-secret";

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    console.log("STEP 5: Token created.");

    // --------------------------------------------------------
    // LOGIN SUCCESS
    // --------------------------------------------------------

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
  console.log("Backend: https://tiktok-api-com.up.railway.app");
  console.log("Frontend: https://tiktok-api.up.railway.app");
  console.log("=================================");
});