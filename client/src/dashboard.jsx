import React, { useEffect, useState } from "react";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Invalid user data:", error);
      }
    }

    setLoading(false);
  }, []);

  const handleRedeem = () => {
    setRedeemed(true);
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>

        <h1 style={styles.title}>Congratulations!</h1>

        <p style={styles.subtitle}>
          {user ? `Welcome, ${user.username}!` : "Welcome to TikTok Clone!"}
        </p>

        <div style={styles.coinBox}>
          <div style={styles.coinIcon}>🪙</div>

          <div>
            <p style={styles.coinLabel}>Your Coins</p>

            <h2 style={styles.coins}>{redeemed ? "0" : "5,000"}</h2>
          </div>
        </div>

        {!redeemed ? (
          <button style={styles.button} onClick={handleRedeem}>
            Redeem 5,000 Coins
          </button>
        ) : (
          <div style={styles.success}>
            ✅ 5,000 coins redeemed successfully!
          </div>
        )}

        <p style={styles.smallText}>Thank you for joining TikTok Clone.</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "450px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "40px 30px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
  },

  icon: {
    fontSize: "60px",
    marginBottom: "10px",
  },

  title: {
    margin: "0",
    fontSize: "32px",
    fontWeight: "700",
  },

  subtitle: {
    color: "#666",
    fontSize: "17px",
    marginTop: "10px",
  },

  coinBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    background: "#fff8dc",
    borderRadius: "15px",
    padding: "20px",
    margin: "30px 0",
  },

  coinIcon: {
    fontSize: "50px",
  },

  coinLabel: {
    margin: "0",
    color: "#777",
    fontSize: "14px",
  },

  coins: {
    margin: "5px 0 0",
    fontSize: "36px",
  },

  button: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: "#000000",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    padding: "15px",
    borderRadius: "10px",
    background: "#e8f5e9",
    color: "#2e7d32",
    fontWeight: "600",
  },

  smallText: {
    marginTop: "25px",
    color: "#888",
    fontSize: "13px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    fontSize: "20px",
  },
};

export default Dashboard;
