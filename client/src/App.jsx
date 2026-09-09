import { useState } from "react";
import logo from "./assets/tiktok-logo.png";
import "./App.css";

// ============================================================
// RAILWAY BACKEND
// ============================================================

const API_URL = "https://tiktok-api-com.up.railway.app";

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
  // GENERAL APP STATES
  // ============================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const [coins, setCoins] = useState(5000);

  // ============================================================
  // PHONE VALIDATION
  // ============================================================

  const validatePhone = (phone) => {
    return /^09\d{9}$/.test(phone);
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = loginUsername.trim();
    const phone = loginPhone.trim();

    // ----------------------------------------------------------
    // CHECK USERNAME
    // ----------------------------------------------------------

    if (!username) {
      setMessage("Please enter your username.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!phone) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 digits.",
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // SEND LOGIN REQUEST TO RAILWAY
      // --------------------------------------------------------

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

      const data = await response.json();

      // --------------------------------------------------------
      // LOGIN SUCCESS
      // --------------------------------------------------------

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user);

        setCoins(data.user.coins ?? 5000);

        setLoginUsername("");
        setLoginPhone("");

        setMessage("");

        setScreen("dashboard");
      }

      // --------------------------------------------------------
      // LOGIN FAILED
      // --------------------------------------------------------
      else {
        setMessage(data.message || "Invalid username or phone number.");
      }
    } catch (error) {
      console.error("Login error:", error);

      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SIGN UP
  // ============================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    const username = signupUsername.trim();
    const phone = signupPhone.trim();

    // ----------------------------------------------------------
    // CHECK USERNAME
    // ----------------------------------------------------------

    if (!username) {
      setMessage("Username is required.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!phone) {
      setMessage("Phone number is required.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 digits.",
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // SEND SIGNUP REQUEST TO RAILWAY
      // --------------------------------------------------------

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

      const data = await response.json();

      // --------------------------------------------------------
      // SIGNUP SUCCESS
      // --------------------------------------------------------

      if (data.success) {
        setMessage("Account created successfully! Please log in.");

        // Put username into login field
        setLoginUsername(username);

        // Put phone into login field
        setLoginPhone(phone);

        // Clear signup fields
        setSignupUsername("");
        setSignupPhone("");

        // Go to login page
        setTimeout(() => {
          setScreen("login");
          setMessage("");
        }, 1000);
      }

      // --------------------------------------------------------
      // SIGNUP FAILED
      // --------------------------------------------------------
      else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);

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
            {/* USERNAME */}

            <input
              type="text"
              placeholder="Username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
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
              required
            />

            {/* SIGNUP BUTTON */}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {message && <div className="message">{message}</div>}

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

        {/* DASHBOARD CONTENT */}

        <main className="dashboard-content">
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
          Manage your account, check notifications,
          <br />
          comment on videos, and more.
        </p>

        <form onSubmit={handleLogin}>
          {/* USERNAME */}

          <input
            type="text"
            placeholder="Username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
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
            required
          />

          {/* LOGIN BUTTON */}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

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
