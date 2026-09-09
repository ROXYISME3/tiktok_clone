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
  const [loginPassword, setLoginPassword] = useState("");

  // ============================================================
  // SIGNUP STATES
  // ============================================================

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

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

  const isValidPhone = (phone) => {
    return /^09\d{9}$/.test(phone);
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    // ----------------------------------------------------------
    // CHECK USERNAME
    // ----------------------------------------------------------

    if (!loginUsername.trim()) {
      setMessage("Username is required.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!loginPhone.trim()) {
      setMessage("Phone number is required.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE FORMAT
    // ----------------------------------------------------------

    if (!isValidPhone(loginPhone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 digits.",
      );
      return;
    }

    // ----------------------------------------------------------
    // CHECK PASSWORD
    // ----------------------------------------------------------

    if (!loginPassword) {
      setMessage("Password is required.");
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
          username: loginUsername.trim(),
          phone: loginPhone.trim(),
          password: loginPassword,
        }),
      });

      // --------------------------------------------------------
      // READ SERVER RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      // --------------------------------------------------------
      // LOGIN SUCCESS
      // --------------------------------------------------------

      if (data.success) {
        // Save logged-in user
        localStorage.setItem("user", JSON.stringify(data.user));

        // Save user in React
        setUser(data.user);

        // Get coins from database
        setCoins(data.user.coins ?? 5000);

        // Clear login fields
        setLoginUsername("");
        setLoginPhone("");
        setLoginPassword("");

        // Clear message
        setMessage("");

        // Go to dashboard
        setScreen("dashboard");
      } else {
        setMessage(
          data.message || "Invalid username, phone number, or password.",
        );
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

    // ----------------------------------------------------------
    // CHECK USERNAME
    // ----------------------------------------------------------

    if (!signupUsername.trim()) {
      setMessage("Username is required.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE
    // ----------------------------------------------------------

    if (!signupPhone.trim()) {
      setMessage("Phone number is required.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK PHONE FORMAT
    // ----------------------------------------------------------

    if (!isValidPhone(signupPhone)) {
      setMessage(
        "Phone number must start with 09 and contain exactly 11 digits.",
      );
      return;
    }

    // ----------------------------------------------------------
    // CHECK PASSWORD
    // ----------------------------------------------------------

    if (!signupPassword) {
      setMessage("Password is required.");
      return;
    }

    if (signupPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    // ----------------------------------------------------------
    // CHECK CONFIRM PASSWORD
    // ----------------------------------------------------------

    if (signupPassword !== signupConfirmPassword) {
      setMessage("Passwords do not match.");
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
          username: signupUsername.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
        }),
      });

      // --------------------------------------------------------
      // READ SERVER RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      // --------------------------------------------------------
      // SIGNUP SUCCESS
      // --------------------------------------------------------

      if (data.success) {
        setMessage("Account created successfully! Please log in.");

        // Put signup information into login fields
        setLoginUsername(signupUsername.trim());
        setLoginPhone(signupPhone.trim());

        // Clear signup fields
        setSignupUsername("");
        setSignupPhone("");
        setSignupPassword("");
        setSignupConfirmPassword("");

        // Return to login
        setTimeout(() => {
          setScreen("login");
        }, 800);
      } else {
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
    setLoginPassword("");

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
              inputMode="numeric"
              maxLength={11}
              placeholder="09XXXXXXXXX"
              value={signupPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                setSignupPhone(value);
              }}
              required
            />

            {/* PASSWORD */}

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />

            {/* CONFIRM PASSWORD */}

            <input
              type="password"
              placeholder="Confirm password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              required
            />

            {/* SIGN UP BUTTON */}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* MESSAGE */}

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

          {/* VIDEO CARDS */}

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
            inputMode="numeric"
            maxLength={11}
            placeholder="09XXXXXXXXX"
            value={loginPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              setLoginPhone(value);
            }}
            required
          />

          {/* PASSWORD */}

          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />

          {/* LOGIN BUTTON */}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* FORGOT PASSWORD */}

        <button
          className="forgot"
          onClick={() => setMessage("Password recovery is not configured yet.")}
        >
          Forgot password?
        </button>

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
