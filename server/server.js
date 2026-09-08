require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

// ================================
// CORS
// ================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://tiktokclone-apc.up.railway.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

// ================================
// TEST SERVER
// ================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TikTok Clone API is running!",
  });
});

// ================================
// TEST DATABASE
// ================================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// ================================
// CREATE USERS TABLE
// ================================

app.get("/api/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(30) UNIQUE,
        password_hash TEXT NOT NULL,
        profile_picture TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.json({
      success: true,
      message: "Users table is ready.",
    });
  } catch (error) {
    console.error("Setup error:", error);

    res.status(500).json({
      success: false,
      message: "Database setup failed.",
    });
  }
});

// ================================
// REGISTER
// ================================

app.post("/api/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check username
    const usernameCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Check email
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }
    }

    // Check phone
    if (phone) {
      const phoneCheck = await pool.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Phone number already exists.",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Save user
    const result = await pool.query(
      `
      INSERT INTO users
      (
        username,
        email,
        phone,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, phone, created_at
      `,
      [
        username,
        email || null,
        phone || null,
        hashedPassword,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// ================================
// LOGIN
// ================================

app.post("/api/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username/email and password are required.",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = $1
         OR email = $1
      LIMIT 1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username/email or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username/email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});