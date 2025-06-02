// ==============================================
// 1. IMPORTS & INITIAL CONFIGURATION
// ==============================================

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
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

let adminActive = false;
const adminPassword = process.env.ADMIN_PASSWORD; //its password so that must be called from .env

// ==============================================
// 3. MIDDLEWARE
// ==============================================

app.use(
  session({
    secret: "wayfare-secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// ==============================================
// 4. UTILITY FUNCTIONS
// ==============================================

async function checkVisited(username) {
  const result = await db.query(
    "SELECT country_code FROM countries_visited WHERE username = $1",
    [username]
  );
  return result.rows.map((row) => row.country_code);
}

// ==============================================
// 5. ROOT,LOGIN & AUTH ROUTES
// ==============================================

app.get("/", async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE countries_visited RESTART IDENTITY;");
    console.log("Countries reset via back button.");
  } catch (err) {
    console.error("Auto-reset failed:", err);
  }
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  req.session.user = null;
  const showError = req.query.error === "1";

  res.render("login.ejs", {
    error: showError ? "Login Error" : null
  });
});

app.post("/login", async (req, res) => {
  req.session.user = req.body.username.trim();

  try {
    const result = await db.query("SELECT * FROM countries_user WHERE username = $1", [req.session.user]);

    if (result.rows.length === 0) {
      await db.query("INSERT INTO countries_user (username, score) VALUES ($1, $2)", [req.session.user, 0]);
      req.session.highScore = 0;
    } else {
      req.session.highScore = result.rows[0].score;
    }
    console.log("Game has been started successfully!");
    res.redirect("/game");

  } catch (err) {
    console.error("Login Error:", err);
    res.redirect("/login?error=1");
  }
});

app.get("/logout", (req, res) => {
  console.log("Logged out! See you next time")
  res.redirect("/login");
});

// ==============================================
// 6. MAIN GAME ROUTES
// ==============================================

app.get("/game", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  
  const countries = await checkVisited(req.session.user);
  const last = req.query.last || null;
  const total = countries.length;

  const countriesTotal = 176;
  const hasWon = total >= countriesTotal;

  if(hasWon === true){
    await db.query("DELETE FROM countries_visited WHERE username = $1", [req.session.user]);
  }

  const result = await db.query("SELECT * FROM countries_user WHERE username = $1", [req.session.user]);
  const dbScore = result.rows[0]?.score || 0;

  if (total > dbScore) {
    req.session.highScore = total;
    await db.query("UPDATE countries_user SET score = $1 WHERE username = $2", [total, req.session.user]);
    console.log("High score updated!")
  }

  const leaderboardResult = await db.query(
    "SELECT username, score FROM countries_user ORDER BY score DESC LIMIT 3"
  );

  res.render("index.ejs", {
    countries,
    total,
    error: null,
    user: req.session.user,
    score: req.session.highScore,
    lastCountry: last,
    topScores: leaderboardResult.rows,
    hasWon: hasWon
  });
});

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
      await db.query("INSERT INTO countries_visited (username,country_code) VALUES ($1,$2)", [req.session.user, countryCode]);
      res.redirect("/game?last=" + countryCode);
      console.log(countryCode + " Has been added!")
    } catch (err) {
      console.log(err);
      const countries = await checkVisited(req.session.user);
      res.render("index.ejs", {
        countries,
        total: countries.length,
        lastCountry: null,
        user: req.session.user,
        score: req.session.highScore,
        topScores,
        hasWon:null,
        error: "Country has already been added, try again.",
      });
    }

  } catch (err) {
    console.log(err);
    const countries = await checkVisited(req.session.user);
    res.render("index.ejs", {
      countries,
      total: countries.length,
      lastCountry: null,
      user: req.session.user,
      score: req.session.highScore,
      topScores,
      hasWon:null,
      error: "Country name does not exist, try again.",
    });
  }
});

app.post("/reset", async (req, res) => {
  try {
    await db.query("DELETE FROM countries_visited WHERE username = $1", [req.session.user]);
    res.redirect("/game");
  } catch (err) {
    console.error("Reset Error:", err);
    res.status(500).send("Error while resetting.");
  }
});

// ==============================================
// 7. ADMIN ROUTES
// ==============================================

app.get("/admin-login", (req, res) => {
  const adminError = req.query.error === "2";

  res.render("admin-login.ejs", {
    error: adminError ? "Sorry you are not Ogulcan" : null
  });
});

app.post("/admin-login", (req, res) => {
  const password = req.body.adminPass;

  if (password === adminPassword) {
    adminActive = true;
    res.redirect("/admin");
  } else {
    res.redirect("/admin-login?error=2");
  }
});

app.get("/admin", (req, res) => {
  if (adminActive === true) {
    res.render("admin.ejs", {});
    adminActive = false;
  } else {
    res.redirect("/admin-login");
  }
});

app.get("/clean", async (req, res) => {
  await db.query("TRUNCATE TABLE countries_user RESTART IDENTITY;");
  res.redirect("/login");
});

// ==============================================
// 8. SERVER LISTEN
// ==============================================

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
