import { useEffect, useState } from "react";
import logo from "./assets/tiktok-logo.png";
import "./App.css";

// ============================================================
// BACKEND API
// ============================================================

const API_URL = "https://tiktok-api-com.up.railway.app";

// ============================================================
// APP
// ============================================================

function App() {
  // ============================================================
  // CHECK URL
  // ============================================================

  const isAdminPage = window.location.pathname === "/admin";

  // ============================================================
  // USER LOGIN
  // ============================================================

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPhone, setLoginPhone] = useState("");

  // ============================================================
  // SIGN UP
  // ============================================================

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // ============================================================
  // GENERAL
  // ============================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(5000);

  // ============================================================
  // ADMIN LOGIN
  // ============================================================

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminUser, setAdminUser] = useState(null);

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================

  const [securityLogs, setSecurityLogs] = useState([]);
  const [securitySummary, setSecuritySummary] = useState({
    successful: 0,
    failed: 0,
    blocked: 0,
  });

  const [logsLoading, setLogsLoading] = useState(false);

  const [port, setPort] = useState("8080");
  const [portResult, setPortResult] = useState("");
  const [portLoading, setPortLoading] = useState(false);

  // ============================================================
  // PHONE VALIDATION
  // ============================================================

  const validatePhone = (phone) => {
    return /^09\d{9}$/.test(phone);
  };

  // ============================================================
  // SIGN UP
  // ============================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = signupUsername.trim();
    const phone = signupPhone.trim();

    if (!username) {
      setMessage("Please enter your name.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 numbers."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Account created successfully! You can now log in.");

        setLoginUsername(username);
        setLoginPhone(phone);

        setSignupUsername("");
        setSignupPhone("");

        setTimeout(() => {
          setScreen("login");
          setMessage("");
        }, 1000);
      } else {
        setMessage(
          data.message ||
            data.error ||
            `Registration failed. Server returned ${response.status}.`
        );
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);
      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USER LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = loginUsername.trim();
    const phone = loginPhone.trim();

    if (!username) {
      setMessage("Please enter your name.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 numbers."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        setUser(data.user);
        setCoins(data.user.coins ?? 5000);

        setLoginUsername("");
        setLoginPhone("");
        setMessage("");
        setScreen("dashboard");
      } else {
        setMessage(data.message || "Name and phone number do not match.");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USER LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setLoginUsername("");
    setLoginPhone("");
    setCoins(5000);
    setMessage("");
    setScreen("login");
  };

  // ============================================================
  // DEMO CASH OUT
  // ============================================================

  const handleCashOut = () => {
    alert(
      "Demo Cash Out\n\n" +
        "This is only a demonstration. " +
        "The virtual coins have no real monetary value."
    );
  };

  // ============================================================
  // ADMIN LOGIN
  // ============================================================

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = adminUsername.trim();
    const phone = adminPhone.trim();

    if (!username) {
      setMessage("Please enter the admin name.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 numbers."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone,
        }),
      });

      const data = await response.json();

      // ========================================================
      // LOGIN FAILED
      // ========================================================

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Invalid admin credentials."
        );
        return;
      }

      // ========================================================
      // CHECK ADMIN ROLE
      // ========================================================

      if (data.user?.role !== "admin") {
        setMessage(
          "Access denied. This account is not an administrator."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return;
      }

      // ========================================================
      // ADMIN LOGIN SUCCESS
      // ========================================================

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setAdminUser(data.user);
      setAdminUsername("");
      setAdminPhone("");
      setMessage("");
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);
      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADMIN LOGOUT
  // ============================================================

  const handleAdminLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setAdminUser(null);
    setAdminUsername("");
    setAdminPhone("");
    setMessage("");

    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  // ============================================================
  // LOAD SECURITY DATA
  // ============================================================

  const loadSecurityData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      setLogsLoading(true);

      const [logsResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/security-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/api/admin/security-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const logsData = await logsResponse.json();
      const summaryData = await summaryResponse.json();

      if (logsResponse.ok) {
        setSecurityLogs(logsData.logs || []);
      }

      if (summaryResponse.ok) {
        setSecuritySummary({
          successful: summaryData.successful || 0,
          failed: summaryData.failed || 0,
          blocked: summaryData.blocked || 0,
        });
      }
    } catch (error) {
      console.error("SECURITY DATA ERROR:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  // ============================================================
  // CHECK ADMIN SESSION
  // ============================================================

  useEffect(() => {
    if (!isAdminPage) {
      return;
    }

    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);

        if (parsedUser.role === "admin") {
          setAdminUser(parsedUser);
        }
      } catch (error) {
        console.error("INVALID SAVED USER:", error);
      }
    }
  }, [isAdminPage]);

  // ============================================================
  // LOAD ADMIN DATA
  // ============================================================

  useEffect(() => {
    if (isAdminPage && adminUser) {
      loadSecurityData();

      const interval = setInterval(() => {
        loadSecurityData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isAdminPage, adminUser]);

  // ============================================================
  // PORT CHECKER
  // ============================================================

  const handlePortCheck = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPortResult("You are not authenticated.");
      return;
    }

    const selectedPort = Number(port);

    if (
      !Number.isInteger(selectedPort) ||
      selectedPort < 1 ||
      selectedPort > 65535
    ) {
      setPortResult("Please enter a valid port from 1 to 65535.");
      return;
    }

    try {
      setPortLoading(true);
      setPortResult("");

      const response = await fetch(`${API_URL}/api/admin/port-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          port: selectedPort,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.open) {
          setPortResult(
            `Port ${selectedPort} is OPEN on the server.`
          );
        } else {
          setPortResult(
            `Port ${selectedPort} is CLOSED on the server.`
          );
        }
      } else {
        setPortResult(
          data.message || "Unable to check the port."
        );
      }
    } catch (error) {
      console.error("PORT CHECK ERROR:", error);
      setPortResult("Cannot connect to the server.");
    } finally {
      setPortLoading(false);
    }
  };

  // ============================================================
  // ADMIN LOGIN PAGE
  // ============================================================

  if (isAdminPage && !adminUser) {
    return (
      <div className="tiktok-page admin-login-page">
        <header className="header">
          <div className="logo">
            <img src={logo} alt="TikTok Clone" />
          </div>

          <div className="help">
            🔐 Security Administration
          </div>
        </header>

        <main className="login-container admin-login-container">
          <div className="admin-lock-icon">🔐</div>

          <h1>Admin Login</h1>

          <p className="description">
            Authorized administrators only.
          </p>

          <form onSubmit={handleAdminLogin}>
            <input
              type="text"
              placeholder="Admin name"
              value={adminUsername}
              onChange={(e) =>
                setAdminUsername(e.target.value)
              }
              required
            />

            <input
              type="tel"
              placeholder="Admin phone number"
              value={adminPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                if (value.length <= 11) {
                  setAdminPhone(value);
                }
              }}
              maxLength={11}
              inputMode="numeric"
              required
            />

            <button
              className="login-button admin-login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Checking..." : "Admin Login"}
            </button>
          </form>

          {message && (
            <div className="message admin-message">
              {message}
            </div>
          )}

          <button
            className="forgot"
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.location.reload();
            }}
          >
            ← Back to User Login
          </button>
        </main>

        <footer className="footer">
          <div className="footer-bottom">
            <button className="language">
              English (US)
            </button>

            <span>© 2026 TikTok Clone</span>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================

  if (isAdminPage && adminUser) {
    return (
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-header">
          <div className="admin-brand">
            <img src={logo} alt="TikTok Clone" />

            <div>
              <h2>Security Administration</h2>
              <span>Administrator Dashboard</span>
            </div>
          </div>

          <div className="admin-header-right">
            <span>
              👤 {adminUser.username}
            </span>

            <button
              className="admin-logout-button"
              onClick={handleAdminLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <main className="admin-dashboard-content">

          {/* ====================================================
              TITLE
          ==================================================== */}

          <section className="admin-title-section">
            <h1>Security Dashboard</h1>

            <p>
              Monitor authentication activity and system security.
            </p>
          </section>

          {/* ====================================================
              SECURITY SUMMARY
          ==================================================== */}

          <section className="security-summary-grid">

            <div className="security-card success-card">
              <div className="security-card-icon">
                ✅
              </div>

              <div>
                <span>Successful Logins</span>
                <strong>
                  {securitySummary.successful}
                </strong>
              </div>
            </div>

            <div className="security-card failed-card">
              <div className="security-card-icon">
                ⚠️
              </div>

              <div>
                <span>Failed Attempts</span>
                <strong>
                  {securitySummary.failed}
                </strong>
              </div>
            </div>

            <div className="security-card blocked-card">
              <div className="security-card-icon">
                🚫
              </div>

              <div>
                <span>Blocked Attempts</span>
                <strong>
                  {securitySummary.blocked}
                </strong>
              </div>
            </div>

          </section>

          {/* ====================================================
              PORT CHECKER
          ==================================================== */}

          <section className="admin-panel port-checker-panel">

            <div className="panel-header">
              <div>
                <h2>🔎 Port Checker</h2>

                <p>
                  Check whether a local server port is open.
                </p>
              </div>
            </div>

            <div className="port-checker-form">

              <input
                type="number"
                min="1"
                max="65535"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="Enter port"
              />

              <button
                onClick={handlePortCheck}
                disabled={portLoading}
              >
                {portLoading
                  ? "Checking..."
                  : "Check Port"}
              </button>

            </div>

            {portResult && (
              <div className="port-result">
                {portResult}
              </div>
            )}

          </section>

          {/* ====================================================
              SECURITY LOGIN LOGS
          ==================================================== */}

          <section className="admin-panel security-logs-panel">

            <div className="panel-header">

              <div>
                <h2>🔐 SECURITY LOGIN LOGS</h2>

                <p>
                  Records of successful, failed, and blocked
                  authentication attempts.
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadSecurityData}
                disabled={logsLoading}
              >
                {logsLoading ? "Refreshing..." : "↻ Refresh"}
              </button>

            </div>

            <div className="logs-table-container">

              <table className="security-logs-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Date / Time</th>
                    <th>User Agent</th>
                  </tr>
                </thead>

                <tbody>

                  {securityLogs.length === 0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="no-logs"
                      >
                        {logsLoading
                          ? "Loading security logs..."
                          : "No security login records found."}
                      </td>
                    </tr>

                  ) : (

                    securityLogs.map((log) => (

                      <tr key={log.id}>

                        <td>
                          {log.id}
                        </td>

                        <td>
                          {log.name || "—"}
                        </td>

                        <td>
                          {log.phone || "—"}
                        </td>

                        <td className="ip-address">
                          {log.ip_address}
                        </td>

                        <td>

                          <span
                            className={`status-badge status-${String(
                              log.status
                            ).toLowerCase()}`}
                          >
                            {log.status}
                          </span>

                        </td>

                        <td>
                          {log.attempt_time
                            ? new Date(
                                log.attempt_time
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td
                          className="user-agent"
                          title={log.user_agent || ""}
                        >
                          {log.user_agent || "—"}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </main>
      </div>
    );
  }

  // ============================================================
  // SIGNUP SCREEN
  // ============================================================

  if (screen === "signup") {
    return (
      <div className="tiktok-page">

        <header className="header">

          <div className="logo">
            <img
              src={logo}
              alt="TikTok Clone"
            />
          </div>

          <div className="help">
            ? &nbsp; Feedback and help
          </div>

        </header>

        <main className="login-container">

          <h1>Create an account</h1>

          <p className="description">
            Create your TikTok Clone account.
          </p>

          <form onSubmit={handleSignup}>

            <input
              type="text"
              placeholder="Name"
              value={signupUsername}
              onChange={(e) =>
                setSignupUsername(e.target.value)
              }
              required
            />

            <input
              type="tel"
              placeholder="Phone number (09XXXXXXXXX)"
              value={signupPhone}
              onChange={(e) => {

                const value =
                  e.target.value.replace(/\D/g, "");

                if (value.length <= 11) {
                  setSignupPhone(value);
                }

              }}
              maxLength={11}
              inputMode="numeric"
              required
            />

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Sign up"}
            </button>

          </form>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <button
            className="forgot"
            onClick={() => {
              setScreen("login");
              setMessage("");
            }}
          >
            Already have an account? Log in
          </button>

        </main>

        <footer className="footer">

          <div className="signup">

            Already have an account?

            <button
              onClick={() => {
                setScreen("login");
                setMessage("");
              }}
            >
              Log in
            </button>

          </div>

          <div className="footer-bottom">

            <button className="language">
              English (US)
            </button>

            <span>
              © 2026 TikTok Clone
            </span>

          </div>

        </footer>

      </div>
    );
  }

  // ============================================================
  // USER DASHBOARD
  // ============================================================

  if (screen === "dashboard") {
    return (
      <div className="dashboard-page">

        <header className="dashboard-header">

          <div className="dashboard-logo">
            <img
              src={logo}
              alt="TikTok Clone"
            />
          </div>

          <div className="dashboard-header-right">

            <span className="help">
              ? &nbsp; Feedback and help
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Log out
            </button>

          </div>

        </header>

        <main className="dashboard-content">

          <section className="welcome-section">

            <h1>
              Welcome
              {user?.username
                ? `, ${user.username}`
                : ""}
              !
            </h1>

            <p>
              Discover videos, follow creators,
              and enjoy your personalized experience.
            </p>

          </section>

          <section className="reward-card">

            <div className="reward-icon">
              🪙
            </div>

            <h2>
              Congratulations!
            </h2>

            <p className="reward-text">
              You received
            </p>

            <div className="coin-amount">
              {coins.toLocaleString()}
            </div>

            <p className="coin-label">
              Virtual Coins
            </p>

            <p className="demo-warning">
              Demo reward — these coins have no
              real monetary value.
            </p>

            <button
              className="cashout-button"
              onClick={handleCashOut}
            >
              Demo Cash Out
            </button>

          </section>

          <section className="video-section">

            <h2>
              For You
            </h2>

            <div className="video-grid">

              <div className="video-card">
                <div className="video-placeholder">
                  ▶
                </div>

                <h3>
                  For You
                </h3>

                <p>
                  Discover new videos
                </p>
              </div>

              <div className="video-card">
                <div className="video-placeholder">
                  ▶
                </div>

                <h3>
                  Trending
                </h3>

                <p>
                  See what's trending
                </p>
              </div>

              <div className="video-card">
                <div className="video-placeholder">
                  ▶
                </div>

                <h3>
                  Following
                </h3>

                <p>
                  Watch creators you follow
                </p>
              </div>

            </div>

          </section>

        </main>

        <nav className="bottom-nav">

          <button className="nav-item active">
            🏠
            <span>
              Home
            </span>
          </button>

          <button className="nav-item">
            🔍
            <span>
              Discover
            </span>
          </button>

          <button className="create-button">
            +
          </button>

          <button className="nav-item">
            💬
            <span>
              Inbox
            </span>
          </button>

          <button className="nav-item">
            👤
            <span>
              Profile
            </span>
          </button>

        </nav>

      </div>
    );
  }

  // ============================================================
  // NORMAL USER LOGIN
  // ============================================================

  return (
    <div className="tiktok-page">

      <header className="header">

        <div className="logo">
          <img
            src={logo}
            alt="TikTok Clone"
          />
        </div>

        <div className="help">
          ? &nbsp; Feedback and help
        </div>

      </header>

      <main className="login-container">

        <h1>
          Log in to TikTok
        </h1>

        <p className="description">
          Enter your name and phone number to continue.
        </p>

        <form onSubmit={handleLogin}>

          <input
            type="text"
            placeholder="Name"
            value={loginUsername}
            onChange={(e) =>
              setLoginUsername(e.target.value)
            }
            required
          />

          <input
            type="tel"
            placeholder="Phone number (09XXXXXXXXX)"
            value={loginPhone}
            onChange={(e) => {

              const value =
                e.target.value.replace(/\D/g, "");

              if (value.length <= 11) {
                setLoginPhone(value);
              }

            }}
            maxLength={11}
            inputMode="numeric"
            required
          />

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Log in"}
          </button>

        </form>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* ======================================================
            ADMIN LINK
        ====================================================== */}

        <button
          className="admin-link-button"
          onClick={() => {
            window.location.href = "/admin";
          }}
        >
          🔐 Admin Login
        </button>

      </main>

      <footer className="footer">

        <div className="signup">

          Don't have an account?

          <button
            onClick={() => {
              setScreen("signup");
              setMessage("");
            }}
          >
            Sign up
          </button>

        </div>

        <div className="footer-bottom">

          <button className="language">
            English (US)
          </button>

          <span>
            © 2026 TikTok Clone
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;