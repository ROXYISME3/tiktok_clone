require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://tiktokclone-apc.up.railway.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin, such as Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ============================================================
// TEST SERVER
// ============================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT NOW() AS databaseTime"
    );

    res.json({
      success: true,
      message: "MySQL database connected successfully.",
      databaseTime: rows[0].databaseTime,
    });

  } catch (error) {
    console.error("MYSQL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "MySQL connection failed.",
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
});

// ============================================================
// TEST MYSQL DATABASE
// ============================================================

("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT NOW() AS databaseTime"
    );

    res.json({
      success: true,
      message: "MySQL database connected successfully.",
      databaseTime: rows[0].databaseTime,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "MySQL database connection failed.",
      error: error.message,
    });
  }
});

// ============================================================
// CREATE USERS TABLE
// ============================================================

app.get("/api/setup", async (req, res) => {
  try {app.get
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(30) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        coins INT NOT NULL DEFAULT 5000,
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
      error: error.message,
    });
  }
});

// ============================================================
// SIGN UP
// ============================================================

app.post("/api/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------------

    const [usernameRows] = await pool.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (usernameRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK EMAIL
    // --------------------------------------------------------

    if (email) {
      const [emailRows] = await pool.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (emailRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    if (phone) {
      const [phoneRows] = await pool.query(
        "SELECT id FROM users WHERE phone = ? LIMIT 1",
        [phone]
      );

      if (phoneRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Phone number already exists.",
        });
      }
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------------------------------
    // INSERT USER
    // --------------------------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        username,
        email,
        phone,
        password_hash,
        coins
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        username,
        email || null,
        phone || null,
        hashedPassword,
        5000,
      ]
    );

    // --------------------------------------------------------
    // GET CREATED USER
    // --------------------------------------------------------

    const [newUserRows] = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        phone,
        coins,
        created_at
      FROM users
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: newUserRows[0],
    });

  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Username, email, or phone number already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// ============================================================
// LOGIN WITH USERNAME OR EMAIL
// ============================================================

app.post("/api/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username/email and password are required.",
      });
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = ?
         OR email = ?
      LIMIT 1
      `,
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username/email or password.",
      });
    }

    const user = rows[0];

    // --------------------------------------------------------
    // CHECK PASSWORD
    // --------------------------------------------------------

    const passwordMatch = await bcrypt.compare(
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

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // SEND RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        coins: user.coins,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
});

// ============================================================
// GET LOGGED-IN USER
// ============================================================

app.get("/api/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        username,
        email,
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
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user: rows[0],
    });

  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get user.",
    });
  }
});

// ============================================================
// LOGIN WITH PHONE
// ============================================================

app.post("/api/login-phone", async (req, res) => {
  try {
    const {
      phone,
      password,
    } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number and password are required.",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE phone = ?
      LIMIT 1
      `,
      [phone]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid phone number or password.",
      });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid phone number or password.",
      });
    }

    const token = jwt.sign(
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

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        coins: user.coins,
      },
    });

  } catch (error) {
    console.error("Phone login error:", error);

    res.status(500).json({
      success: false,
      message: "Phone login failed.",
      error: error.message,
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});