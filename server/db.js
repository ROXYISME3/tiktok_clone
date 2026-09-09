require("dotenv").config();

const mysql = require("mysql2/promise");

// ============================================================
// MYSQL DATABASE CONNECTION
// ============================================================

let pool;

// ============================================================
// OPTION 1: RAILWAY DATABASE_URL
// ============================================================

if (process.env.DATABASE_URL) {
  console.log("=================================");
  console.log("Using DATABASE_URL");
  console.log("=================================");

  pool = mysql.createPool(process.env.DATABASE_URL);
}

// ============================================================
// OPTION 2: RAILWAY MYSQL VARIABLES
// ============================================================

else {
  console.log("=================================");
  console.log("Using Railway MySQL variables");
  console.log("=================================");

  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// ============================================================
// TEST DATABASE CONNECTION
// ============================================================

async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("=================================");
    console.log("MYSQL DATABASE CONNECTED");
    console.log("=================================");

    // Test query
    const [rows] = await connection.query("SELECT 1 AS test");

    console.log("MYSQL TEST RESULT:");
    console.log(rows);

  } catch (error) {
    console.error("=================================");
    console.error("MYSQL DATABASE CONNECTION ERROR");
    console.error("=================================");
    console.error("Message:", error.message);
    console.error("=================================");

  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run database test
testDatabaseConnection();

// ============================================================
// EXPORT POOL
// ============================================================

module.exports = pool;