const express = require("express");
const path = require("path");
const app = express();

const { Pool } = require("pg");
require("dotenv").config();

const cors = require('cors');
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});


app.use(express.json());


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/recipes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recipes");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

app.get("/recipes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rotten Food" });
  }
});


//Checkpoint 2: Added Author check to ensure user exists
app.post("/recipes", async (req, res) => {
  const { dish, ingredients, author, cuisine, instructions } = req.body;

  if (!Array.isArray(ingredients) || !Array.isArray(instructions)) {
    return res.status(400).json({ error: "Ingredients and instructions must be comma separated" });
  }

  try {
    const authorCheck = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [author]
    );

    if (authorCheck.rows.length === 0) {
      return res.status(400).json({ error: "Author not found" });
    }

    const result = await pool.query(
      `INSERT INTO recipes (dish, ingredients, author, cuisine, instructions)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dish, ingredients, author, cuisine, instructions]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Overcooked!!" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Person Ran Away" });
  }
});

app.post("/users", async (req, res) => {
  const { username, email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING *;`,
      [username, email]
    );

    if (result.rows.length === 0) {
      // User exists already
      return res.json({ exists: true });
    }

    // New user added
    res.status(201).json({ exists: false, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/cuisines", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cuisines");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errrr" });
  }
});


app.listen(3000, () => {
  console.log("App is listening on port 3000");
});

