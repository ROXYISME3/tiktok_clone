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
        message: "This