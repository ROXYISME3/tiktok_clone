import { useState } from "react";
import logo from "./assets/tiktok-logo.png";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [coins, setCoins] = useState(10000);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save the login token
        localStorage.setItem("token", data.token);

        // Login successful
        setMessage("");

        // Move from login page to dashboard
        setIsLoggedIn(true);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setCoins(10000);
  };

  const handleCashOut = () => {
    alert(
      "Demo Cash Out\n\nThis is only a demonstration. The 10,000 virtual coins have no real monetary value.",
    );
  };

  // =========================
  // DASHBOARD
  // =========================

  if (isLoggedIn) {
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

        {/* MAIN DASHBOARD */}
        <main className="dashboard-content">
          <section className="welcome-section">
            <h1>Welcome to TikTok Clone</h1>

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

          {/* CONTENT CARDS */}
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

  // =========================
  // LOGIN PAGE
  // =========================

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
            placeholder="Email or phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="login-button" type="submit">
            Log in
          </button>
        </form>

        <button className="forgot">Forgot password?</button>

        {message && <div className="message">{message}</div>}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="signup">
          Don't have an account?
          <button>Sign up</button>
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
