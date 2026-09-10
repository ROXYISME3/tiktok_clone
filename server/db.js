// ============================================================
// MYSQL DATABASE CONNECTION
// ============================================================

const mysql = require("mysql2/promise");

// ============================================================
// USE RAILWAY MYSQL VARIABLES
// ============================================================

const dbConfig = {
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
};

// ============================================================
// SHOW WHICH VARIABLES ARE AVAILABLE
// (DO NOT PRINT THE PASSWORD)
// ============================================================

console.log("=================================");
console.log("Using Railway MySQL variables");
console.log("=================================");
console.log("MYSQLHOST:", process.env.MYSQLHOST ? "FOUND" : "MISSING");
console.log("MYSQLPORT:", process.env.MYSQLPORT ? "FOUND" : "MISSING");
console.log("MYSQLUSER:", process.env.MYSQLUSER ? "FOUND" : "MISSING");
console.log(
  "MYSQLPASSWORD:",
  process.env.MYSQLPASSWORD ? "FOUND" : "MISSING"
);
console.log(
  "MYSQLDATABASE:",
  process.env.MYSQLDATABASE ? "FOUND" : "MISSING"
);
console.log("=================================");

// ============================================================
// CREATE MYSQL CONNECTION POOL
// ============================================================

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ============================================================
// TEST DATABASE CONNECTION
// ============================================================

(async () => {
  try {
    const connection = await pool.getConnection();

    console.log("=================================");
    console.log("✅ MYSQL DATABASE CONNECTED");
    console.log("=================================");

    connection.release();
  } catch (error) {
    console.error("=================================");
    console.error("❌ MYSQL DATABASE CONNECTION ERROR");
    console.error("=================================");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Errno:", error.errno);
    console.error("SQL State:", error.sqlState);
    console.error("=================================");
  }
})();

// ============================================================
// EXPORT POOL
// ============================================================

module.exports = pool;