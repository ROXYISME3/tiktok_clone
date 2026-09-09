require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

// ============================================================
// CORS
// ============================================================
//
// For now we allow requests from your deployed frontend.
// This prevents the CORS problem while we are getting
// signup and login working.
//
// ============================================================

app.use(
  cors({
    origin: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================================
// HOME / TEST SERVER
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TikTok Clone API is running.",
  });
});

// ============================================================
// TEST DATABASE
// ============================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT NOW() AS databaseTime"
    );

    res.json({
      success: true,
      message:
        "MySQL database connected successfully.",
      databaseTime: rows[0].databaseTime,
    });
  } catch (error) {
    console.error(
      "MYSQL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "MySQL connection failed.",
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
});

// ============================================================
// DATABASE SETUP
// ============================================================
//
// Open this once:
//
// https://tiktok-api.up.railway.app/api/setup
//
// ============================================================

app.get("/api/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,

        username VARCHAR(100) NOT NULL UNIQUE,

        email VARCHAR(255) NULL UNIQUE,

        phone VARCHAR(30) NOT NULL UNIQUE,

        password_hash VARCHAR(255) NULL,

        coins INT NOT NULL DEFAULT 5000,

        profile_picture TEXT NULL,

        bio TEXT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Make password optional if the table
    // already existed from the old version.

    try {
      await pool.query(`
        ALTER TABLE users
        MODIFY password_hash VARCHAR(255) NULL
      `);
    } catch (alterError) {
      console.log(
        "Password column already configured."
      );
    }

    res.json({
      success: true,
      message:
        "Users table is ready.",
    });

  } catch (error) {
    console.error(
      "DATABASE SETUP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Database setup failed.",
      error: error.message,
    });
  }
});

// ============================================================
// SIGN UP
// NAME + PHONE
// ============================================================

app.post("/api/signup", async (req, res) => {
  try {
    console.log(
      "SIGNUP REQUEST:",
      req.body
    );

    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    const phone =
      typeof req.body.phone === "string"
        ? req.body.phone.trim()
        : "";

    // --------------------------------------------------------
    // CHECK NAME
    // --------------------------------------------------------

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 numbers.",
      });
    }

    // --------------------------------------------------------
    // CHECK EXISTING NAME
    // --------------------------------------------------------

    const [usernameRows] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
        [username]
      );

    if (usernameRows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Name already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK EXISTING PHONE
    // --------------------------------------------------------

    const [phoneRows] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE phone = ?
        LIMIT 1
        `,
        [phone]
      );

    if (phoneRows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Phone number already exists.",
      });
    }

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    const [result] =
      await pool.query(
        `
        INSERT INTO users
        (
          username,
          phone,
          password_hash,
          coins
        )
        VALUES
        (?, ?, NULL, 5000)
        `,
        [
          username,
          phone,
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
          profile_picture,
          bio,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

    console.log(
      "USER CREATED:",
      newUserRows[0]
    );

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user: newUserRows[0],
    });

  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error
    );

    // Duplicate database entry
    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Name or phone number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Registration failed.",
      error: error.message,
    });
  }
});

// ============================================================
// LOGIN
// NAME + PHONE
// ============================================================

app.post("/api/login", async (req, res) => {
  try {
    console.log(
      "LOGIN REQUEST:",
      req.body
    );

    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    const phone =
      typeof req.body.phone === "string"
        ? req.body.phone.trim()
        : "";

    // --------------------------------------------------------
    // CHECK NAME
    // --------------------------------------------------------

    if (!username) {
      return res.status(400).json({
        success: false,
        message:
          "Name is required.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must start with 09 and contain exactly 11 numbers.",
      });
    }

    // --------------------------------------------------------
    // FIND USER
    // BOTH NAME AND PHONE MUST MATCH
    // --------------------------------------------------------

    const [rows] =
      await pool.query(
        `
        SELECT
          id,
          username,
          phone,
          coins,
          profile_picture,
          bio,
          created_at
        FROM users
        WHERE username = ?
        AND phone = ?
        LIMIT 1
        `,
        [
          username,
          phone,
        ]
      );

    // --------------------------------------------------------
    // USER NOT FOUND
    // --------------------------------------------------------

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Name and phone number do not match.",
      });
    }

    const user = rows[0];

    // --------------------------------------------------------
    // JWT SECRET
    // --------------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT_SECRET is not configured on the server.",
      });
    }

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

    const token =
      jwt.sign(
        {
          id: user.id,
          username: user.username,
          phone: user.phone,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

    // --------------------------------------------------------
    // LOGIN SUCCESS
    // --------------------------------------------------------

    return res.json({
      success: true,
      message:
        "Login successful.",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        coins: user.coins,
        profile_picture:
          user.profile_picture,
        bio: user.bio,
        created_at:
          user.created_at,
      },
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed.",
      error: error.message,
    });
  }
});

// ============================================================
// GET USER
// ============================================================

app.get("/api/user/:id", async (req, res) => {
  try {
    const userId =
      req.params.id;

    const [rows] =
      await pool.query(
        `
        SELECT
          id,
          username,
          phone,
          coins,
          profile_picture,
          bio,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
      );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.json({
      success: true,
      user: rows[0],
    });

  } catch (error) {
    console.error(
      "GET USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get user.",
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `TikTok Clone API running on port ${PORT}`
    );
  }
);