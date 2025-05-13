// Import required modules
const path = require("path");
const express = require("express");
const getFirebirdClient = require("./lib/node-firebird");

// Initialize Express app and set port
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve index.html for root route "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API route to fetch movies from Firebird
app.get("/api/movies", async (req, res) => {
  try {
    const Firebird = await getFirebirdClient();
    if (!Firebird) {
      return res.status(500).json({ error: "Failed to connect to Firebird" });
    }

    // Runs the query
    Firebird.query(
      "SELECT * FROM ITEM",
      // Callback function -- handles the response
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json(result);
        Firebird.detach();
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route to add a new movie to Firebird
app.post("/api/addMovie", async (req, res) => {
  const { title, releaseDate, runTime } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  
  const Firebird = await getFirebirdClient();
  if (!Firebird) {
    return res.status(500).json({ error: "Failed to connect to Firebird" });
  }

  // Runs the query
  Firebird.query("INSERT INTO ITEM (ID, TYPEID, DESCRIPT, FIRSTRELEASE, LENGTH) VALUES (2, 1, ?, ?, ?)", [title, releaseDate, runTime], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
    Firebird.detach();
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});