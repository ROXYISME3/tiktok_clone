import { useState } from "react";
import logo from "./assets/tiktok-logo.png";
import "./App.css";

// ============================================================
// RAILWAY BACKEND API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL || "https://tiktok-api.up.railway.app";

function App() {
  // ============================================================
  // LOGIN STATES
  // ============================================================

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPhone, setLoginPhone] = useState("");

  // ============================================================
  // SIGNUP STATES
  // ============================================================

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // ============================================================
  // GENERAL STATES
  // ============================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(5000);

  // ============================================================
  // PHONE VALIDATION
  //
  // Must:
  // - start with 09
  // - contain exactly 11 digits
  //
  // Example:
  // 09123456789
  // ============================================================

  const validatePhone = (phone) => {
    return /^09\d{9}$/.test(phone);
  };

  // ============================================================
  // SIGN UP
  // NAME + PHONE ONLY
  // ============================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = signupUsername.trim();
    const phone = signupPhone.trim();

    // ----------------------------------------------------------
    // CHECK NAME
    // ----------------------------------------------------------

    if (!username) {
      setMessage("Please enter your name.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 numbers.",
      );
      return;
    }

    // ----------------------------------------------------------
    // SEND SIGNUP REQUEST TO RAILWAY BACKEND
    // ----------------------------------------------------------

    try {
      setLoading(true);

      console.log("Sending signup request to:", `${API_URL}/api/signup`);

      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          phone: phone,
        }),
      });

      // --------------------------------------------------------
      // READ RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      console.log("Signup HTTP status:", response.status);
      console.log("Signup response:", data);

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (response.ok && data.success) {
        setMessage("Account created successfully! You can now log in.");

        // Put name into login
        setLoginUsername(username);

        // Put phone into login
        setLoginPhone(phone);

        // Clear signup fields
        setSignupUsername("");
        setSignupPhone("");

        // Go to login page
        setTimeout(() => {
          setScreen("login");
          setMessage("");
        }, 1200);
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGIN
  // NAME + PHONE ONLY
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = loginUsername.trim();
    const phone = loginPhone.trim();

    // ----------------------------------------------------------
    // CHECK NAME
    // ----------------------------------------------------------

    if (!username) {
      setMessage("Please enter your name.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 numbers.",
      );
      return;
    }

    // ----------------------------------------------------------
    // SEND LOGIN REQUEST TO RAILWAY BACKEND
    // ----------------------------------------------------------

    try {
      setLoading(true);

      console.log("Sending login request to:", `${API_URL}/api/login`);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: username,
          phone: phone,
        }),
      });

      // --------------------------------------------------------
      // READ RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      console.log("Login HTTP status:", response.status);
      console.log("Login response:", data);

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (response.ok && data.success) {
        // Save user
        localStorage.setItem("user", JSON.stringify(data.user));

        // Save JWT token
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Save user in React
        setUser(data.user);

        // Get coins
        setCoins(data.user.coins ?? 5000);

        // Clear login fields
        setLoginUsername("");
        setLoginPhone("");

        // Clear message
        setMessage("");

        // Open dashboard
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
  // LOGOUT
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
        "The virtual coins have no real monetary value.",
    );
  };

  // ============================================================
  // SIGNUP PAGE
  // ============================================================

  if (screen === "signup") {
    return (
      <div className="tiktok-page">
        {/* HEADER */}

        <header className="header">
          <div className="logo">
            <img src={logo} alt="TikTok Clone" />
          </div>

          <div className="help">? &nbsp; Feedback and help</div>
        </header>

        {/* SIGNUP */}

        <main className="login-container">
          <h1>Create an account</h1>

          <p className="description">Create your TikTok Clone account.</p>

          <form onSubmit={handleSignup}>
            {/* NAME */}

            <input
              type="text"
              placeholder="Name"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              autoComplete="name"
              required
            />

            {/* PHONE */}

            <input
              type="tel"
              placeholder="Phone number (09XXXXXXXXX)"
              value={signupPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                if (value.length <= 11) {
                  setSignupPhone(value);
                }
              }}
              maxLength={11}
              inputMode="numeric"
              autoComplete="tel"
              required
            />

            {/* SIGN UP BUTTON */}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* MESSAGE */}

          {message && <div className="message">{message}</div>}

          {/* LOGIN LINK */}

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

        {/* FOOTER */}

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
            <button className="language">English (US)</button>

            <span>© 2026 TikTok Clone</span>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  if (screen === "dashboard") {
    return (
      <div className="dashboard-page">
        {/* HEADER */}

        <header className="dashboard-header">
          <div className="dashboard-logo">
            <img src={logo} alt="TikTok Clone" />
          </div>

          <div className="dashboard-header-right">
            <span className="help">? &nbsp; Feedback and help</span>

            <button className="logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        {/* DASHBOARD */}

        <main className="dashboard-content">
          {/* WELCOME */}

          <section className="welcome-section">
            <h1>
              Welcome
              {user?.username ? `, ${user.username}` : ""}!
            </h1>

            <p>
              Discover videos, follow creators, and enjoy your personalized
              experience.
            </p>
          </section>

          {/* REWARD CARD */}

          <section className="reward-card">
            <div className="reward-icon">🪙</div>

            <h2>Congratulations!</h2>

            <p className="reward-text">You received</p>

            <div className="coin-amount">{coins.toLocaleString()}</div>

            <p className="coin-label">Virtual Coins</p>

            <p className="demo-warning">
              Demo reward — these coins have no real monetary value.
            </p>

            <button className="cashout-button" onClick={handleCashOut}>
              Demo Cash Out
            </button>
          </section>

          {/* VIDEO SECTION */}

          <section className="video-section">
            <h2>For You</h2>

            <div className="video-grid">
              <div className="video-card">
                <div className="video-placeholder">▶</div>

                <h3>For You</h3>

                <p>Discover new videos</p>
              </div>

              <div className="video-card">
                <div className="video-placeholder">▶</div>

                <h3>Trending</h3>

                <p>See what's trending</p>
              </div>

              <div className="video-card">
                <div className="video-placeholder">▶</div>

                <h3>Following</h3>

                <p>Watch creators you follow</p>
              </div>
            </div>
          </section>
        </main>

        {/* BOTTOM NAVIGATION */}

        <nav className="bottom-nav">
          <button className="nav-item active">
            🏠
            <span>Home</span>
          </button>

          <button className="nav-item">
            🔍
            <span>Discover</span>
          </button>

          <button className="create-button">+</button>

          <button className="nav-item">
            💬
            <span>Inbox</span>
          </button>

          <button className="nav-item">
            👤
            <span>Profile</span>
          </button>
        </nav>
      </div>
    );
  }

  // ============================================================
  // LOGIN PAGE
  // ============================================================

  return (
    <div className="tiktok-page">
      {/* HEADER */}

      <header className="header">
        <div className="logo">
          <img src={logo} alt="TikTok Clone" />
        </div>

        <div className="help">? &nbsp; Feedback and help</div>
      </header>

      {/* LOGIN */}

      <main className="login-container">
        <h1>Log in to TikTok</h1>

        <p className="description">
          Enter your name and phone number to continue.
        </p>

        <form onSubmit={handleLogin}>
          {/* NAME */}

          <input
            type="text"
            placeholder="Name"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            autoComplete="name"
            required
          />

          {/* PHONE */}

          <input
            type="tel"
            placeholder="Phone number (09XXXXXXXXX)"
            value={loginPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              if (value.length <= 11) {
                setLoginPhone(value);
              }
            }}
            maxLength={11}
            inputMode="numeric"
            autoComplete="tel"
            required
          />

          {/* LOGIN BUTTON */}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* MESSAGE */}

        {message && <div className="message">{message}</div>}
      </main>

      {/* FOOTER */}

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
          <button className="language">English (US)</button>

          <span>© 2026 TikTok Clone</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
