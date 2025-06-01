# 🌍 Wayfare Map Tracker

**Wayfare Map Tracker** is a full-stack travel tracking app where users log visited countries on an interactive world map, score their journey, and experience smooth, custom-built UX/UI across devices.

---

## 🛤️ The Journey Behind the Project

This project wasn't built overnight. It’s the result of applying everything I’ve learned during my full-stack web development journey — from SQL to responsive design, from EJS templating to Node.js routing.

---

## 🚀 Key Features Developed from Scratch

- ✅ **User Authentication System**  
  Each visitor creates a username; sessions are handled manually without packages.

- ✅ **PostgreSQL Integration**  
  High scores stored/updated in `countries_user` table via dynamic SQL.

- ✅ **Interactive SVG World Map**  
  Clicking a country:
  - Adds color
  - Plays sound
  - Updates score

- ✅ **Admin Panel**  
  A hidden `/admin` route allows score reset via POST `/clean`.

- ✅ **High Score Logic**  
  Only updates DB if current score exceeds stored one.

- ✅ **Sound Effects**  
  Clicks, errors, resets — managed via JS `<audio>` elements.

- ✅ **Handmade CSS**  
  No libraries — pure CSS styling and animation.

- ✅ **Responsive Layout**  
  Fully functional on both mobile and desktop.

---

## ⚙️ Tech Stack

| Layer        | Tech Used                       |
|--------------|----------------------------------|
| Backend      | Node.js, Express.js              |
| Frontend     | EJS, HTML5, CSS3, JavaScript     |
| Database     | PostgreSQL                       |
| Deployment   | Render (Web + DB)                |
| Tools        | Git, GitHub                      |

---

## 🗃️ PostgreSQL Tables

```sql
CREATE TABLE countries_user (
  username TEXT PRIMARY KEY,
  score INT
);
```

*(Optional)*

```sql
CREATE TABLE visited (
  username TEXT,
  country_code TEXT
);
```

---

## 📁 Folder Structure

```
wayfare-map-tracker/
├── public/
│   ├── sounds/
│   ├── images/
│   └── styles/
├── views/
│   ├── index.ejs
│   ├── login.ejs
│   └── admin.ejs
├── index.js
├── main.css
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔐 Admin Access

- `/admin` → reset button
- `/clean` → resets high scores
- Not linked in UI — known internally only

---

## 🧠 What I Learned

- PostgreSQL integration with Node.js using `pg`
- How to manage async DB updates and compare scores
- Full control over DOM using SVG map
- Audio playback integration in browser
- Responsive design with custom breakpoints
- Creating admin-only routes
- Deployment with linked PostgreSQL via Render
- Writing structured `README`, `LICENSE`, and `.gitignore`

---

## 📦 Installation

```bash
git clone https://github.com/YOUR_USERNAME/wayfare-map-tracker.git
cd wayfare-map-tracker
npm install
node index.js
```

---

## 📜 License

MIT – See [LICENSE](./LICENSE)

---

## 👨‍💻 Author

**Oğulcan Tekineş**  
“Explore the world, mark your journey.”

- GitHub: [github.com/ogulcantekines](https://github.com/ogulcantekines/wayFare-map-tracker)
- LinkedIn: [linkedin.com/in/oğulcan-tekineş](https://www.linkedin.com/in/oğulcan-tekineş-483309268/)
