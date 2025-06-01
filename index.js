// ==============================================
// 1. IMPORTS & INITIAL CONFIGURATION
// ==============================================

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const { Client } = pg;

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.LOCAL ? false : { rejectUnauthorized: false }
});

db.connect();

const app = express();
const port = process.env.PORT || 3000;

// ==============================================
// 2. GLOBAL STATE VARIABLES
// ==============================================

let currentUser = "";
let currentHighScore = 0;
let adminActive = false;
const adminPassword = process.env.ADMIN_PASSWORD; //its password so that must be called from .env

// ==============================================
// 3. MIDDLEWARE
// ==============================================

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// ==============================================
// 4. UTILITY FUNCTIONS
// ==============================================

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  return result.rows.map(row => row.country_code);
}

// ==============================================
// 5. ROOT,LOGIN & AUTH ROUTES
// ==============================================

// Reset visited countries table on back navigation
app.get("/", async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE visited_countries RESTART IDENTITY;");
    console.log("Countries reset via back button.");
  } catch (err) {
    console.error("Auto-reset failed:", err);
  }
  res.redirect("/login");
});

// Show login page
app.get("/login", (req, res) => {
  currentUser = ""; // Clear session user on every login load
  const showError = req.query.error === "1";

  res.render("login.ejs", {
    error: showError ? "Login Error" : null
  });
});

// Handle login submission
app.post("/login", async (req, res) => {
  const username = req.body.username.trim();
  currentUser = username;

  try {
    const result = await db.query("SELECT * FROM countries_user WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      await db.query("INSERT INTO countries_user (username, score) VALUES ($1, $2)", [username, 0]);
      currentHighScore = 0;
    } else {
      currentHighScore = result.rows[0].score;
    }
    console.log("Game has been started successfully!");
    res.redirect("/game");

  } catch (err) {
    console.error("Login Error:", err);
    res.redirect("/login?error=1");
  }
});

// Handle logout
app.get("/logout", (req, res) => {
  console.log("Logged out! See you next time")
  res.redirect("/login");
});

// ==============================================
// 6. MAIN GAME ROUTES
// ==============================================

app.get("/game", async (req, res) => {

  if (currentUser === "") {
    return res.redirect("/login");
  }

  const countries = await checkVisisted();
  const last = req.query.last || null;
  const total = countries.length;

  const result = await db.query("SELECT * FROM countries_user WHERE username = $1", [currentUser]);
  const dbScore = result.rows[0]?.score || 0;

  if (total > dbScore) {
    currentHighScore = total;
    await db.query("UPDATE countries_user SET score = $1 WHERE username = $2", [currentHighScore, currentUser]);
    console.log("High score updated!")
  }

  const leaderboardResult = await db.query(
    "SELECT username, score FROM countries_user ORDER BY score DESC LIMIT 3"
  );

  res.render("index.ejs", {
    countries,
    total,
    error: null,
    user: currentUser,
    score: currentHighScore,
    lastCountry: last,
    topScores: leaderboardResult.rows
  });
});

// Add a new country to visited list
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  const leaderboardResult = await db.query(
    "SELECT username, score FROM countries_user ORDER BY score DESC LIMIT 3"
  );
  const topScores = leaderboardResult.rows;

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const countryCode = result.rows[0].country_code;

    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/game?last=" + countryCode);
      console.log(countryCode + " Has been added!")
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries,
        total: countries.length,
        lastCountry: null,
        user: currentUser,
        score: currentHighScore,
        topScores,
        error: "Country has already been added, try again.",
      });
    }

  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries,
      total: countries.length,
      lastCountry: null,
      user: currentUser,
      score: currentHighScore,
      topScores,
      error: "Country name does not exist, try again.",
    });
  }
});

// Reset only visited countries table
app.post("/reset", async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE visited_countries RESTART IDENTITY;");
    res.redirect("/game");
  } catch (err) {
    console.error("Reset Error:", err);
    res.status(500).send("Error while resetting.");
  }
});

// ==============================================
// 7. ADMIN ROUTES
// ==============================================

// Show admin login
app.get("/admin-login", (req, res) => {
  const adminError = req.query.error === "2";

  res.render("admin-login.ejs", {
    error: adminError ? "Sorry you are not Ogulcan" : null
  });
});

// Handle admin login
app.post("/admin-login", (req, res) => {
  const password = req.body.adminPass;

  if (password === adminPassword) {
    adminActive = true;
    res.redirect("/admin");
  } else {
    res.redirect("/admin-login?error=2");
  }
});

// Show admin dashboard
app.get("/admin", (req, res) => {
  if (adminActive === true) {
    res.render("admin.ejs", {});
    adminActive = false;
  } else {
    res.redirect("/admin-login");
  }
});

// Clear all users and their scores
app.post("/clean", async (req, res) => {
  await db.query("TRUNCATE TABLE countries_user RESTART IDENTITY;");
  res.redirect("/login");
});

// ==============================================
// 8. SERVER LISTEN
// ==============================================

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
